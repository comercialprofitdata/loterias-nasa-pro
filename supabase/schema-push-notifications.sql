-- =========================================================================
-- LOTOLAB — WEB PUSH REAL EM SEGUNDO PLANO (VAPID)
-- Rodar no SQL Editor do Supabase (projeto kwiagspkzrnculrvtrmp)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plataforma TEXT DEFAULT 'web',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permite inscrição anônima ou autenticada no próprio aparelho (somente escrita)
DROP POLICY IF EXISTS "push_sub_insert" ON public.push_subscriptions;
CREATE POLICY "push_sub_insert" ON public.push_subscriptions
  FOR INSERT TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "push_sub_update" ON public.push_subscriptions;
CREATE POLICY "push_sub_update" ON public.push_subscriptions
  FOR UPDATE TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Leitura e limpeza de toda a base ficam restritas à Edge Function (service_role)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_ativo
  ON public.push_subscriptions (ativo)
  WHERE ativo = TRUE;
