// ===================================================================
// SORTEIOS - Calendário calculado + prêmio/concurso de fonte real
// ===================================================================
// REGRA FUNDAMENTAL: dia e horário do sorteio são determinísticos e
// podem ser calculados. Prêmio estimado e número do concurso NÃO —
// só aparecem se vierem de fonte real (Supabase). Sem fonte, a UI
// mostra "—". Nunca inventar valor de prêmio: além de enganar o
// usuário, é publicidade enganosa (CDC art. 37).

const SORTEIOS_CONFIG = {
  // Derivado da config do Supabase; evita project-id hardcoded errado
  get functionUrl() {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    return base ? `${base}/functions/v1/fetch-sorteios` : null;
  },
  autoRefreshMs: 30 * 60 * 1000
};

const SORTEIOS_CALENDARIO = {
  // 0=domingo, 1=segunda, 2=terça, 3=quarta, 4=quinta, 5=sexta, 6=sábado
  // Mega-Sena: 3 sorteios regulares (Terça=2, Quinta=4, Sábado=6), além de semanas especiais com Sexta
  megasena: { dias: [2, 4, 5, 6], hora: 20 },
  // Lotofácil: 6 sorteios semanais (Segunda a Sábado)
  lotofacil: { dias: [1, 2, 3, 4, 5, 6], hora: 20 }
};

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/**
 * Converte data da Caixa (dd/mm/aaaa) para rótulo amigável ('Hoje', 'Amanhã' ou dia da semana)
 */
function formatarDataProximoCaixa(dataProximoBR, modalidade = null, agora = new Date()) {
  if (!dataProximoBR) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dataProximoBR).trim());
  if (!m) return null;
  const data = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(data.getTime())) return null;

  // Ajuste determinístico para Mega-Sena: sorteios regulares ocorrem às Terças (2), Quintas (4) e Sábados (6).
  // Se a Caixa retornar Domingo (0), Segunda (1) ou Quarta (3), corrige para o próximo sorteio válido!
  if (modalidade === 'megasena') {
    if (data.getDay() === 0) data.setDate(data.getDate() + 2); // Domingo -> Terça
    else if (data.getDay() === 1) data.setDate(data.getDate() + 1); // Segunda -> Terça
    else if (data.getDay() === 3) data.setDate(data.getDate() + 1); // Quarta -> Quinta
  }

  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);
  const diffDias = Math.round((data.getTime() - hoje.getTime()) / 86400000);
  const diaSemana = NOMES_DIAS[data.getDay()] || '';
  const dataCurta = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;

  if (diffDias === 0) {
    // Se a data da Caixa for hoje, mas o horário limite (20h) já passou:
    // O concurso do dia já encerrou apostas e está em apuração/sorteando.
    const horaLimite = SORTEIOS_CALENDARIO[modalidade]?.hora ?? 20;
    if (agora.getHours() >= horaLimite) {
      if (agora.getHours() < 22) {
        return `Hoje (${diaSemana}) • Em apuração`;
      }
      return `Encerrado (${diaSemana})`;
    }
    return `Hoje (${diaSemana})`;
  }
  if (diffDias === 1) return `Amanhã (${diaSemana} ${dataCurta})`;
  if (diffDias < 0) return `Encerrado (${dataCurta})`;
  return `${diaSemana} (${dataCurta})`;
}

/**
 * Próximo sorteio de uma modalidade a partir de `agora`.
 * Se hoje é dia de sorteio e ainda não passou do horário, retorna "Hoje".
 */
function calcularProximoSorteio(modalidade, agora = new Date()) {
  const cfg = SORTEIOS_CALENDARIO[modalidade];
  if (!cfg) return { dia: '—', hora: '20h', dataBR: '' };

  const hojeEhDiaDeSorteio = cfg.dias.includes(agora.getDay());
  const aindaDaTempoHoje = agora.getHours() < cfg.hora;

  if (hojeEhDiaDeSorteio && aindaDaTempoHoje) {
    const diaSemana = NOMES_DIAS[agora.getDay()];
    return { dia: `Hoje (${diaSemana})`, hora: `${cfg.hora}h`, dataBR: agora.toLocaleDateString('pt-BR') };
  }

  for (let i = 1; i <= 7; i++) {
    const alvo = new Date(agora);
    alvo.setDate(alvo.getDate() + i);
    const candidato = alvo.getDay();
    if (cfg.dias.includes(candidato)) {
      const diaSemana = NOMES_DIAS[candidato];
      const dataCurta = `${String(alvo.getDate()).padStart(2, '0')}/${String(alvo.getMonth() + 1).padStart(2, '0')}`;
      const rotulo = i === 1 ? `Amanhã (${diaSemana} ${dataCurta})` : `${diaSemana} (${dataCurta})`;
      return { dia: rotulo, hora: `${cfg.hora}h`, dataBR: alvo.toLocaleDateString('pt-BR') };
    }
  }

  return { dia: '—', hora: `${cfg.hora}h`, dataBR: '' };
}

/**
 * Tempo até o próximo sorteio. Substituiu "2h 45min" fixo no HTML da home,
 * que nunca mudava e ficava incorreto para todo mundo que não abrisse o
 * app exatamente no minuto em que aquele texto foi escrito.
 */
function calcularContagemRegressiva(modalidade, agora = new Date()) {
  const cfg = SORTEIOS_CALENDARIO[modalidade];
  if (!cfg) return '—';

  // Verifica se temos informação oficial do próximo sorteio sincronizado
  let infoSincronizada = null;
  try {
    const salvos = obterSorteiosSalvos();
    if (salvos && salvos[modalidade]) {
      infoSincronizada = salvos[modalidade];
    }
  } catch (_) {}

  let dataAlvoOficial = null;
  if (infoSincronizada?.dataBR) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(infoSincronizada.dataBR).trim());
    if (m) {
      dataAlvoOficial = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), cfg.hora, 0, 0);
    }
  }

  const alvoHoje = new Date(agora);
  alvoHoje.setHours(cfg.hora, 0, 0, 0);

  const hojeEhDiaDeSorteio = cfg.dias.includes(agora.getDay());
  const sorteioHojeJaFoi = dataAlvoOficial
    ? (dataAlvoOficial.toDateString() !== agora.toDateString() && dataAlvoOficial > agora)
    : false;

  // Se hoje é dia de sorteio, o próximo concurso NÃO é em data futura e estamos entre 20h00 e 21h59
  if (hojeEhDiaDeSorteio && !sorteioHojeJaFoi && agora >= alvoHoje && agora.getHours() < 22) {
    return 'Em apuração...';
  }

  const alvo = dataAlvoOficial && dataAlvoOficial > agora ? new Date(dataAlvoOficial) : new Date(agora);
  if (!dataAlvoOficial || dataAlvoOficial <= agora) {
    alvo.setHours(cfg.hora, 0, 0, 0);
    if (!(hojeEhDiaDeSorteio && agora < alvo)) {
      for (let i = 1; i <= 7; i++) {
        const candidato = new Date(agora);
        candidato.setDate(candidato.getDate() + i);
        if (cfg.dias.includes(candidato.getDay())) {
          alvo.setTime(candidato.setHours(cfg.hora, 0, 0, 0));
          break;
        }
      }
    }
  }

  const diffMs = alvo - agora;
  if (diffMs <= 0) return 'Sorteando...';

  const horas = Math.floor(diffMs / 3_600_000);
  const minutos = Math.floor((diffMs % 3_600_000) / 60_000);

  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    return `${dias}d ${horas % 24}h`;
  }
  return horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
}

function formatarPremio(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0) return '—';
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

/**
 * Escreve na UI. `dados` é sempre {megasena: {...}, lotofacil: {...}},
 * onde premio/concurso podem ser null (vira "—" e não um número falso).
 *
 * Usa CLASSE, não id: a home (criada por js/redesign.js) tinha seu próprio
 * card de "Próximos Sorteios" com valores hardcoded (R$ 56.5M, "2h 45min")
 * que nunca eram atualizados — só o card da aba Carteira (ids cal-mega-*)
 * recebia dado real. querySelectorAll atualiza os DOIS cards ao mesmo tempo,
 * sem duplicar essa lógica em outro arquivo.
 */
function atualizarSorteiosUI(dados, origem = 'calculado') {
  const mapa = [
    { chave: 'megasena', classePremio: 'js-mega-premio', classeConcurso: 'js-mega-concurso' },
    { chave: 'lotofacil', classePremio: 'js-loto-premio', classeConcurso: 'js-loto-concurso' }
  ];

  mapa.forEach(({ chave, classePremio, classeConcurso }) => {
    const info = dados?.[chave];
    if (!info) return;

    document.querySelectorAll(`.${classePremio}`).forEach((el) => {
      el.innerText = formatarPremio(info.premio);
      el.title = info.premio
        ? 'Estimativa oficial sincronizada'
        : 'Estimativa indisponível — consulte o site da Caixa';
    });

    document.querySelectorAll(`.${classeConcurso}`).forEach((el) => {
      const prefixo = info.concurso ? `Conc. ${info.concurso} • ` : '';
      el.innerText = `${prefixo}${info.dia} ${info.hora}`;
    });

    document.querySelectorAll(`.js-${chave}-countdown`).forEach((el) => {
      el.innerText = calcularContagemRegressiva(chave);
    });
  });

  document.querySelectorAll('.js-sorteios-sync').forEach((el) => {
    const hora = new Date().toLocaleTimeString('pt-BR');
    el.innerText = origem === 'servidor'
      ? `Atualizado às ${hora}`
      : `Calendário local • ${hora}`;
    el.classList.remove('hidden');
  });
}

/** Base sempre confiável: dias corretos, prêmio/concurso vazios. */
function montarCalendarioLocal(agora = new Date()) {
  const mega = calcularProximoSorteio('megasena', agora);
  const loto = calcularProximoSorteio('lotofacil', agora);

  return {
    megasena: { ...mega, premio: null, concurso: null },
    lotofacil: { ...loto, premio: null, concurso: null },
    atualizadoEm: agora.toISOString()
  };
}

/** Mescla dados reais (prêmio/concurso) sobre o calendário calculado. */
function mesclarDadosServidor(linhas, agora = new Date()) {
  const base = montarCalendarioLocal(agora);

  linhas.forEach((linha) => {
    const chave = linha.modalidade;
    if (!base[chave]) return;
    base[chave].premio = linha.premio_estimado ?? null;
    base[chave].concurso = linha.proximo_concurso ?? null;
  });

  return base;
}

function salvarUltimoSorteio(dados) {
  try {
    localStorage.setItem(
      'sorteios_ultima_sincronizacao',
      JSON.stringify({ ...dados, atualizadoEm: new Date().toISOString() })
    );
  } catch (err) {
    console.warn('Não foi possível salvar sorteios:', err);
  }
}

function obterSorteiosSalvos() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const salvos = localStorage.getItem('sorteios_ultima_sincronizacao');
    return salvos ? JSON.parse(salvos) : null;
  } catch (err) {
    return null;
  }
}

async function sincronizarSorteiosReais({ silencioso = false } = {}) {
  if (!silencioso) {
    tocarBeep('click');
    toast('🔄 Buscando sorteios da Caixa...', '📡');
  }

  const agora = new Date();

  // Calendário é confiável offline: pinta primeiro pra nunca ficar vazio.
  atualizarSorteiosUI(montarCalendarioLocal(agora), 'calculado');

  // 1) Direto na Caixa. É a fonte mais fresca e funciona no navegador do
  // usuário (a Caixa libera CORS); o servidor do Supabase é que não alcança.
  try {
    if (typeof buscarConcursoCaixa === 'function') {
      const [mega, loto] = await Promise.all([
        buscarConcursoCaixa('megasena'),
        buscarConcursoCaixa('lotofacil')
      ]);

      if (mega?.premioProximo || loto?.premioProximo) {
        const dados = montarCalendarioLocal(agora);

        if (mega) {
          dados.megasena.premio = mega.premioProximo;
          dados.megasena.concurso = mega.proximoConcurso;
          if (mega.dataProximo) {
            let dataAjustadaMega = mega.dataProximo;
            const pm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(mega.dataProximo).trim());
            if (pm) {
              const dt = new Date(Number(pm[3]), Number(pm[2]) - 1, Number(pm[1]));
              if (dt.getDay() === 0) dt.setDate(dt.getDate() + 2);
              else if (dt.getDay() === 1) dt.setDate(dt.getDate() + 1);
              else if (dt.getDay() === 3) dt.setDate(dt.getDate() + 1);
              dataAjustadaMega = dt.toLocaleDateString('pt-BR');
            }
            dados.megasena.dataBR = dataAjustadaMega;
            const rotulo = formatarDataProximoCaixa(dataAjustadaMega, 'megasena');
            if (rotulo) dados.megasena.dia = rotulo;
          }
        }
        if (loto) {
          dados.lotofacil.premio = loto.premioProximo;
          dados.lotofacil.concurso = loto.proximoConcurso;
          if (loto.dataProximo) {
            dados.lotofacil.dataBR = loto.dataProximo;
            const rotulo = formatarDataProximoCaixa(loto.dataProximo, 'lotofacil');
            if (rotulo) dados.lotofacil.dia = rotulo;
          }
        }

        atualizarSorteiosUI(dados, 'servidor');
        salvarUltimoSorteio(dados);

        if (!silencioso) {
          tocarSomNasa('sucesso');
          toast('✅ Sorteios atualizados', '🎯');
        }
        return;
      }
    }
  } catch (err) {
    console.warn('Caixa indisponível:', err.message);
  }

  // 2) Cache no Supabase
  try {
    const cliente = obterClienteSupabase();
    if (cliente) {
      const { data, error } = await cliente.from('sorteios_cache').select('*');
      if (!error && data?.length) {
        const dados = mesclarDadosServidor(data, agora);
        atualizarSorteiosUI(dados, 'servidor');
        salvarUltimoSorteio(dados);
        if (!silencioso) {
          tocarSomNasa('sucesso');
          toast('✅ Sorteios atualizados', '🎯');
        }
        return;
      }
      if (error) console.warn('sorteios_cache indisponível:', error.message);
    }
  } catch (err) {
    console.warn('Supabase indisponível:', err.message);
  }

  // 2) Edge Function direta
  try {
    const url = SORTEIOS_CONFIG.functionUrl;
    if (url) {
      const resposta = await fetch(url);
      if (resposta.ok) {
        const linhas = await resposta.json();
        if (Array.isArray(linhas) && linhas.length) {
          const dados = mesclarDadosServidor(linhas, agora);
          atualizarSorteiosUI(dados, 'servidor');
          salvarUltimoSorteio(dados);
          if (!silencioso) {
            tocarSomNasa('sucesso');
            toast('✅ Sorteios atualizados', '🎯');
          }
          return;
        }
      }
    }
  } catch (err) {
    console.warn('Edge Function indisponível:', err.message);
  }

  // 3) Último cache local: reaproveita prêmio/concurso, recalcula os dias
  const salvos = obterSorteiosSalvos();
  if (salvos?.megasena?.premio || salvos?.lotofacil?.premio) {
    const dados = montarCalendarioLocal(agora);
    dados.megasena.premio = salvos.megasena?.premio ?? null;
    dados.megasena.concurso = salvos.megasena?.concurso ?? null;
    dados.lotofacil.premio = salvos.lotofacil?.premio ?? null;
    dados.lotofacil.concurso = salvos.lotofacil?.concurso ?? null;
    atualizarSorteiosUI(dados, 'servidor');

    if (!silencioso) {
      const minutos = Math.floor((Date.now() - new Date(salvos.atualizadoEm)) / 60000);
      toast(`ℹ️ Prêmios de ${minutos} min atrás (offline)`, '📌');
    }
    return;
  }

  // 4) Sem nenhuma fonte: datas corretas, prêmio "—" e aviso honesto
  if (!silencioso) {
    toast('ℹ️ Datas confirmadas. Prêmios indisponíveis no momento.', '📌');
  }
}

function atualizarContagensRegressivas() {
  document.querySelectorAll('.js-megasena-countdown').forEach((el) => {
    el.innerText = calcularContagemRegressiva('megasena');
  });
  document.querySelectorAll('.js-lotofacil-countdown').forEach((el) => {
    el.innerText = calcularContagemRegressiva('lotofacil');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarSorteiosUI(montarCalendarioLocal(), 'calculado');
  atualizarContagensRegressivas();

  // Contagem regressiva não depende de rede: atualiza a cada minuto sozinha,
  // em vez de ficar presa ao valor do último sync (a cada 30min).
  setInterval(atualizarContagensRegressivas, 60_000);

  setTimeout(() => {
    sincronizarSorteiosReais({ silencioso: true });
    setInterval(
      () => sincronizarSorteiosReais({ silencioso: true }),
      SORTEIOS_CONFIG.autoRefreshMs
    );
  }, 1500);
});

window.sorteios = {
  sincronizar: sincronizarSorteiosReais,
  ultimos: obterSorteiosSalvos,
  calendarioLocal: () => atualizarSorteiosUI(montarCalendarioLocal(), 'calculado')
};

console.log('🎯 Sorteios carregado. Debug: window.sorteios.sincronizar()');
