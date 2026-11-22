// ===================================================================
// ESCOLHER -> AGUARDAR -> REVELAR
// ===================================================================
// A Início mostra o que espera a pessoa. O resultado de cada jogo conferido
// é revelado dezena a dezena, com o mesmo cuidado se houve prêmio ou não.

function bilhetesParaRevelar() {
  const lista = (Array.isArray(window.carteiraJogos) && window.carteiraJogos.length)
    ? window.carteiraJogos
    : (Array.isArray(carteiraJogos) ? carteiraJogos : []);
  return lista.filter((b) => b.conferido && !b.revelado && (b.dezenasSorteadas || []).length);
}

function bilhetesAguardando() {
  const lista = (Array.isArray(window.carteiraJogos) && window.carteiraJogos.length)
    ? window.carteiraJogos
    : (Array.isArray(carteiraJogos) ? carteiraJogos : []);
  return lista.filter((b) => !b.conferido && !window.concursoOuDataEhPassado?.(b.concursoAlvo, b.data, b.modalidade));
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
    containerHero.after(cartao);
  }
  cartao.className = 'p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg font-sans';

  if (revelar.length) {
    const txtJogos = `${revelar.length} ${revelar.length === 1 ? 'jogo' : 'jogos'}`;
    cartao.innerHTML = `
      <div class="flex items-center justify-between gap-2.5 flex-wrap">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <div class="truncate">
            <span class="text-xs font-bold text-white tracking-tight">Resultado disponível</span>
            <span class="ml-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-black">${txtJogos}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" class="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1 ritual-ver" onclick="${revelar.length > 1 ? 'abrirResumoConferencia()' : 'revelarProximoResultado()'}">
            ${revelar.length > 1 ? 'Ver resumo' : 'Ver resultado'}
          </button>
          <button type="button" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs font-mono active:scale-95 transition" onclick="typeof irParaCarteiraSubAba === 'function' ? irParaCarteiraSubAba('bilhetes') : mudarAba('carteira')">
            Carteira
          </button>
        </div>
      </div>`;
    return;
  }

  const NOMES_MOD_RITUAL = { megasena: 'Mega-Sena', lotofacil: 'Lotofácil', quina: 'Quina', lotomania: 'Lotomania', diadesorte: 'Dia de Sorte' };
  const primeiro = aguardando[0];
  const mesmoConcurso = aguardando.filter((b) => b.concursoAlvo === primeiro.concursoAlvo && b.modalidade === primeiro.modalidade).length;
  const jogo = NOMES_MOD_RITUAL[primeiro.modalidade] || 'Mega-Sena';
  const txtAguardando = `${mesmoConcurso} ${mesmoConcurso === 1 ? 'jogo' : 'jogos'}`;

  cartao.className = 'p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-lg font-sans';
  cartao.innerHTML = `
    <div class="flex items-center justify-between gap-2.5">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
        <div class="truncate">
          <span class="text-xs font-bold text-white tracking-tight">Monitoramento</span>
          <span class="ml-1.5 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-black">${txtAguardando}</span>
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline ml-1">(${jogo})</span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button type="button" class="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-black text-xs font-mono active:scale-95 transition flex items-center gap-1 ritual-ver" onclick="typeof conferirTodosBilhetesSalvos === 'function' ? conferirTodosBilhetesSalvos() : null">
          ⚡ Conferir
        </button>
        <button type="button" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs font-mono active:scale-95 transition" onclick="typeof irParaCarteiraSubAba === 'function' ? irParaCarteiraSubAba('bilhetes') : mudarAba('carteira')">
          Carteira
        </button>
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
  const nomesMod = { megasena: 'Mega-Sena', lotofacil: 'Lotofácil', quina: 'Quina', lotomania: 'Lotomania', diadesorte: 'Dia de Sorte' };
  tela.innerHTML = `
    <div class="ritual-conteudo">
      <p class="gastos-rotulo">${nomesMod[bilhete.modalidade] || 'Mega-Sena'} • concurso ${texto(bilhete.concursoConferido || String(bilhete.concursoAlvo || '').replace(/\D/g, ''))}</p>
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
    const restantes = bilhetesParaRevelar().length;
    botao.textContent = restantes ? `Ver próximo (${restantes})` : 'Fechar';
    if (restantes > 1 && !tela.querySelector('#ritual-ver-resumo')) {
      const btnResumo = document.createElement('button');
      btnResumo.type = 'button';
      btnResumo.id = 'ritual-ver-resumo';
      btnResumo.className = 'fluxo-link';
      btnResumo.textContent = `Ver resumo consolidado de todos (${restantes + 1})`;
      btnResumo.onclick = () => {
        tela.remove();
        abrirResumoConferencia([bilhete, ...bilhetesParaRevelar()]);
      };
      botao.after(btnResumo);
    }
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

/** Resumo consolidado de todos os jogos conferidos de uma só vez (sem precisar clicar 1 a 1). */
function abrirResumoConferencia(listaCustom) {
  const lista = Array.isArray(listaCustom) && listaCustom.length ? listaCustom : bilhetesParaRevelar();
  if (!lista.length) return;
  const nomesMod = { megasena: 'Mega-Sena', lotofacil: 'Lotofácil', quina: 'Quina', lotomania: 'Lotomania', diadesorte: 'Dia de Sorte' };
  const escHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const totalPremio = lista.reduce((s, b) => s + (Number(b.premioGanho) || 0), 0);
  const premiados = lista.filter((b) => Number(b.premioGanho) > 0 || (b.status && !/Não premiado/i.test(b.status) && /SENA|QUINA|QUADRA|TERNO|DUQUE|PONTOS|ACERTOS|MÊS DA SORTE/i.test(b.status))).length;
  const brl = (v) => typeof formatarBRL === 'function' ? formatarBRL(v) : Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <div class="folha resumo-conferencia-folha">
      <h2>Resumo da conferência (${lista.length} ${lista.length === 1 ? 'jogo' : 'jogos'})</h2>
      <p>${premiados > 0
        ? `🎉 ${premiados} ${premiados === 1 ? 'jogo premiado' : 'jogos premiados'} · Total estimado: ${brl(totalPremio)}`
        : 'Todos os jogos abaixo foram conferidos contra o resultado oficial da CAIXA.'}</p>
      <div class="resumo-conf-lista">
        ${lista.map((b, i) => {
          const sorteadasSet = new Set((b.dezenasSorteadas || []).map(Number));
          const jogadas = (b.dezenas || []).map(Number);
          const acertos = jogadas.filter((d) => sorteadasSet.has(d)).length;
          const premio = Number(b.premioGanho || 0);
          return `
            <div class="resumo-conf-item ${premio > 0 ? 'premiado' : ''}">
              <div class="resumo-conf-topo">
                <strong>${escHtml(b.nome || `Jogo ${i + 1}`)} · ${escHtml(nomesMod[b.modalidade] || 'Loteria')}</strong>
                <span>${premio > 0 ? `🎉 ${brl(premio)}` : `${acertos} ${acertos === 1 ? 'acerto' : 'acertos'}`}</span>
              </div>
              <div class="resumo-conf-bolas">
                ${jogadas.map((d) => `<span class="${sorteadasSet.has(d) ? 'acertou' : ''}">${String(d).padStart(2, '0')}</span>`).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>
      <p>Confirme valores e prêmios sempre nos canais oficiais da CAIXA.</p>
      <button type="button" id="btn-fechar-resumo-conf">Marcar todos como vistos</button>
    </div>`;
  document.body.appendChild(fundo);

  const concluirResumo = () => {
    lista.forEach((b) => { b.revelado = true; });
    if (typeof salvarCarteiraStorage === 'function') salvarCarteiraStorage();
    fundo.remove();
    renderizarNaProxima();
  };
  fundo.querySelector('#btn-fechar-resumo-conf')?.addEventListener('click', concluirResumo);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) concluirResumo(); });
}
window.abrirResumoConferencia = abrirResumoConferencia;

const renderizarGastosBase = window.renderizarGastos;
window.renderizarGastos = function () {
  renderizarGastosBase();
  renderizarNaProxima();
};
