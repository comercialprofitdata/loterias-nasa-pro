// ===================================================================
// CONFERÊNCIA DE BILHETES - resultado oficial da Caixa
// ===================================================================
// A conferência anterior comparava TODO bilhete com baseConcursosMega[0]:
// um concurso hardcoded de 28/11/2024, ignorando a data que o usuário
// escolheu ao salvar. Bilhetes de outras datas podiam ser marcados como
// premiados por coincidência com um sorteio antigo.
//
// Princípio: só existem dois desfechos honestos — conferido contra o
// concurso certo, ou declaradamente não conferido. "Não premiado" só é
// escrito depois de comparar com o resultado oficial daquela data.

const CONFERENCIA_CONFIG = {
  get functionUrl() {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    return base ? `${base}/functions/v1/fetch-resultado` : null;
  }
};

// Faixas premiadas por modalidade (mínimo de acertos que paga prêmio)
const FAIXAS_PREMIACAO = {
  megasena: [
    { acertos: 6, rotulo: '🏆 SENA' },
    { acertos: 5, rotulo: '🥈 QUINA' },
    { acertos: 4, rotulo: '🥉 QUADRA' }
  ],
  lotofacil: [
    { acertos: 15, rotulo: '🏆 15 PONTOS' },
    { acertos: 14, rotulo: '14 Pontos' },
    { acertos: 13, rotulo: '13 Pontos' },
    { acertos: 12, rotulo: '12 Pontos' },
    { acertos: 11, rotulo: '11 Pontos' }
  ]
};

const STATUS = {
  aguardando: '⏳ Aguardando sorteio',
  indisponivel: '⚠️ Não foi possível conferir',
  naoPremiado: 'Não premiado'
};

// Evita repetir a mesma consulta para vários bilhetes da mesma data.
const cacheResultados = new Map();

async function obterResultadoOficial(modalidade, dataBR, concursoNum) {
  const chave = `${modalidade}|${concursoNum || dataBR}`;
  if (cacheResultados.has(chave)) return cacheResultados.get(chave);

  // 1. Tenta achar na baseConcursos em memória primeiro (ultra-rápido, sem rede)
  const base = modalidade === 'megasena' ? (window.baseConcursosMega || []) : (window.baseConcursosLoto || []);
  let encontrado = null;
  if (concursoNum) {
    const num = Number(String(concursoNum).replace(/\D/g, ''));
    if (num > 0) encontrado = base.find(c => Number(c.concurso) === num);
  }
  if (!encontrado && dataBR) {
    encontrado = base.find(c => c.data === dataBR);
  }
  if (encontrado && Array.isArray(encontrado.dezenas) && encontrado.dezenas.length > 0) {
    cacheResultados.set(chave, encontrado);
    return encontrado;
  }

  // 2. Se não achou na memória, busca via API da Caixa por número de concurso ou data
  let resultado = null;
  if (concursoNum && window.caixaApi && typeof window.caixaApi.ultimo === 'function') {
    const num = Number(String(concursoNum).replace(/\D/g, ''));
    if (num > 0) {
      resultado = await window.caixaApi.ultimo(modalidade, num).catch(() => null);
    }
  }
  if (!resultado && typeof buscarConcursoPorData === 'function') {
    resultado = await buscarConcursoPorData(modalidade, dataBR).catch(() => null);
  }

  if (resultado) cacheResultados.set(chave, resultado);
  return resultado;
}

function dataBRNoFuturo(dataBR) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((dataBR || '').trim());
  if (!partes) return false;

  const [, dia, mes, ano] = partes;
  const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 20, 0, 0);
  return alvo.getTime() > Date.now();
}

function premioDaFaixa(resultado, acertos) {
  const faixa = (resultado.rateio || []).find((f) => f.acertos === acertos);
  return faixa ? Number(faixa.premio) || 0 : 0;
}

function combinacoes(n, k) {
  if (k < 0 || k > n) return 0;
  let total = 1;
  for (let i = 1; i <= k; i++) total = (total * (n - k + i)) / i;
  return Math.round(total);
}

/** Jogo com mais dezenas equivale a várias apostas simples: soma todas as faixas. */
function premioTotalDoBilhete(bilhete, resultado, acertos, faixas) {
  const dezenasPorAposta = bilhete.modalidade === 'lotofacil' ? 15 : 6;
  const n = (bilhete.dezenas || []).length;
  return faixas.reduce((total, f) => {
    const apostas = combinacoes(acertos, f.acertos) * combinacoes(n - acertos, dezenasPorAposta - f.acertos);
    return total + apostas * premioDaFaixa(resultado, f.acertos);
  }, 0);
}

function avaliarBilhete(bilhete, resultado) {
  const sorteadas = (resultado.dezenas || []).map(Number);
  const acertos = sorteadas.filter((d) => (bilhete.dezenas || []).map(Number).includes(d)).length;
  const faixas = FAIXAS_PREMIACAO[bilhete.modalidade] || [];
  const faixa = faixas.find((f) => f.acertos === acertos);

  return {
    acertos,
    dezenasSorteadas: sorteadas,
    concursoConferido: resultado.concurso,
    premioGanho: faixa ? premioTotalDoBilhete(bilhete, resultado, acertos, faixas) : 0,
    status: faixa ? faixa.rotulo : `${acertos} acertos (Não premiado)`,
    premiado: Boolean(faixa)
  };
}

async function conferirTodosBilhetesSalvos() {
  if (!Array.isArray(carteiraJogos) || carteiraJogos.length === 0) {
    toast('Nenhum bilhete na carteira.', '⚠️');
    tocarBeep('alert');
    return;
  }

  tocarBeep('click');
  toast('🔍 Consultando resultados oficiais da Caixa...', '📡');
  cacheResultados.clear();

  let premiados = 0;
  let conferidos = 0;
  let aguardando = 0;
  let indisponiveis = 0;

  for (const bilhete of carteiraJogos) {
    const ehPassado = typeof window.concursoOuDataEhPassado === 'function'
      ? window.concursoOuDataEhPassado(bilhete.concursoAlvo, bilhete.data, bilhete.modalidade)
      : !dataBRNoFuturo(bilhete.data);

    if (!ehPassado) {
      bilhete.conferido = false;
      bilhete.status = STATUS.aguardando;
      bilhete.premioGanho = 0;
      aguardando++;
      continue;
    }

    const numConc = bilhete.concursoAlvo ? Number(String(bilhete.concursoAlvo).replace(/\D/g, '')) : null;
    const resultado = await obterResultadoOficial(bilhete.modalidade, bilhete.data, numConc);

    if (!resultado) {
      // Sem resultado oficial ainda
      bilhete.conferido = false;
      bilhete.status = STATUS.indisponivel;
      bilhete.premioGanho = 0;
      indisponiveis++;
      continue;
    }

    if (resultado.data && (!bilhete.data || bilhete.data !== resultado.data)) {
      bilhete.data = resultado.data; // Corrige para a data oficial
    }

    const avaliacao = avaliarBilhete(bilhete, resultado);
    bilhete.conferido = true;
    bilhete.status = avaliacao.status;
    bilhete.premioGanho = avaliacao.premioGanho;
    bilhete.acertos = avaliacao.acertos;
    bilhete.concursoConferido = avaliacao.concursoConferido;
    bilhete.dezenasSorteadas = avaliacao.dezenasSorteadas;

    conferidos++;
    if (avaliacao.premiado) premiados++;
  }

  salvarCarteiraStorage();
  atualizarPainelCarteira();

  const partes = [];
  if (conferidos) partes.push(`${conferidos} conferido${conferidos > 1 ? 's' : ''}`);
  if (premiados) partes.push(`${premiados} premiado${premiados > 1 ? 's' : ''}`);
  if (aguardando) partes.push(`${aguardando} aguardando sorteio`);
  if (indisponiveis) partes.push(`${indisponiveis} sem resultado`);

  if (premiados > 0) {
    tocarSomNasa('sucesso');
    toast(partes.join(' • '), '🎉');
  } else if (conferidos > 0) {
    toast(partes.join(' • '), '✅');
  } else {
    toast(
      indisponiveis
        ? 'Não foi possível obter os resultados agora. Tente novamente.'
        : partes.join(' • '),
      '📌'
    );
  }
}

/** Último concurso realizado de uma modalidade, direto da Caixa. */
async function obterUltimoResultadoOficial(modalidade) {
  return typeof buscarConcursoCaixa === 'function'
    ? await buscarConcursoCaixa(modalidade)
    : null;
}

/** Converte o retorno da Caixa para o formato usado por baseConcursos*. */
function montarRegistroConcurso(resultado) {
  const premio = (acertos) => {
    const faixa = (resultado.rateio || []).find((f) => f.acertos === acertos);
    return faixa ? Number(faixa.premio) || 0 : 0;
  };

  const registro = {
    concurso: resultado.concurso,
    data: resultado.data,
    dezenas: resultado.dezenas,
    acumulado: Boolean(resultado.acumulado)
  };

  if (resultado.modalidade === 'megasena') {
    registro.premioSena = premio(6);
    registro.premioQuina = premio(5);
    registro.premioQuadra = premio(4);
  } else {
    registro.premio15 = premio(15);
  }

  return registro;
}

// Bilhetes conferidos antes da correção da base podem ter status errado.
function reabrirConferenciasAntigas() {
  const chave = 'nasa_reconferencia_20261101';
  if (localStorage.getItem(chave) || !Array.isArray(carteiraJogos)) return;
  carteiraJogos.forEach((b) => {
    b.conferido = false;
    b.premioGanho = 0;
    b.status = 'Aguardando conferência';
  });
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  localStorage.setItem(chave, '1');
}

let conferindoAutomatico = false;
async function conferirSorteiosPassadosAutomatico() {
  reabrirConferenciasAntigas();
  if (conferindoAutomatico || !Array.isArray(carteiraJogos) || carteiraJogos.length === 0) return;
  const pendentes = carteiraJogos.filter(b => {
    if (b.conferido) return false;
    if (typeof window.concursoOuDataEhPassado === 'function') {
      return window.concursoOuDataEhPassado(b.concursoAlvo, b.data, b.modalidade);
    }
    return !dataBRNoFuturo(b.data);
  });
  if (pendentes.length === 0) return;

  conferindoAutomatico = true;
  let alterou = false;

  for (const bilhete of pendentes) {
    const numConc = bilhete.concursoAlvo ? Number(String(bilhete.concursoAlvo).replace(/\D/g, '')) : null;
    const resultado = await obterResultadoOficial(bilhete.modalidade, bilhete.data, numConc);
    if (resultado) {
      if (resultado.data && (!bilhete.data || bilhete.data !== resultado.data)) {
        bilhete.data = resultado.data;
      }
      const avaliacao = avaliarBilhete(bilhete, resultado);
      bilhete.conferido = true;
      bilhete.status = avaliacao.status;
      bilhete.premioGanho = avaliacao.premioGanho;
      bilhete.acertos = avaliacao.acertos;
      bilhete.concursoConferido = avaliacao.concursoConferido;
      bilhete.dezenasSorteadas = avaliacao.dezenasSorteadas;
      alterou = true;
    }
  }

  conferindoAutomatico = false;
  if (alterou) {
    salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  }
}
window.conferirSorteiosPassadosAutomatico = conferirSorteiosPassadosAutomatico;

window.conferencia = {
  conferir: conferirTodosBilhetesSalvos,
  conferirAutomatico: conferirSorteiosPassadosAutomatico,
  resultado: obterResultadoOficial,
  ultimo: obterUltimoResultadoOficial,
  limparCache: () => cacheResultados.clear()
};

console.log('🎟️ Conferência oficial carregada');
