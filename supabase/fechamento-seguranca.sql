-- Fecha o acesso público às apostas e à telemetria. Rode uma vez no SQL Editor.
-- Faz cópia antes de mudar; nada é apagado.
begin;

create schema if not exists backup_20261101;
revoke all on schema backup_20261101 from public, anon, authenticated;
create table if not exists backup_20261101.carteira_apostas as table public.carteira_apostas;
create table if not exists backup_20261101.user_telemetria_logs as table public.user_telemetria_logs;

-- Liga ao dono as apostas gravadas com e-mail. As demais ficam guardadas, sem acesso pelo app.
update public.carteira_apostas c
   set user_id = u.id::text
  from auth.users u
 where lower(c.user_id) = lower(u.email)
   and not exists (select 1 from public.carteira_apostas d
                    where d.user_id = u.id::text and d.bilhete_id = c.bilhete_id);

revoke all on public.carteira_apostas from anon, authenticated;
revoke all on public.user_telemetria_logs from anon, authenticated;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
            where schemaname = 'public' and tablename in ('carteira_apostas', 'user_telemetria_logs')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.carteira_apostas enable row level security;
alter table public.user_telemetria_logs enable row level security;

grant select, insert, update, delete on public.carteira_apostas to authenticated;
create policy "dono le apostas" on public.carteira_apostas for select to authenticated
  using (user_id = auth.uid()::text);
create policy "dono cria apostas" on public.carteira_apostas for insert to authenticated
  with check (user_id = auth.uid()::text);
create policy "dono altera apostas" on public.carteira_apostas for update to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
create policy "dono apaga apostas" on public.carteira_apostas for delete to authenticated
  using (user_id = auth.uid()::text);

commit;

select 'carteira' as tabela, count(*) as total, (select count(*) from backup_20261101.carteira_apostas) as copia from public.carteira_apostas
union all
select 'telemetria', count(*), (select count(*) from backup_20261101.user_telemetria_logs) from public.user_telemetria_logs;
