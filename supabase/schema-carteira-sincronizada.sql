-- ===================================================================
-- MEU VOLANTE PRO — SINCRONIZAÇÃO EM NUVEM DA CARTEIRA DE APOSTAS
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Garante persistência permanente e sincronização entre celular e computador.
-- ===================================================================

create table if not exists public.carteira_apostas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  bilhete_id text not null,
  modalidade text not null check (modalidade in ('megasena', 'lotofacil', 'quina')),
  nome text not null,
  dezenas integer[] not null,
  data text,
  concurso_alvo text,
  custo numeric(10,2) default 5.0,
  premio_ganho numeric(10,2) default 0,
  conferido boolean default false,
  status text default 'Aguardando sorteio',
  registrado_como_jogado boolean default true,
  data_registro timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, bilhete_id)
);

create index if not exists carteira_apostas_user_idx on public.carteira_apostas (user_id, created_at desc);
create index if not exists carteira_apostas_conc_idx on public.carteira_apostas (concurso_alvo);

alter table public.carteira_apostas enable row level security;

-- POLÍTICAS DE ACESSO (ROW LEVEL SECURITY)
-- Suporta usuários autenticados via Supabase Auth (UUID), e-mail do cliente ou Código VIP
drop policy if exists "permitir leitura carteira" on public.carteira_apostas;
create policy "permitir leitura carteira"
on public.carteira_apostas for select
using (true);

drop policy if exists "permitir insercao carteira" on public.carteira_apostas;
create policy "permitir insercao carteira"
on public.carteira_apostas for insert
with check (true);

drop policy if exists "permitir atualizacao carteira" on public.carteira_apostas;
create policy "permitir atualizacao carteira"
on public.carteira_apostas for update
using (true);

drop policy if exists "permitir exclusao carteira" on public.carteira_apostas;
create policy "permitir exclusao carteira"
on public.carteira_apostas for delete
using (true);
