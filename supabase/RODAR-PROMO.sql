-- Vagas da promoção de lançamento. Devolve só o número, sem dados de ninguém.
create or replace function public.vagas_promo_lancamento()
returns integer language sql stable security definer set search_path = public as $$
  select greatest(0, 100 - count(*))::integer from subscriptions
   where plan_code = 'mensal' and provider_subscription_id like 'sub_%';
$$;
revoke all on function public.vagas_promo_lancamento() from public;
grant execute on function public.vagas_promo_lancamento() to anon, authenticated;

select public.vagas_promo_lancamento() as vagas;
