// ===================================================================
// TELA GERAR: abas Jogo | Bolão e notas explicativas dos indicadores
// ===================================================================

// O que cada indicador olha e por que está na tela. O aviso de que nada
// disso muda a chance de ganhar aparece uma vez só, no fim da nota.
const NOTAS_INDICADORES = [
  {
    titulo: 'Sequências e finais iguais',
    texto: 'Olha se há 3 ou mais dezenas seguidas (como 14, 15, 16) ou 3 com o mesmo final (como 07, 27, 47). A maioria das combinações possíveis não tem isso. Jogos assim formam desenhos no volante que mais gente costuma marcar.'
  },
  {
    titulo: 'Espalhamento no volante',
    texto: 'Olha em quantas linhas e colunas do volante as suas dezenas caem. Mostra se o jogo ficou concentrado em poucas linhas.'
  },
  {
    titulo: 'Dezenas por linha',
    texto: 'Conta quantas dezenas ficaram em cada linha do volante. Avisa quando 4 ou mais caem na mesma linha, ou quando o jogo ocupa só duas linhas.'
  },
  {
    titulo: 'Pares, ímpares e primos',
    texto: 'Conta quantas dezenas são pares, ímpares e primas. Avisa quando todas são pares, todas são ímpares ou nenhuma é prima, o que é pouco comum entre as combinações possíveis.'
  },
  {
    titulo: 'Soma das dezenas',
    texto: 'Soma as dezenas do jogo. Avisa quando o total fica muito abaixo ou muito acima do que a maior parte das combinações soma. Num jogo de 6 dezenas, a faixa comum vai de 119 a 247.'
  },
  {
    titulo: 'Quadrantes',
    texto: 'Conta quantas dezenas caem em cada quarto do volante (Q1 a Q4, as quatro cores). Avisa quando 4 ou mais ficam no mesmo quarto.'
  }
];
const NOTA_LOTOFACIL = 'Na Lotofácil estes indicadores são só informativos: mostram como as suas dezenas se dividem entre a moldura (as 16 da borda do volante) e o miolo (as 9 do centro), além de pares, ímpares e soma.';
const AVISO_INDICADORES = 'Isto só descreve o seu jogo. Não muda a chance de ganhar: toda combinação tem a mesma chance.';

function abrirNotaIndicador(numero) {
  const nota = NOTAS_INDICADORES[numero - 1];
  if (!nota) return;
  const lotofacil = typeof modalidadeAtual !== 'undefined' && modalidadeAtual === 'lotofacil';
  const valor = document.getElementById(`val-t${numero}`)?.textContent.trim();
  const selo = document.getElementById(`badge-status-t${numero}`)?.textContent.trim();

  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  const folha = document.createElement('div');
  folha.className = 'folha';
  const titulo = document.createElement('h2');
  titulo.textContent = lotofacil ? 'Indicadores da Lotofácil' : nota.titulo;
  const texto = document.createElement('p');
  texto.textContent = lotofacil ? NOTA_LOTOFACIL : nota.texto;
  const neste = document.createElement('p');
  neste.textContent = valor && valor !== '-' ? `Neste jogo: ${valor}${selo ? ` (${selo.toLowerCase()})` : ''}.` : '';
  const aviso = document.createElement('p');
  aviso.textContent = AVISO_INDICADORES;
  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.textContent = 'Entendi';
  folha.append(titulo, texto, neste, aviso, fechar);
  fundo.append(folha);
  document.body.appendChild(fundo);
  fechar.addEventListener('click', () => fundo.remove());
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fundo.remove(); });
}
window.abrirNotaIndicador = abrirNotaIndicador;

// ===================================================================
// MÊS DA SORTE (DIA DE SORTE) — Seletor automático na tela Gerar
// ===================================================================
const MESES_DA_SORTE = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
window.mesDaSorteAtual = MESES_DA_SORTE[new Date().getMonth()];

function atualizarSeletorMesDaSorte() {
  const mod = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const ancora = document.getElementById('select-qtd-dezenas')?.closest('div') || document.getElementById('display-meu-jogo');
  if (!ancora) return;
  let box = document.getElementById('lotolab-mes-da-sorte-box');
  if (mod !== 'diadesorte') {
    if (box) box.style.display = 'none';
    return;
  }
  if (!box) {
    box = document.createElement('div');
    box.id = 'lotolab-mes-da-sorte-box';
    box.className = 'mt-3 p-3 rounded-2xl border border-amber-500/35 bg-amber-950/20 flex items-center justify-between gap-2 flex-wrap';
    box.innerHTML = `
      <label for="select-mes-sorte" class="text-xs font-extrabold text-amber-300">🗓️ Mês da Sorte</label>
      <div class="flex items-center gap-2">
        <select id="select-mes-sorte" class="rounded-xl bg-slate-950 border border-amber-500/40 text-xs font-bold text-white px-2.5 py-1.5">
          ${MESES_DA_SORTE.map((m) => `<option value="${m}" ${m === window.mesDaSorteAtual ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <button type="button" id="btn-sortear-mes-sorte" class="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px]">🎲 Sortear</button>
      </div>
    `;
    ancora.after(box);
    box.querySelector('#select-mes-sorte')?.addEventListener('change', (e) => {
      window.mesDaSorteAtual = e.target.value;
    });
    box.querySelector('#btn-sortear-mes-sorte')?.addEventListener('click', () => {
      const idx = Math.floor(Math.random() * MESES_DA_SORTE.length);
      window.mesDaSorteAtual = MESES_DA_SORTE[idx];
      const sel = document.getElementById('select-mes-sorte');
      if (sel) sel.value = window.mesDaSorteAtual;
    });
  }
  box.style.display = 'flex';
}
window.atualizarSeletorMesDaSorte = atualizarSeletorMesDaSorte;

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      atualizarSeletorMesDaSorte();
      const origTrocar = window.trocarModalidade;
      if (typeof origTrocar === 'function') {
        window.trocarModalidade = function (...args) {
          const r = origTrocar.apply(this, args);
          setTimeout(atualizarSeletorMesDaSorte, 30);
          return r;
        };
      }
    }, 350);
  });
}

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    const folhas = document.querySelectorAll('.folha-fundo');
    folhas[folhas.length - 1]?.remove();
    return;
  }
  const card = evento.target.closest?.('[id^="teste-card-"]');
  if (card && (evento.key === 'Enter' || evento.key === ' ')) {
    evento.preventDefault();
    abrirNotaIndicador(Number(card.id.replace('teste-card-', '')));
  }
});

// Tocar num indicador abre a nota. Indicador travado do plano grátis segue abrindo os planos.
document.addEventListener('click', (evento) => {
  const card = evento.target.closest?.('[id^="teste-card-"]');
  if (!card || evento.target.closest('.science-lock-overlay')) return;
  abrirNotaIndicador(Number(card.id.replace('teste-card-', '')));
});

function alternarAbaGerar(aba) {
  const bolao = aba === 'bolao';
  document.getElementById('gerar-painel-jogo')?.classList.toggle('hidden', bolao);
  document.getElementById('gerar-painel-bolao')?.classList.toggle('hidden', !bolao);
  document.getElementById('gerar-aba-jogo')?.classList.toggle('ativa', !bolao);
  document.getElementById('gerar-aba-bolao')?.classList.toggle('ativa', bolao);
  document.getElementById('gerar-aba-jogo')?.setAttribute('aria-selected', String(!bolao));
  document.getElementById('gerar-aba-bolao')?.setAttribute('aria-selected', String(bolao));
  if (bolao) window.renderizarBolao?.();
}
window.alternarAbaGerar = alternarAbaGerar;

let abrindoBolao = false;
function abrirBolaoNoGerar() {
  abrindoBolao = true;
  try {
    if (typeof mudarAba === 'function') mudarAba('volante');
  } finally {
    abrindoBolao = false;
  }
  alternarAbaGerar('bolao');
  window.scrollTo(0, 0);
}
window.abrirBolaoNoGerar = abrirBolaoNoGerar;

// O bolão saiu da Carteira: os atalhos antigos passam a abrir Gerar > Bolão.
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  document.getElementById('seg-cart-bolao')?.classList.add('hidden');
  const mudarAbaAnterior = window.mudarAba;
  if (typeof mudarAbaAnterior === 'function') {
    window.mudarAba = function (aba, ...resto) {
      const retorno = mudarAbaAnterior.call(this, aba, ...resto);
      if (aba === 'volante' && !abrindoBolao) alternarAbaGerar('jogo');
      return retorno;
    };
  }
  // Indicadores tocáveis também pelo teclado e pelo leitor de tela.
  document.querySelectorAll('[id^="teste-card-"]').forEach((card) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Entender o indicador ${card.id.replace('teste-card-', '')}`);
  });
  const alternarCarteira = window.alternarSubAbaCarteira;
  if (typeof alternarCarteira === 'function') {
    window.alternarSubAbaCarteira = function (modo, ...resto) {
      if (modo === 'bolao') return abrirBolaoNoGerar();
      return alternarCarteira.call(this, modo, ...resto);
    };
  }
}, 0));
