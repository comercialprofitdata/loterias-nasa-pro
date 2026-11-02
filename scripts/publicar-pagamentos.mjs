#!/usr/bin/env node
// Publica as funções de pagamento no Supabase. Uso: node scripts/publicar-pagamentos.mjs
// Pede o token e a chave do Asaas no terminal; não grava nenhum dos dois.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const PROJETO = 'kwiagspkzrnculrvtrmp';
const API = `https://api.supabase.com/v1/projects/${PROJETO}`;
const ARQUIVO_WEBHOOK = '.env.asaas';

const leitor = createInterface({ input: process.stdin, output: process.stdout });
const token = (await leitor.question('Token do Supabase (sbp_...): ')).trim();
const chaveAsaas = (await leitor.question('Chave do Asaas (Enter para manter a atual): ')).trim();
leitor.close();

if (!token.startsWith('sbp_')) throw new Error('Token do Supabase inválido.');
if (chaveAsaas && !chaveAsaas.startsWith('$aact_prod_')) throw new Error('A chave deve ser de produção e começar com $aact_prod_.');

let tokenWebhook = existsSync(ARQUIVO_WEBHOOK)
  ? readFileSync(ARQUIVO_WEBHOOK, 'utf8').split('=')[1]?.trim()
  : '';
if (!tokenWebhook) {
  tokenWebhook = randomBytes(24).toString('base64url');
  writeFileSync(ARQUIVO_WEBHOOK, `ASAAS_WEBHOOK_TOKEN=${tokenWebhook}\n`, { mode: 0o600 });
}

const segredos = await fetch(`${API}/secrets`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify([
    ...(chaveAsaas ? [{ name: 'ASAAS_API_KEY', value: chaveAsaas }] : []),
    { name: 'ASAAS_API_URL', value: 'https://api.asaas.com/v3' },
    { name: 'ASAAS_WEBHOOK_TOKEN', value: tokenWebhook }
  ])
});
console.log(`Segredos: ${segredos.ok ? 'OK' : `FALHOU (${segredos.status})`}`);
if (!segredos.ok) process.exit(1);

const funcoes = [
  ['criar-cobranca', ''],
  ['cancelar-assinatura', ''],
  ['delete-account', ''],
  ['asaas-webhook', '--no-verify-jwt']
];
for (const [nome, opcao] of funcoes) {
  execSync(`npx -y supabase@2.122.0 functions deploy ${nome} ${opcao} --project-ref ${PROJETO} --use-api`, {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    stdio: 'ignore'
  });
  console.log(`Função ${nome}: OK`);
}

const base = `https://${PROJETO}.supabase.co/functions/v1`;
const semToken = await fetch(`${base}/asaas-webhook`, { method: 'POST', body: '{}' });
const semLogin = await fetch(`${base}/criar-cobranca`, { method: 'POST', body: '{}' });
console.log(`Webhook sem token (esperado 401): ${semToken.status}`);
console.log(`Cobrança sem login (esperado 401): ${semLogin.status}`);
console.log(`\nURL do webhook no Asaas: ${base}/asaas-webhook`);
console.log(`Token do webhook: está no arquivo ${ARQUIVO_WEBHOOK}`);
