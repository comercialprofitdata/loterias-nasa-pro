-- =========================================================================
-- LOTOLAB — MIGRAÇÃO CONSOLIDADA: 5 LOTERIAS + PLAY BILLING + METADADOS
-- Rodar no SQL Editor do Supabase (projeto kwiagspkzrnculrvtrmp)
-- =========================================================================

-- 1. Liberar todas as 5 loterias em carteira_apostas (antes travava Lotomania/Dia de Sorte)
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT conname INTO c_name
    FROM pg_constraint
   WHERE conrelid = 'public.carteira_apostas'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%modalidade%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.carteira_apostas DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.carteira_apostas
  ADD CONSTRAINT carteira_apostas_modalidade_5_check
  CHECK (modalidade IN ('megasena', 'lotofacil', 'quina', 'lotomania', 'diadesorte'));

ALTER TABLE public.carteira_apostas
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Liberar todas as 5 loterias em concursos_historico
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT conname INTO c_name
    FROM pg_constraint
   WHERE conrelid = 'public.concursos_historico'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%modalidade%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.concursos_historico DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.concursos_historico
  ADD CONSTRAINT concursos_historico_modalidade_5_check
  CHECK (modalidade IN ('megasena', 'lotofacil', 'quina', 'lotomania', 'diadesorte'));

-- 3. Proteção contra replay de recibos Google Play Billing em subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS purchase_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_purchase_token_unique
  ON public.subscriptions (purchase_token)
  WHERE purchase_token IS NOT NULL;
