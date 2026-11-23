-- =========================================================================
-- LOTOLAB — SINCRONIZAÇÃO DE BOLÕES NA NUVEM (RLS ESTRITA POR USUÁRIO)
-- =========================================================================
-- Execute no SQL Editor do Supabase junto com as migrações da Onda 1B.

CREATE TABLE IF NOT EXISTS public.boloes_usuarios (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dados JSONB NOT NULL DEFAULT '[]'::jsonb,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.boloes_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boloes_select_proprio" ON public.boloes_usuarios;
CREATE POLICY "boloes_select_proprio"
  ON public.boloes_usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "boloes_insert_proprio" ON public.boloes_usuarios;
CREATE POLICY "boloes_insert_proprio"
  ON public.boloes_usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "boloes_update_proprio" ON public.boloes_usuarios;
CREATE POLICY "boloes_update_proprio"
  ON public.boloes_usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "boloes_delete_proprio" ON public.boloes_usuarios;
CREATE POLICY "boloes_delete_proprio"
  ON public.boloes_usuarios
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
