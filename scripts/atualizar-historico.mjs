#!/usr/bin/env node
// Atualiza js/historico-oficial.js com os concursos publicados pela Caixa.
// Mantém os últimos 500 de cada modalidade e só baixa os que faltam.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const ARQUIVO = 'js/historico-oficial.js';
const API = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
const QTD = 500;

async function buscar(modalidade, numero = '') {
  const resposta = await fetch(`${API}/${modalidade}/${numero}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  });
  if (!resposta.ok) throw new Error(`${modalidade} ${numero}: HTTP ${resposta.status}`);
  return resposta.json();
}

function converter(d) {
  const faixaMaxima = d.tipoJogo === 'LOTOFACIL' ? 15 : 6;
  return {
    concurso: d.numero,
    data: d.dataApuracao,
    dezenas: (d.listaDezenas || []).map(Number).sort((a, b) => a - b),
    acumulado: Boolean(d.acumulado),
    rateio: (d.listaRateioPremio || []).map((f) => ({
      acertos: faixaMaxima + 1 - Number(f.faixa),
      premio: Number(f.valorPremio) || 0
    }))
  };
}

function lerAtual() {
  if (!existsSync(ARQUIVO)) return { megasena: [], lotofacil: [] };
  const texto = readFileSync(ARQUIVO, 'utf8');
  return JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1));
}

const dados = lerAtual();

for (const modalidade of ['megasena', 'lotofacil']) {
  const ultimo = converter(await buscar(modalidade));
  const porConcurso = new Map(dados[modalidade].map((c) => [c.concurso, c]));
  porConcurso.set(ultimo.concurso, ultimo);

  // A raiz da API pode atrasar: tenta também o concurso seguinte.
  try {
    const seguinte = converter(await buscar(modalidade, ultimo.concurso + 1));
    if (seguinte.dezenas.length) porConcurso.set(seguinte.concurso, seguinte);
  } catch {}

  const topo = Math.max(...porConcurso.keys());
  for (let n = topo; n > topo - QTD && n > 0; n--) {
    if (!porConcurso.has(n)) porConcurso.set(n, converter(await buscar(modalidade, n)));
  }

  dados[modalidade] = [...porConcurso.values()]
    .filter((c) => c.concurso > topo - QTD)
    .sort((a, b) => b.concurso - a.concurso);
  console.log(`${modalidade}: ${dados[modalidade].length} concursos, último ${topo}`);
}

writeFileSync(ARQUIVO, `// Gerado por scripts/atualizar-historico.mjs a partir da API da Caixa. Não editar.\nwindow.HISTORICO_OFICIAL = ${JSON.stringify(dados)};\n`);
