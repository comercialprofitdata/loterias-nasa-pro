-- Permite concluir a exclusão de quem se cadastrou só com o celular.
-- Uso: select public.concluir_exclusao('11912345678');
create or replace function public.concluir_exclusao(alvo text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  contato text := lower(trim(alvo));
  conta uuid;
begin
  select id into conta from auth.users where lower(email) = contato;

  delete from public.carteira_apostas
   where lower(user_id) = contato or user_id = conta::text;
  delete from public.user_telemetria_logs
   where lower(user_id) = contato or lower(coalesce(user_email, '')) = contato or user_id = conta::text;
  delete from public.eventos_uso where lower(coalesce(email, '')) = contato;
  delete from public.visitor_leads where lower(coalesce(email, '')) = contato or phone = contato;
  if conta is not null then
    delete from auth.users where id = conta;
  end if;

  update public.exclusao_solicitacoes
     set status = 'concluida', processado_em = now()
   where lower(email) = contato and status = 'pendente';

  return 'Dados de ' || contato || ' excluídos.';
end;
$$;
revoke all on function public.concluir_exclusao(text) from public, anon, authenticated;
