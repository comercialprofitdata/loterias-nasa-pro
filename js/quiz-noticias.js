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
    id: 'n1',
    tag: 'BRASIL',
    titulo: 'Mega da Virada 2026: organize seu planejamento separado',
    resumo: 'No LotoLab você marca "Planejar para a Mega da Virada 2026" na tela Gerar e mantém seus palpites separados dos concursos normais.',
    detalhe: 'A Mega da Virada tem regra própria: o prêmio principal não acumula. No LotoLab, você pode montar seus palpites e bolões marcados como planejamento da Virada 2026 sem misturar com os sorteios regulares de terça, quinta e sábado.',
    acaoTexto: 'Planejar na tela Gerar →',
    acaoAba: 'volante'
  },
  {
    id: 'n2',
    tag: 'MUNDO',
    titulo: 'Powerball x Mega-Sena: por que os prêmios nos EUA passam de US$ 1 bi?',
    resumo: 'Nos EUA, a chance da Powerball é de 1 em 292 milhões (quase 6x mais difícil que a Mega-Sena), o que faz o prêmio acumular por meses.',
    detalhe: 'Enquanto a Mega-Sena tem 50.063.860 combinações simples de 6 dezenas, a Powerball americana exige acertar 5 bolas de 69 + 1 Powerball de 26 (1 em 292.201.338). Quanto menor a probabilidade de acerto, mais concursos acumulam em sequência.',
    acaoTexto: 'Abrir Quiz de hoje →',
    acaoQuiz: true
  },
  {
    id: 'n3',
    tag: 'BOLÃO',
    titulo: 'Bolão com amigos sem dor de cabeça no WhatsApp',
    resumo: 'Use a aba Bolão na tela Gerar para dividir cotas pelas regras da CAIXA, marcar quem já pagou e enviar o resumo pronto para o grupo.',
    detalhe: 'Na aba Bolão do LotoLab você confere o valor mínimo oficial da CAIXA para Mega-Sena, Lotofácil e Quina, controla quem já pagou e ainda calcula automaticamente o prêmio por cota após o sorteio.',
    acaoTexto: 'Abrir aba Bolão →',
    acaoAba: 'bolao'
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

function abrirModalNoticiaLotoLab(noticiaId) {
  const n = LOTOLAB_NOTICIAS.find((item) => item.id === noticiaId);
  if (!n) return;
  try {
    const lidas = JSON.parse(localStorage.getItem('lotolab_noticias_lidas') || '[]');
    if (!lidas.includes(n.id)) {
      lidas.push(n.id);
      localStorage.setItem('lotolab_noticias_lidas', JSON.stringify(lidas));
    }
  } catch {}
  document.getElementById('modal-noticia-lotolab')?.remove();
  const modal = document.createElement('div');
  modal.id = 'modal-noticia-lotolab';
  modal.className = 'fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="max-w-md w-full rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 space-y-3 shadow-2xl">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">${n.tag}</span>
        <button type="button" onclick="this.closest('#modal-noticia-lotolab')?.remove()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">✕</button>
      </div>
      <h3 class="text-base font-black text-white leading-snug">${n.titulo}</h3>
      <p class="text-xs text-slate-300 leading-relaxed">${n.detalhe || n.resumo}</p>
      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" id="btn-noticia-acao" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs">${n.acaoTexto || 'Fechar'}</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  modal.querySelector('#btn-noticia-acao')?.addEventListener('click', () => {
    modal.remove();
    if (n.acaoQuiz) {
      document.getElementById('lotolab-quiz-noticias')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (n.acaoAba === 'bolao' && typeof window.irParaCarteiraSubAba === 'function') {
      window.activateTab?.('gerar');
    } else if (n.acaoAba && typeof window.activateTab === 'function') {
      window.activateTab('gerar');
    }
  });
  renderizarAvisosQuizENoticias();
}
window.abrirModalNoticiaLotoLab = abrirModalNoticiaLotoLab;

function renderizarAvisosQuizENoticias() {
  const homeView = document.getElementById('view-home');
  if (!homeView) return;
  const estado = lerEstadoQuiz();
  const qHoje = QUIZ_PERGUNTAS[perguntaDoDiaIndex()];
  const quizPendente = typeof estado.respondidas[qHoje.id] !== 'number';
  let lidas = [];
  try { lidas = JSON.parse(localStorage.getItem('lotolab_noticias_lidas') || '[]'); } catch {}
  const naoLidas = LOTOLAB_NOTICIAS.filter((n) => !lidas.includes(n.id)).length;

  let barra = document.getElementById('lotolab-avisos-topo');
  if (!quizPendente && naoLidas === 0) {
    barra?.remove();
    return;
  }
  if (!barra) {
    barra = document.createElement('div');
    barra.id = 'lotolab-avisos-topo';
    barra.className = 'mb-3 flex flex-wrap gap-2';
    homeView.insertBefore(barra, homeView.firstChild);
  }
  barra.innerHTML = `
    ${quizPendente ? `
      <button type="button" onclick="document.getElementById('lotolab-quiz-noticias')?.scrollIntoView({behavior:'smooth',block:'center'});" class="flex-1 min-w-[200px] px-3 py-2 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-left flex items-center justify-between gap-2 transition">
        <span class="text-xs font-bold text-emerald-200">🔔 Novo Quiz disponível (+10 Tokens)</span>
        <span class="text-[11px] font-black text-emerald-400 shrink-0">Responder →</span>
      </button>
    ` : ''}
    ${naoLidas > 0 ? `
      <button type="button" onclick="abrirModalNoticiaLotoLab('${LOTOLAB_NOTICIAS.find((n) => !lidas.includes(n.id))?.id || 'n1'}');" class="flex-1 min-w-[180px] px-3 py-2 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 text-left flex items-center justify-between gap-2 transition">
        <span class="text-xs font-bold text-cyan-200">📰 ${naoLidas} ${naoLidas === 1 ? 'notícia nova' : 'notícias novas'} no Radar</span>
        <span class="text-[11px] font-black text-cyan-400 shrink-0">Ler →</span>
      </button>
    ` : ''}
  `;

  // Dispara notificação local se o usuário ativou os avisos no menu
  const diaHoje = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('lotolab_aviso_20h30') === '1'
      && localStorage.getItem('lotolab_notif_quiz_dia') !== diaHoje
      && typeof Notification !== 'undefined' && Notification.permission === 'granted'
      && quizPendente) {
    localStorage.setItem('lotolab_notif_quiz_dia', diaHoje);
    try {
      new Notification('🧪 Novo Quiz LotoLab disponível!', {
        body: `${qHoje.pergunta} (+10 Tokens)`,
        icon: './icon-192.png?v=3'
      });
    } catch (_) {}
  }
}

function renderizarCardQuizENoticias() {
  const homeView = document.getElementById('view-home');
  if (!homeView) return;
  renderizarAvisosQuizENoticias();

  let container = document.getElementById('lotolab-quiz-noticias');
  if (!container) {
    container = document.createElement('section');
    container.id = 'lotolab-quiz-noticias';
    container.className = 'mt-4 space-y-4';
    const provaFatos = document.getElementById('home-prova-fatos-section');
    if (provaFatos && provaFatos.parentElement === homeView) {
      homeView.insertBefore(container, provaFatos);
    } else {
      homeView.appendChild(container);
    }
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
          <button type="button" onclick="abrirModalNoticiaLotoLab('${n.id}')" class="text-left rounded-2xl border border-slate-800 hover:border-cyan-500/50 bg-slate-950/70 hover:bg-slate-900 p-3 space-y-1.5 transition cursor-pointer">
            <div class="flex items-center justify-between gap-2">
              <span class="inline-block text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">${n.tag}</span>
              <span class="text-[10px] font-bold text-cyan-400">Ler →</span>
            </div>
            <h4 class="text-xs font-bold text-white leading-snug">${n.titulo}</h4>
            <p class="text-[11px] text-slate-400 leading-relaxed">${n.resumo}</p>
          </button>
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
