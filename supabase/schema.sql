-- Meu Volante PRO: autorizacao e dados protegidos no Supabase
-- Execute no SQL Editor do seu projeto Supabase.
-- Nunca coloque a service_role key no index.html.

create type public.app_role as enum ('user', 'owner');
create type public.subscription_status as enum ('trial', 'active', 'past_due', 'canceled', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_code text not null,
  status public.subscription_status not null,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_subscription_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.visitor_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null unique check (char_length(email) between 5 and 254),
  -- opcional: a captura de leads na home não exige telefone
  phone text check (phone is null or char_length(phone) between 8 and 20),
  marketing_consent boolean not null default false check (marketing_consent = true),
  consent_at timestamptz not null default now(),
  source text not null default 'visitor_trial',
  created_at timestamptz not null default now()
);

create index visitor_leads_phone_idx on public.visitor_leads (phone);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_status_idx on public.subscriptions(status);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index audit_logs_target_user_id_idx on public.audit_logs(target_user_id);

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.visitor_leads enable row level security;

create policy "visitors can register with consent"
on public.visitor_leads for insert
to anon, authenticated
with check (marketing_consent = true);

create policy "users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_owner());

create policy "owners can manage profiles"
on public.profiles for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

create policy "users can read their own subscription"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid() or public.is_owner());

create policy "owners can manage subscriptions"
on public.subscriptions for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

create policy "owners can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_owner());

create policy "authenticated users can record own audit events"
on public.audit_logs for insert
to authenticated
with check (actor_id = auth.uid());

-- Depois de criar sua conta em Authentication > Users, substitua o UUID abaixo
-- pelo seu auth.users.id e execute em uma sessao administrativa do SQL Editor:
-- update public.profiles set role = 'owner' where id = 'SEU-UUID-AQUI';
--
-- Esse e o unico ponto de promocao do proprietario. Nao implemente essa operacao
-- no navegador e nao aceite role vindo de localStorage, URL ou formulario publico.
