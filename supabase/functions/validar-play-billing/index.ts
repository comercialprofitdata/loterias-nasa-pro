// Edge Function: valida assinatura Google Play Billing (subscriptionsv2)
// e ativa o plano PRO do usuário autenticado na tabela profiles.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const PLAY_SA_JSON = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON") ?? ""

const PACKAGE_NAME = "br.dev.pd.meuvolante"
const SKUS_VALIDOS = new Set(["lotolab_pro_mensal", "lotolab_pro_anual"])
const ESTADOS_ATIVOS = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
])

const CORS = {
  "Access-Control-Allow-Origin": "https://loterias.pd.dev.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  })

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function pemParaDer(pem: string): ArrayBuffer {
  const limpo = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")
  const bin = atob(limpo)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function obterTokenGooglePlay(sa: { client_email: string; private_key: string }): Promise<string> {
  const agora = Math.floor(Date.now() / 1000)
  const enc = new TextEncoder()
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })))
  const claim = b64url(enc.encode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    exp: agora + 3600,
    iat: agora
  })))

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemParaDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${header}.${claim}`))
  )

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${b64url(sig)}`
    })
  })
  const dados = await res.json()
  if (!res.ok || !dados.access_token) throw new Error("Falha OAuth2 Google Play")
  return dados.access_token
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "Método não permitido" }, 405)

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    if (!authHeader.startsWith("Bearer ")) return responder({ erro: "Não autenticado" }, 401)

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return responder({ erro: "Sessão inválida" }, 401)

    const { sku, purchaseToken } = await req.json()
    if (!SKUS_VALIDOS.has(String(sku)) || !purchaseToken || String(purchaseToken).length < 10) {
      return responder({ erro: "Dados de compra inválidos" }, 400)
    }

    if (!PLAY_SA_JSON) {
      return responder({ erro: "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON não configurado" }, 503)
    }

    const sa = JSON.parse(PLAY_SA_JSON)
    const token = await obterTokenGooglePlay(sa)
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(String(purchaseToken))}`
    const playRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const playData = await playRes.json()

    if (!playRes.ok) {
      return responder({ ativo: false, erro: "Compra não confirmada pelo Google Play" }, 402)
    }

    const estado = String(playData?.subscriptionState ?? "")
    const lineItems = Array.isArray(playData?.lineItems) ? playData.lineItems : []
    const itemCorrespondente = lineItems.find((li: { productId?: string }) => li?.productId === String(sku))
    const ativo = ESTADOS_ATIVOS.has(estado) && Boolean(itemCorrespondente)

    if (!ativo) {
      return responder({ ativo: false, estado, sku, erro: "Assinatura inativa ou SKU divergente" }, 402)
    }

    // Proteção contra replay: impede reutilizar o mesmo purchaseToken em contas diferentes
    const { data: existente } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("purchase_token", String(purchaseToken))
      .maybeSingle()

    if (existente && existente.user_id && existente.user_id !== userData.user.id) {
      return responder({ ativo: false, erro: "Compra já vinculada a outra conta" }, 409)
    }

    // Acknowledge obrigatório na Google Play (sem isso o Google estorna automaticamente em 3 dias)
    if (String(playData?.acknowledgementState ?? "") !== "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED") {
      const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(String(sku))}/tokens/${encodeURIComponent(String(purchaseToken))}:acknowledge`
      const ackRes = await fetch(ackUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (!ackRes.ok) {
        return responder({ ativo: false, erro: "Falha ao confirmar (acknowledge) compra na Google Play" }, 502)
      }
    }

    const planCode = sku === "lotolab_pro_anual" ? "anual" : "mensal"
    const validUntil = itemCorrespondente?.expiryTime
      || new Date(Date.now() + (planCode === "anual" ? 366 : 32) * 86400000).toISOString()

    const { error: dbErr } = await admin
      .from("subscriptions")
      .upsert({
        user_id: userData.user.id,
        plan_code: planCode,
        status: "active",
        valid_until: validUntil,
        purchase_token: String(purchaseToken),
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })

    if (dbErr) {
      return responder({ ativo: false, erro: `Erro ao salvar assinatura: ${dbErr.message}` }, 500)
    }

    return responder({ ativo: true, estado, sku, plan_code: planCode, valid_until: validUntil })
  } catch (err) {
    return responder({ ativo: false, erro: err instanceof Error ? err.message : "Erro interno" }, 500)
  }
})
