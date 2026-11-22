// Edge Function: baixa o histórico oficial de concursos da Caixa.
//
// Trabalha em lotes: cada chamada busca até `quantidade` concursos que ainda
// não estão no banco, indo do mais recente para trás. Chame repetidamente
// (ou por cron) até `faltam` chegar a zero — isso evita o timeout da função
// e o rate limit do portal da Caixa.
//
// GET ?modalidade=megasena&quantidade=50&alvo=200

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api"
const MODALIDADES = ["megasena", "lotofacil", "quina", "lotomania", "diadesorte"]
const CRON_SECRET = Deno.env.get("CRON_SECRET") || Deno.env.get("PUSH_CRON_SECRET") || ""

// Requisições simultâneas ao portal da Caixa. Acima disso o portal começa
// a recusar conexões.
const CONCORRENCIA = 5
const QUANTIDADE_MAXIMA = 60
const ALVO_PADRAO = 200

interface ConcursoRow {
  modalidade: string
  concurso: number
  data_apuracao: string
  dezenas: number[]
  acumulado: boolean
  rateio: { acertos: number; ganhadores: number; premio: number }[]
}

/** "28/11/2024" -> "2024-11-28" (formato date do Postgres) */
function dataBRParaISO(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((texto || "").trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

async function buscarConcurso(
  modalidade: string,
  concurso?: number
): Promise<ConcursoRow | null> {
  const url = concurso ? `${BASE}/${modalidade}/${concurso}` : `${BASE}/${modalidade}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    })

    if (!resposta.ok) return null

    const dados = await resposta.json()
    const dezenas = (dados?.listaDezenas ?? []).map(Number).filter(Number.isFinite)
    const dataISO = dataBRParaISO(String(dados?.dataApuracao ?? ""))
    const numero = Number(dados?.numero)

    // Sem dezenas ou sem data não há registro histórico válido.
    if (!dezenas.length || !dataISO || !Number.isFinite(numero)) return null

    const rateio = (dados?.listaRateioPremio ?? []).map((faixa: any) => ({
      acertos: Number(String(faixa?.descricaoFaixa ?? "").replace(/\D/g, "")) || 0,
      ganhadores: Number(faixa?.numeroDeGanhadores) || 0,
      premio: Number(faixa?.valorPremio) || 0
    }))

    return {
      modalidade,
      concurso: numero,
      data_apuracao: dataISO,
      dezenas: dezenas.sort((a: number, b: number) => a - b),
      acumulado: Boolean(dados?.acumulado),
      rateio
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/** Executa em pequenos lotes paralelos para não saturar o portal. */
async function buscarEmLotes(
  modalidade: string,
  numeros: number[]
): Promise<ConcursoRow[]> {
  const encontrados: ConcursoRow[] = []

  for (let i = 0; i < numeros.length; i += CONCORRENCIA) {
    const lote = numeros.slice(i, i + CONCORRENCIA)
    const respostas = await Promise.all(
      lote.map((n) => buscarConcurso(modalidade, n))
    )
    encontrados.push(...respostas.filter((r): r is ConcursoRow => r !== null))
  }

  return encontrados
}

async function sincronizar(modalidade: string, quantidade: number, alvo: number) {
  const ultimo = await buscarConcurso(modalidade)
  if (!ultimo) {
    return { modalidade, erro: "Caixa não respondeu", inseridos: 0, faltam: alvo }
  }

  const menorDesejado = Math.max(1, ultimo.concurso - alvo + 1)

  // Descobre o que já existe para não rebaixar a API por nada.
  const { data: existentes, error } = await supabase
    .from("concursos_historico")
    .select("concurso")
    .eq("modalidade", modalidade)
    .gte("concurso", menorDesejado)

  if (error) {
    return { modalidade, erro: error.message, inseridos: 0, faltam: alvo }
  }

  const jaTemos = new Set((existentes ?? []).map((r) => r.concurso))

  const pendentes: number[] = []
  for (let n = ultimo.concurso; n >= menorDesejado; n--) {
    if (!jaTemos.has(n)) pendentes.push(n)
    if (pendentes.length >= quantidade) break
  }

  if (pendentes.length === 0) {
    return {
      modalidade,
      inseridos: 0,
      faltam: 0,
      total_no_banco: jaTemos.size,
      ultimo_concurso: ultimo.concurso
    }
  }

  const linhas = await buscarEmLotes(modalidade, pendentes)

  if (linhas.length > 0) {
    const { error: erroGravacao } = await supabase
      .from("concursos_historico")
      .upsert(linhas, { onConflict: "modalidade,concurso" })

    if (erroGravacao) {
      return { modalidade, erro: erroGravacao.message, inseridos: 0, faltam: alvo - jaTemos.size }
    }
  }

  const totalAgora = jaTemos.size + linhas.length
  const universo = ultimo.concurso - menorDesejado + 1

  return {
    modalidade,
    inseridos: linhas.length,
    faltam: Math.max(0, universo - totalAgora),
    total_no_banco: totalAgora,
    ultimo_concurso: ultimo.concurso
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS })
  }

  // Exige autorização de cron ou service_role para evitar abuso externo da API
  const authHeader = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim()
  const autorizado = (CRON_SECRET && authHeader === CRON_SECRET)
    || (SUPABASE_SERVICE_ROLE_KEY && authHeader === SUPABASE_SERVICE_ROLE_KEY)
  if (!autorizado) {
    return new Response(JSON.stringify({ erro: "Não autorizado." }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" }
    })
  }

  const url = new URL(req.url)
  const modalidadeParam = url.searchParams.get("modalidade")
  const quantidade = Math.min(
    Number(url.searchParams.get("quantidade")) || 40,
    QUANTIDADE_MAXIMA
  )
  const alvo = Number(url.searchParams.get("alvo")) || ALVO_PADRAO

  const alvos = modalidadeParam ? [modalidadeParam.toLowerCase()] : MODALIDADES

  if (alvos.some((m) => !MODALIDADES.includes(m))) {
    return new Response(JSON.stringify({ erro: "modalidade inválida" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" }
    })
  }

  const relatorio = []
  for (const modalidade of alvos) {
    relatorio.push(await sincronizar(modalidade, quantidade, alvo))
  }

  return new Response(JSON.stringify({ resultado: relatorio }), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" }
  })
})
