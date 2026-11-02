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

function montarCardDoJogo() {
  const display = document.getElementById('display-meu-jogo');
  const card = display?.closest('.rounded-3xl');
  if (!card || card.dataset.fluxo) return null;
  card.dataset.fluxo = '1';
  card.classList.add('fluxo-card-jogo');

  const blocoJogo = display.parentElement;
  const blocoQtd = document.getElementById('container-seletores-qtd')?.parentElement;
  const blocoJogos = document.getElementById('btn-qtd-jogos-1')?.closest('.pt-2\\.5');
  const blocoGerar = document.getElementById('txt-btn-gerar-principal')?.closest('.pt-1');
  const blocoAbas = document.getElementById('container-abas-jogos-gerados');
  const btnGerar = document.getElementById('txt-btn-gerar-principal')?.closest('button');

  card.querySelector('#modalidade-label').textContent = 'Seu jogo';
  card.querySelector('button[onclick^="salvarJogoNaCarteira"]')?.remove();
  document.getElementById('qtd-selecionadas')?.closest('.font-mono')?.classList.add('hidden');
  document.getElementById('banner-cta-pro-volante')?.remove();
  document.getElementById('label-titulo-jogo-ativo')?.classList.add('hidden');
  document.querySelector('button[onclick^="salvarJogoAtivoNaCarteira"]')?.remove();

  const ajustes = criarGaveta('Quantidade de dezenas e de jogos', 'fluxo-gaveta-ajustes');
  [blocoQtd, blocoJogos].forEach((bloco) => bloco && ajustes.appendChild(bloco));

  card.append(blocoJogo);
  if (blocoAbas) blocoJogo.before(blocoAbas);
  // Ordem de decisão: salvar o jogo que está na tela ou pedir outro.
  if (blocoGerar) blocoJogo.querySelector('button[id], .space-y-2 > button')?.after(blocoGerar);
  card.append(ajustes);

  if (btnGerar) {
    btnGerar.classList.remove('btn-rocket-launch');
    btnGerar.classList.add('fluxo-btn-secundario');
    btnGerar.innerHTML = '<span id="txt-btn-gerar-principal">Gerar outro jogo</span>';
  }

  return card;
}

function montarBotaoSalvar() {
  const texto = document.getElementById('txt-btn-joguei-jogo');
  const botao = texto?.closest('button');
  if (!botao) return;

  botao.removeAttribute('onclick');
  botao.classList.add('fluxo-btn-principal');
  botao.innerHTML = '<span id="txt-btn-joguei-jogo">Salvar este jogo</span>';
  let salvo = false;

  botao.addEventListener('click', () => {
    if (salvo) {
      mudarAba('carteira');
      return;
    }
    const salvar = () => {
      const antes = carteiraJogos.length;
      marcarComoJogadoProximoConcurso();
      if (carteiraJogos.length > antes) {
        salvo = true;
        document.getElementById('txt-btn-joguei-jogo').textContent = '✓ Salvo. Ver meus jogos';
      }
    };
    window.salvarDepoisDoCadastro?.(salvar);
    salvar();
  });

  const display = document.getElementById('display-meu-jogo');
  new MutationObserver(() => {
    salvo = false;
    const rotulo = document.getElementById('txt-btn-joguei-jogo');
    if (rotulo) rotulo.textContent = 'Salvar este jogo';
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
  card.classList.add('fluxo-card-volante');

  const gaveta = criarGaveta('Escolher minhas dezenas', 'fluxo-gaveta-volante');
  card.before(gaveta);
  gaveta.appendChild(card);

  // Jogo atual fixo no topo enquanto a pessoa marca as dezenas.
  const espelho = document.createElement('div');
  espelho.id = 'fluxo-espelho-jogo';
  card.prepend(espelho);
  const display = document.getElementById('display-meu-jogo');
  const copiar = () => { espelho.innerHTML = display.innerHTML; };
  new MutationObserver(copiar).observe(display, { childList: true, subtree: true });
  copiar();

  document.getElementById('chk-destaque-subgrid')?.closest('label')?.classList.add('hidden');
  const chk = document.getElementById('chk-destaque-subgrid');
  if (chk) chk.checked = false;
  if (typeof volanteModo10Colunas !== 'undefined') volanteModo10Colunas = true;
  grade.classList.add('classic-10x6');
  [...card.querySelectorAll('p, div')].find((el) => !el.children.length && el.textContent.trim().startsWith('Dica:'))?.classList.add('hidden');
  const rotuloWhats = document.getElementById('txt-whatsapp-botao');
  if (rotuloWhats) new MutationObserver(() => {
    if (rotuloWhats.textContent !== 'Enviar no WhatsApp') rotuloWhats.textContent = 'Enviar no WhatsApp';
  }).observe(rotuloWhats, { childList: true, characterData: true, subtree: true });
  if (rotuloWhats) rotuloWhats.textContent = 'Enviar no WhatsApp';

  // Limpar a seleção pertence à escolha manual das dezenas.
  const limparJogo = document.querySelector('.fluxo-card-jogo button[onclick^="limparSelecao"]');
  if (limparJogo) {
    limparJogo.className = 'fluxo-link';
    limparJogo.textContent = 'Limpar dezenas marcadas';
    grade.after(limparJogo);
  }

  // "Limpar" só existe quando há regra para limpar.
  const limpar = card.querySelector('button[onclick^="limparFixosEProibidos"]');
  const painel = document.getElementById('painel-regras-ativas');
  if (limpar && painel) {
    limpar.className = 'fluxo-link';
    limpar.textContent = 'Limpar fixas e proibidas';
    painel.after(limpar);
    const atualizar = () => {
      const temRegra = (typeof getFixos === 'function' && getFixos().length > 0)
        || (typeof getProibidos === 'function' && getProibidos().length > 0);
      limpar.hidden = !temRegra;
    };
    new MutationObserver(atualizar).observe(grade, { childList: true });
    atualizar();
  }

  if (typeof renderizarVolante === 'function') renderizarVolante();
}

function montarIndicadores() {
  const blocos = ['card-matriz-4x4-box', 'painel-score-telemetria', 'card-bateria-testes']
    .map((id) => document.getElementById(id)).filter(Boolean);
  if (!blocos.length || document.getElementById('fluxo-gaveta-indicadores')) return;

  const gaveta = criarGaveta('Ver indicadores do jogo', 'fluxo-gaveta-indicadores');
  blocos[0].before(gaveta);
  blocos.forEach((bloco) => gaveta.appendChild(bloco));
  document.getElementById('card-sugestao-troca')?.classList.add('hidden');
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

function iniciarFluxoJogo() {
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
  ligarRevisao();
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
  window.mudarAba = function (aba, ...resto) {
    const retorno = original.call(this, aba, ...resto);
    window.scrollTo(0, 0);
    if (!vindoDoHistorico && history.state?.aba !== aba) history.pushState({ aba }, '');
    return retorno;
  };

  const fecharAberto = () => {
    const folha = document.querySelector('.folha-fundo');
    if (folha) { folha.remove(); return true; }
    const modal = [...document.querySelectorAll('.fixed.inset-0')]
      .find((m) => !m.dataset.obrigatorio && !m.classList.contains('hidden') && getComputedStyle(m).display !== 'none');
    if (!modal) return false;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    return true;
  };

  history.replaceState({ aba: 'inicio' }, '');
  window.addEventListener('popstate', (evento) => {
    if (fecharAberto()) {
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
    gaveta.querySelector('summary').after(tabela);
    gaveta.querySelector('summary').textContent = 'Ver chances e indicadores';
  }
  const display = document.getElementById('display-meu-jogo');
  if (display) new MutationObserver(() => window.renderizarRevisaoDoJogo?.()).observe(display, { childList: true });
  window.renderizarRevisaoDoJogo?.();
  window.renderizarGastos?.();
}
