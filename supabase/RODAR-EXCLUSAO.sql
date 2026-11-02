-- Pedidos de exclusão de conta (exigência da Google Play e da LGPD).
-- O app e a página pública só registram o pedido; a fila é lida aqui no painel.
create table if not exists public.exclusao_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 5 and 254),
  motivo text check (motivo is null or char_length(motivo) <= 1000),
  origem text not null default 'web' check (origem in ('web', 'app')),
  status text not null default 'pendente' check (status in ('pendente', 'concluida', 'rejeitada')),
  solicitado_em timestamptz not null default now(),
  processado_em timestamptz,
  observacao text
);
create index if not exists exclusao_solicitacoes_status_idx
  on public.exclusao_solicitacoes (status, solicitado_em);

alter table public.exclusao_solicitacoes enable row level security;
revoke all on public.exclusao_solicitacoes from anon, authenticated;
grant insert (email, motivo, origem) on public.exclusao_solicitacoes to anon, authenticated;
drop policy if exists "qualquer pessoa pede exclusao" on public.exclusao_solicitacoes;
create policy "qualquer pessoa pede exclusao" on public.exclusao_solicitacoes
  for insert to anon, authenticated with check (true);

-- Apaga os dados de um e-mail depois de confirmar que o pedido é do titular.
-- Uso: select public.concluir_exclusao('pessoa@exemplo.com');
create or replace function public.concluir_exclusao(alvo text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  email_alvo text := lower(trim(alvo));
  conta uuid;
begin
  select id into conta from auth.users where lower(email) = email_alvo;

  delete from public.carteira_apostas
   where lower(user_id) = email_alvo or user_id = conta::text;
  delete from public.user_telemetria_logs
   where lower(user_id) = email_alvo or lower(coalesce(user_email, '')) = email_alvo or user_id = conta::text;
  delete from public.eventos_uso where lower(coalesce(email, '')) = email_alvo;
  delete from public.visitor_leads where lower(email) = email_alvo;
  if conta is not null then
    delete from auth.users where id = conta;
  end if;

  update public.exclusao_solicitacoes
     set status = 'concluida', processado_em = now()
   where lower(email) = email_alvo and status = 'pendente';

  return 'Dados de ' || email_alvo || ' excluídos.';
end;
$$;
revoke all on function public.concluir_exclusao(text) from public, anon, authenticated;

select 'pedidos de exclusao' as tabela, count(*) as total from public.exclusao_solicitacoes;
