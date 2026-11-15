// ===================================================================
// FLUXO PRINCIPAL: apresentação -> gerar -> ver o jogo -> salvar
// ===================================================================
// Uma tela só, com o jogo sempre à vista e um único botão de salvar.
// O restante (dezenas manuais, quantidade, indicadores) fica recolhido.

function iniciarJogo() {
  mudarAba('volante');
  setTimeout(() => {
    if (typeof gerarApostaNasaComMatriz4x4 === 'function') gerarApostaNasaComMatriz4x4();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 120);
}
window.iniciarJogo = iniciarJogo;

function criarGaveta(titulo, id) {
  const gaveta = document.createElement('details');
  gaveta.className = 'fluxo-gaveta';
  gaveta.id = id;
  const resumo = document.createElement('summary');
  resumo.textContent = titulo;
  gaveta.appendChild(resumo);
  return gaveta;
}

// A tela Gerar segue a ordem em que a pessoa decide:
// definições -> ações (2x2) -> números e volante juntos -> indicadores.
// Os blocos do index.html são só reposicionados; nenhum id é criado de novo.

function montarCardDoJogo() {
  const display = document.getElementById('display-meu-jogo');
  const card = display?.closest('.rounded-3xl');
  if (!card || card.dataset.fluxo) return null;
  card.dataset.fluxo = '1';
  card.classList.add('fluxo-card-definicoes');

  const blocoJogo = display.parentElement;
  const blocoQtd = document.getElementById('container-seletores-qtd')?.parentElement;
  const blocoJogos = document.getElementById('btn-qtd-jogos-1')?.closest('.pt-2\\.5');
  const blocoGerar = document.getElementById('txt-btn-gerar-principal')?.closest('.pt-1');
  const btnGerar = document.getElementById('txt-btn-gerar-principal')?.closest('button');
  const btnSalvar = document.getElementById('txt-btn-joguei-jogo')?.closest('button');
  const btnWhats = document.getElementById('btn-whatsapp-lote');
  const btnPdf = card.querySelector('button[onclick^="imprimirJogosVolante"]');

  // Sobram do desenho antigo: dois botões de salvar repetidos, selos e o banner.
  card.querySelector('button[onclick^="salvarJogoNaCarteira"]')?.remove();
  card.querySelector('button[onclick^="salvarJogoAtivoNaCarteira"]')?.remove();
  document.getElementById('banner-cta-pro-volante')?.remove();
  document.getElementById('modalidade-label')?.closest('.space-y-2')?.classList.add('hidden');

  const titulo = document.createElement('h2');
  titulo.className = 'fluxo-titulo';
  titulo.textContent = 'Como vai ser o jogo';
  card.prepend(titulo);
  [blocoQtd, blocoJogos].forEach((bloco) => bloco && card.append(bloco));

  // Um card só com as quatro ações, em 2x2.
  const acoes = document.createElement('div');
  acoes.id = 'fluxo-card-acoes';
  acoes.className = 'fluxo-card-acoes';
  if (btnGerar) {
    btnGerar.className = 'fluxo-acao fluxo-acao-principal';
    acoes.append(btnGerar);
  }
  if (btnSalvar) {
    btnSalvar.className = 'fluxo-acao fluxo-acao-principal fluxo-acao-salvar';
    acoes.append(btnSalvar);
  }
  if (btnWhats) {
    btnWhats.className = 'fluxo-acao';
    acoes.append(btnWhats);
  }
  if (btnPdf) {
    btnPdf.className = 'fluxo-acao';
    btnPdf.textContent = 'PDF';
    btnPdf.removeAttribute('onclick');
    btnPdf.addEventListener('click', imprimirJogoDaTela);
    acoes.append(btnPdf);
  }
  card.after(acoes);

  // O que ficou vazio no card das definições deixa de ocupar espaço.
  blocoGerar?.classList.add('hidden');
  blocoJogo.classList.add('hidden');
  return card;
}

/** PDF do que está na tela: o lote gerado ou o jogo único, nunca jogos de outra aba. */
function imprimirJogoDaTela() {
  const jogo = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
  const minimo = typeof getConfigAtual === 'function' ? getConfigAtual().minDezenas : 6;
  if (jogo.length < minimo) {
    window.toast?.(`Faltam ${minimo - jogo.length} dezenas para completar o jogo.`, '⚠️');
    return;
  }
  const jogos = typeof loteApostasGeradas !== 'undefined' && loteApostasGeradas.length > 1
    ? loteApostasGeradas.map((a) => a.dezenas)
    : [[...jogo].sort((a, b) => a - b)];
  const virada = Boolean(window.estaPlanejandoMegaVirada?.());
  window.imprimirJogosVolante?.(jogos, modalidadeAtual, virada ? { planejamento: true, titulo: 'Mega da Virada 2026' } : {});
}

/** Folha para escolher o sorteio do jogo: concurso regular ou Mega da Virada. */
function abrirDestinoDoJogo(aoEscolher) {
  const info = typeof obterInfoProximoSorteio === 'function' ? obterInfoProximoSorteio('megasena') : {};
  const jogos = typeof loteApostasGeradas !== 'undefined' && loteApostasGeradas.length > 1 ? loteApostasGeradas.length : 1;
  const dezenas = typeof getJogoAtual === 'function' ? getJogoAtual().length : 0;
  const custo = typeof window.custoDoBilhete === 'function'
    ? window.custoDoBilhete({ modalidade: 'megasena', dezenas: new Array(dezenas) }) * jogos
    : null;
  const resumo = [
    jogos > 1 ? `${jogos} jogos` : '1 jogo',
    `${dezenas} dezenas`,
    custo === null ? null : custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  ].filter(Boolean).join(' · ');
  const proximo = [info.concurso ? `Concurso ${info.concurso}` : null, info.rotulo || null].filter(Boolean).join(' · ') || '—';

  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <div class="folha">
      <h2>Salvar para qual sorteio?</h2>
      <p>Mega-Sena · ${resumo}</p>
      <button type="button" class="folha-opcao" data-destino="proximo">
        <strong>Próximo concurso</strong><span>${proximo}</span>
      </button>
      <button type="button" class="folha-opcao folha-opcao-virada" data-destino="virada">
        <strong>Mega da Virada 2026</strong><span>Fica separado dos concursos normais na Carteira</span>
      </button>
      <p>O app guarda o seu jogo, mas não faz nem registra apostas. Apostas só valem nos canais oficiais da CAIXA.</p>
      <button type="button" class="folha-sair">Cancelar</button>
    </div>`;
  document.body.appendChild(fundo);
  const fechar = () => fundo.remove();
  fundo.querySelector('.folha-sair').addEventListener('click', fechar);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
  fundo.querySelectorAll('[data-destino]').forEach((botao) => botao.addEventListener('click', () => {
    fechar();
    aoEscolher(botao.dataset.destino);
  }));
}

function montarBotaoSalvar() {
  const texto = document.getElementById('txt-btn-joguei-jogo');
  const botao = texto?.closest('button');
  if (!botao) return;

  botao.removeAttribute('onclick');
  botao.innerHTML = '<span id="txt-btn-joguei-jogo">Salvar jogo</span>';
  let salvo = false;
  // Vale para o jogo que está na tela; um jogo novo volta ao concurso regular.
  let destinoVirada = false;
  window.estaPlanejandoMegaVirada = () => modalidadeAtual === 'megasena' && destinoVirada;
  window.atualizarModoMegaVirada = () => {
    if (modalidadeAtual !== 'megasena') destinoVirada = false;
  };

  // O mesmo jogo (ou lote) não é salvo duas vezes, mesmo depois de trocar de jogo ou de loteria e voltar.
  const assinaturaDoJogo = () => {
    const lote = typeof loteApostasGeradas !== 'undefined' && loteApostasGeradas.length > 1
      ? loteApostasGeradas.map((a) => a.dezenas.join('-')).join('|')
      : (typeof getJogoAtual === 'function' ? [...getJogoAtual()].sort((a, b) => a - b).join('-') : '');
    return `${modalidadeAtual}:${lote}`;
  };
  const salvos = new Map();

  const salvarNoDestino = (destino) => {
    const salvar = () => {
      destinoVirada = destino === 'virada';
      const antes = carteiraJogos.length;
      if (destinoVirada) window.salvarJogoAtivoNaCarteira?.();
      else marcarComoJogadoProximoConcurso();
      if (carteiraJogos.length > antes) {
        salvo = true;
        salvos.set(assinaturaDoJogo(), destino);
        document.getElementById('txt-btn-joguei-jogo').textContent = 'Salvo · ver na Carteira';
      } else {
        destinoVirada = false;
      }
    };
    // Sem conta, o cadastro abre e o jogo é salvo assim que a conta for criada.
    if (window.exigirLeadAntesDeSalvar?.() === false) window.salvarDepoisDoCadastro?.(salvar);
    else salvar();
  };

  botao.addEventListener('click', () => {
    if (salvo) {
      mudarAba('carteira');
      return;
    }
    const minimo = typeof getConfigAtual === 'function' ? getConfigAtual().minDezenas : 6;
    const marcadas = typeof getJogoAtual === 'function' ? getJogoAtual().length : 0;
    if (marcadas < minimo) {
      window.toast?.(`Faltam ${minimo - marcadas} dezenas para completar o jogo.`, '⚠️');
      return;
    }
    if (modalidadeAtual === 'megasena') abrirDestinoDoJogo(salvarNoDestino);
    else salvarNoDestino('proximo');
  });

  const display = document.getElementById('display-meu-jogo');
  let ultimaAssinatura = null;
  new MutationObserver(() => {
    const atual = assinaturaDoJogo();
    if (atual === ultimaAssinatura) return;
    ultimaAssinatura = atual;
    salvo = salvos.has(atual);
    destinoVirada = salvos.get(atual) === 'virada';
    const rotulo = document.getElementById('txt-btn-joguei-jogo');
    if (rotulo) rotulo.textContent = salvo ? 'Salvo · ver na Carteira' : 'Salvar jogo';
    display.classList.remove('fluxo-pulso');
    void display.offsetWidth;
    display.classList.add('fluxo-pulso');
  }).observe(display, { childList: true });
}

function montarVolante() {
  const grade = document.getElementById('volante-grid');
  const card = grade?.closest('.rounded-3xl');
  if (!card || card.dataset.fluxo) return;
  card.dataset.fluxo = '1';
  // Números e volante no mesmo card: a pessoa vê o jogo e onde ele cai.
  card.classList.add('fluxo-card-volante', 'fluxo-card-jogo');

  document.getElementById('chk-destaque-subgrid')?.closest('label')?.classList.add('hidden');
  if (typeof volanteModo10Colunas !== 'undefined') volanteModo10Colunas = true;
  grade.classList.add('classic-10x6');

  // Preferências avançadas sobem para o card das definições.
  const definicoes = document.querySelector('.fluxo-card-definicoes');
  const modos = document.getElementById('btn-modo-normal')?.parentElement?.parentElement;
  const regras = document.getElementById('painel-regras-ativas');
  if (modos && regras) {
    const preferencias = document.createElement('details');
    preferencias.className = 'fluxo-preferencias';
    const resumo = document.createElement('summary');
    const ajuda = document.createElement('p');
    ajuda.className = 'gastos-nota';
    ajuda.textContent = 'Escolha Fixar ou Proibir e toque nas dezenas do volante. Volte para Normal para marcar o jogo.';
    preferencias.append(resumo, ajuda, modos, regras);
    preferencias.addEventListener('toggle', () => {
      if (!preferencias.open && typeof modoToque !== 'undefined' && modoToque !== 'normal') setModoToque('normal');
    });
    (definicoes || card).append(preferencias);
    const atualizarResumo = () => {
      const fixas = typeof getFixos === 'function' ? getFixos().length : 0;
      const proibidas = typeof getProibidos === 'function' ? getProibidos().length : 0;
      resumo.textContent = fixas || proibidas
        ? `Preferências avançadas · ${fixas} fixas · ${proibidas} proibidas`
        : 'Preferências avançadas · fixas e proibidas';
    };
    new MutationObserver(atualizarResumo).observe(regras, { childList: true, subtree: true });
    atualizarResumo();

    // "Limpar" só existe quando há regra para limpar.
    const limpar = card.querySelector('button[onclick^="limparFixosEProibidos"]') || modos.querySelector('button[onclick^="limparFixosEProibidos"]');
    if (limpar) {
      limpar.className = 'fluxo-link';
      limpar.textContent = 'Limpar fixas e proibidas';
      regras.after(limpar);
      const atualizar = () => {
        const temRegra = (typeof getFixos === 'function' && getFixos().length > 0)
          || (typeof getProibidos === 'function' && getProibidos().length > 0);
        limpar.hidden = !temRegra;
      };
      new MutationObserver(atualizar).observe(grade, { childList: true });
      atualizar();
    }
  }
  [...card.querySelectorAll('p, div')].find((el) => !el.children.length && el.textContent.trim().startsWith('Dica:'))?.classList.add('hidden');

  const rotuloWhats = document.getElementById('txt-whatsapp-botao');
  if (rotuloWhats) {
    new MutationObserver(() => {
      if (rotuloWhats.textContent !== 'WhatsApp') rotuloWhats.textContent = 'WhatsApp';
    }).observe(rotuloWhats, { childList: true, characterData: true, subtree: true });
    rotuloWhats.textContent = 'WhatsApp';
  }

  // Topo do card: os números do jogo, o aviso de jogo repetido e a sugestão de troca.
  const titulo = document.createElement('h2');
  titulo.className = 'fluxo-titulo';
  titulo.textContent = 'Seu jogo';
  const display = document.getElementById('display-meu-jogo');
  const abas = document.getElementById('container-abas-jogos-gerados');
  const alerta = document.getElementById('alerta-jogo-ja-jogado');
  card.prepend(...[titulo, abas, display, alerta].filter(Boolean));
  const revisao = document.getElementById('revisao-jogo');
  if (revisao) display.after(revisao);

  const sugestao = document.getElementById('card-sugestao-troca');
  const conteudoSugestao = document.getElementById('conteudo-sugestao-troca');
  if (sugestao && conteudoSugestao) {
    sugestao.firstElementChild?.classList.add('hidden');
    grade.before(sugestao);
    const atualizarVisibilidadeSugestao = () => {
      sugestao.hidden = conteudoSugestao.textContent.trim() === '' && conteudoSugestao.children.length === 0;
      // As sub-abas antigas deixavam o aviso com display:none para sempre.
      sugestao.style.display = sugestao.hidden ? 'none' : '';
    };
    new MutationObserver(atualizarVisibilidadeSugestao).observe(conteudoSugestao, { childList: true, subtree: true, characterData: true });
    atualizarVisibilidadeSugestao();
  }

  // Limpar a seleção fica discreto, logo abaixo do volante.
  const limparJogo = document.querySelector('button[onclick^="limparSelecao"]');
  if (limparJogo) {
    limparJogo.className = 'fluxo-link fluxo-limpar';
    limparJogo.textContent = 'Limpar dezenas';
    grade.after(limparJogo);
  }

  const desenharVolante = window.renderizarVolante;
  if (typeof desenharVolante === 'function') {
    window.renderizarVolante = function (...args) {
      const retorno = desenharVolante.apply(this, args);
      const dezena = window.dezenaSugeridaParaSair;
      if (dezena && typeof getJogoAtual === 'function' && getJogoAtual().includes(dezena)) window.marcarDezenaSugerida?.(dezena);
      return retorno;
    };
  }

  if (typeof renderizarVolante === 'function') renderizarVolante();
}

function montarIndicadores() {
  const blocos = ['card-matriz-4x4-box', 'painel-score-telemetria', 'card-bateria-testes']
    .map((id) => document.getElementById(id)).filter(Boolean);
  if (!blocos.length || document.getElementById('fluxo-gaveta-indicadores')) return;

  // Quadrantes e os seis indicadores num bloco só.
  const gaveta = criarGaveta('Indicadores do jogo', 'fluxo-gaveta-indicadores');
  blocos[0].before(gaveta);
  blocos.forEach((bloco) => gaveta.appendChild(bloco));
  gaveta.classList.toggle('tem-incomum', Boolean(window.jogoTemIndicadorIncomum));
}

// Sem jogos salvos não há o que filtrar nem somar: fica só o convite para começar.
function recolherFiltrosDaCarteira() {
  const tela = document.getElementById('carteira-subview-bilhetes');
  const filtros = [...(tela?.children || [])].find((b) => b.innerText?.includes('EXIBIR'));
  if (!filtros || filtros.closest('.fluxo-gaveta')) return;
  const gaveta = criarGaveta('Filtrar jogos', 'fluxo-gaveta-filtros');
  filtros.before(gaveta);
  gaveta.appendChild(filtros);
}

function ajustarCarteira() {
  recolherFiltrosDaCarteira();
  // Totais agora ficam no painel de gastos.
  document.getElementById('banca-investido')?.closest('.grid')?.classList.add('hidden');
  const lista = document.getElementById('total-bilhetes-salvos');
  const tela = document.getElementById('carteira-subview-bilhetes');
  if (!lista || !tela) return;
  const vazia = !carteiraJogos.length;
  [...tela.children].forEach((bloco) => {
    if (!bloco.contains(lista)) bloco.classList.toggle('hidden', vazia);
  });
  tela.classList.toggle('fluxo-carteira-vazia', vazia);
}

function ocultarLoginsIndisponiveis() {
  const config = window.NASA_SUPABASE_CONFIG || {};
  if (!config.googleEnabled) document.querySelector('button[onclick="loginComGoogle()"]')?.classList.add('hidden');
  if (!config.metaEnabled) document.querySelector('button[onclick="loginComMeta()"]')?.classList.add('hidden');
  if (!config.googleEnabled && !config.metaEnabled) {
    const divisor = [...document.querySelectorAll('#modal-auth-saas span')].find((el) => el.textContent.trim() === 'ou com e-mail');
    divisor?.parentElement?.classList.add('hidden');
  }
}

// Lançamento só no tema escuro: o claro volta quando for refeito.
function fixarTemaEscuro() {
  window.alternarTema = () => {};
  document.documentElement.classList.add('dark');
  document.querySelectorAll('[onclick*="alternarTema"]').forEach((b) => b.classList.add('hidden'));
}

function limparFechar() {
  const titulo = [...document.querySelectorAll('#view-fechamentos span, #view-fechamentos div')]
    .find((el) => !el.children.length && el.textContent.trim() === 'Custo do fechamento');
  titulo?.closest('.rounded-2xl')?.classList.add('hidden');
}

function aplicarTemaDaModalidade() {
  const lotofacil = typeof modalidadeAtual !== 'undefined' && modalidadeAtual === 'lotofacil';
  document.documentElement.classList.toggle('tema-lotofacil', lotofacil);
}

function ligarTemaDaModalidade() {
  const trocar = window.trocarModalidade;
  window.trocarModalidade = function (...args) {
    const retorno = trocar.apply(this, args);
    aplicarTemaDaModalidade();
    window.atualizarModoMegaVirada?.();
    window.renderizarRevisaoDoJogo?.();
    return retorno;
  };
  aplicarTemaDaModalidade();
}

function podeVerPlanos() {
  return planoUsuario !== 'pro' && !window.contextoLoja?.ativo();
}

function abrirPlanos() {
  window.fecharDrawerPerfil?.();
  window.abrirModalPaywall?.('botao_planos');
}

function atualizarEntradaPlanos() {
  const existente = document.getElementById('cartao-planos');
  if (!podeVerPlanos()) {
    existente?.remove();
    return;
  }
  const hero = document.getElementById('home-btn-hero-primary')?.parentElement;
  if (existente || !hero) return;
  const cartao = document.createElement('div');
  cartao.id = 'cartao-planos';
  cartao.className = 'gastos-painel';
  cartao.innerHTML = `
    <div class="gastos-topo">
      <div><strong class="instalar-titulo">Plano grátis</strong><p class="gastos-nota">Mais jogos, carteira e bolões sem limite.</p></div>
      <button type="button" class="ritual-ver">Ver planos</button>
    </div>`;
  cartao.querySelector('button').addEventListener('click', abrirPlanos);
  hero.after(cartao);
}

function ligarEntradaPlanos() {
  const atualizarPlano = window.atualizarVisualPlano;
  if (typeof atualizarPlano === 'function') {
    window.atualizarVisualPlano = function (...args) {
      const retorno = atualizarPlano.apply(this, args);
      atualizarEntradaPlanos();
      return retorno;
    };
  }
  const abrirMenu = window.abrirDrawerPerfil;
  if (typeof abrirMenu === 'function') {
    window.abrirDrawerPerfil = function (...args) {
      const retorno = abrirMenu.apply(this, args);
      const linha = document.getElementById('drawer-admin-row');
      if (linha && podeVerPlanos() && !document.getElementById('drawer-ver-planos')) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.id = 'drawer-ver-planos';
        botao.className = 'ritual-ver';
        botao.style.width = '100%';
        botao.style.marginTop = '12px';
        botao.textContent = 'Ver planos';
        botao.addEventListener('click', abrirPlanos);
        linha.before(botao);
      }
      return retorno;
    };
  }
  atualizarEntradaPlanos();
}

function iniciarFluxoJogo() {
  ligarEntradaPlanos();
  ligarTemaDaModalidade();
  fixarTemaEscuro();
  limparFechar();
  ocultarLoginsIndisponiveis();
  // Começa com um jogo, sem aviso nem som na abertura.
  const avisoOriginal = window.toast;
  const beepOriginal = window.tocarBeep;
  window.toast = () => {};
  window.tocarBeep = () => {};
  if (typeof setQtdJogosParaGerar === 'function') setQtdJogosParaGerar(1);
  window.toast = avisoOriginal;
  window.tocarBeep = beepOriginal;

  document.getElementById('home-active-mod-badge')?.parentElement?.parentElement?.classList.add('hidden');
  trocarIconesNavegacao();
  ligarBotaoVoltar();
  ligarPremioGuardado();
  [...document.querySelectorAll('#carteira-subview-bilhetes button')]
    .find((b) => b.textContent.includes('Mandar pelo WhatsApp'))?.closest('.rounded-2xl, .rounded-3xl')?.remove();
  const atualizar = window.atualizarPainelCarteira;
  if (typeof atualizar === 'function') {
    window.atualizarPainelCarteira = function (...args) {
      const retorno = atualizar.apply(this, args);
      ajustarCarteira();
      window.renderizarGastos?.();
      return retorno;
    };
  }
  ajustarCarteira();
  document.getElementById('nasa-seg-gerar')?.classList.add('hidden');
  montarCardDoJogo();
  montarBotaoSalvar();
  montarVolante();
  montarIndicadores();
  ligarRevisao();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarFluxoJogo, 0));

// Os 5 destinos da barra inferior usam um único conjunto de ícones.
function trocarIconesNavegacao() {
  const tracos = {
    'Início': '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    'Gerar': '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/>',
    'Fechar': '<path d="M4 6h16M4 12h16M4 18h10"/>',
    'Análise': '<path d="M5 20V11M12 20V5M19 20v-6"/>',
    'Carteira': '<path d="M3 8h18v12H3z"/><path d="M16 14h2M7 8V5h10v3"/>'
  };
  document.querySelectorAll('.tab-label').forEach((rotulo) => {
    const desenho = tracos[rotulo.textContent.trim()];
    const icone = rotulo.previousElementSibling;
    if (desenho && icone) {
      icone.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${desenho}</svg>`;
    }
  });
}

// Voltar do Android: fecha o que está aberto, depois volta de aba. Só sai do app na Início.
function ligarBotaoVoltar() {
  const original = window.mudarAba;
  let vindoDoHistorico = false;
  let ignorarProximoVoltar = false;
  window.mudarAba = function (aba, ...resto) {
    const retorno = original.call(this, aba, ...resto);
    window.scrollTo(0, 0);
    if (!vindoDoHistorico) {
      // Histórico de uma camada só: qualquer aba volta para a Início, e a Início sai do app.
      const atual = history.state?.aba;
      if (aba === 'inicio') {
        if (atual && atual !== 'inicio') { ignorarProximoVoltar = true; history.back(); }
      } else if (!atual || atual === 'inicio') {
        history.pushState({ aba }, '');
      } else if (atual !== aba) {
        history.replaceState({ aba }, '');
      }
    }
    return retorno;
  };

  const fecharAberto = () => {
    const folha = document.querySelector('.folha-fundo');
    if (folha) { folha.remove(); return true; }
    const menu = document.getElementById('nasa-profile-drawer-backdrop');
    if (menu?.classList.contains('open')) { window.fecharDrawerPerfil?.(); return 'menu'; }
    const modal = [...document.querySelectorAll('.fixed.inset-0')]
      .find((m) => !m.dataset.obrigatorio && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none');
    if (!modal) return false;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    return true;
  };

  // O menu lateral ganha uma entrada no histórico, para o Voltar fechá-lo em qualquer tela.
  const abrirMenu = window.abrirDrawerPerfil;
  if (typeof abrirMenu === 'function') {
    window.abrirDrawerPerfil = function (...args) {
      const retorno = abrirMenu.apply(this, args);
      if (!history.state?.menu) history.pushState({ aba: abaAtual, menu: true }, '');
      return retorno;
    };
  }
  const fecharMenu = window.fecharDrawerPerfil;
  if (typeof fecharMenu === 'function') {
    window.fecharDrawerPerfil = function (...args) {
      const retorno = fecharMenu.apply(this, args);
      // Fechado pelo X ou por um item do menu: a entrada vira a da tela atual.
      if (history.state?.menu) history.replaceState({ aba: abaAtual }, '');
      return retorno;
    };
  }

  history.replaceState({ aba: 'inicio' }, '');
  window.addEventListener('popstate', (evento) => {
    if (ignorarProximoVoltar) { ignorarProximoVoltar = false; return; }
    const fechou = fecharAberto();
    // O menu tem a própria entrada no histórico: fechá-lo já consumiu o Voltar.
    if (fechou === 'menu') return;
    if (fechou) {
      history.pushState({ aba: abaAtual }, '');
      return;
    }
    vindoDoHistorico = true;
    window.mudarAba(evento.state?.aba || 'inicio');
    vindoDoHistorico = false;
  });
}

// Mostra o último prêmio conhecido enquanto a consulta à Caixa não responde.
function ligarPremioGuardado() {
  ['js-mega-premio', 'js-loto-premio'].forEach((classe) => {
    const chave = `meu_volante_${classe}`;
    document.querySelectorAll(`.${classe}`).forEach((el) => {
      const ajustar = () => {
        const texto = el.textContent.trim();
        if (texto.startsWith('R$')) {
          try { localStorage.setItem(chave, texto); } catch {}
          return;
        }
        let guardado = null;
        try { guardado = localStorage.getItem(chave); } catch {}
        const novo = guardado || 'Consultando...';
        if (texto !== novo) el.textContent = novo;
      };
      new MutationObserver(ajustar).observe(el, { childList: true, characterData: true, subtree: true });
      ajustar();
    });
  });
}

function ligarRevisao() {
  const gaveta = document.getElementById('fluxo-gaveta-indicadores');
  if (gaveta && !document.getElementById('tabela-chances')) {
    const tabela = document.createElement('div');
    tabela.id = 'tabela-chances';
    gaveta.append(tabela);
  }
  const display = document.getElementById('display-meu-jogo');
  if (display) new MutationObserver(() => window.renderizarRevisaoDoJogo?.()).observe(display, { childList: true });
  window.renderizarRevisaoDoJogo?.();
  window.renderizarGastos?.();
}
