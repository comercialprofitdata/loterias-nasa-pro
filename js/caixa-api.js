// ===================================================================
// API DA CAIXA - acesso direto do navegador
// ===================================================================
// O portal da Caixa envia Access-Control-Allow-Origin: *, então o navegador
// pode consultá-lo sem servidor no meio. E foi preciso: a Caixa recusa
// conexão vinda dos datacenters do Supabase, então a Edge Function que eu
// havia escrito para isso não funciona — de dentro do Brasil, que é onde
// está o usuário, funciona.
//
// Este módulo é a única porta de entrada para dados de loteria no cliente.
// Quem precisa de resultado ou prêmio chama daqui.

const CAIXA_API = {
  base: 'https://servicebus2.caixa.gov.br/portaldeloterias/api',
  timeoutMs: 12000,
  // 0=domingo ... 6=sábado
  calendario: {
    // Mega-Sena: 3 sorteios semanais (Terça=2, Quinta=4, Sábado=6)
    megasena: { dias: [2, 4, 6], hora: 20 },
    // Lotofácil: 6 sorteios semanais (Segunda a Sábado)
    lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 },
    // Quina: 6 sorteios semanais (Segunda a Sábado)
    quina: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
  }
};

const cacheCaixa = new Map();
const requisicoesEmAndamento = new Map();

function dataBRParaDate(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto || '').trim());
  if (!m) return null;
  const data = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(data.getTime()) ? null : data;
}

function normalizarConcurso(dados, modalidade) {
  const dezenas = (dados?.listaDezenas ?? []).map(Number).filter(Number.isFinite);
  const numero = Number(dados?.numero);

  // Concurso ainda não sorteado vem sem dezenas.
  if (!dezenas.length || !Number.isFinite(numero)) return null;

  return {
    modalidade,
    concurso: numero,
    data: String(dados?.dataApuracao ?? ''),
    dezenas: dezenas.sort((a, b) => a - b),
    acumulado: Boolean(dados?.acumulado),
    proximoConcurso: Number(dados?.numeroConcursoProximo) || null,
    dataProximo: String(dados?.dataProximoConcurso ?? ''),
    premioProximo: Number(dados?.valorEstimadoProximoConcurso) || null,
    rateio: (dados?.listaRateioPremio ?? []).map((f) => ({
      acertos: Number(String(f?.descricaoFaixa ?? '').replace(/\D/g, '')) || 0,
      ganhadores: Number(f?.numeroDeGanhadores) || 0,
      premio: Number(f?.valorPremio) || 0
    }))
  };
}

const cacheUltimoEm = new Map();
const VALIDADE_ULTIMO_MS = 5 * 60 * 1000;

async function buscarConcursoCaixa(modalidade, concurso = null) {
  const chave = `${modalidade}|${concurso ?? 'ultimo'}`;
  if (!concurso && cacheCaixa.has(chave) && Date.now() - (cacheUltimoEm.get(chave) || 0) > VALIDADE_ULTIMO_MS) {
    cacheCaixa.delete(chave);
  }
  if (cacheCaixa.has(chave)) return cacheCaixa.get(chave);
  if (requisicoesEmAndamento.has(chave)) return requisicoesEmAndamento.get(chave);

  const promessa = (async () => {
    const url = concurso
      ? `${CAIXA_API.base}/${modalidade}/${concurso}`
      : `${CAIXA_API.base}/${modalidade}`;

    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), CAIXA_API.timeoutMs);

    try {
      const resposta = await fetch(url, {
        signal: controle.signal,
        headers: { Accept: 'application/json' }
      });

      if (!resposta.ok) return null;

      let resultado = normalizarConcurso(await resposta.json(), modalidade);

      // CASO ESPECIAL DA CAIXA: Em noites de sorteio, o endpoint raiz '/modalidade' pode
      // continuar retornando o concurso anterior em cache CDN da Caixa por até 1h, mesmo que
      // o sorteio (proximoConcurso) já tenha sido apurado no endpoint '/modalidade/{proximoConcurso}'.
      if (resultado && !concurso && resultado.proximoConcurso) {
        try {
          const proxRes = await fetch(`${CAIXA_API.base}/${modalidade}/${resultado.proximoConcurso}`, {
            signal: controle.signal,
            headers: { Accept: 'application/json' }
          });
          if (proxRes.ok) {
            const proxDados = normalizarConcurso(await proxRes.json(), modalidade);
            if (proxDados && Array.isArray(proxDados.dezenas) && proxDados.dezenas.length > 0) {
              resultado = proxDados;
            }
          }
        } catch (_) {}
      }

      // Cacheia tanto o último quanto os passados nesta sessão para evitar rate-limit da Caixa
      if (resultado) {
        cacheCaixa.set(chave, resultado);
        if (!concurso) cacheUltimoEm.set(chave, Date.now());
        cacheCaixa.set(`${modalidade}|${resultado.concurso}`, resultado);
      }

      return resultado;
    } catch (err) {
      console.warn(`Caixa indisponível (${modalidade}/${concurso ?? 'último'}):`, err.message);
      return null;
    } finally {
      clearTimeout(limite);
      requisicoesEmAndamento.delete(chave);
    }
  })();

  requisicoesEmAndamento.set(chave, promessa);
  return promessa;
}

/** Quantos sorteios da modalidade existem entre duas datas. */
function contarSorteiosEntre(de, ate, modalidade) {
  const cfg = CAIXA_API.calendario[modalidade];
  if (!cfg) return 0;

  const inicio = new Date(de);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(ate);
  fim.setHours(0, 0, 0, 0);

  const sentido = fim >= inicio ? 1 : -1;
  let total = 0;
  const cursor = new Date(inicio);

  for (let i = 0; i < 4000; i++) {
    cursor.setDate(cursor.getDate() + sentido);
    if (cfg.dias.includes(cursor.getDay())) total += sentido;
    if (cursor.getTime() === fim.getTime()) break;
  }

  return total;
}

/**
 * Encontra o concurso de uma data (dd/mm/aaaa).
 * Estima pelo calendário fixo e confere contra a data que a Caixa devolve,
 * corrigindo quando feriado ou sorteio especial desloca a numeração.
 */
async function buscarConcursoPorData(modalidade, dataBR) {
  const alvo = dataBRParaDate(dataBR);
  if (!alvo) return null;

  const ultimo = await buscarConcursoCaixa(modalidade);
  if (!ultimo) return null;

  const dataUltimo = dataBRParaDate(ultimo.data);
  if (!dataUltimo) return null;

  if (dataUltimo.getTime() === alvo.getTime()) return ultimo;
  if (alvo > dataUltimo) return null; // sorteio ainda não aconteceu

  let estimativa = ultimo.concurso - contarSorteiosEntre(alvo, dataUltimo, modalidade);

  for (let tentativa = 0; tentativa <= 4; tentativa++) {
    if (estimativa < 1) return null;

    const candidato = await buscarConcursoCaixa(modalidade, estimativa);
    if (!candidato) return null;

    const dataCandidato = dataBRParaDate(candidato.data);
    if (!dataCandidato) return null;
    if (dataCandidato.getTime() === alvo.getTime()) return candidato;

    estimativa += dataCandidato > alvo ? -1 : 1;
  }

  return null;
}

window.caixaApi = {
  ultimo: buscarConcursoCaixa,
  porData: buscarConcursoPorData,
  limparCache: () => cacheCaixa.clear()
};

console.log('🏛️ API da Caixa disponível. Debug: window.caixaApi.ultimo("megasena")');
