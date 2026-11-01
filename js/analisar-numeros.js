// ===================================================================
// CAMINHO A — "Já tenho meus números" (Mobile-First Polish)
// ===================================================================

function abrirModalAnalisarNumeros() {
  const modalExistente = document.getElementById('modal-analisar-numeros');
  if (modalExistente) {
    modalExistente.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'modal-analisar-numeros';
  modal.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-cyan-800/60 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl relative font-sans">
      <!-- Top Bar -->
      <div class="flex items-center justify-between pb-1 border-b border-slate-800">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300">
          <span>🔬</span> DIAGNÓSTICO PRÓPRIO
        </div>
        <button type="button" onclick="fecharModalAnalisarNumeros()" class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition">✕</button>
      </div>

      <div class="text-left space-y-1">
        <h2 class="text-base font-black text-white">Já Tenho Meus Números</h2>
        <p class="text-xs text-slate-300 leading-relaxed">
          Cole ou digite suas dezenas para ver os indicadores do jogo.
        </p>
      </div>

      <div class="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
        <span class="text-sm">🔒</span>
        <span>100% privado — a análise roda localmente no seu aparelho.</span>
      </div>

      <div>
        <label for="input-analisar-numeros" class="text-[10px] uppercase font-bold text-slate-400 block mb-1">
          Números (separados por espaço, vírgula ou hífen)
        </label>
        <textarea id="input-analisar-numeros" rows="3" placeholder="Ex: 04 12 23 31 45 58"
                  class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-sm"></textarea>
        <p id="analisar-numeros-contagem" class="text-[11px] text-slate-400 mt-1">
          Digite 6 dezenas (Mega) ou 15 (Lotofácil).
        </p>
      </div>

      <button type="button" id="btn-analisar-numeros-confirmar"
              class="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
        <span>🔬</span> Analisar Meus Números
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const textarea = document.getElementById('input-analisar-numeros');
  const contagem = document.getElementById('analisar-numeros-contagem');

  textarea.addEventListener('input', () => {
    const dezenas = extrairDezenasDoTexto(textarea.value);
    if (dezenas.length === 0) {
      contagem.innerText = 'Digite 6 dezenas (Mega) ou 15 (Lotofácil).';
      contagem.className = 'text-[11px] text-slate-400 mt-1';
    } else {
      const valido = dezenas.length === 6 || dezenas.length === 15;
      contagem.innerText = `${dezenas.length} dezena${dezenas.length > 1 ? 's' : ''} reconhecida${dezenas.length > 1 ? 's' : ''}${valido ? ' ✓' : ' — precisa ser 6 ou 15'}`;
      contagem.className = valido
        ? 'text-[11px] text-emerald-400 mt-1 font-bold'
        : 'text-[11px] text-amber-400 mt-1';
    }
  });

  document
    .getElementById('btn-analisar-numeros-confirmar')
    .addEventListener('click', confirmarAnaliseDeNumeros);

  textarea.focus();
}

function fecharModalAnalisarNumeros() {
  document.getElementById('modal-analisar-numeros')?.remove();
}

/** Mesma regra de importarBilheteTexto(): números 1-60, únicos, em ordem. */
function extrairDezenasDoTexto(texto) {
  const nums = String(texto || '').match(/\d+/g);
  if (!nums) return [];
  return Array.from(new Set(nums.map(Number)))
    .filter((n) => n >= 1 && n <= 60)
    .sort((a, b) => a - b);
}

function confirmarAnaliseDeNumeros() {
  const textarea = document.getElementById('input-analisar-numeros');
  const dezenas = extrairDezenasDoTexto(textarea?.value);

  if (dezenas.length !== 6 && dezenas.length !== 15) {
    toast('Digite exatamente 6 dezenas (Mega-Sena) ou 15 (Lotofácil).', '⚠️');
    tocarBeep('alert');
    return;
  }

  const modalidade = dezenas.length === 15 ? 'lotofacil' : 'megasena';
  if (typeof modalidadeAtual !== 'undefined' && modalidadeAtual !== modalidade && typeof trocarModalidade === 'function') {
    trocarModalidade(modalidade);
  }

  setJogoAtual([...dezenas]);
  fecharModalAnalisarNumeros();

  if (typeof activateTab === 'function') activateTab('gerar');
  if (typeof alternarSubAbaGerar === 'function') alternarSubAbaGerar('testes');

  setTimeout(() => {
    if (typeof renderizarVolante === 'function') renderizarVolante();
    if (typeof atualizarDisplayJogo === 'function') atualizarDisplayJogo();
    if (typeof executarAnaliseDinamicaDoJogo === 'function') executarAnaliseDinamicaDoJogo();
    if (typeof executarAnaliseVitorio === 'function') executarAnaliseVitorio();
    tocarSomNasa('sucesso');
  }, 50);
}

console.log('🔬 Módulo Analisar Números carregado (Mobile-First Polish)');
