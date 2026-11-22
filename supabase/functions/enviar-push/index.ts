// Edge Function: envia Web Push real (VAPID) em segundo plano para todos os
// celulares inscritos em push_subscriptions (TWA Android + PWA Web).
//
// Secrets necessárias no Supabase:
// - VAPID_PUBLIC_KEY
// - VAPID_PRIVATE_KEY
// - VAPID_SUBJECT (ex: mailto:suporte@pd.dev.br)
// - PUSH_ADMIN_SECRET (chave compartilhada com GitHub Actions / Painel Admin)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? ""
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:suporte@pd.dev.br"
const PUSH_ADMIN_SECRET = Deno.env.get("PUSH_ADMIN_SECRET") ?? ""

const CORS = {
  "Access-Control-Allow-Origin": "https://loterias.pd.dev.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-push-secret"
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  })

function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(valor)
}

async function consultarUltimoCaixa(modalidade = "megasena") {
  const urls = [
    `https://servicebus2.caixa.gov.br/portaldeloterias/api/${modalidade}`,
    `https://api.guidi.dev.br/loteria/${modalidade}/ultimo`
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      if (res.ok) return await res.json()
    } catch {
      // tenta fallback
    }
  }
  return null
}

async function montarPayload(tipo: string, body: Record<string, unknown>) {
  if (tipo === "manual") {
    return {
      title: String(body.titulo || "🎯 LotoLab"),
      body: String(body.corpo || "Novidade disponível no LotoLab!"),
      url: String(body.url || "./")
    }
  }

  if (tipo === "quiz") {
    return {
      title: "🧪 Quiz do Dia no LotoLab",
      body: "Nova pergunta disponível! Acerte para ganhar +10 Tokens (20 Tokens = +1 geração extra).",
      url: "./#lotolab-quiz-noticias"
    }
  }

  if (tipo === "acumulado") {
    const dados = await consultarUltimoCaixa("megasena")
    const premio = Number(dados?.valorEstimadoProximoConcurso || 0)
    const concurso = dados?.numeroConcursoProximo || ""
    const acumulado = Boolean(dados?.acumulado)
    if (!premio && !acumulado) {
      return null // não incomoda o usuário se API falhou sem dados
    }
    const textoPremio = premio > 0 ? formatarBRL(premio) : "prêmio acumulado"
    return {
      title: acumulado ? `🔥 Mega-Sena ACUMULOU: ${textoPremio}!` : `🍀 Mega-Sena #${concurso}: ${textoPremio}`,
      body: "Sorteio hoje às 20h. Gere seu jogo calibrado ou monte seu bolão no LotoLab.",
      url: "./"
    }
  }

  if (tipo === "resultado") {
    const dados = await consultarUltimoCaixa("megasena")
    const conc = dados?.numero ? `#${dados.numero}` : ""
    const dezenas = Array.isArray(dados?.listaDezenas) ? dados.listaDezenas.join(" · ") : ""
    return {
      title: `🎯 Resultado Mega-Sena ${conc}`.trim(),
      body: dezenas ? `Dezenas: ${dezenas}. Toque para conferir sua carteira.` : "Novo resultado oficial disponível. Toque para conferir.",
      url: "./#carteira"
    }
  }

  return {
    title: "🎯 LotoLab",
    body: "Acompanhe os próximos sorteios oficiais e organize seus jogos.",
    url: "./"
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "Método não permitido" }, 405)

  try {
    const segredoRecebido = req.headers.get("x-push-secret") ?? ""
    if (!PUSH_ADMIN_SECRET || segredoRecebido !== PUSH_ADMIN_SECRET) {
      return responder({ erro: "Não autorizado" }, 401)
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return responder({ erro: "Chaves VAPID não configuradas no Supabase" }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const tipo = String(body.tipo || "manual")
    const payload = await montarPayload(tipo, body)
    if (!payload) {
      return responder({ ok: true, enviados: 0, motivo: "Sem gatilho elegível agora" })
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const { data: inscritos, error } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("ativo", true)

    if (error) return responder({ erro: error.message }, 500)

    const lista = inscritos || []
    let enviados = 0
    let expirados = 0
    const jsonPayload = JSON.stringify(payload)

    await Promise.allSettled(
      lista.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            jsonPayload
          )
          enviados++
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode
          if (status === 404 || status === 410) {
            expirados++
            await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
          }
        }
      })
    )

    return responder({ ok: true, tipo, totalBase: lista.length, enviados, expirados, payload })
  } catch (err) {
    return responder({ erro: err instanceof Error ? err.message : "Erro ao enviar push" }, 500)
  }
})
