// Edge Function: cancela a renovação da assinatura do usuário no Asaas.
// O período já pago continua valendo até o fim da validade.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY") ?? ""
const ASAAS_API_URL = Deno.env.get("ASAAS_API_URL") ?? ""

const CORS = {
  "Access-Control-Allow-Origin": "https://loterias.pd.dev.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, "Content-Type": "application/json" } })

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "use POST" }, 405)
  if (!ASAAS_API_KEY || !ASAAS_API_URL) return responder({ erro: "gateway não configurado" }, 503)

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "")
  const usuario = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: sessao } = await usuario.auth.getUser()
  if (!sessao?.user) return responder({ erro: "sessão inválida ou expirada" }, 401)

  const { data: assinaturas, error } = await admin
    .from("subscriptions")
    .select("id, provider_subscription_id, valid_until")
    .eq("user_id", sessao.user.id)
    .eq("provider", "asaas")
    .eq("status", "active")
    .like("provider_subscription_id", "sub_%")
  if (error) return responder({ erro: "falha ao consultar assinatura" }, 500)
  if (!assinaturas?.length) return responder({ erro: "nenhuma assinatura ativa" }, 404)

  for (const assinatura of assinaturas) {
    const resposta = await fetch(`${ASAAS_API_URL}/subscriptions/${assinatura.provider_subscription_id}`, {
      method: "DELETE",
      headers: { access_token: ASAAS_API_KEY, "User-Agent": "MeuVolantePRO" }
    })
    if (!resposta.ok && resposta.status !== 404) {
      console.error("Asaas recusou o cancelamento:", resposta.status)
      return responder({ erro: "não foi possível cancelar agora" }, 502)
    }
    const { error: erroLocal } = await admin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", assinatura.id)
    if (erroLocal) return responder({ erro: "falha ao registrar o cancelamento" }, 500)
  }

  return responder({ cancelada: true, validaAte: assinaturas[0].valid_until })
})
