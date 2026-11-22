#!/usr/bin/env node
// Atualiza js/historico-oficial.js com os concursos publicados pela Caixa.
// Mantém os últimos 500 de Mega-Sena/Lotofácil e 100 de Quina/Lotomania/Dia de Sorte.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const ARQUIVO = 'js/historico-oficial.js';
const API = 'https://servicebus2.caixa.gov.br/portaldeloterias/api';
const MIRROR_API = 'https://loteriascaixa-api.herokuapp.com/api';
const ALVOS = [
  { mod: 'megasena', qtd: 500 },
  { mod: 'lotofacil', qtd: 500 },
  { mod: 'quina', qtd: 100 },
  { mod: 'lotomania', qtd: 100 },
  { mod: 'diadesorte', qtd: 100 }
];

async function buscar(modalidade, numero = '') {
  const resposta = await fetch(`${API}/${modalidade}/${numero}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(20000)
  });
  if (!resposta.ok) throw new Error(`${modalidade} ${numero}: HTTP ${resposta.status}`);
  return resposta.json();
}

async function buscarLoteMirror(modalidade, qtd) {
  const resposta = await fetch(`${MIRROR_API}/${modalidade}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30000)
  });
  if (!resposta.ok) throw new Error(`mirror ${modalidade}: HTTP ${resposta.status}`);
  const lista = await resposta.json();
  if (!Array.isArray(lista) || !lista.length) throw new Error(`mirror ${modalidade}: lista vazia`);
  return lista.slice(0, qtd).map((d) => {
    const reg = {
      concurso: Number(d.concurso),
      data: String(d.data || ''),
      dezenas: (d.dezenas || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b),
      acumulado: Boolean(d.acumulou),
      rateio: (d.premiacoes || []).map((f) => ({
        acertos: extrairAcertos(modalidade, { descricaoFaixa: f.descricao, faixa: f.faixa }),
        premio: Number(f.valorPremio) || 0
      }))
    };
    if (modalidade === 'diadesorte' && d.mesSorte) reg.mesSorte = String(d.mesSorte).trim();
    return reg;
  }).filter((r) => r.concurso > 0 && r.dezenas.length > 0);
}

function extrairAcertos(mod, faixa) {
  const desc = String(faixa?.descricaoFaixa || '');
  if (/0\s*acert/i.test(desc)) return 0;
  const num = Number(desc.replace(/\D/g, ''));
  if (num > 0) return num;
  const maxPorMod = { megasena: 6, lotofacil: 15, quina: 5, lotomania: 20, diadesorte: 7 };
  return (maxPorMod[mod] || 6) + 1 - Number(faixa?.faixa || 1);
}

function converter(mod, d) {
  const reg = {
    concurso: d.numero,
    data: d.dataApuracao,
    dezenas: (d.listaDezenas || []).map(Number).sort((a, b) => a - b),
    acumulado: Boolean(d.acumulado),
    rateio: (d.listaRateioPremio || []).map((f) => ({
      acertos: extrairAcertos(mod, f),
      premio: Number(f.valorPremio) || 0
    }))
  };
  if (mod === 'diadesorte' && d.nomeTimeCoracaoMesSorte) {
    reg.mesSorte = String(d.nomeTimeCoracaoMesSorte).trim();
  }
  return reg;
}

function lerAtual() {
  if (!existsSync(ARQUIVO)) return { megasena: [], lotofacil: [], quina: [], lotomania: [], diadesorte: [] };
  const texto = readFileSync(ARQUIVO, 'utf8');
  const parsed = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1));
  return {
    megasena: parsed.megasena || [],
    lotofacil: parsed.lotofacil || [],
    quina: parsed.quina || [],
    lotomania: parsed.lotomania || [],
    diadesorte: parsed.diadesorte || []
  };
}

const dados = lerAtual();

for (const { mod, qtd } of ALVOS) {
  try {
    const ultimo = converter(mod, await buscar(mod));
    const porConcurso = new Map((dados[mod] || []).map((c) => [c.concurso, c]));
    porConcurso.set(ultimo.concurso, ultimo);

    try {
      const seguinte = converter(mod, await buscar(mod, ultimo.concurso + 1));
      if (seguinte.dezenas.length) porConcurso.set(seguinte.concurso, seguinte);
    } catch {}

    const topo = Math.max(...porConcurso.keys());
    const faltantes = [];
    for (let n = topo; n > topo - qtd && n > 0; n--) {
      if (!porConcurso.has(n)) faltantes.push(n);
    }

    for (let i = 0; i < faltantes.length; i += 6) {
      const lote = faltantes.slice(i, i + 6);
      const resps = await Promise.allSettled(lote.map((n) => buscar(mod, n).then((d) => converter(mod, d))));
      for (const r of resps) {
        if (r.status === 'fulfilled' && r.value?.dezenas?.length) {
          porConcurso.set(r.value.concurso, r.value);
        }
      }
    }

    dados[mod] = [...porConcurso.values()]
      .filter((c) => c.concurso > topo - qtd)
      .sort((a, b) => b.concurso - a.concurso);
    console.log(`${mod}: ${dados[mod].length} concursos, último #${topo}`);
  } catch (err) {
    console.warn(`Aviso em ${mod} (CAIXA): ${err.message} — tentando mirror oficial...`);
    try {
      const doMirror = await buscarLoteMirror(mod, qtd);
      const porConcurso = new Map((dados[mod] || []).map((c) => [c.concurso, c]));
      for (const item of doMirror) porConcurso.set(item.concurso, item);
      const topo = Math.max(...porConcurso.keys());
      dados[mod] = [...porConcurso.values()]
        .filter((c) => c.concurso > topo - qtd)
        .sort((a, b) => b.concurso - a.concurso);
      console.log(`${mod} (mirror): ${dados[mod].length} concursos, último #${topo}`);
    } catch (errMirror) {
      console.warn(`Aviso em ${mod} (mirror): ${errMirror.message} (mantendo ${dados[mod]?.length || 0} locais)`);
    }
  }
}

writeFileSync(ARQUIVO, `// Gerado por scripts/atualizar-historico.mjs a partir da API da Caixa. Não editar.\nwindow.HISTORICO_OFICIAL = ${JSON.stringify(dados)};\n`);
