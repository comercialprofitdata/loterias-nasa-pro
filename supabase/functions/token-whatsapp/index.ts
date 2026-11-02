// Envia e confere o token de 6 dígitos pelo WhatsApp (Green API).
// Secrets: GREEN_API_URL, GREEN_API_INSTANCE, GREEN_API_TOKEN, TOKEN_PEPPER.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
const CORS = {
  "Access-Control-Allow-Origin": "https://loterias.pd.dev.br",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Content-Type": "application/json"
}
const VALIDADE_MS = 10 * 60 * 1000
const MAX_ENVIOS_HORA = 3
const MAX_TENTATIVAS = 5

const responder = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status, headers: CORS })

async function resumo(telefone: string, codigo: string) {
  const dados = new TextEncoder().encode(`${telefone}:${codigo}:${Deno.env.get("TOKEN_PEPPER")}`)
  const hash = await crypto.subtle.digest("SHA-256", dados)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function enviar(telefone: string) {
  const umaHora = new Date(Date.now() - 3600000).toISOString()
  const { count } = await admin.from("tokens_whatsapp").select("id", { count: "exact", head: true })
    .eq("telefone", telefone).gte("criado_em", umaHora)
  if ((count ?? 0) >= MAX_ENVIOS_HORA) return responder({ erro: "Muitos pedidos. Tente de novo em uma hora." }, 429)

  const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0")
  const url = `${Deno.env.get("GREEN_API_URL")}/waInstance${Deno.env.get("GREEN_API_INSTANCE")}/sendMessage/${Deno.env.get("GREEN_API_TOKEN")}`
  const envio = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: `55${telefone}@c.us`, message: `Seu código do Meu Volante PRO é ${codigo}. Vale por 10 minutos.` })
  })
  if (!envio.ok) return responder({ erro: "Não foi possível enviar o código." }, 502)

  const { error } = await admin.from("tokens_whatsapp").insert({
    telefone,
    codigo_hash: await resumo(telefone, codigo),
    expira_em: new Date(Date.now() + VALIDADE_MS).toISOString()
  })
  if (error) return responder({ erro: "Não foi possível registrar o código." }, 500)
  return responder({ enviado: true })
}

async function conferir(telefone: string, codigo: string) {
  const { data: registro } = await admin.from("tokens_whatsapp").select("*").eq("telefone", telefone)
    .is("validado_em", null).gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false }).limit(1).maybeSingle()
  if (!registro || registro.tentativas >= MAX_TENTATIVAS) return responder({ erro: "Código expirado. Peça outro." }, 400)

  if (registro.codigo_hash !== await resumo(telefone, codigo)) {
    await admin.from("tokens_whatsapp").update({ tentativas: registro.tentativas + 1 }).eq("id", registro.id)
    return responder({ erro: "Código incorreto." }, 400)
  }
  await admin.from("tokens_whatsapp").update({ validado_em: new Date().toISOString() }).eq("id", registro.id)
  return responder({ validado: true })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "Método inválido." }, 405)
  const { acao, telefone, codigo } = await req.json().catch(() => ({}))
  if (!/^\d{2}9\d{8}$/.test(String(telefone))) return responder({ erro: "Celular inválido." }, 400)
  if (acao === "enviar") return enviar(telefone)
  if (acao === "conferir" && /^\d{6}$/.test(String(codigo))) return conferir(telefone, codigo)
  return responder({ erro: "Pedido inválido." }, 400)
})
