-- =========================================================================
-- LOTOLAB — WEB PUSH REAL EM SEGUNDO PLANO (VAPID) — RLS BLINDADO
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

-- Remove qualquer policy aberta antiga (nenhum anon/authenticated edita linhas alheias!)
DROP POLICY IF EXISTS "push_sub_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_sub_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_sub_select" ON public.push_subscriptions;

-- RPC segura: só grava ou atualiza o endpoint exato apresentado pelo próprio aparelho
CREATE OR REPLACE FUNCTION public.registrar_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_plataforma TEXT DEFAULT 'web'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) < 20 OR p_p256dh IS NULL OR p_auth IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.push_subscriptions (endpoint, p256dh, auth, user_id, plataforma, ativo, updated_at)
  VALUES (p_endpoint, p_p256dh, p_auth, auth.uid(), COALESCE(p_plataforma, 'web'), TRUE, NOW())
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_id = COALESCE(auth.uid(), public.push_subscriptions.user_id),
        plataforma = EXCLUDED.plataforma,
        ativo = TRUE,
        updated_at = NOW();

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.desativar_push_subscription(p_endpoint TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_endpoint IS NULL OR length(p_endpoint) < 20 THEN
    RETURN FALSE;
  END IF;
  UPDATE public.push_subscriptions
     SET ativo = FALSE, updated_at = NOW()
   WHERE endpoint = p_endpoint;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_push_subscription(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.desativar_push_subscription(TEXT) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_ativo
  ON public.push_subscriptions (ativo)
  WHERE ativo = TRUE;
