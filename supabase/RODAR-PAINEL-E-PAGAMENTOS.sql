-- Painel do dono e tabelas de pagamento. Só cria o que falta; não apaga dados.
-- ANTES: crie seu usuário em Authentication > Users e confira o e-mail na última linha.
do $$ begin
  create type public.app_role as enum ('user', 'owner');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.subscription_status as enum ('trial', 'active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.cobranca_status as enum ('pendente', 'confirmada', 'recebida', 'vencida', 'estornada', 'cancelada');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'user',
  asaas_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_code text not null,
  status public.subscription_status not null,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cobrancas (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  plano text not null,
  valor numeric(10,2) not null check (valor > 0),
  metodo text not null,
  status public.cobranca_status not null default 'pendente',
  url_pagamento text,
  vence_em date,
  criada_em timestamptz not null default now(),
  paga_em timestamptz,
  evento_bruto jsonb
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);
create index if not exists cobrancas_user_idx on public.cobrancas (user_id, criada_em desc);

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;
revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cobrancas enable row level security;
revoke all on public.profiles, public.subscriptions, public.cobrancas from anon, authenticated;
grant select on public.profiles, public.subscriptions, public.cobrancas to authenticated;
drop policy if exists "le o proprio perfil" on public.profiles;
create policy "le o proprio perfil" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "le a propria assinatura" on public.subscriptions;
create policy "le a propria assinatura" on public.subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "le as proprias cobrancas" on public.cobrancas;
create policy "le as proprias cobrancas" on public.cobrancas for select to authenticated using (user_id = auth.uid());

create or replace function public.criar_perfil_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', '')) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.criar_perfil_usuario() from public, anon, authenticated;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil_usuario();
insert into public.profiles (id, display_name)
  select id, coalesce(raw_user_meta_data->>'full_name', '') from auth.users on conflict (id) do nothing;

-- O servidor confere se quem pede é o dono antes de devolver qualquer dado.
create or replace function public.painel_dono()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return json_build_object(
    'cadastros', (select count(*) from visitor_leads where coalesce(source, '') <> 'teste_instalacao'),
    'aparelhos', (select count(distinct aparelho) from eventos_uso),
    'ativos_7d', (select count(distinct aparelho) from eventos_uso where criado_em > now() - interval '7 days'),
    'jogos_gerados', (select count(*) from eventos_uso where evento = 'gerou_jogo'),
    'jogos_salvos', (select count(*) from eventos_uso where evento = 'salvou_jogo'),
    'pagamentos', (select count(*) from cobrancas where status in ('confirmada', 'recebida')),
    'receita', (select coalesce(sum(valor), 0) from cobrancas where status in ('confirmada', 'recebida')),
    'exclusoes', (select count(*) from exclusao_solicitacoes where status = 'pendente'),
    'contatos', (select coalesce(json_agg(c), '[]') from (
      select name as nome, email, phone as celular, marketing_consent as novidades, created_at as criado_em
        from visitor_leads where coalesce(source, '') <> 'teste_instalacao' order by created_at desc limit 500) c),
    'uso', (select coalesce(json_agg(u), '[]') from (select * from painel_uso_por_pessoa limit 500) u),
    'fila_exclusao', (select coalesce(json_agg(f), '[]') from (
      select email as contato, origem, solicitado_em from exclusao_solicitacoes
       where status = 'pendente' order by solicitado_em) f)
  );
end;
$$;
revoke all on function public.painel_dono() from public, anon;
grant execute on function public.painel_dono() to authenticated;

update public.profiles set role = 'owner'
 where id in (select id from auth.users where lower(email) in ('comercial.profitdata@gmail.com', 'vitorio.bergamo@gmail.com'));

select (select count(*) from public.profiles where role = 'owner') as donos;
