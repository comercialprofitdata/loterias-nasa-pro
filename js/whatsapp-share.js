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

function obterInfoProximoSorteio(modalidade) {
  const mod = modalidade || (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena');
  let proximoNumero = null;
  let proximaData = null;

  if (mod === 'megasena' && typeof baseConcursosMega !== 'undefined' && baseConcursosMega.length > 0) {
    const ultimo = baseConcursosMega[0];
    proximoNumero = ultimo.proximoConcurso || (ultimo.concurso + 1);
    proximaData = ultimo.dataProximo || null;
  } else if (mod === 'lotofacil' && typeof baseConcursosLoto !== 'undefined' && baseConcursosLoto.length > 0) {
    const ultimo = baseConcursosLoto[0];
    proximoNumero = ultimo.proximoConcurso || (ultimo.concurso + 1);
    proximaData = ultimo.dataProximo || null;
  }

  // Valida se proximaData ainda está no futuro ou é hoje
  if (proximaData) {
    const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(proximaData).trim());
    if (partes) {
      const [, dia, mes, ano] = partes;
      const alvo = new Date(Number(ano), Number(mes) - 1, Number(dia), 20, 0, 0);
      if (alvo.getTime() <= Date.now()) {
        proximaData = null; // A data gravada no registro anterior já passou!
      }
    }
  }

  // Fallback para data calculada se não tiver vindo da Caixa ainda
  if (!proximaData) {
    if (typeof calcularProximoSorteio === 'function') {
      const calc = calcularProximoSorteio(mod);
      proximaData = calc.dataBR || calc.dia;
    } else {
      proximaData = 'Próximo Sorteio Oficial';
    }
  }

  return {
    concurso: proximoNumero ? `#${proximoNumero}` : 'Próximo Oficial',
    data: proximaData
  };
}

/**
 * Registra o jogo (ou lote de jogos) com status ativo para o próximo concurso oficial
 * Permite que o apostador aperte "JOGUEI ESTE JOGO!" na hora que apostou na lotérica/app
 */
function marcarComoJogadoProximoConcurso() {
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

  if (!ehPro && carteiraJogos.length >= 2) {
    if (typeof abrirModalPaywall === 'function') {
      abrirModalPaywall('carteira_limite');
    } else if (typeof toast === 'function') {
      toast('Limite de 2 bilhetes do Plano Grátis atingido. Faça upgrade para salvar bilhetes ilimitados.', '⚠️');
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
      toast(`🎉 ${totalJogos} jogos registrados para o concurso ${infoSorteio.concurso}!`, '✅');
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
    toast(`🎉 Jogo registrado com sucesso para o concurso ${infoSorteio.concurso}!`, '✅');
  }
}

function salvarJogoAtivoNaCarteira() {
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

  if (!ehPro && carteiraJogos.length >= 2) {
    if (typeof abrirModalPaywall === 'function') {
      abrirModalPaywall('carteira_limite');
    } else if (typeof toast === 'function') {
      toast('Limite de 2 bilhetes do Plano Grátis atingido. Faça upgrade para salvar bilhetes ilimitados.', '⚠️');
    }
    return;
  }

  // Se houver lote com múltiplos jogos gerados, salva todos
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    loteApostasGeradas.forEach((aposta, i) => {
      carteiraJogos.unshift({
        id: Date.now() + i,
        modalidade: mod,
        nome: `${nomeMod} • Jogo #${aposta.id || i + 1} (${aposta.dezenas.length} dezenas)`,
        dezenas: [...aposta.dezenas],
        data: infoSorteio.data,
        score: aposta.analise?.score || score,
        concursoAlvo: infoSorteio.concurso,
        tipo: 'calibrado'
      });
    });

    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
    if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();
    if (typeof toast === 'function') toast(`${loteApostasGeradas.length} jogos salvos na sua Carteira!`, '💼');
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
    nome: `${nomeMod} • ${jogo.length} Dezenas`,
    dezenas: [...jogo],
    data: infoSorteio.data,
    score: score,
    concursoAlvo: infoSorteio.concurso,
    tipo: 'calibrado'
  };

  carteiraJogos.unshift(novoBilhete);
  if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
  if (typeof atualizarPainelCarteira === 'function') atualizarPainelCarteira();
  if (typeof renderizarCockpitInicioApostador === 'function') renderizarCockpitInicioApostador();

  if (typeof toast === 'function') toast('Jogo salvo na sua Carteira!', '💼');
}

function compartilharJogoGeradoWhatsapp() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const nomeMod = mod === 'megasena' ? 'Mega-Sena' : 'Lotofácil';
  const score = document.getElementById('score-numero')?.innerText || '98';
  const infoSorteio = obterInfoProximoSorteio(mod);

  // Caso 1: Foram gerados múltiplos jogos (2, 3 ou 5 jogos)
  if (typeof loteApostasGeradas !== 'undefined' && Array.isArray(loteApostasGeradas) && loteApostasGeradas.length > 1) {
    const totalJogos = loteApostasGeradas.length;
    
    let linhasJogos = loteApostasGeradas.map((ap, i) => {
      const dezenas = ap.dezenas.map(d => String(d).padStart(2, '0')).join(' - ');
      const scoreIndividual = ap.analise?.score || score;
      return `🎲 *Jogo #${i + 1}* (Nota ${scoreIndividual}/100):\n👉 *${dezenas}*`;
    }).join('\n\n');

    const textoLote = 
`🚀 *${totalJogos} JOGOS GERADOS • ${nomeMod.toUpperCase()}*
🎯 *Concurso Alvo:* ${infoSorteio.concurso} (${infoSorteio.data})
Sorteios são aleatórios: nenhum jogo tem mais chance que outro.

${linhasJogos}

🔬 *Critérios de Calibração:*
• Sem sequências longas viciadas
• Dezenas bem espalhadas no volante
• Equilíbrio estatístico de pares e ímpares

🛰️ *Loterias NASA Pro* — Monte e audite seus jogos:
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
`🚀 *JOGO GERADO • ${nomeMod.toUpperCase()}*
🎯 *Concurso Alvo:* ${infoSorteio.concurso} (${infoSorteio.data})
📊 *Nota de Equilíbrio:* ${score}/100 (6 de 6 Testes OK)

🎯 *Dezenas:*
👉 *${dezenasFormatadas}*

🔬 *Distribuição:*
• Sem sequências longas viciadas
• Dezenas bem espalhadas no volante
• Proporção ideal de pares e ímpares

🛰️ *Loterias NASA Pro* — Monte e audite seus jogos:
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
