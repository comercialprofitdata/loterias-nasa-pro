-- =========================================================================
-- EXPURGO AUTOMÁTICO DE DADOS DE USUÁRIOS EXCLUÍDOS (TRIGGER POSTGRESQL)
-- Meu Volante PRO - Conformidade LGPD & Limpeza de Contas Órfãs
-- =========================================================================
-- Quando um usuário for deletado de auth.users (seja via Edge Function,
-- pelo próprio painel administrativo ou por solicitação do usuário),
-- este trigger garante o expurgo em cascata automático das tabelas de negócio.

-- 1. Cria a tabela user_telemetria_logs caso não exista
create table if not exists public.user_telemetria_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  acao text not null,
  detalhes jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists idx_user_telemetria_logs_user
  on public.user_telemetria_logs (user_id);

alter table public.user_telemetria_logs enable row level security;

drop policy if exists "usuarios gerenciam seus proprios logs de telemetria" on public.user_telemetria_logs;
create policy "usuarios gerenciam seus proprios logs de telemetria"
  on public.user_telemetria_logs
  for all
  to authenticated
  using (user_id = auth.uid()::text or user_id = auth.jwt()->>'email')
  with check (user_id = auth.uid()::text or user_id = auth.jwt()->>'email');

-- 2. Função disparada na exclusão de um usuário de auth.users
create or replace function public.trg_expurgar_dados_usuario_orfa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text;
  v_email text;
begin
  v_uid := old.id::text;
  v_email := lower(coalesce(old.email, ''));

  -- Expurgar apostas da carteira (tanto pelo UUID quanto pelo e-mail se foi usado como chave)
  delete from public.carteira_apostas
  where user_id = v_uid
     or (v_email <> '' and lower(user_id) = v_email);

  -- Expurgar logs de telemetria
  delete from public.user_telemetria_logs
  where user_id = v_uid
     or (v_email <> '' and lower(user_id) = v_email);

  -- Expurgar leads de visitantes se houver
  if v_email <> '' then
    delete from public.visitor_leads
    where lower(email) = v_email;
  end if;

  return old;
end;
$$;

-- 3. Trigger atrelado a auth.users
drop trigger if exists on_auth_user_deleted on auth.users;

create trigger on_auth_user_deleted
after delete on auth.users
for each row
execute function public.trg_expurgar_dados_usuario_orfa();
