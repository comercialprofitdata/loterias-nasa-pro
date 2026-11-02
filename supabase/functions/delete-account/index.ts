// Edge Function: exclusão de conta e dados pessoais.
//
// Dois caminhos, porque só um deles pode provar quem está pedindo:
//
//  POST com Authorization: Bearer <jwt>  -> apaga imediatamente
//     A sessão prova a titularidade. Remove perfil, assinaturas, leads e o
//     próprio usuário do auth.
//
//  POST { email } sem JWT               -> registra solicitação
//     Vem da página pública exigida pelo Google Play. Sem sessão não há como
//     provar que quem digitou o e-mail é o dono dele, então apagar na hora
//     permitiria que qualquer pessoa excluísse a conta de outra.
//
// Requisitos: Google Play (exclusão dentro e fora do app) e LGPD Art. 18, VI.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  })

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

/** Remove tudo que está atrelado ao usuário. Ordem importa: filhos antes. */
async function apagarDadosDoUsuario(userId: string, email: string) {
  const etapas: string[] = []

  const { error: erroAssinaturas } = await admin
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
  if (erroAssinaturas) throw new Error(`subscriptions: ${erroAssinaturas.message}`)
  etapas.push("assinaturas")

  // audit_logs referencia o usuário com ON DELETE SET NULL: o registro de
  // auditoria permanece, mas deixa de ser vinculável a uma pessoa.
  const { error: erroPerfil } = await admin.from("profiles").delete().eq("id", userId)
  if (erroPerfil) throw new Error(`profiles: ${erroPerfil.message}`)
  etapas.push("perfil")

  // Expurga apostas da carteira do usuário (UUID ou email)
  await admin
    .from("carteira_apostas")
    .delete()
    .or(`user_id.eq.${userId},user_id.eq.${email}`)
  etapas.push("carteira de apostas")

  // Expurga logs de telemetria do usuário
  if (email) await admin.from("eventos_uso").delete().eq("email", email)
  await admin
    .from("user_telemetria_logs")
    .delete()
    .or(`user_id.eq.${userId},user_id.eq.${email}`)
  etapas.push("logs de telemetria")

  if (email) {
    const { error: erroLead } = await admin
      .from("visitor_leads")
      .delete()
      .eq("email", email)
    if (erroLead) throw new Error(`visitor_leads: ${erroLead.message}`)
    etapas.push("cadastro de contato")
  }

  const { error: erroAuth } = await admin.auth.admin.deleteUser(userId)
  if (erroAuth) throw new Error(`auth: ${erroAuth.message}`)
  etapas.push("credenciais de acesso")

  return etapas
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return responder({ erro: "use POST" }, 405)

  let corpo: { email?: string; motivo?: string } = {}
  try {
    corpo = await req.json()
  } catch {
    // Corpo vazio é aceitável no fluxo autenticado.
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""

  // ---------- Caminho 1: sessão válida, exclusão imediata ----------
  if (token) {
    const cliente = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data, error } = await cliente.auth.getUser()

    if (error || !data?.user) {
      return responder({ erro: "sessão inválida ou expirada" }, 401)
    }

    try {
      const etapas = await apagarDadosDoUsuario(data.user.id, data.user.email ?? "")

      await admin.from("exclusao_solicitacoes").insert({
        email: data.user.email ?? "desconhecido@app.local",
        origem: "app",
        status: "concluida",
        processado_em: new Date().toISOString(),
        observacao: `Excluído pelo próprio titular: ${etapas.join(", ")}`
      })

      return responder({ excluido: true, removido: etapas })
    } catch (err) {
      console.error("Falha ao excluir conta:", err)
      return responder({ erro: "não foi possível concluir a exclusão" }, 500)
    }
  }

  // ---------- Caminho 2: sem sessão, abre solicitação ----------
  const email = (corpo.email ?? "").trim().toLowerCase()

  if (!emailValido(email)) {
    return responder({ erro: "informe um e-mail válido" }, 400)
  }

  const { error } = await admin.from("exclusao_solicitacoes").insert({
    email,
    motivo: (corpo.motivo ?? "").slice(0, 1000) || null,
    origem: "web",
    status: "pendente"
  })

  if (error) {
    console.error("Falha ao registrar solicitação:", error.message)
    return responder({ erro: "não foi possível registrar a solicitação" }, 500)
  }

  return responder({
    registrado: true,
    prazoDias: 30,
    mensagem:
      "Solicitação registrada. A exclusão é concluída em até 30 dias, " +
      "conforme a LGPD. Você receberá a confirmação neste e-mail."
  })
})
