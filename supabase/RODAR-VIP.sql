-- Códigos VIP validados no servidor. Só o dono cria; ninguém consegue listá-los pelo site.
create table if not exists public.codigos_vip (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  dias integer check (dias is null or dias > 0),
  usos_max integer not null default 1 check (usos_max > 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create table if not exists public.resgates_vip (
  id uuid primary key default gen_random_uuid(),
  codigo_id uuid not null references public.codigos_vip(id) on delete cascade,
  aparelho uuid not null,
  contato text,
  resgatado_em timestamptz not null default now(),
  unique (codigo_id, aparelho)
);
alter table public.codigos_vip enable row level security;
alter table public.resgates_vip enable row level security;
revoke all on public.codigos_vip, public.resgates_vip from anon, authenticated;

-- Repetir no mesmo aparelho não gasta outro uso, e serve para revalidar o acesso.
create or replace function public.resgatar_codigo_vip(p_codigo text, p_aparelho uuid, p_contato text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  vip public.codigos_vip;
  resgate public.resgates_vip;
  usados integer;
begin
  select * into vip from codigos_vip where codigo = upper(trim(p_codigo)) and ativo;
  if not found then return json_build_object('ok', false); end if;

  perform pg_advisory_xact_lock(hashtext(vip.id::text));
  select * into resgate from resgates_vip where codigo_id = vip.id and aparelho = p_aparelho;
  if not found then
    select count(*) into usados from resgates_vip where codigo_id = vip.id;
    if usados >= vip.usos_max then return json_build_object('ok', false, 'motivo', 'usado'); end if;
    insert into resgates_vip (codigo_id, aparelho, contato)
      values (vip.id, p_aparelho, left(p_contato, 254)) returning * into resgate;
  end if;

  if vip.dias is not null and resgate.resgatado_em + make_interval(days => vip.dias) < now() then
    return json_build_object('ok', false, 'motivo', 'expirado');
  end if;
  return json_build_object('ok', true, 'nome', vip.nome,
    'valido_ate', case when vip.dias is null then null else resgate.resgatado_em + make_interval(days => vip.dias) end);
end;
$$;
revoke all on function public.resgatar_codigo_vip(text, uuid, text) from public;
grant execute on function public.resgatar_codigo_vip(text, uuid, text) to anon, authenticated;

create or replace function public.criar_codigo_vip(p_nome text, p_dias integer, p_usos integer default 1)
returns text language plpgsql security definer set search_path = public as $$
declare novo text := 'VIP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
begin
  if not public.is_owner() then raise exception 'acesso negado' using errcode = '42501'; end if;
  insert into codigos_vip (codigo, nome, dias, usos_max) values (novo, left(trim(p_nome), 120), p_dias, p_usos);
  return novo;
end;
$$;
revoke all on function public.criar_codigo_vip(text, integer, integer) from public, anon;
grant execute on function public.criar_codigo_vip(text, integer, integer) to authenticated;

create or replace function public.listar_codigos_vip()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'acesso negado' using errcode = '42501'; end if;
  return (select coalesce(json_agg(l), '[]') from (
    select c.codigo, c.nome, c.dias, c.usos_max, c.ativo, c.criado_em,
           (select count(*) from resgates_vip r where r.codigo_id = c.id) as usos
      from codigos_vip c order by c.criado_em desc) l);
end;
$$;
revoke all on function public.listar_codigos_vip() from public, anon;
grant execute on function public.listar_codigos_vip() to authenticated;

create or replace function public.alterar_codigo_vip(p_codigo text, p_ativo boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'acesso negado' using errcode = '42501'; end if;
  update codigos_vip set ativo = p_ativo where codigo = p_codigo;
end;
$$;
revoke all on function public.alterar_codigo_vip(text, boolean) from public, anon;
grant execute on function public.alterar_codigo_vip(text, boolean) to authenticated;

select count(*) as codigos_vip from public.codigos_vip;
