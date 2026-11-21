-- Tabela de captura de erros do front-end (js/error-trap.js)
create table if not exists public.telemetry_errors (
  id bigint generated always as identity primary key,
  error_message text not null,
  stack text,
  url text,
  user_agent text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.telemetry_errors enable row level security;

drop policy if exists "anyone can log client errors" on public.telemetry_errors;
create policy "anyone can log client errors"
on public.telemetry_errors for insert
to anon, authenticated
with check (true);

drop policy if exists "owners can read client errors" on public.telemetry_errors;
create policy "owners can read client errors"
on public.telemetry_errors for select
to authenticated
using (public.is_owner());
