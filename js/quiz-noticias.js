// ===================================================================
// QUIZ DIÁRIO, TOKENS E NOTÍCIAS DE LOTERIAS (LotoLab)
// ===================================================================
// Aumenta a retenção diária sem prometer prêmios: curiosidades reais,
// matemática das loterias do Brasil e do mundo e ponte com @lotolab.app.

const QUIZ_STORAGE_KEY = 'lotolab_quiz_tokens_v1';

const QUIZ_PERGUNTAS = [
  {
    id: 'q1',
    categoria: 'Mega-Sena',
    pergunta: 'Quantas combinações simples de 6 dezenas existem na Mega-Sena?',
    opcoes: ['10.500.200', '50.063.860', '120.000.000', '3.268.760'],
    correta: 1,
    explicacao: 'São exatamente 50.063.860 combinações possíveis de 6 números entre 60.'
  },
  {
    id: 'q2',
    categoria: 'Lotofácil',
    pergunta: 'Quantas combinações possíveis de 15 dezenas existem na Lotofácil?',
    opcoes: ['3.268.760', '50.063.860', '1.250.000', '8.500.000'],
    correta: 0,
    explicacao: 'A Lotofácil tem 3.268.760 combinações simples de 15 dezenas entre 25.'
  },
  {
    id: 'q3',
    categoria: 'Brasil',
    pergunta: 'Qual é o estado brasileiro que mais acumulou ganhadores na faixa principal da Mega-Sena historicamente?',
    opcoes: ['Rio de Janeiro', 'Minas Gerais', 'São Paulo', 'Bahia'],
    correta: 2,
    explicacao: 'São Paulo lidera com folga em número de apostas premiadas, também por concentrar o maior volume de apostas do país.'
  },
  {
    id: 'q4',
    categoria: 'Mundo',
    pergunta: 'Qual loteria dos Estados Unidos já pagou um prêmio recorde acima de US$ 2 bilhões?',
    opcoes: ['EuroMillions', 'Powerball', 'El Gordo', 'SuperEnalotto'],
    correta: 1,
    explicacao: 'A Powerball americana detém o maior prêmio individual da história mundial das loterias (US$ 2,04 bilhões em 2022).'
  },
  {
    id: 'q5',
    categoria: 'Matemática',
    pergunta: 'Na Mega-Sena, marcar 7 dezenas no mesmo volante equivale a quantas apostas simples?',
    opcoes: ['2 apostas', '7 apostas', '14 apostas', '21 apostas'],
    correta: 1,
    explicacao: 'Um jogo de 7 dezenas cobre exatamente 7 combinações simples de 6 números (C(7,6) = 7).'
  },
  {
    id: 'q6',
    categoria: 'Mitos',
    pergunta: 'A sequência 01-02-03-04-05-06 tem menos chance de ser sorteada do que outros números?',
    opcoes: ['Sim, é impossível sair', 'Não, a chance é exatamente a mesma', 'Só sai em dezembro', 'Tem metade da chance'],
    correta: 1,
    explicacao: 'Cada combinação simples tem exatamente 1 em 50.063.860 de chance. A diferença é que muita gente joga sequências populares e dividiria o prêmio.'
  },
  {
    id: 'q7',
    categoria: 'Mega da Virada',
    pergunta: 'Qual é a principal regra diferente da Mega da Virada em relação aos concursos regulares?',
    opcoes: ['Tem 70 números', 'O prêmio principal não acumula', 'Só vale para bolão', 'É sorteada em janeiro'],
    correta: 1,
    explicacao: 'Na Mega da Virada, se ninguém acertar as 6 dezenas, o prêmio principal é dividido entre quem acertou a Quina (5 dezenas).'
  },
  {
    id: 'q8',
    categoria: 'Europa',
    pergunta: 'Qual é o nome da famosa loteria transnacional da Europa jogada em 9 países?',
    opcoes: ['Loto Europa', 'EuroMillions', 'Mega Europa', 'EuroJack'],
    correta: 1,
    explicacao: 'A EuroMillions reúne 9 países europeus (como França, Espanha, Reino Unido e Portugal) com sorteios às terças e sextas.'
  },
  {
    id: 'q9',
    categoria: 'Lotofácil',
    pergunta: 'Quantas cotas no máximo um Bolão oficial da CAIXA aceita na Lotofácil de 15 números?',
    opcoes: ['Até 7 cotas', 'Até 50 cotas', 'Até 100 cotas', 'Sem limite'],
    correta: 0,
    explicacao: 'Pelas regras oficiais da CAIXA, um bolão de Lotofácil com 15 dezenas aceita de 2 a 7 cotas.'
  },
  {
    id: 'q10',
    categoria: 'Estatística',
    pergunta: 'Se uma dezena está há 40 concursos sem sair, a chance dela no próximo sorteio:',
    opcoes: ['Aumenta muito', 'Dobra automaticamente', 'Continua exatamente igual', 'Fica garantida'],
    correta: 2,
    explicacao: 'Cada sorteio é um evento independente: as bolas não têm memória dos concursos anteriores.'
  }
];

const LOTOLAB_NOTICIAS = [
  {
    tag: 'BRASIL',
    titulo: 'Mega da Virada 2026: organize seu planejamento separado',
    resumo: 'No LotoLab você marca "Planejar para a Mega da Virada 2026" na tela Gerar e mantém seus palpites separados dos concursos normais.'
  },
  {
    tag: 'MUNDO',
    titulo: 'Powerball x Mega-Sena: por que os prêmios nos EUA passam de US$ 1 bi?',
    resumo: 'Nos EUA, a chance da Powerball é de 1 em 292 milhões (quase 6x mais difícil que a Mega-Sena), o que faz o prêmio acumular por meses.'
  },
  {
    tag: 'DICA DE BOLÃO',
    titulo: 'Bolão com amigos sem dor de cabeça no WhatsApp',
    resumo: 'Use a aba Bolão na tela Gerar para dividir cotas pelas regras da CAIXA, marcar quem já pagou e enviar o resumo pronto para o grupo.'
  }
];

function lerEstadoQuiz() {
  try {
    const bruto = JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY) || '{}');
    return {
      tokens: Number(bruto.tokens) || 0,
      respondidas: bruto.respondidas && typeof bruto.respondidas === 'object' ? bruto.respondidas : {}
    };
  } catch {
    return { tokens: 0, respondidas: {} };
  }
}

function salvarEstadoQuiz(estado) {
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(estado));
  } catch {}
}

function perguntaDoDiaIndex() {
  const hoje = new Date();
  const diaAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 86400000);
  return diaAno % QUIZ_PERGUNTAS.length;
}

function renderizarCardQuizENoticias() {
  const homeView = document.getElementById('view-home');
  if (!homeView) return;

  let container = document.getElementById('lotolab-quiz-noticias');
  if (!container) {
    container = document.createElement('section');
    container.id = 'lotolab-quiz-noticias';
    container.className = 'mt-4 space-y-4';
    homeView.appendChild(container);
  }

  const estado = lerEstadoQuiz();
  const idxAtual = Number(window.__lotolabQuizIdx ?? perguntaDoDiaIndex()) % QUIZ_PERGUNTAS.length;
  const q = QUIZ_PERGUNTAS[idxAtual];
  const respUsuario = estado.respondidas[q.id];
  const jaRespondeu = typeof respUsuario === 'number';
  const acertou = jaRespondeu && respUsuario === q.correta;

  container.innerHTML = `
    <div class="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-4 sm:p-5 space-y-3 shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            🧪 Quiz LotoLab · ${q.categoria}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30" id="lotolab-tokens-badge">
            🪙 ${estado.tokens} Tokens
          </span>
          <button type="button" id="btn-quiz-proxima" class="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
            Próxima →
          </button>
        </div>
      </div>

      <h3 class="text-sm sm:text-base font-extrabold text-white leading-snug">${q.pergunta}</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${q.opcoes.map((op, i) => {
          let cls = 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-200';
          if (jaRespondeu) {
            if (i === q.correta) cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black';
            else if (i === respUsuario) cls = 'bg-rose-500/20 border-rose-400 text-rose-300';
            else cls = 'bg-slate-950/40 border-slate-800 text-slate-500';
          }
          return `<button type="button" data-quiz-opcao="${i}" ${jaRespondeu ? 'disabled' : ''} class="text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition ${cls}">${op}</button>`;
        }).join('')}
      </div>

      ${jaRespondeu ? `
        <div class="rounded-2xl p-3 text-xs leading-relaxed ${acertou ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200' : 'bg-slate-950/70 border border-slate-700 text-slate-300'}">
          <strong>${acertou ? '✅ Resposta certa (+10 Tokens)!' : 'ℹ️ Quase lá!'}</strong> ${q.explicacao}
        </div>
      ` : `
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
          <span>Acerte e ganhe <strong>+10 Tokens</strong> no LotoLab.</span>
          <a href="https://www.instagram.com/lotolab.app/" target="_blank" rel="noopener" class="text-emerald-400 hover:underline font-bold">
            💡 Ver dica no @lotolab.app →
          </a>
        </div>
      `}
    </div>

    <div class="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-black tracking-wider uppercase text-cyan-400">📰 Radar & Curiosidades LotoLab</span>
        <a href="https://www.instagram.com/lotolab.app/" target="_blank" rel="noopener" class="text-[11px] font-bold text-emerald-400 hover:underline">@lotolab.app</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        ${LOTOLAB_NOTICIAS.map((n) => `
          <article class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-1.5">
            <span class="inline-block text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">${n.tag}</span>
            <h4 class="text-xs font-bold text-white leading-snug">${n.titulo}</h4>
            <p class="text-[11px] text-slate-400 leading-relaxed">${n.resumo}</p>
          </article>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-quiz-opcao]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const escolhida = Number(btn.dataset.quizOpcao);
      const atual = lerEstadoQuiz();
      if (typeof atual.respondidas[q.id] === 'number') return;
      atual.respondidas[q.id] = escolhida;
      if (escolhida === q.correta) atual.tokens += 10;
      salvarEstadoQuiz(atual);
      if (typeof toast === 'function') {
        toast(escolhida === q.correta ? 'Você acertou e ganhou +10 Tokens!' : 'Resposta registrada! Veja a explicação.', escolhida === q.correta ? '🪙' : '🧪');
      }
      renderizarCardQuizENoticias();
    });
  });

  container.querySelector('#btn-quiz-proxima')?.addEventListener('click', () => {
    window.__lotolabQuizIdx = (idxAtual + 1) % QUIZ_PERGUNTAS.length;
    renderizarCardQuizENoticias();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderizarCardQuizENoticias, 450);
  });
}
window.renderizarCardQuizENoticias = renderizarCardQuizENoticias;
