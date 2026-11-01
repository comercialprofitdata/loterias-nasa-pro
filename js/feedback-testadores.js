// =========================================================================
// MEU VOLANTE PRO — SISTEMA DE FEEDBACK & AVALIAÇÃO DE TESTADORES VIP
// =========================================================================
(function () {
  'use strict';

  const STORAGE_KEY_FEEDBACKS = 'loterias_nasa_feedbacks_v1';
  const STORAGE_KEY_ULTIMO_FEEDBACK = 'loterias_nasa_ultimo_feedback_data';
  const NUMERO_WHATSAPP_VITORIO = '5511999999999'; // Pode ser atualizado no painel admin

  function obterFeedbacks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_FEEDBACKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function salvarFeedbackLocal(fb) {
    const lista = obterFeedbacks();
    lista.unshift(fb);
    localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(lista));
    localStorage.setItem(STORAGE_KEY_ULTIMO_FEEDBACK, new Date().toISOString());
    return lista;
  }

  let notaSelecionada = 5;

  function criarOuObterModalFeedback() {
    let modal = document.getElementById('modal-feedback-testador');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-feedback-testador';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md hidden font-sans';
      modal.innerHTML = `
        <div class="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative animate-fade-in">
          <!-- Fechar -->
          <button type="button" onclick="window.fecharModalFeedbackTestador()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center transition">✕</button>

          <!-- Cabeçalho -->
          <div class="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div class="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-cyan-950/40">
              
            </div>
            <div>
              <span class="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                PROGRAMA DE TESTADORES VIP
              </span>
              <h3 class="text-sm sm:text-base font-black text-white mt-0.5">Como está sua experiência?</h3>
            </div>
          </div>

          <!-- Explicação Amigável -->
          <p class="text-xs text-slate-300 leading-relaxed">
            Você é um dos nossos testadores pioneiros! Sua opinião e sugestões são fundamentais para calibrarmos o app para você.
          </p>

          <!-- Seletor de Nota (Estrelas / Emojis) -->
          <div class="space-y-1.5 bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <label class="text-[11px] font-bold text-slate-300 block text-center">Sua Nota Geral:</label>
            <div class="flex items-center justify-center gap-2 sm:gap-3 py-1" id="feedback-estrelas-container">
              <button type="button" onclick="window.selecionarNotaFeedback(1)" class="fb-star-btn text-2xl transition hover:scale-125" data-nota="1" title="1 - Precisa Melhorar">😡</button>
              <button type="button" onclick="window.selecionarNotaFeedback(2)" class="fb-star-btn text-2xl transition hover:scale-125" data-nota="2" title="2 - Regular">🤔</button>
              <button type="button" onclick="window.selecionarNotaFeedback(3)" class="fb-star-btn text-2xl transition hover:scale-125" data-nota="3" title="3 - Bom">👍</button>
              <button type="button" onclick="window.selecionarNotaFeedback(4)" class="fb-star-btn text-2xl transition hover:scale-125" data-nota="4" title="4 - Muito Bom">✨</button>
              <button type="button" onclick="window.selecionarNotaFeedback(5)" class="fb-star-btn text-2xl transition hover:scale-125" data-nota="5" title="5 - Excelente / Espetacular">🎯</button>
            </div>
            <div id="feedback-nota-rotulo" class="text-center font-bold text-xs text-cyan-400">
              🎯 5/5 — Excelente / Espetacular!
            </div>
          </div>

          <!-- Campos do Formulário -->
          <form id="form-feedback-testador" onsubmit="event.preventDefault(); window.submeterFeedbackTestador();" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Seu Nome / Apelido</label>
              <input type="text" id="feedback-nome" required placeholder="Como podemos te chamar?" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans" />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Seu WhatsApp (para contato se desejar)</label>
              <input type="tel" id="feedback-whatsapp" placeholder="Ex: (11) 99999-9999" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans" />
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">O que podemos melhorar ou adicionar?</label>
              <textarea id="feedback-mensagem" required rows="3" placeholder="Conte o que achou das matrizes, do volante, filtros ou se encontrou alguma dúvida..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans resize-none"></textarea>
            </div>

            <!-- Botões de Ação -->
            <div class="space-y-2 pt-1">
              <button type="submit" class="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan-950/40 transition active:scale-95 flex items-center justify-center gap-1.5">
                <span>💾</span>
                <span>Enviar Minha Avaliação</span>
              </button>

              <button type="button" onclick="window.enviarFeedbackViaWhatsApp()" class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition active:scale-95 flex items-center justify-center gap-2">
                <span>💬</span>
                <span>Enviar Sugestão Direto no WhatsApp do Vitório</span>
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  const ROTULOS_NOTAS = {
    1: '😡 1/5 — Precisa Melhorar Bastante',
    2: '🤔 2/5 — Regular / Ajustes Necessários',
    3: '👍 3/5 — Bom / No Caminho Certo',
    4: '✨ 4/5 — Muito Bom / Fácil de Usar',
    5: '🎯 5/5 — Excelente / Espetacular!'
  };

  window.selecionarNotaFeedback = function (nota) {
    notaSelecionada = Number(nota);
    const rotuloEl = document.getElementById('feedback-nota-rotulo');
    if (rotuloEl) rotuloEl.innerText = ROTULOS_NOTAS[notaSelecionada] || `Nota ${notaSelecionada}/5`;

    document.querySelectorAll('.fb-star-btn').forEach((btn) => {
      const n = Number(btn.getAttribute('data-nota'));
      if (n <= notaSelecionada) {
        btn.classList.add('scale-110');
        btn.style.opacity = '1';
        btn.style.filter = 'none';
      } else {
        btn.classList.remove('scale-110');
        btn.style.opacity = '0.35';
        btn.style.filter = 'grayscale(100%)';
      }
    });
  };

  window.abrirModalFeedbackTestador = function () {
    const modal = criarOuObterModalFeedback();
    window.selecionarNotaFeedback(5);

    // Preenche nome e contato se logado
    const nomeInput = document.getElementById('feedback-nome');
    const zapInput = document.getElementById('feedback-whatsapp');
    if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
      if (nomeInput && !nomeInput.value) nomeInput.value = usuarioSessao.nome || '';
      if (zapInput && !zapInput.value) zapInput.value = usuarioSessao.telefone || '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.fecharModalFeedbackTestador = function () {
    const modal = document.getElementById('modal-feedback-testador');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  window.submeterFeedbackTestador = async function () {
    const nomeEl = document.getElementById('feedback-nome');
    const zapEl = document.getElementById('feedback-whatsapp');
    const msgEl = document.getElementById('feedback-mensagem');

    const nome = nomeEl ? nomeEl.value.trim() : 'Testador';
    const whatsapp = zapEl ? zapEl.value.trim() : '';
    const mensagem = msgEl ? msgEl.value.trim() : '';

    if (!mensagem) {
      alert('Por favor, escreva uma breve mensagem ou sugestão.');
      return;
    }

    const fb = {
      id: 'fb-' + Date.now(),
      nome,
      whatsapp,
      nota: notaSelecionada,
      rotuloNota: ROTULOS_NOTAS[notaSelecionada],
      mensagem,
      data: new Date().toISOString()
    };

    salvarFeedbackLocal(fb);

    // Sincroniza com Supabase se disponível
    try {
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
        await window.supabaseClient.from('visitor_leads').insert([{
          name: nome,
          phone: whatsapp,
          notes: `[FEEDBACK ${notaSelecionada}/5]: ${mensagem}`,
          source: 'feedback_testador',
          consent: true
        }]);
      }
    } catch (e) {
      console.warn('Sync feedback remoto:', e);
    }

    window.fecharModalFeedbackTestador();

    if (typeof window.toast === 'function') {
      window.toast(`Obrigado pelo feedback, ${nome.split(' ')[0]}! Juntos fazemos o melhor app! 🎯`, '🙏');
    }
    if (typeof window.tocarSomNasa === 'function') window.tocarSomNasa('sucesso');

    // Se estiver no painel admin, atualiza a tabela de feedbacks
    if (typeof window.renderizarFeedbacksAdmin === 'function') {
      window.renderizarFeedbacksAdmin();
    }
  };

  window.enviarFeedbackViaWhatsApp = function () {
    const nomeEl = document.getElementById('feedback-nome');
    const msgEl = document.getElementById('feedback-mensagem');

    const nome = nomeEl && nomeEl.value.trim() ? nomeEl.value.trim() : 'Testador';
    const mensagem = msgEl ? msgEl.value.trim() : '';

    const rotulo = ROTULOS_NOTAS[notaSelecionada] || `Nota ${notaSelecionada}/5`;

    const texto = 
      `*Feedback Meu Volante PRO*\n\n` +
      `👤 *Testador:* ${nome}\n` +
      `⭐ *Avaliação:* ${rotulo}\n\n` +
      `💡 *Sugestão de Melhoria:*\n"${mensagem || 'App muito bom! Parabéns pelo projeto!'}"\n\n` +
      `Enviado via aplicativo oficial.`;

    // Abre direto no app WhatsApp nativo no celular ou Web no desktop
    if (typeof window.abrirWhatsApp === 'function') {
      window.abrirWhatsApp({ texto: texto });
    } else {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(texto)}`;
    }
    window.submeterFeedbackTestador();
  };

  // Disparo inteligente periódico:
  // Se o usuário realizou 3 ou mais ações ou gerou jogos e não avaliou nos últimos 5 dias,
  // exibe um convite discreto no canto inferior da tela.
  function verificarDisparoPeriodico() {
    try {
      const ultimo = localStorage.getItem(STORAGE_KEY_ULTIMO_FEEDBACK);
      if (ultimo) {
        const dias = (Date.now() - new Date(ultimo).getTime()) / (1000 * 60 * 60 * 24);
        if (dias < 5) return; // Avaliou recentemente
      }

      // Contador de jogos gerados na sessão
      const jogosFeitos = Number(sessionStorage.getItem('nasa_jogos_gerados_sessao') || '0');
      if (jogosFeitos >= 3) {
        exibirBannerDiscretoConviteFeedback();
      }
    } catch (_) {}
  }

  function exibirBannerDiscretoConviteFeedback() {
    if (document.getElementById('banner-convite-feedback')) return;

    const banner = document.createElement('div');
    banner.id = 'banner-convite-feedback';
    banner.className = 'fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-slate-900/95 border-2 border-cyan-500/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-fade-in text-xs font-sans';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-2xl">⭐</span>
        <div>
          <div class="font-black text-white text-[11px]">Como está sendo sua experiência?</div>
          <div class="text-[10px] text-slate-400">Dê sua nota e envie sugestões de melhoria!</div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button type="button" onclick="window.abrirModalFeedbackTestador(); document.getElementById('banner-convite-feedback')?.remove();" class="px-2.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-[10px] shadow active:scale-95 transition">
          Avaliar
        </button>
        <button type="button" onclick="document.getElementById('banner-convite-feedback')?.remove();" class="p-1 text-slate-500 hover:text-white rounded-lg">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  // Monitora quando o usuário gera um jogo para incrementar o contador
  const originalGerarJogo = window.gerarPalpiteExpressHome;
  if (typeof originalGerarJogo === 'function') {
    window.gerarPalpiteExpressHome = function (...args) {
      const res = originalGerarJogo.apply(this, args);
      try {
        const c = Number(sessionStorage.getItem('nasa_jogos_gerados_sessao') || '0') + 1;
        sessionStorage.setItem('nasa_jogos_gerados_sessao', String(c));
        if (c === 3) {
          setTimeout(verificarDisparoPeriodico, 2500);
        }
      } catch (_) {}
      return res;
    };
  }

  // =========================================================================
  // RENDERIZAÇÃO NO PAINEL ADMINISTRATIVO
  // =========================================================================
  window.renderizarFeedbacksAdmin = function () {
    const container = document.getElementById('lista-feedbacks-admin-body');
    if (!container) return;

    const lista = obterFeedbacks();
    const totalEl = document.getElementById('kpi-total-feedbacks');
    const mediaEl = document.getElementById('kpi-media-feedbacks');

    if (totalEl) totalEl.innerText = String(lista.length);
    if (mediaEl) {
      if (lista.length === 0) {
        mediaEl.innerText = '5.0 ⭐';
      } else {
        const media = (lista.reduce((acc, f) => acc + (Number(f.nota) || 5), 0) / lista.length).toFixed(1);
        mediaEl.innerText = `${media} ⭐`;
      }
    }

    if (lista.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="p-6 text-center text-slate-500 font-sans">
            Nenhuma avaliação ou sugestão registrada ainda. O sistema solicitará feedback periodicamente aos testadores.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = lista.map((f) => {
      const zapNum = (f.whatsapp || '').replace(/\D/g, '');
      const dataFormatada = f.data ? new Date(f.data).toLocaleDateString('pt-BR') : '-';

      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="p-3.5">
            <div class="font-bold text-white font-sans">${f.nome || 'Anônimo'}</div>
            <div class="text-[10px] text-slate-400 font-mono">${f.whatsapp || 'Sem telefone'}</div>
          </td>
          <td class="p-3.5">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-xs font-mono">
              ${f.nota}/5 ⭐
            </span>
          </td>
          <td class="p-3.5">
            <div class="text-xs text-slate-200 font-sans max-w-xs break-words">
              "${f.mensagem || '-'}"
            </div>
          </td>
          <td class="p-3.5 text-[10px] text-slate-400 font-mono">
            ${dataFormatada}
          </td>
          <td class="p-3.5 text-right">
            ${zapNum ? `
              <button type="button" onclick="window.abrirWhatsApp ? window.abrirWhatsApp({ fone: '${zapNum}', texto: 'Olá, ${(f.nome || '').replace(/'/g, '')}! Vi sua sugestão no Meu Volante PRO. Muito obrigado pelo feedback!' }) : (window.location.href = 'whatsapp://send?phone=55${zapNum}&text=Olá!')" class="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition">
                <span>💬</span> <span>Responder</span>
              </button>
            ` : `
              <span class="text-slate-600 text-[10px]">Sem WhatsApp</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  };

  window.obterListaFeedbacksTestadores = obterFeedbacks;

  console.log('⭐ Módulo de Feedback & Avaliações de Testadores inicializado com sucesso.');
})();
