// ===================================================================
// ESCOLHER -> AGUARDAR -> REVELAR
// ===================================================================
// A Início mostra o que espera a pessoa. O resultado de cada jogo conferido
// é revelado dezena a dezena, com o mesmo cuidado se houve prêmio ou não.

function bilhetesParaRevelar() {
  return (Array.isArray(carteiraJogos) ? carteiraJogos : [])
    .filter((b) => b.conferido && !b.revelado && (b.dezenasSorteadas || []).length);
}

function bilhetesAguardando() {
  return (Array.isArray(carteiraJogos) ? carteiraJogos : [])
    .filter((b) => !b.conferido && !window.concursoOuDataEhPassado?.(b.concursoAlvo, b.data, b.modalidade));
}

function renderizarNaProxima() {
  const containerHero = document.querySelector('.nasa-jackpot-hero');
  if (!containerHero) return;
  let cartao = document.getElementById('cartao-na-proxima');
  const revelar = bilhetesParaRevelar();
  const aguardando = bilhetesAguardando();
  if (!revelar.length && !aguardando.length) {
    cartao?.remove();
    return;
  }
  if (!cartao) {
    cartao = document.createElement('div');
    cartao.id = 'cartao-na-proxima';
    cartao.className = 'gastos-painel';
    containerHero.after(cartao);
  }

  if (revelar.length) {
    cartao.innerHTML = `
      <div class="gastos-topo">
        <div><span class="gastos-rotulo">Resultado disponível</span><strong>${revelar.length} ${revelar.length === 1 ? 'jogo' : 'jogos'} para ver</strong></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" class="ritual-ver" onclick="revelarProximoResultado()">Ver resultado</button>
          <button type="button" class="gastos-editar" onclick="typeof irParaCarteiraSubAba === 'function' ? irParaCarteiraSubAba('bilhetes') : mudarAba('carteira')">Ver carteira</button>
        </div>
      </div>`;
    return;
  }

  const primeiro = aguardando[0];
  const mesmoConcurso = aguardando.filter((b) => b.concursoAlvo === primeiro.concursoAlvo && b.modalidade === primeiro.modalidade).length;
  const jogo = primeiro.modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena';
  cartao.innerHTML = `
    <div class="gastos-topo">
      <div>
        <span class="gastos-rotulo">Na próxima</span>
        <strong>${mesmoConcurso} ${mesmoConcurso === 1 ? 'jogo' : 'jogos'}</strong>
        <p class="gastos-nota">${jogo} ${String(primeiro.concursoAlvo || '')}${primeiro.data ? ` • ${primeiro.data}` : ''}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="button" class="ritual-ver" onclick="typeof conferirTodosBilhetesSalvos === 'function' ? conferirTodosBilhetesSalvos() : null">Conferir</button>
        <button type="button" class="gastos-editar" onclick="typeof irParaCarteiraSubAba === 'function' ? irParaCarteiraSubAba('bilhetes') : mudarAba('carteira')">Ver carteira</button>
      </div>
    </div>`;
}

function revelarProximoResultado() {
  const bilhete = bilhetesParaRevelar()[0];
  if (!bilhete) return;

  const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sorteadas = bilhete.dezenasSorteadas.map(Number);
  const jogadas = (bilhete.dezenas || []).map(Number);
  const texto = (d) => String(d).padStart(2, '0');
  const tela = document.createElement('div');
  tela.className = 'folha-fundo ritual-tela';
  tela.setAttribute('role', 'dialog');
  tela.setAttribute('aria-modal', 'true');
  tela.innerHTML = `
    <div class="ritual-conteudo">
      <p class="gastos-rotulo">${bilhete.modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena'} • concurso ${texto(bilhete.concursoConferido || String(bilhete.concursoAlvo || '').replace(/\D/g, ''))}</p>
      <h2>Dezenas sorteadas</h2>
      <div class="ritual-bolas" id="ritual-sorteadas"></div>
      <h3>Seu jogo</h3>
      <div class="ritual-bolas ritual-jogo">${jogadas.map((d) => `<span data-dezena="${d}">${texto(d)}</span>`).join('')}</div>
      <div id="ritual-desfecho" aria-live="polite"></div>
      <button type="button" id="ritual-acao">Pular</button>
    </div>`;
  document.body.appendChild(tela);

  const areaSorteadas = tela.querySelector('#ritual-sorteadas');
  const botao = tela.querySelector('#ritual-acao');
  let indice = 0;
  let timer = null;

  const mostrarDezena = (dezena) => {
    const bola = document.createElement('span');
    bola.textContent = texto(dezena);
    areaSorteadas.appendChild(bola);
    tela.querySelector(`.ritual-jogo [data-dezena="${dezena}"]`)?.classList.add('acertou');
  };

  const concluir = () => {
    clearInterval(timer);
    while (indice < sorteadas.length) mostrarDezena(sorteadas[indice++]);
    const acertos = jogadas.filter((d) => sorteadas.includes(d)).length;
    const premio = Number(bilhete.premioGanho || 0);
    tela.querySelector('#ritual-desfecho').innerHTML = premio > 0
      ? `<strong>${acertos} acertos. Prêmio de ${formatarBRL(premio)}</strong><p class="gastos-nota">Confirme o valor e o resgate nos canais oficiais da Caixa.</p>`
      : `<strong>${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}</strong><p class="gastos-nota">Não foi desta vez. Seu jogo já está conferido.</p>`;
    bilhete.revelado = true;
    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    botao.textContent = bilhetesParaRevelar().length ? 'Ver próximo' : 'Fechar';
    botao.onclick = () => {
      tela.remove();
      renderizarNaProxima();
      revelarProximoResultado();
    };
  };

  botao.onclick = concluir;
  if (reduzir) {
    concluir();
    return;
  }
  timer = setInterval(() => {
    mostrarDezena(sorteadas[indice++]);
    if (indice >= sorteadas.length) concluir();
  }, sorteadas.length > 6 ? 250 : 650);
}
window.revelarProximoResultado = revelarProximoResultado;

const renderizarGastosBase = window.renderizarGastos;
window.renderizarGastos = function () {
  renderizarGastosBase();
  renderizarNaProxima();
};
