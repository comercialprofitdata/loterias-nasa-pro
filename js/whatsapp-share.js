// ===================================================================
// AÇÕES RÁPIDAS: COMPARTILHAR JOGO NO WHATSAPP & SALVAR NA CARTEIRA
// Suporta aposta única ou lote completo (1, 2, 3 ou 5 jogos gerados)
// Inclui o botão "JOGUEI ESTE JOGO!" com vinculação automática ao sorteio oficial
// ===================================================================

window.normalizarTelefoneWhatsapp = function(fone) {
  if (!fone) return '';
  let limpo = String(fone).replace(/\D/g, '');
  if (!limpo) return '';
  if (limpo.startsWith('0')) limpo = limpo.substring(1);
  if (limpo.length === 10 || limpo.length === 11) {
    limpo = '55' + limpo;
  }
  return limpo;
};

window.abrirWhatsApp = window.dispararWhatsApp = function ({ fone = '', texto = '' } = {}) {
  const foneLimpo = window.normalizarTelefoneWhatsapp(fone);

  let textoDecodificado = texto || '';
  try {
    if (typeof texto === 'string' && (texto.includes('%20') || texto.includes('%0A') || texto.includes('%2A'))) {
      textoDecodificado = decodeURIComponent(texto);
    }
  } catch (_) {
    textoDecodificado = texto;
  }

  const textoFinalEncoded = encodeURIComponent(textoDecodificado);

  // Detecção robusta de dispositivo móvel (Android, iPhone, etc.)
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
    || (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  if (isMobile) {
    // NO CELULAR: Dispara protocolo nativo whatsapp:// para abrir o APP OFICIAL INSTALADO no aparelho
    // Nunca usa window.open com api.whatsapp.com em celular para não abrir o Chrome na página "Baixar o WhatsApp"
    let deepLink = 'whatsapp://send?';
    if (foneLimpo) {
      deepLink += `phone=${foneLimpo}&`;
    }
    deepLink += `text=${textoFinalEncoded}`;

    const a = document.createElement('a');
    a.href = deepLink;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
    return;
  }

  // NO COMPUTADOR: Abre o WhatsApp Web no navegador
  let webUrl = foneLimpo
    ? `https://web.whatsapp.com/send?phone=${foneLimpo}&text=${textoFinalEncoded}`
    : `https://web.whatsapp.com/send?text=${textoFinalEncoded}`;

  window.open(webUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Concurso e data do próximo sorteio. A data só vem de fonte oficial (Caixa);
 * sem ela, devolve '—' em vez de calcular por calendário. `data` é sempre
 * dd/mm/aaaa ou '—', que é o formato que a Carteira e a conferência esperam.
 */
function obterInfoProximoSorteio(modalidade) {
  const mod = modalidade || (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena');
  const ehDataBR = (texto) => /^\d{2}\/\d{2}\/\d{4}$/.test(String(texto || '').trim());
  let proximoNumero = null;
  let proximaData = null;

  // 1. Sorteios sincronizados da Caixa.
  if (typeof obterSorteiosSalvos === 'function') {
    const item = obterSorteiosSalvos()?.[mod];
    if (item?.concurso) proximoNumero = Number(item.concurso);
    if (item?.dataOficial === true && ehDataBR(item.dataBR)) proximaData = String(item.dataBR).trim();
  }

  // 2. Sem sincronização: o último concurso conhecido aponta o seguinte.
  if (!proximoNumero) {
    const base = mod === 'megasena'
      ? (typeof baseConcursosMega !== 'undefined' ? baseConcursosMega : [])
      : (typeof baseConcursosLoto !== 'undefined' ? baseConcursosLoto : []);
    const ultimo = base?.[0];
    if (ultimo) {
      proximoNumero = Number(ultimo.proximoConcurso || (ultimo.concurso + 1));
      if (ehDataBR(ultimo.dataProximo)) proximaData = String(ultimo.dataProximo).trim();
    }
  }

  // 3. Data que já passou é informação velha: não serve nem a data nem o número.
  let rotulo = '';
  if (proximaData) {
    const [dia, mes, ano] = proximaData.split('/').map(Number);
    const alvo = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (alvo.getTime() < hoje.getTime()) {
      proximaData = null;
      proximoNumero = null;
    } else {
      const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      rotulo = `${dias[alvo.getDay()]}, ${proximaData}`;
    }
  }

  return {
    concurso: proximoNumero ? ('#' + proximoNumero) : 'Próximo Oficial',
    data: proximaData || '—',
    dataSimples: proximaData || '',
    rotulo
  };
}

/** Jogos salvos antes desta correção podem ter duas datas no mesmo texto. Fica só a data oficial. */
function corrigirDatasDosJogosSalvos() {
  if (typeof carteiraJogos === 'undefined' || !Array.isArray(carteiraJogos)) return 0;
  let corrigidos = 0;
  carteiraJogos.forEach((bilhete) => {
    const texto = String(bilhete.data || '');
    if (!texto || /^\d{2}\/\d{2}\/\d{4}$/.test(texto) || texto === '—' || texto === 'Data oficial a confirmar') return;
    if (!/ • | às \d/.test(texto)) return;
    const achada = /(\d{2}\/\d{2}\/\d{4})/.exec(texto);
    bilhete.data = achada ? achada[1] : '—';
    corrigidos++;
  });
  if (corrigidos && typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  return corrigidos;
}
window.corrigirDatasDosJogosSalvos = corrigirDatasDosJogosSalvos;
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
    if (corrigirDatasDosJogosSalvos() && typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  }, 1500));
}

function obterDestinoJogo(modalidade) {
  if (modalidade === 'megasena' && window.estaPlanejandoMegaVirada?.()) {
    return {
      concurso: 'Mega da Virada 2026',
      data: 'Data oficial a confirmar',
      status: 'Palpite planejado • não é aposta oficial',
      tipo: 'mega_virada_2026'
    };
  }
  return { ...obterInfoProximoSorteio(modalidade), status: 'Aguardando sorteio', tipo: 'calibrado' };
}
window.obterDestinoJogo = obterDestinoJogo;

/**
 * Registra o jogo (ou lote de jogos) com status ativo para o próximo concurso oficial
 * Permite que o apostador aperte "JOGUEI ESTE JOGO!" na hora que apostou na lotérica/app
 */
function marcarComoJogadoProximoConcurso() {
  if (window.estaPlanejandoMegaVirada?.()) {
    salvarJogoAtivoNaCarteira();
    return;
  }
  if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) {
    return;
  }
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterInfoProximoSorteio(mod);

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];

  const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                (typeof usuarioSessao !== 'undefined' && (usuarioSessao?.tipo === 'master_founder' || usuarioSessao?.tipo === 'vip_convidado' || usuarioSessao?.plano === 'pro'));

  if (!ehPro && carteiraJogos.length >= 10) {
    if (typeof abrirModalPaywall === 'function') {
      abrirModalPaywall('carteira_limite');
    } else if (typeof toast === 'function') {
      toast('Limite de 10 jogos do plano grátis atingido. Veja os planos para salvar jogos ilimitados.', '⚠️');
    }
    return;
  }

  // Cenário 1: Há múltiplos jogos gerados (Lote de 2, 3 ou 5)
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    const totalJogos = loteApostasGeradas.length;
    
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dez)`,
        dezenas: [...aposta.dezenas],
        data: infoSorteio.data,
        concursoAlvo: infoSorteio.concurso,
        score: aposta.analise?.score || score,
        status: 'Aguardando sorteio',
        registradoComoJogado: true,
        dataRegistro: new Date().toISOString()
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

    if (typeof toast === 'function') {
      toast(`${totalJogos} jogos salvos na Carteira para o concurso ${infoSorteio.concurso}. Isto não é uma aposta.`, '✅');
    }
    return;
  }

  // Cenário 2: Aposta individual ativa
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Gere um jogo primeiro para registrar como jogado', '⚠️');
    return;
  }

  const novoBilhete = {
    id: Date.now(),
    modalidade: mod,
    nome: `${nomeMod} • ${jogo.length} Dezenas`,
    dezenas: [...jogo],
    data: infoSorteio.data,
    concursoAlvo: infoSorteio.concurso,
    score: score,
    status: 'Aguardando sorteio',
    registradoComoJogado: true,
    dataRegistro: new Date().toISOString()
  };

  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

  if (typeof toast === 'function') {
    toast(`Jogo salvo na Carteira para o concurso ${infoSorteio.concurso}. Isto não é uma aposta.`, '✅');
  }
}

function salvarJogoAtivoNaCarteira() {
  if (typeof window.exigirLeadAntesDeSalvar === 'function' && !window.exigirLeadAntesDeSalvar()) {
    return;
  }
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const destinoJogo = obterDestinoJogo(mod);
  const infoSorteio = destinoJogo;

  if (!Array.isArray(carteiraJogos)) carteiraJogos = [];

  const ehPro = (typeof planoUsuario !== 'undefined' && planoUsuario === 'pro') ||
                (typeof usuarioSessao !== 'undefined' && (usuarioSessao?.tipo === 'master_founder' || usuarioSessao?.tipo === 'vip_convidado' || usuarioSessao?.plano === 'pro'));

  if (!ehPro && carteiraJogos.length >= 10) {
    if (typeof abrirModalPaywall === 'function') {
      abrirModalPaywall('carteira_limite');
    } else if (typeof toast === 'function') {
      toast('Limite de 10 jogos do plano grátis atingido. Veja os planos para salvar jogos ilimitados.', '⚠️');
    }
    return;
  }

  // Se houver lote com múltiplos jogos gerados, salva todos
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: destinoJogo.tipo === 'mega_virada_2026'
          ? `Mega da Virada 2026 • Jogo #${aposta.id || i + 1}`
          : `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dezenas)`,
        dezenas: [...aposta.dezenas],
        data: infoSorteio.data,
        score: aposta.analise?.score || score,
        concursoAlvo: infoSorteio.concurso,
        status: infoSorteio.status,
        tipo: infoSorteio.tipo,
        dataRegistro: new Date().toISOString()
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
    if (typeof toast === 'function') toast(destinoJogo.tipo === 'mega_virada_2026'
      ? `${loteApostasGeradas.length} palpites da Mega da Virada salvos na Carteira.`
      : `${loteApostasGeradas.length} jogos salvos na sua Carteira!`, '💼');
    return;
  }

  // Aposta individual ativa
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Selecione ou gere um jogo primeiro', '⚠️');
    return;
  }

  const novoBilhete = {
    id: Date.now(),
    modalidade: mod,
    nome: destinoJogo.tipo === 'mega_virada_2026'
      ? `Mega da Virada 2026 • ${jogo.length} dezenas`
      : `${nomeMod} • ${jogo.length} Dezenas`,
    dezenas: [...jogo],
    data: infoSorteio.data,
    score: score,
    concursoAlvo: infoSorteio.concurso,
    status: infoSorteio.status,
    tipo: infoSorteio.tipo,
    dataRegistro: new Date().toISOString()
  };

  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

  if (typeof toast === 'function') toast(destinoJogo.tipo === 'mega_virada_2026'
    ? 'Palpite da Mega da Virada salvo na Carteira. Ele ainda não é uma aposta oficial.'
    : 'Jogo salvo na sua Carteira!', '💼');
}

function compartilharJogoGeradoWhatsapp() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterDestinoJogo(mod);
  const nomeDestino = infoSorteio.tipo === 'mega_virada_2026' ? 'Mega da Virada 2026' : nomeMod;
  const avisoPlanejamento = infoSorteio.tipo === 'mega_virada_2026'
    ? '\nEste é um palpite para planejamento; não é comprovante nem registro de aposta oficial.'
    : '';

  // Caso 1: Foram gerados múltiplos jogos (2, 3 ou 5 jogos)
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    const totalJogos = loteApostasGeradas.length;
    
    let linhasJogos = loteApostasGeradas.map((ap, i) => {
      const dezenas = ap.dezenas.map(d => String(d).padStart(2, '0')).join(' - ');
      return `🎲 *Jogo #${i + 1}:*\n👉 *${dezenas}*`;
    }).join('\n\n');

    const textoLote = 
`🎯 *${totalJogos} JOGOS GERADOS • ${nomeDestino.toUpperCase()}*
🎯 *Concurso Alvo:* ${infoSorteio.concurso}${infoSorteio.rotulo ? ` (${infoSorteio.rotulo})` : ''}
Sorteios são aleatórios: nenhum jogo tem mais chance que outro.${avisoPlanejamento}

${linhasJogos}

*Meu Volante PRO* — Organize e confira seus jogos:
👉 https://loterias.pd.dev.br/`;

    window.abrirWhatsApp({ texto: textoLote });
    if (typeof toast === 'function') toast(`Enviando ${totalJogos} jogos no WhatsApp...`, '📱');
    return;
  }

  // Caso 2: Jogo único ativo
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  if (!jogo || jogo.length === 0) {
    if (typeof toast === 'function') toast('Gere um jogo primeiro para enviar', '⚠️');
    return;
  }

  const dezenasFormatadas = jogo.map(n => String(n).padStart(2, '0')).join(' - ');

  const textoUnico = 
`🎯 *JOGO GERADO • ${nomeDestino.toUpperCase()}*
🎯 *Concurso Alvo:* ${infoSorteio.concurso}${infoSorteio.rotulo ? ` (${infoSorteio.rotulo})` : ''}
Sorteios são aleatórios: nenhum jogo tem mais chance que outro.${avisoPlanejamento}

🎯 *Dezenas:*
👉 *${dezenasFormatadas}*

*Meu Volante PRO* — Organize e confira seus jogos:
👉 https://loterias.pd.dev.br/`;

    window.abrirWhatsApp({ texto: textoUnico });
    if (typeof toast === 'function') toast('Abrindo WhatsApp...', '📱');
}

/**
 * Atualiza o rótulo do botão de WhatsApp para mostrar se está enviando 1 ou lote
 */
function atualizarRotuloBotaoWhatsapp() {
  const elBtnTxt = document.getElementById('txt-whatsapp-botao');
  const btn = document.getElementById('btn-whatsapp-lote');
  const qtdLote = (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas)) ? loteApostasGeradas.length : 0;
  const qtdDesejada = typeof qtdApostasDesejada !== 'undefined' ? qtdApostasDesejada : 1;
  const qtd = qtdLote > 1 ? qtdLote : (qtdDesejada > 1 ? qtdDesejada : 1);

  const texto = qtd > 1 ? `Enviar ${qtd} Jogos no WhatsApp` : 'Enviar no WhatsApp';

  if (elBtnTxt) {
    elBtnTxt.innerText = texto;
  }
  if (btn && btn.childNodes.length > 0) {
    const span = btn.querySelector('#txt-whatsapp-botao');
    if (span) span.innerText = texto;
  }
}
