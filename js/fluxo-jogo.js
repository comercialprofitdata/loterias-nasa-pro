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
    const antes = carteiraJogos.length;
    marcarComoJogadoProximoConcurso();
    if (carteiraJogos.length > antes) {
      salvo = true;
      document.getElementById('txt-btn-joguei-jogo').textContent = '✓ Salvo. Ver meus jogos';
    }
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
function ajustarCarteira() {
  const lista = document.getElementById('total-bilhetes-salvos');
  const tela = document.getElementById('carteira-subview-bilhetes');
  if (!lista || !tela) return;
  const vazia = !carteiraJogos.length;
  [...tela.children].forEach((bloco) => {
    if (!bloco.contains(lista)) bloco.classList.toggle('hidden', vazia);
  });
  tela.classList.toggle('fluxo-carteira-vazia', vazia);
}

function iniciarFluxoJogo() {
  if (typeof setQtdJogosParaGerar === 'function') setQtdJogosParaGerar(1);
  [...document.querySelectorAll('#carteira-subview-bilhetes button')]
    .find((b) => b.textContent.includes('Mandar pelo WhatsApp'))?.closest('.rounded-2xl, .rounded-3xl')?.remove();
  const atualizar = window.atualizarPainelCarteira;
  if (typeof atualizar === 'function') {
    window.atualizarPainelCarteira = function (...args) {
      const retorno = atualizar.apply(this, args);
      ajustarCarteira();
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

// Salvar não exige conta: fica no aparelho, e a conta é oferecida depois.
window.exigirLeadAntesDeSalvar = () => true;

document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarFluxoJogo, 0));
