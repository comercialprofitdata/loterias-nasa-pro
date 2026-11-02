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
