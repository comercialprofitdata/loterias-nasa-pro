#!/usr/bin/env node
// Gera as artes da loja e do Instagram. Uso: node scripts/gerar-artes.mjs <pasta com playwright> [--so-capturas]
// As capturas saem como no app da loja (sem venda nem botão de instalar).
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdirSync, readFile, readFileSync, copyFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const require = createRequire(join(process.argv[2], 'x.js'));
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('playwright-core')); }
const soCapturas = process.argv.includes('--so-capturas');
const logo = readFileSync('marketing/logo.svg', 'utf8');
const posts = JSON.parse(readFileSync('marketing/instagram-posts.json', 'utf8'));
mkdirSync('marketing/play', { recursive: true });
mkdirSync('marketing/instagram', { recursive: true });
if (!soCapturas) copyFileSync('icon-512.png', 'marketing/play/icone-512.png');

const base = 'margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;background:#0B1220;color:#F1F5F9;';
const marca = '<div style="display:flex;align-items:center;gap:20px"><div style="width:72px;height:72px">LOGO</div><b style="font-size:34px">Meu Volante PRO</b></div>'.replace('LOGO', logo);

const navegador = await chromium.launch({ channel: 'chrome' });

async function arte(caminho, largura, altura, html) {
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
  await pagina.setContent(`<body style="${base}width:${largura}px;height:${altura}px;overflow:hidden">${html}</body>`);
  await pagina.screenshot({ path: caminho });
  await pagina.close();
}

if (!soCapturas) await arte('marketing/play/destaque-1024x500.png', 1024, 500, `
  <div style="height:100%;box-sizing:border-box;padding:56px;display:flex;flex-direction:column;justify-content:center;gap:24px">
    ${marca}
    <div style="font-size:52px;font-weight:800;line-height:1.1">Seus jogos em ordem.</div>
    <div style="font-size:26px;color:#A3B1C6">Gastos, conferência e chance real. Não prevemos resultados.</div>
  </div>`);

const cores = { 'Métodos': '#22D3EE', 'Ciência': '#10B981', 'Consciência': '#F59E0B', 'Mitos': '#A855F7', 'App': '#38BDF8' };
for (const post of soCapturas ? [] : posts) {
  await arte(`marketing/instagram/dia-${String(post.dia).padStart(2, '0')}.png`, 1080, 1350, `
    <div style="height:100%;box-sizing:border-box;padding:88px;display:flex;flex-direction:column;justify-content:space-between">
      ${marca}
      <div style="display:flex;flex-direction:column;gap:36px">
        <div style="font-size:30px;font-weight:800;color:${cores[post.tema]}">${post.tema.toUpperCase()}</div>
        <div style="font-size:92px;font-weight:800;line-height:1.08">${post.titulo}</div>
        <div style="font-size:44px;line-height:1.35;color:#CBD5E1">${post.texto}</div>
      </div>
      <div style="font-size:26px;color:#A3B1C6">Não prevê resultados nem garante prêmios • App independente, sem vínculo com a Caixa • +18</div>
    </div>`);
}
if (!soCapturas) writeFileSync('marketing/instagram/legendas.md', posts.map((p) => `## Dia ${p.dia}: ${p.titulo}\n${p.legenda}\n`).join('\n'));

// Capturas reais do app.
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const servidor = createServer((q, r) => {
  let f = '.' + decodeURIComponent(q.url.split('?')[0]);
  if (f === './') f = './index.html';
  readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': tipos[extname(f)] || 'text/plain' }); r.end(d); } });
}).listen(8131);
const contexto = await navegador.newContext({ viewport: { width: 412, height: 732 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
await contexto.addInitScript(() => {
  localStorage.setItem('nasa_boas_vindas_v1', 'x');
  localStorage.setItem('loterias_nasa_visitor_lead', '{"email":"exemplo@exemplo.com"}');
  localStorage.setItem('meu_volante_orcamento_mensal', '100');
  localStorage.setItem('nasa_reconferencia_20261101', '1');
  localStorage.setItem('nasa_modo_loja', '1');
});
await contexto.route(/supabase\.co\/(rest|functions)/, (r) => (['GET', 'OPTIONS'].includes(r.request().method()) ? r.continue() : r.abort()));
const p = await contexto.newPage();
await p.goto('http://localhost:8131/', { waitUntil: 'load' });
await p.waitForTimeout(3500);
const foto = async (nome) => { await p.waitForTimeout(3600); await p.screenshot({ path: `marketing/play/captura-${nome}.png` }); };
await p.evaluate(() => iniciarJogo());
await foto('1-jogo');
await p.evaluate(async () => {
  carteiraJogos.length = 0;
  carteiraJogos.push({ id: 21, modalidade: 'megasena', nome: 'j', dezenas: [10, 18, 27, 41, 52, 59], data: '12/11/2026', concursoAlvo: '#3085', status: 'x' });
  await conferirSorteiosPassadosAutomatico();
  await new Promise((s) => setTimeout(s, 1000));
  mudarAba('inicio');
  renderizarGastos();
});
await foto('2-inicio');
await p.click('#cartao-na-proxima .ritual-ver');
await p.waitForTimeout(4500);
await p.screenshot({ path: 'marketing/play/captura-3-resultado.png' });
await p.click('#ritual-acao');
await p.evaluate(() => mudarAba('carteira'));
await foto('4-carteira');
await p.evaluate(() => mudarAba('calor'));
await foto('5-estatisticas');
await p.evaluate(() => {
  localStorage.setItem('meu_volante_boloes', JSON.stringify([{
    id: 1, nome: 'Bolão da família', modalidade: 'megasena', destino: 'virada', modo: 'caixa', dezenas: 6, cotas: 4, minhasCotas: 1,
    jogos: [[4, 17, 23, 38, 45, 52], [8, 13, 29, 34, 47, 56], [2, 19, 26, 31, 43, 60]],
    participantes: [{ nome: 'Ana', cotas: 1, pagou: true }, { nome: 'Bruno', cotas: 1, pagou: true }, { nome: 'Carla', cotas: 1, pagou: false }, { nome: 'Você', cotas: 1, pagou: true }],
    prazo: '2026-12-20', guardiao: 'Ana', premioPequeno: 'dividir'
  }]));
  window.abrirBolaoNoGerar();
});
await foto('6-bolao');
await navegador.close();
servidor.close();
console.log('artes geradas');
