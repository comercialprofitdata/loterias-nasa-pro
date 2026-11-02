// Edge Function: cria cobrança ou assinatura no Asaas.
//
// Regras de segurança que moldam este arquivo:
//
//  1. O PREÇO NUNCA VEM DO CLIENTE. A tabela PLANOS abaixo é a fonte da
//     verdade. Se o valor viesse no corpo da requisição, qualquer pessoa
//     abriria o DevTools e assinaria o plano anual por um centavo.
//  2. A API key do Asaas fica só aqui, como secret da função. No front-end
//     ela daria a terceiros acesso a criar cobranças e ler recebimentos.
//  3. Exige sessão válida: cobrança sem dono não tem como ser liberada
//     depois pelo webhook.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!
// Sandbox: https://api-sandbox.asaas.com/v3 · Produção: https://api.asaas.com/v3
const ASAAS_API_URL = Deno.env.get("ASAAS_API_URL") ?? ""

const CORS = {
  "Access-Control-Allow-Origin": "https://loterias.pd.dev.br",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface Plano {
  nome: string
  valor: number
  recorrente: boolean
  ciclo?: "MONTHLY" | "YEARLY"
  descricao: string
}

const PLANOS: Record<string, Plano> = {
  avulso: {
    nome: "Passe de 30 dias",
    // O Asaas recusa cobrança abaixo de R$ 5,00; R$ 4,90 batia nesse piso
    // e toda tentativa de compra falhava com "valor não pode ser menor
    // que R$ 5,00" — só foi descoberto simulando uma cobrança de verdade
    // no sandbox.
    valor: 5.9,
    recorrente: false,
    descricao: "Meu Volante PRO — passe de 30 dias"
  },
  mensal: {
    nome: "PRO Mensal",
    valor: 29.9,
    recorrente: true,
    ciclo: "MONTHLY",
    descricao: "Meu Volante PRO — assinatura mensal"
  },
  anual: {
    nome: "PRO Anual",
    valor: 197,
    recorrente: true,
    ciclo: "YEARLY",
    descricao: "Meu Volante PRO — assinatura anual"
  }
}

const METODOS = ["PIX", "CREDIT_CARD", "UNDEFINED"] as const

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  })

async function chamarAsaas(caminho: string, metodo: string, corpo?: unknown) {
  const resposta = await fetch(`${ASAAS_API_URL}${caminho}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "MeuVolantePRO",
      access_token: ASAAS_API_KEY
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  })

  const dados = await resposta.json()

  if (!resposta.ok) {
    const detalhe = dados?.errors?.[0]?.description ?? `HTTP ${resposta.status}`
    throw new Error(detalhe)
  }

  return dados
}

/** Só dígitos, 11 (CPF) ou 14 (CNPJ). O Asaas recusa o cadastro sem isso. */
function normalizarDocumento(valor: string): string | null {
  const digitos = (valor || "").replace(/\D/g, "")
  return digitos.length === 11 || digitos.length === 14 ? digitos : null
}

/** Reaproveita o cliente já criado no Asaas para não duplicar cadastro. */
async function obterOuCriarCliente(
  userId: string,
  nome: string,
  email: string,
  documento: string
): Promise<string> {
  const { data: perfil } = await admin
    .from("profiles")
    .select("asaas_customer_id")
    .eq("id", userId)
    .maybeSingle()

  if (perfil?.asaas_customer_id) return perfil.asaas_customer_id

  const cliente = await chamarAsaas("/customers", "POST", {
    name: nome,
    email,
    cpfCnpj: documento,
    notificationDisabled: false
  })

  await admin
    .from("profiles")
    .update({ asaas_customer_id: cliente.id })
    .eq("id", userId)

  return cliente.id
}

function vencimentoEmDias(dias: number): string {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data.toISOString().slice(0, 10)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "use POST" }, 405)

  if (!ASAAS_API_KEY || !ASAAS_API_URL) {
    return responder({ erro: "gateway não configurado" }, 503)
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!token) return responder({ erro: "autenticação obrigatória" }, 401)

  const clienteUsuario = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  const { data: sessao, error: erroSessao } = await clienteUsuario.auth.getUser()
  if (erroSessao || !sessao?.user) {
    return responder({ erro: "sessão inválida ou expirada" }, 401)
  }

  let corpo: { plano?: string; metodo?: string; documento?: string; nome?: string } = {}
  try {
    corpo = await req.json()
  } catch {
    return responder({ erro: "corpo inválido" }, 400)
  }

  const plano = PLANOS[String(corpo.plano ?? "")]
  if (!plano) return responder({ erro: "plano inválido" }, 400)

  const metodo = String(corpo.metodo ?? "UNDEFINED")
  if (!METODOS.includes(metodo as typeof METODOS[number])) {
    return responder({ erro: "método de pagamento inválido" }, 400)
  }

  const documento = normalizarDocumento(String(corpo.documento ?? ""))
  if (!documento) return responder({ erro: "CPF ou CNPJ inválido" }, 400)

  const email = sessao.user.email ?? ""
  const nome =
    String(corpo.nome ?? "").trim() ||
    sessao.user.user_metadata?.full_name ||
    email.split("@")[0]

  // Clique repetido ou checkout abandonado reaproveita a cobrança em aberto.
  const { data: pendente } = await admin
    .from("cobrancas")
    .select("id, url_pagamento")
    .eq("user_id", sessao.user.id)
    .eq("plano", corpo.plano)
    .eq("status", "pendente")
    .not("url_pagamento", "is", null)
    .order("criada_em", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendente) {
    return responder({
      id: pendente.id,
      plano: plano.nome,
      valor: plano.valor,
      recorrente: plano.recorrente,
      urlPagamento: pendente.url_pagamento
    })
  }

  try {
    const customerId = await obterOuCriarCliente(sessao.user.id, nome, email, documento)

    const base = {
      customer: customerId,
      billingType: metodo,
      value: plano.valor,
      description: plano.descricao,
      externalReference: `${sessao.user.id}|${corpo.plano}`
    }

    // Assinatura usa /subscriptions para o Asaas cuidar da renovação;
    // cobrança avulsa usa /payments.
    const cobranca = plano.recorrente
      ? await chamarAsaas("/subscriptions", "POST", {
          ...base,
          cycle: plano.ciclo,
          nextDueDate: vencimentoEmDias(1)
        })
      : await chamarAsaas("/payments", "POST", {
          ...base,
          dueDate: vencimentoEmDias(3)
        })

    // Assinatura não traz invoiceUrl: a primeira fatura é gerada em seguida.
    let urlPagamento: string | null = cobranca.invoiceUrl ?? null
    if (!urlPagamento && plano.recorrente) {
      const faturas = await chamarAsaas(`/subscriptions/${cobranca.id}/payments`, "GET")
      urlPagamento = faturas?.data?.[0]?.invoiceUrl ?? null
    }

    const { error: erroRegistro } = await admin.from("cobrancas").insert({
      id: cobranca.id,
      user_id: sessao.user.id,
      email,
      plano: corpo.plano,
      valor: plano.valor,
      metodo,
      status: "pendente",
      url_pagamento: urlPagamento,
      vence_em: cobranca.dueDate ?? cobranca.nextDueDate ?? null,
      evento_bruto: cobranca
    })
    if (erroRegistro) throw new Error(`registro da cobrança: ${erroRegistro.message}`)

    return responder({
      id: cobranca.id,
      plano: plano.nome,
      valor: plano.valor,
      recorrente: plano.recorrente,
      urlPagamento
    })
  } catch (err) {
    console.error("Falha ao criar cobrança:", err)
    return responder({ erro: "Não foi possível criar a cobrança. Tente novamente." }, 502)
  }
})
