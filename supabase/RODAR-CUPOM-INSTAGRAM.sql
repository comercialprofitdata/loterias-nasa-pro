-- Cria o cupom da campanha sem reiniciar ou reativar um cupom já existente.
do $$
declare
  atual public.codigos_vip%rowtype;
begin
  select * into atual
    from public.codigos_vip
    where codigo = 'INSTAVIP100'
    for update;

  if found then
    if atual.nome is distinct from 'Instagram - VIP por 1 ano'
      or atual.dias is distinct from 365
      or atual.usos_max is distinct from 100
      or atual.ativo is distinct from true then
      raise exception 'INSTAVIP100 já existe com outra configuração; revise o cupom antes de continuar.';
    end if;
  else
    insert into public.codigos_vip (codigo, nome, dias, usos_max, ativo)
    values ('INSTAVIP100', 'Instagram - VIP por 1 ano', 365, 100, true);
  end if;
end;
$$;

select c.codigo, c.dias, c.usos_max, c.ativo,
       (select count(*) from public.resgates_vip r where r.codigo_id = c.id) as ativacoes
  from public.codigos_vip c
 where c.codigo = 'INSTAVIP100';
