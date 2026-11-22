#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PACKAGE_NAME = 'br.dev.pd.meuvolante';
const KEY_PATH = process.env.GOOGLE_PLAY_KEY || path.resolve('android/play-service-account.json');
const AAB_PATH = process.argv[2] || path.resolve('android/LotoLab-v8.aab');
const TRACK = process.argv[3] || 'internal'; // internal | alpha | beta | production

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${claim}`)
    .sign(sa.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`
    })
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Falha OAuth2: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function api(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} em ${url}: ${text}`);
  }
  return json;
}

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`❌ Chave JSON não encontrada em: ${KEY_PATH}`);
    console.error('Salve o arquivo JSON da Conta de Serviço em android/play-service-account.json');
    process.exit(1);
  }
  if (!fs.existsSync(AAB_PATH)) {
    console.error(`❌ Arquivo .aab não encontrado em: ${AAB_PATH}`);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  const token = await getAccessToken(sa);
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;
  const uploadBase = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACKAGE_NAME}`;

  console.log(`🔑 Autenticado como ${sa.client_email}`);
  const edit = await api(`${base}/edits`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log(`📝 Edit aberto: ${edit.id}`);

  const aabBuffer = fs.readFileSync(AAB_PATH);
  console.log(`📦 Enviando ${path.basename(AAB_PATH)} (${(aabBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
  const bundle = await api(`${uploadBase}/edits/${edit.id}/bundles?uploadType=media`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: aabBuffer
  });
  console.log(`✅ Bundle enviado! versionCode=${bundle.versionCode}`);

  await api(`${base}/edits/${edit.id}/tracks/${TRACK}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track: TRACK,
      releases: [{
        versionCodes: [String(bundle.versionCode)],
        status: 'completed'
      }]
    })
  });
  console.log(`🚀 Faixa '${TRACK}' atualizada para versionCode ${bundle.versionCode}`);

  await api(`${base}/edits/${edit.id}:commit`, token, { method: 'POST' });
  console.log('🎉 Publicação enviada para revisão na Google Play com sucesso!');
}

main().catch((err) => {
  console.error('❌ Erro no envio:', err.message);
  process.exit(1);
});
