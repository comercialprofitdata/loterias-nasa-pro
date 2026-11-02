-- Códigos de validação por WhatsApp. Só a Edge Function acessa esta tabela.
create table if not exists public.tokens_whatsapp (
  id uuid primary key default gen_random_uuid(),
  telefone text not null,
  codigo_hash text not null,
  tentativas integer not null default 0,
  expira_em timestamptz not null,
  validado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists tokens_whatsapp_telefone_idx on public.tokens_whatsapp (telefone, criado_em desc);

alter table public.tokens_whatsapp enable row level security;
revoke all on public.tokens_whatsapp from anon, authenticated;
