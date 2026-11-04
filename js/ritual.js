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
      <div class="flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <div class="truncate">
            <span class="text-xs font-bold text-white tracking-tight">Resultado disponível</span>
            <span class="ml-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-black">${txtJogos}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" class="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs font-mono shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1 ritual-ver" onclick="revelarProximoResultado()">
            Ver resultado
          </button>
          <button type="button" class="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs font-mono active:scale-95 transition" onclick="typeof irParaCarteiraSubAba === 'function' ? irParaCarteiraSubAba('bilhetes') : mudarAba('carteira')">
            Carteira
          </button>
        </div>
      </div>`;
    return;
  }

  const primeiro = aguardando[0];
  const mesmoConcurso = aguardando.filter((b) => b.concursoAlvo === primeiro.concursoAlvo && b.modalidade === primeiro.modalidade).length;
  const jogo = primeiro.modalidade === 'lotofacil' ? 'Lotofácil' : 'Mega-Sena';
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
