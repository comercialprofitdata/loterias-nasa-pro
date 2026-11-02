-- Habilita o proprietário a criar códigos VIP personalizados pelo painel do app.
create or replace function public.criar_codigo_vip_personalizado(
  p_codigo text,
  p_nome text,
  p_dias integer,
  p_usos integer default 1
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  novo_codigo text := upper(trim(coalesce(p_codigo, '')));
  nome_campanha text := trim(coalesce(p_nome, ''));
begin
  if not public.is_owner() then
    raise exception 'acesso negado' using errcode = '42501';
  end if;

  if novo_codigo !~ '^[A-Z0-9][A-Z0-9-]{2,31}$' then
    raise exception 'código inválido' using errcode = '22023';
  end if;
  if length(nome_campanha) not between 1 and 120 then
    raise exception 'nome da campanha inválido' using errcode = '22023';
  end if;
  if p_dias is not null and p_dias <= 0 then
    raise exception 'validade inválida' using errcode = '22023';
  end if;
  if p_usos is null or p_usos not between 1 and 1000 then
    raise exception 'quantidade de usos inválida' using errcode = '22023';
  end if;

  insert into public.codigos_vip (codigo, nome, dias, usos_max)
  values (novo_codigo, nome_campanha, p_dias, p_usos);

  return novo_codigo;
end;
$$;

revoke all on function public.criar_codigo_vip_personalizado(text, text, integer, integer) from public, anon;
grant execute on function public.criar_codigo_vip_personalizado(text, text, integer, integer) to authenticated;
