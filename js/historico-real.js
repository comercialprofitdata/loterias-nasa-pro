// ===================================================================
// HISTÓRICO OFICIAL DE CONCURSOS (SUPABASE + FALLBACK DIRETO CAIXA)
// ===================================================================
// Carrega os sorteios reais da Caixa (tabela concursos_historico ou busca
// direta na API oficial da Caixa no navegador) para dentro de
// baseConcursosMega e baseConcursosLoto.
//
// Regra de ouro: NUNCA fabricar sorteios com Math.random(). Apenas dados
// oficiais da Caixa Econômica Federal são utilizados.

const HISTORICO_CONFIG = {
  limite: 300,
  qtdFallbackCaixa: 10, // busca lote enxuto para não acionar rate-limit da Caixa
  chaveCache: 'loterias_nasa_historico_v3',
  validadeCacheMs: 4 * 60 * 60 * 1000 // 4 horas para invalidar rápido após sorteios
};

// Base publicada com o site, gerada direto da API da Caixa.
const SEED_INICIAL_MEGASENA = window.HISTORICO_OFICIAL?.megasena || [];
const SEED_INICIAL_LOTOFACIL = window.HISTORICO_OFICIAL?.lotofacil || [];

// Inicialização imediata com os últimos sorteios reais
if (typeof baseConcursosMega === 'undefined' || !baseConcursosMega || baseConcursosMega.length < 10) {
  baseConcursosMega = [...SEED_INICIAL_MEGASENA];
}
if (typeof baseConcursosLoto === 'undefined' || !baseConcursosLoto || baseConcursosLoto.length < 10) {
  baseConcursosLoto = [...SEED_INICIAL_LOTOFACIL];
}
window.baseConcursosMega = baseConcursosMega;
window.baseConcursosLoto = baseConcursosLoto;

let historicoCarregandoPromise = null;

/** "2024-11-28" -> "28/11/2024" (formato usado na UI e na carteira) */
function dataISOParaBR(iso) {
  const s = String(iso || '').trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

/** Converte a linha do banco ou da API da Caixa para o formato que as análises esperam. */
function converterConcurso(linha) {
  const premioDaFaixa = (acertos) => {
    const faixa = (linha.rateio || []).find((f) => Number(f.acertos) === acertos);
    return faixa ? Number(faixa.premio) || 0 : 0;
  };

  const registro = {
    concurso: Number(linha.concurso),
    data: dataISOParaBR(linha.data_apuracao || linha.data),
    dezenas: (linha.dezenas || []).map(Number),
    acumulado: Boolean(linha.acumulado),
    proximoConcurso: Number(linha.proximoConcurso || linha.numeroConcursoProximo) || null,
    dataProximo: dataISOParaBR(linha.dataProximo || linha.dataProximoConcurso || ''),
    premioProximo: Number(linha.premioProximo || linha.valorEstimadoProximoConcurso) || null,
    rateio: linha.rateio || []
  };

  if (linha.modalidade === 'megasena') {
    registro.premioSena = premioDaFaixa(6);
    registro.premioQuina = premioDaFaixa(5);
    registro.premioQuadra = premioDaFaixa(4);
  } else {
    registro.premio15 = premioDaFaixa(15);
  }

  return registro;
}

function aplicarHistorico({ megasena, lotofacil }) {
  const ordenar = (lista) => [...lista].sort((a, b) => b.concurso - a.concurso);

  if (megasena?.length) {
    const mapa = new Map();
    SEED_INICIAL_MEGASENA.forEach((c) => mapa.set(Number(c.concurso), c));
    (window.baseConcursosMega || baseConcursosMega || []).forEach((c) => mapa.set(Number(c.concurso), c));
    megasena.forEach((c) => mapa.set(Number(c.concurso), c));
    baseConcursosMega = ordenar(Array.from(mapa.values()));
    window.baseConcursosMega = baseConcursosMega;
  }
  if (lotofacil?.length) {
    const mapa = new Map();
    SEED_INICIAL_LOTOFACIL.forEach((c) => mapa.set(Number(c.concurso), c));
    (window.baseConcursosLoto || baseConcursosLoto || []).forEach((c) => mapa.set(Number(c.concurso), c));
    lotofacil.forEach((c) => mapa.set(Number(c.concurso), c));
    baseConcursosLoto = ordenar(Array.from(mapa.values()));
    window.baseConcursosLoto = baseConcursosLoto;
  }
}

function salvarCacheHistorico(dados) {
  try {
    localStorage.setItem(
      HISTORICO_CONFIG.chaveCache,
      JSON.stringify({ ...dados, salvoEm: Date.now() })
    );
  } catch (err) {
    console.warn('Histórico não cacheado:', err.message);
  }
}

function lerCacheHistorico() {
  try {
    const bruto = localStorage.getItem(HISTORICO_CONFIG.chaveCache);
    if (!bruto) return null;

    const dados = JSON.parse(bruto);
    const idade = Date.now() - (dados.salvoEm || 0);
    if (idade > HISTORICO_CONFIG.validadeCacheMs) return null;

    if (!dados.megasena?.length && !dados.lotofacil?.length) return null;
    return dados;
  } catch {
    return null;
  }
}

/**
 * Busca os últimos N concursos reais diretamente na API pública da Caixa
 * quando a tabela do Supabase ainda não foi populada.
 */
async function buscarUltimosConcursosDiretoCaixa(modalidade, qtd = 15) {
  if (!window.caixaApi || typeof window.caixaApi.ultimo !== 'function') return [];

  try {
    const ultimo = await window.caixaApi.ultimo(modalidade);
    if (!ultimo || !ultimo.concurso) return [];

    const lista = [converterConcurso(ultimo)];
    const numerosAnteriores = [];
    for (let i = 1; i < qtd; i++) {
      if (ultimo.concurso - i >= 1) {
        numerosAnteriores.push(ultimo.concurso - i);
      }
    }

  // Renderiza o primeiro concurso imediatamente para a tela nunca ficar vazia enquanto busca os anteriores
  if (lista.length > 0) {
    if (modalidade === 'megasena' && (!baseConcursosMega || baseConcursosMega.length === 0)) {
      baseConcursosMega = [...lista];
      rerenderizarAnalises();
    } else if (modalidade === 'lotofacil' && (!baseConcursosLoto || baseConcursosLoto.length === 0)) {
      baseConcursosLoto = [...lista];
      rerenderizarAnalises();
    }
  }

    // Busca em lotes de 3 para ser rápido e nunca acionar rate-limit da Caixa
    for (let i = 0; i < numerosAnteriores.length; i += 3) {
      const lote = numerosAnteriores.slice(i, i + 3);
      const resultados = await Promise.all(
        lote.map((num) => window.caixaApi.ultimo(modalidade, num).catch(() => null))
      );
      resultados.forEach((res) => {
        if (res && Array.isArray(res.dezenas) && res.dezenas.length > 0) {
          lista.push(converterConcurso(res));
        }
      });
    }

    return lista.sort((a, b) => b.concurso - a.concurso);
  } catch (err) {
    console.warn(`Falha ao buscar histórico direto da Caixa (${modalidade}):`, err.message);
    return [];
  }
}

async function carregarHistoricoReal({ silencioso = true } = {}) {
  // Se já temos histórico carregado na memória, apenas re-renderiza e evita bater na Caixa de novo
  if (
    (typeof baseConcursosMega !== 'undefined' && baseConcursosMega.length > 0) ||
    (typeof baseConcursosLoto !== 'undefined' && baseConcursosLoto.length > 0)
  ) {
    rerenderizarAnalises();
    if (!silencioso) toast('Histórico oficial sincronizado', '📊');
    return true;
  }

  if (historicoCarregandoPromise) {
    return historicoCarregandoPromise;
  }

  historicoCarregandoPromise = (async () => {
    try {
      // 1. Primeiro verifica se já temos cache recente válido para resposta instantânea
      const cache = lerCacheHistorico();
      if (cache && silencioso) {
        aplicarHistorico(cache);
        rerenderizarAnalises();
      }

  // 2. Tenta buscar o histórico completo no Supabase
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;

  if (cliente) {
    try {
      const { data, error } = await cliente
        .from('concursos_historico')
        .select('modalidade, concurso, data_apuracao, dezenas, acumulado, rateio')
        .order('concurso', { ascending: false })
        .limit(HISTORICO_CONFIG.limite);

      if (error) throw new Error(error.message);

      if (data?.length) {
        const convertidos = {
          megasena: data.filter((l) => l.modalidade === 'megasena').map(converterConcurso),
          lotofacil: data.filter((l) => l.modalidade === 'lotofacil').map(converterConcurso)
        };

        if (convertidos.megasena.length > 0 || convertidos.lotofacil.length > 0) {
          aplicarHistorico(convertidos);
          salvarCacheHistorico(convertidos);
          rerenderizarAnalises();

          if (!silencioso) {
            const total = convertidos.megasena.length + convertidos.lotofacil.length;
            toast(`${total} concursos oficiais carregados`, '📊');
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('Histórico indisponível no Supabase, tentando API direta da Caixa:', err.message);
    }
  }

  // 3. Se já aplicamos o cache acima, estamos prontos
  if (cache && (cache.megasena?.length || cache.lotofacil?.length)) {
    aplicarHistorico(cache);
    rerenderizarAnalises();
    if (!silencioso) toast('Histórico oficial carregado', '📊');
    return true;
  }

  // 4. Fallback automático: busca os últimos sorteios direto da API oficial da Caixa no navegador!
  try {
    const megaDireto = await buscarUltimosConcursosDiretoCaixa('megasena', HISTORICO_CONFIG.qtdFallbackCaixa);
    const lotoDireto = await buscarUltimosConcursosDiretoCaixa('lotofacil', HISTORICO_CONFIG.qtdFallbackCaixa);

    if (megaDireto.length > 0 || lotoDireto.length > 0) {
      const convertidos = { megasena: megaDireto, lotofacil: lotoDireto };
      aplicarHistorico(convertidos);
      salvarCacheHistorico(convertidos);
      rerenderizarAnalises();

      if (!silencioso) {
        const total = megaDireto.length + lotoDireto.length;
        toast(`${total} concursos sincronizados direto da Caixa!`, '🏛️');
      }
      return true;
    }
  } catch (err) {
    console.warn('Fallback direto da Caixa falhou:', err.message);
  }

      // 5. Sem dados reais em lugar nenhum
      console.warn('Sem histórico oficial. Análises estatísticas ficam indisponíveis.');
      marcarAnalisesIndisponiveis();
      if (!silencioso) {
        toast('Histórico de concursos indisponível no momento', '⚠️');
      }
      return false;
    } finally {
      historicoCarregandoPromise = null;
    }
  })();

  return historicoCarregandoPromise;
}

function rerenderizarAnalises() {
  const tentar = (nome, ...args) => {
    try {
      if (typeof window[nome] === 'function') window[nome](...args);
    } catch (err) {
      console.warn(`Falha ao atualizar ${nome}:`, err.message);
    }
  };

  tentar('renderizarMapaCalor');
  tentar('atualizarPainelCarteira');
  tentar('atualizarUltimoResultadoHome');
  tentar('atualizarProvaDosFatosRedesign');
  tentar('renderizarCockpitInicioApostador');
  tentar('executarAnaliseDinamicaDoJogo');
}

/**
 * Consulta a Caixa em segundo plano (stale-while-revalidate)
 * para garantir que o resultado mais recente seja capturado no mesmo dia.
 */
async function verificarNovosSorteiosCaixaSegundoPlano() {
  if (!window.caixaApi || typeof window.caixaApi.ultimo !== 'function') return;

  try {
    for (const mod of ['megasena', 'lotofacil']) {
      const base = mod === 'megasena'
        ? (window.baseConcursosMega || baseConcursosMega || [])
        : (window.baseConcursosLoto || baseConcursosLoto || []);
      const ultimoConhecido = base && base.length > 0 ? Number(base[0].concurso) : 0;

      const res = await window.caixaApi.ultimo(mod).catch(() => null);
      if (res && res.concurso && Number(res.concurso) > ultimoConhecido) {
        const conv = converterConcurso(res);
        if (mod === 'megasena') {
          const lista = [...(window.baseConcursosMega || baseConcursosMega || SEED_INICIAL_MEGASENA)];
          if (!lista.some((x) => Number(x.concurso) === Number(conv.concurso))) {
            lista.unshift(conv);
          }
          baseConcursosMega = lista.sort((a, b) => b.concurso - a.concurso);
          window.baseConcursosMega = baseConcursosMega;
        } else {
          const lista = [...(window.baseConcursosLoto || baseConcursosLoto || SEED_INICIAL_LOTOFACIL)];
          if (!lista.some((x) => Number(x.concurso) === Number(conv.concurso))) {
            lista.unshift(conv);
          }
          baseConcursosLoto = lista.sort((a, b) => b.concurso - a.concurso);
          window.baseConcursosLoto = baseConcursosLoto;
        }

        salvarCacheHistorico({
          megasena: window.baseConcursosMega || [],
          lotofacil: window.baseConcursosLoto || []
        });

        rerenderizarAnalises();
        if (typeof window.conferirSorteiosPassadosAutomatico === 'function') {
          window.conferirSorteiosPassadosAutomatico();
        }
      }
    }
  } catch (e) {
    console.warn('Verificação Caixa em segundo plano:', e);
  }
}
window.verificarNovosSorteiosCaixaSegundoPlano = verificarNovosSorteiosCaixaSegundoPlano;

function marcarAnalisesIndisponiveis() {
  const aviso = `
    <div class="col-span-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-sans text-center space-y-2">
      <div>Sincronizando concursos oficiais da Caixa Econômica Federal...</div>
      <button type="button" onclick="window.historico.carregar()" class="px-3 py-1.5 rounded-xl bg-emerald-600 text-slate-950 font-black text-xs">
        🔄 Sincronizar Agora
      </button>
    </div>
  `;

  ['grid-mapa-calor', 'ranking-pedras-quentes', 'ranking-pedras-frias', 'grade-retro-resultados']
    .forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.children.length) el.innerHTML = aviso;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    carregarHistoricoReal({ silencioso: true });
    verificarNovosSorteiosCaixaSegundoPlano();
  }, 400);
});

window.historico = {
  carregar: () => carregarHistoricoReal({ silencioso: false }),
  total: () => ({
    megasena: baseConcursosMega?.length || 0,
    lotofacil: baseConcursosLoto?.length || 0
  }),
  limparCache: () => localStorage.removeItem(HISTORICO_CONFIG.chaveCache)
};

console.log('📊 Histórico oficial + Fallback direto Caixa configurado.');
