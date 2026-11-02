// Edge Function: recebe eventos de pagamento do Asaas.
//
// É o único ponto que concede acesso PRO. O app nunca libera plano por conta
// própria: quem manda é a confirmação do gateway, que chega aqui.
//
// Autenticação: o Asaas envia em todo POST o header `asaas-access-token` com
// o valor cadastrado no painel (Configurações → Integrações → Webhooks). Sem
// conferir isso, qualquer um descobriria a URL e liberaria PRO de graça.
//
// Eventos podem chegar repetidos ou fora de ordem. Por isso uma fatura nunca
// volta a um estado anterior, e a validade é calculada pela data do pagamento.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? ""

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" }
  })

/** Comparação de tempo constante: evita vazar o token por medida de tempo. */
function tokensIguais(recebido: string, esperado: string) {
  if (recebido.length !== esperado.length) return false
  let diferenca = 0
  for (let i = 0; i < recebido.length; i++) {
    diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i)
  }
  return diferenca === 0
}

// Evento do Asaas -> estado da cobrança
const MAPA_EVENTOS: Record<string, string> = {
  PAYMENT_CREATED: "pendente",
  PAYMENT_AWAITING_RISK_ANALYSIS: "pendente",
  PAYMENT_APPROVED_BY_RISK_ANALYSIS: "pendente",
  PAYMENT_CONFIRMED: "confirmada",
  PAYMENT_RECEIVED: "recebida",
  PAYMENT_OVERDUE: "vencida",
  PAYMENT_REFUNDED: "estornada",
  PAYMENT_REPROVED_BY_RISK_ANALYSIS: "cancelada",
  PAYMENT_DELETED: "cancelada",
  PAYMENT_CHARGEBACK_REQUESTED: "estornada",
  PAYMENT_CHARGEBACK_DISPUTE: "estornada"
}

// Ordem do ciclo de uma fatura: evento atrasado não desfaz estado posterior.
const ORDEM_ESTADO: Record<string, number> = {
  pendente: 0,
  vencida: 1,
  confirmada: 2,
  recebida: 3,
  cancelada: 4,
  estornada: 5
}

// Estados que dão acesso PRO. "confirmada" já libera: o pagamento foi aprovado,
// mesmo que o dinheiro só caia na conta no repasse (D+1, D+30 no cartão).
const LIBERAM_ACESSO = new Set(["confirmada", "recebida"])

const DURACAO_PLANO_DIAS: Record<string, number> = {
  avulso: 30,
  mensal: 31,
  anual: 366
}

function validadeDoPlano(plano: string, pagoEm: string): string {
  const dias = DURACAO_PLANO_DIAS[plano] ?? 31
  const data = new Date(pagoEm)
  data.setDate(data.getDate() + dias)
  return data.toISOString()
}

async function tratarFimDaAssinatura(idAssinatura: string) {
  // O período já pago continua valendo até o fim da validade.
  const { error } = await admin
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("provider_subscription_id", idAssinatura)
  if (error) {
    console.error("Erro ao encerrar assinatura:", error.message)
    return json({ erro: "falha ao encerrar" }, 500)
  }
  return json({ ok: true })
}

serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "use POST" }, 405)

  if (!WEBHOOK_TOKEN) {
    console.error("ASAAS_WEBHOOK_TOKEN não configurado")
    return json({ erro: "webhook não configurado" }, 503)
  }

  const tokenRecebido = req.headers.get("asaas-access-token") ?? ""
  if (!tokensIguais(tokenRecebido, WEBHOOK_TOKEN)) {
    return json({ erro: "não autorizado" }, 401)
  }

  let corpo: { event?: string; payment?: Record<string, any>; subscription?: Record<string, any> }
  try {
    corpo = await req.json()
  } catch {
    return json({ erro: "json inválido" }, 400)
  }

  const evento = String(corpo.event ?? "")

  if (evento === "SUBSCRIPTION_DELETED" || evento === "SUBSCRIPTION_INACTIVATED") {
    return corpo.subscription?.id ? tratarFimDaAssinatura(corpo.subscription.id) : json({ ignorado: evento })
  }

  const pagamento = corpo.payment
  const novoStatus = MAPA_EVENTOS[evento]

  // Evento que não afeta acesso. Responder 200 evita que a fila do Asaas trave.
  if (!pagamento?.id || !novoStatus) return json({ ignorado: evento })

  // externalReference foi gravado por criar-cobranca como "userId|plano".
  const [userIdRef, planoRef] = String(pagamento.externalReference ?? "").split("|")

  // A fatura pode já existir ou ser nova, gerada pela renovação da assinatura.
  const { data: existente } = await admin
    .from("cobrancas")
    .select("user_id, plano, email, status, paga_em")
    .eq("id", pagamento.id)
    .maybeSingle()

  if (existente && ORDEM_ESTADO[existente.status] > ORDEM_ESTADO[novoStatus]) {
    return json({ ignorado: "evento_atrasado", atual: existente.status })
  }

  // Renovação sem referência: o dono vem da assinatura já registrada.
  let assinaturaAtual: Record<string, any> | null = null
  if (pagamento.subscription) {
    const { data } = await admin
      .from("subscriptions")
      .select("user_id, plan_code, valid_until")
      .eq("provider_subscription_id", pagamento.subscription)
      .maybeSingle()
    assinaturaAtual = data
  }

  const userId = existente?.user_id ?? (userIdRef || assinaturaAtual?.user_id || null)
  const plano = existente?.plano ?? (planoRef || assinaturaAtual?.plan_code || "mensal")
  const liberaAcesso = LIBERAM_ACESSO.has(novoStatus)
  const pagoEm = existente?.paga_em ??
    (liberaAcesso ? new Date(pagamento.paymentDate ?? pagamento.confirmedDate ?? Date.now()).toISOString() : null)

  const linha = {
    id: pagamento.id,
    user_id: userId,
    email: existente?.email ?? "desconhecido",
    plano,
    valor: Number(pagamento.value) || 0,
    metodo: pagamento.billingType ?? "UNDEFINED",
    status: novoStatus,
    url_pagamento: pagamento.invoiceUrl ?? null,
    vence_em: pagamento.dueDate ?? null,
    paga_em: pagoEm,
    evento_bruto: corpo
  }

  let { error: erroCobranca } = await admin.from("cobrancas").upsert(linha, { onConflict: "id" })

  // Conta já excluída: guarda a cobrança sem dono em vez de travar a fila.
  if (erroCobranca?.code === "23503") {
    ;({ error: erroCobranca } = await admin.from("cobrancas").upsert({ ...linha, user_id: null }, { onConflict: "id" }))
    if (!erroCobranca) return json({ ok: true, aviso: "usuario_excluido" })
  }

  if (erroCobranca) {
    console.error("Erro ao gravar cobrança:", erroCobranca.message)
    // 500 faz o Asaas reenviar depois, o que é o comportamento desejado.
    return json({ erro: "falha ao gravar" }, 500)
  }

  // Sem usuário identificado, a cobrança fica registrada para conciliação manual.
  if (!userId) {
    console.warn(`Pagamento ${pagamento.id} sem usuário vinculado`)
    return json({ ok: true, aviso: "cobranca_sem_usuario" })
  }

  const idAssinatura = pagamento.subscription ?? pagamento.id

  if (liberaAcesso) {
    const { error } = await admin.from("subscriptions").upsert(
      {
        user_id: userId,
        provider: "asaas",
        provider_customer_id: pagamento.customer ?? null,
        provider_subscription_id: idAssinatura,
        plan_code: plano,
        status: "active",
        valid_until: validadeDoPlano(plano, pagoEm),
        updated_at: new Date().toISOString()
      },
      { onConflict: "provider_subscription_id" }
    )

    if (error) {
      console.error("Erro ao ativar assinatura:", error.message)
      return json({ erro: "falha ao ativar" }, 500)
    }

    // A linha provisória da assinatura já cumpriu seu papel.
    if (pagamento.subscription) {
      await admin.from("cobrancas").delete().eq("id", pagamento.subscription).eq("status", "pendente")
    }
  }

  let atualizacao: Record<string, unknown> | null = null
  if (novoStatus === "estornada") {
    atualizacao = { status: "canceled", valid_until: new Date().toISOString() }
  } else if (novoStatus === "vencida" || novoStatus === "cancelada") {
    // Fatura antiga não derruba quem ainda está dentro do período pago.
    const aindaPago = assinaturaAtual?.valid_until && new Date(assinaturaAtual.valid_until) > new Date()
    if (!aindaPago) atualizacao = { status: novoStatus === "vencida" ? "past_due" : "canceled" }
  }

  if (atualizacao) {
    const { error } = await admin
      .from("subscriptions")
      .update({ ...atualizacao, updated_at: new Date().toISOString() })
      .eq("provider_subscription_id", idAssinatura)

    if (error) {
      console.error("Erro ao revogar assinatura:", error.message)
      return json({ erro: "falha ao revogar" }, 500)
    }
  }

  return json({ ok: true, evento, status: novoStatus })
})
