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
-- Contatos e uso do app. O app só grava; a leitura é feita pelo painel do Supabase.
create table if not exists public.visitor_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  phone text,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  source text,
  created_at timestamptz not null default now()
);
alter table public.visitor_leads add column if not exists phone text;
alter table public.visitor_leads enable row level security;
revoke all on public.visitor_leads from anon, authenticated;
grant insert on public.visitor_leads to anon, authenticated;
drop policy if exists "app grava contato" on public.visitor_leads;
create policy "app grava contato" on public.visitor_leads for insert to anon, authenticated with check (true);

create table if not exists public.eventos_uso (
  id bigint generated always as identity primary key,
  aparelho uuid not null,
  email text,
  evento text not null,
  detalhe text,
  modalidade text,
  criado_em timestamptz not null default now()
);
create index if not exists eventos_uso_data_idx on public.eventos_uso (criado_em desc);
alter table public.eventos_uso enable row level security;
revoke all on public.eventos_uso from anon, authenticated;
grant insert on public.eventos_uso to anon, authenticated;
drop policy if exists "app grava evento" on public.eventos_uso;
create policy "app grava evento" on public.eventos_uso for insert to anon, authenticated
  with check (length(evento) <= 40 and coalesce(length(detalhe), 0) <= 80);

-- Consultas prontas no Table Editor.
create or replace view public.painel_uso_por_pessoa with (security_invoker = true) as
select coalesce(max(email), aparelho::text) as pessoa,
       count(*) as eventos,
       count(*) filter (where evento = 'gerou_jogo') as jogos_gerados,
       count(*) filter (where evento = 'salvou_jogo') as jogos_salvos,
       min(criado_em) as primeiro_uso,
       max(criado_em) as ultimo_uso
  from public.eventos_uso
 group by aparelho
 order by ultimo_uso desc;
revoke all on public.painel_uso_por_pessoa from anon, authenticated;
