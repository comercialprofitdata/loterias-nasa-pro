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
  },
  {
    id: 'q11',
    categoria: 'Lotomania',
    pergunta: 'Na Lotomania, o que acontece se você errar TODAS as 20 dezenas sorteadas (0 acertos)?',
    opcoes: ['Não ganha nada', 'Ganha prêmio em faixa própria', 'Recebe o valor do bilhete', 'Só vale em bolão'],
    correta: 1,
    explicacao: 'A Lotomania tem uma faixa oficial exclusiva para quem faz 0 acertos entre os 50 números escolhidos!'
  },
  {
    id: 'q12',
    categoria: 'Quina',
    pergunta: 'Quantos sorteios por semana a Quina realiza regularmente pela CAIXA?',
    opcoes: ['2 por semana', '3 por semana', '6 por semana (segunda a sábado)', '1 por mês'],
    correta: 2,
    explicacao: 'Assim como a Lotofácil, a Quina tem 6 sorteios semanais de segunda a sábado às 20h.'
  },
  {
    id: 'q13',
    categoria: 'Dia de Sorte',
    pergunta: 'Por que o volante do Dia de Sorte vai exatamente de 01 a 31?',
    opcoes: ['Por sorteio aleatório', 'Representa os dias de um mês', 'Por causa do limite de bolas', 'É igual à Lotofácil'],
    correta: 1,
    explicacao: 'O Dia de Sorte foi criado em torno das datas do calendário: você escolhe de 7 a 15 dias (01 a 31) e um Mês da Sorte.'
  },
  {
    id: 'q14',
    categoria: 'Espanha',
    pergunta: 'Como é chamada a tradicional loteria de Natal da Espanha que distribui bilhões em prêmios divididos?',
    opcoes: ['La Roja', 'El Gordo de Navidad', 'EuroLoto', 'SuperEspanha'],
    correta: 1,
    explicacao: 'A Lotería de Navidad ("El Gordo") é realizada desde 1812 e é famosa por premiar bairros e cidades inteiras com bilhetes compartilhados.'
  },
  {
    id: 'q15',
    categoria: 'Mega-Sena',
    pergunta: 'Qual é o número máximo de dezenas que podem ser marcadas em uma única aposta da Mega-Sena?',
    opcoes: ['10 dezenas', '15 dezenas', '20 dezenas', '25 dezenas'],
    correta: 2,
    explicacao: 'A CAIXA permite marcar de 6 até 20 dezenas em um único volante da Mega-Sena (o que equivale a 38.760 apostas simples!).'
  },
  {
    id: 'q16',
    categoria: 'Comportamento',
    pergunta: 'Por que jogos só com números de 01 a 31 costumam gerar prêmios menores quando ganham?',
    opcoes: ['A CAIXA paga menos', 'Muita gente joga datas de aniversário e divide o prêmio', 'Números altos valem mais', 'É mito, nunca divide'],
    correta: 1,
    explicacao: 'A chance de ganhar é igual, mas como muitas pessoas escolhem datas (01–31), há mais chance de dividir o prêmio principal.'
  },
  {
    id: 'q17',
    categoria: 'Quina',
    pergunta: 'Na Quina, qual é o mínimo de acertos necessários para receber premiação oficial?',
    opcoes: ['2 acertos (Duque)', '3 acertos (Terno)', '4 acertos (Quadra)', 'Apenas 5 acertos'],
    correta: 0,
    explicacao: 'A Quina premia quem acerta 5 (Quina), 4 (Quadra), 3 (Terno) e até 2 dezenas (Duque).'
  },
  {
    id: 'q18',
    categoria: 'Bolão CAIXA',
    pergunta: 'Em um Bolão oficial registrado na lotérica, o que garante o direito de cada participante ao prêmio?',
    opcoes: ['Print do WhatsApp', 'O recibo individual de cota emitido pela CAIXA', 'Planilha do Excel', 'Apenas o nome na lista'],
    correta: 1,
    explicacao: 'No Bolão CAIXA oficial, cada participante recebe um recibo individual de cota e pode resgatar sua parte diretamente na CAIXA.'
  },
  {
    id: 'q19',
    categoria: 'Lotomania',
    pergunta: 'Quantas dezenas são marcadas em uma aposta da Lotomania?',
    opcoes: ['20 dezenas', '25 dezenas', '50 dezenas', '60 dezenas'],
    correta: 2,
    explicacao: 'Na Lotomania você marca exatamente 50 números dentre os 100 do volante (00 a 99), e são sorteadas 20 dezenas.'
  },
  {
    id: 'q20',
    categoria: 'Probabilidade',
    pergunta: 'Qual destas loterias brasileiras tem a maior probabilidade matemática de acertar a faixa principal em 1 aposta simples?',
    opcoes: ['Mega-Sena (1 em 50M)', 'Quina (1 em 24M)', 'Dia de Sorte (1 em 2,6M)', 'Lotomania (1 em 11,3M)'],
    correta: 2,
    explicacao: 'Com 1 em 2.629.575 combinações possíveis, o Dia de Sorte é matematicamente mais fácil na faixa principal do que a Lotofácil (1 em 3,26M) e a Mega-Sena (1 em 50M).'
  }
];

const LOTOLAB_NOTICIAS = [
  {
    id: 'n0',
    tag: 'NOVIDADE',
    titulo: 'Agora o LotoLab tem 5 loterias: Mega, Lotofácil, Quina, Lotomania e Dia de Sorte',
    resumo: 'Mega e Lotofácil seguem em destaque no topo, e no menu "Mais ▾" você acessa Quina, Lotomania e Dia de Sorte com conferência oficial.',
    detalhe: 'Para manter o visual limpo e rápido, Mega-Sena e Lotofácil ficam fixas na barra principal. Tocando em "Mais ▾" no topo (ou "Outras loterias" no computador), você libera Quina, Lotomania (inclusive conferência de 0 acertos!) e Dia de Sorte — todas com bolão e resultados oficiais da CAIXA.',
    acaoTexto: 'Abrir menu de loterias →',
    acaoAba: 'volante'
  },
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

function obterContainerHomeLotoLab() {
  return document.querySelector('#view-inicio-new .nasa-home-grid') || document.getElementById('view-inicio-new');
}

function obterMancheteDinamicaCaixa() {
  try {
    const salvos = typeof window.obterSorteiosSalvos === 'function' ? window.obterSorteiosSalvos() : null;
    const mega = salvos?.megasena;
    if (mega && mega.premioTexto) {
      return {
        id: 'caixa_dinamica',
        tag: mega.acumulado ? 'ACUMULOU' : 'PRÓXIMO SORTEIO',
        titulo: `Mega-Sena #${mega.concurso || ''} em ${mega.premioTexto}${mega.dataBR ? ` · sorteio ${mega.dataBR}` : ''}`.trim(),
        resumo: 'Valor oficial sincronizado da CAIXA. Gere seu jogo calibrado ou monte um bolão com amigos.'
      };
    }
    const premioDom = document.querySelector('.js-mega-premio, #home-mega-prize')?.textContent?.trim();
    const concDom = document.querySelector('.js-mega-concurso, #home-mega-concurso')?.textContent?.trim();
    if (premioDom && /R\$/.test(premioDom)) {
      return {
        id: 'caixa_dinamica',
        tag: 'PRÓXIMO SORTEIO',
        titulo: `Mega-Sena ${concDom || ''} em ${premioDom}`.replace(/\s+/g, ' ').trim(),
        resumo: 'Acompanhe os prêmios ao vivo da CAIXA e ative os alertas para não perder o fechamento.'
      };
    }
  } catch {}
  return LOTOLAB_NOTICIAS[0];
}

function renderizarAvisosQuizENoticias() {
  // Foco 100% em JOGAR no topo da Home: remove qualquer barra que empurre o Hero para baixo
  document.getElementById('lotolab-avisos-topo')?.remove();

  const estado = lerEstadoQuiz();
  const qHoje = QUIZ_PERGUNTAS[perguntaDoDiaIndex()];
  const quizPendente = typeof estado.respondidas[qHoje.id] !== 'number';

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
  const homeView = obterContainerHomeLotoLab();
  if (!homeView) return;
  renderizarAvisosQuizENoticias();

  let container = document.getElementById('lotolab-quiz-noticias');
  if (!container) {
    container = document.createElement('section');
    container.id = 'lotolab-quiz-noticias';
    container.className = 'space-y-2.5';
    // Fica ABAIXO dos sorteios (#home-secao-auditoria-caixa) para não concorrer com JOGAR no topo
    const secaoSorteios = document.getElementById('home-secao-auditoria-caixa');
    if (secaoSorteios && secaoSorteios.parentElement === homeView) {
      secaoSorteios.after(container);
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
  const manchete = obterMancheteDinamicaCaixa();

  container.innerHTML = `
    <details id="lotolab-radar-expansivel" class="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
      <summary class="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer select-none list-none">
        <div class="flex items-center gap-2 min-w-0">
          <span class="shrink-0 text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">${manchete.tag}</span>
          <span class="text-xs font-bold text-white truncate">${manchete.titulo}</span>
        </div>
        <span class="shrink-0 text-[11px] font-bold text-cyan-400">Radar (${LOTOLAB_NOTICIAS.length}) ▾</span>
      </summary>
      <div class="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2">
        ${LOTOLAB_NOTICIAS.map((n) => `
          <button type="button" onclick="abrirModalNoticiaLotoLab('${n.id}')" class="text-left rounded-xl border border-slate-800 hover:border-cyan-500/50 bg-slate-950/70 hover:bg-slate-900 p-2.5 space-y-1 transition cursor-pointer">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">${n.tag}</span>
              <span class="text-[10px] font-bold text-cyan-400">Ler →</span>
            </div>
            <h4 class="text-xs font-bold text-white leading-snug">${n.titulo}</h4>
          </button>
        `).join('')}
      </div>
    </details>

    <div class="rounded-2xl border border-emerald-500/30 bg-slate-900/75 p-3.5 space-y-2.5 shadow">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-[11px] font-black tracking-wider uppercase text-emerald-400">
          🧪 Quiz do Dia · ${q.categoria}
        </span>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30" id="lotolab-tokens-badge">
            🪙 ${estado.tokens} Tokens
          </span>
          ${estado.tokens >= 20 ? `
            <button type="button" id="btn-quiz-resgatar" class="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950">
              🎁 Trocar 20 (+1 jogo)
            </button>
          ` : ''}
          <button type="button" id="btn-quiz-proxima" class="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
            Próxima →
          </button>
        </div>
      </div>

      <h3 class="text-xs sm:text-sm font-extrabold text-white leading-snug">${q.pergunta}</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        ${q.opcoes.map((op, i) => {
          let cls = 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-200';
          if (jaRespondeu) {
            if (i === q.correta) cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black';
            else if (i === respUsuario) cls = 'bg-rose-500/20 border-rose-400 text-rose-300';
            else cls = 'bg-slate-950/40 border-slate-800 text-slate-500';
          }
          return `<button type="button" data-quiz-opcao="${i}" ${jaRespondeu ? 'disabled' : ''} class="text-left px-3 py-2 rounded-xl border text-xs font-semibold transition ${cls}">${op}</button>`;
        }).join('')}
      </div>

      ${jaRespondeu ? `
        <div class="rounded-xl p-2.5 text-[11px] leading-relaxed ${acertou ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200' : 'bg-slate-950/70 border border-slate-700 text-slate-300'}">
          <strong>${acertou ? '✅ +10 Tokens!' : 'ℹ️ Quase lá!'}</strong> ${q.explicacao}
        </div>
      ` : `
        <div class="flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Acerte e ganhe <strong>+10 Tokens</strong> (20 = +1 geração).</span>
          <a href="https://www.instagram.com/lotolab.app/" target="_blank" rel="noopener" class="text-emerald-400 hover:underline font-bold shrink-0">@lotolab.app →</a>
        </div>
      `}
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

  container.querySelector('#btn-quiz-resgatar')?.addEventListener('click', () => {
    const atual = lerEstadoQuiz();
    if (atual.tokens < 20) return;
    atual.tokens -= 20;
    salvarEstadoQuiz(atual);
    try {
      const bonus = Number(localStorage.getItem('lotolab_bonus_geracoes') || 0) + 1;
      localStorage.setItem('lotolab_bonus_geracoes', String(bonus));
    } catch {}
    if (typeof toast === 'function') toast('🎁 20 Tokens trocados! +1 geração extra liberada no app.', '🪙');
    renderizarCardQuizENoticias();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderizarCardQuizENoticias, 450);
  });
}
window.renderizarCardQuizENoticias = renderizarCardQuizENoticias;
