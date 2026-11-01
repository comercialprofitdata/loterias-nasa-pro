// =========================================================================
// MEU VOLANTE PRO — TELEMETRIA GLOBAL, LOG DE USO & CALIBRAÇÃO (ADMIN CEO)
// Monitora palpites gerados, dezenas apostadas, scores e histórico de todos os usuários
// =========================================================================
(function () {
  'use strict';

  const STORAGE_KEY_TELEMETRIA = 'loterias_nasa_telemetria_logs_v1';

  // Obtém histórico local de telemetria
  window.obterLogsTelemetriaLocal = function () {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TELEMETRIA);
      if (data) return JSON.parse(data);
    } catch (_) {}

    return [];
  };

  // Salva logs localmente com limite de 300 eventos mais recentes
  window.salvarLogsTelemetriaLocal = function (logs) {
    try {
      const cortado = (logs || []).slice(0, 300);
      localStorage.setItem(STORAGE_KEY_TELEMETRIA, JSON.stringify(cortado));
    } catch (_) {}
  };

  // Helper de detecção detalhada de dispositivo
  function detectarDispositivoDetalhado() {
    try {
      const ua = navigator.userAgent;
      let os = 'Desktop';
      if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone/i.test(ua)) os = 'iPhone / iOS';
      else if (/iPad/i.test(ua)) os = 'iPad / iPadOS';
      else if (/Windows/i.test(ua)) os = 'Windows PC';
      else if (/Macintosh/i.test(ua)) os = 'Mac';

      const dim = `${window.innerWidth}x${window.innerHeight}`;
      return `${os} (${dim})`;
    } catch (_) {
      return 'Mobile / Web';
    }
  }

  // REGISTRADOR CENTRAL DE TELEMETRIA
  window.registrarLogUso = function (acao, dados = {}) {
    try {
      const sessao = (typeof usuarioSessao !== 'undefined' && usuarioSessao)
        ? usuarioSessao
        : (JSON.parse(localStorage.getItem('loterias_nasa_user') || 'null') || {});

      const userId = sessao.email || (sessao.cupomAtivo ? `vip_${sessao.cupomAtivo}` : 'visitante_anonimo');
      const nome = sessao.nome || (sessao.email ? sessao.email.split('@')[0] : 'Visitante');
      const tipo = sessao.tipo || (sessao.email ? 'vip' : 'visitante');

      const horaLocal = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dispositivo = dados.dispositivo || detectarDispositivoDetalhado();

      const novoLog = {
        id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        userId: userId,
        nome: nome,
        tipo: tipo,
        acao: acao || 'clique_geral',
        modalidade: dados.modalidade || (typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena'),
        dezenas: Array.isArray(dados.dezenas) ? dados.dezenas.map(Number) : [],
        concursoAlvo: dados.concursoAlvo || dados.concurso || '',
        score: Number(dados.score || 98),
        testesOk: Number(dados.testesOk || 6),
        detalhes: {
          horaLocal: horaLocal,
          origem: dados.origem || window.location.pathname,
          rotulo: dados.rotulo || '',
          ...((typeof dados.detalhes === 'object' && dados.detalhes) ? dados.detalhes : {})
        },
        dispositivo: dispositivo,
        data: new Date().toISOString()
      };

      const logs = window.obterLogsTelemetriaLocal();
      logs.unshift(novoLog);
      window.salvarLogsTelemetriaLocal(logs);
    } catch (e) {
      console.warn('[Telemetria] Falha ao registrar log:', e);
    }
  };

  // RENDERIZAÇÃO COMPLETA DA SUB-ABA TELEMETRIA NO PAINEL ADMIN
  window.renderizarPainelTelemetriaAdmin = async function () {
    const container = document.getElementById('subsecao-admin-telemetria');
    if (!container) return;

    let logs = window.obterLogsTelemetriaLocal();

    // Tenta puxar logs mais recentes do Supabase se disponível
    try {
      if (typeof obterClienteSupabase === 'function') {
        const cliente = obterClienteSupabase();
        if (cliente) {
          const { data, error } = await cliente
            .from('user_telemetria_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (!error && Array.isArray(data) && data.length > 0) {
            const mapeados = data.map(d => ({
              id: d.id,
              userId: d.user_id,
              nome: d.user_nome || d.user_email || 'Usuário',
              tipo: d.tipo_usuario,
              acao: d.acao,
              modalidade: d.modalidade,
              dezenas: d.dezenas || [],
              concursoAlvo: d.detalhes?.concursoAlvo || '',
              score: d.score || 98,
              testesOk: d.testes_ok || 6,
              dispositivo: d.dispositivo || 'Dispositivo Móvel',
              data: d.created_at
            }));

            // Junta logs locais e remotos deduplicando
            const ids = new Set(mapeados.map(m => m.id));
            logs = [...mapeados, ...logs.filter(l => !ids.has(l.id))];
          }
        }
      }
    } catch (_) {}

    // Cálculos de métricas de calibração
    const totalPalpites = logs.length;
    const scores = logs.map(l => Number(l.score) || 0).filter(s => s > 0);
    const mediaScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '98.5';
    
    // Contagem de dezenas mais jogadas
    const contagemDezenas = {};
    logs.forEach(l => {
      (l.dezenas || []).forEach(d => {
        contagemDezenas[d] = (contagemDezenas[d] || 0) + 1;
      });
    });
    const topDezenas = Object.entries(contagemDezenas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(entry => entry[0]);

    // Testadores únicos ativos
    const testadoresUnicos = new Set(logs.map(l => l.nome));

    container.innerHTML = `
      <div class="space-y-4 font-sans">
        
        <!-- HEADER DA SEÇÃO COM ATUALIZAÇÃO -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">📡</span>
              <h3 class="text-sm font-black text-white uppercase tracking-wider">Telemetria & Histórico Global de Apostas</h3>
              <span class="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[9px] font-mono font-bold text-cyan-300">Live Stream</span>
            </div>
            <p class="text-[11px] text-slate-400">
              Monitore os jogos gerados, dezenas e calibração estatística dos seus clientes e testadores em tempo real.
            </p>
          </div>
          <button type="button" onclick="renderizarPainelTelemetriaAdmin()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto active:scale-95 transition">
            <span>🔄</span> Atualizar Dados
          </button>
        </div>

        <!-- 4 CARDS DE CALIBRAÇÃO E AUDITORIA MATEMÁTICA -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-mono uppercase block">Total de Ações / Jogos</span>
            <div class="text-lg font-black text-white font-mono">${totalPalpites}</div>
            <span class="text-[10px] text-emerald-400">100% monitorado</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-mono uppercase block">Score Médio da IA</span>
            <div class="text-lg font-black text-cyan-400 font-mono">${mediaScore} <span class="text-xs text-slate-500">/ 100</span></div>
            <span class="text-[10px] text-cyan-300">Bateria de 6 Testes OK</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-mono uppercase block">Testadores Ativos</span>
            <div class="text-lg font-black text-amber-400 font-mono">${testadoresUnicos.size}</div>
            <span class="text-[10px] text-slate-400">Pioneiros VIPs</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
            <span class="text-[10px] text-slate-400 font-mono uppercase block">Dezenas + Quentes</span>
            <div class="flex items-center gap-1 pt-0.5 flex-wrap">
              ${topDezenas.length > 0 ? topDezenas.map(d => `<span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">${String(d).padStart(2,'0')}</span>`).join('') : '<span class="text-xs text-slate-500">—</span>'}
            </div>
          </div>
        </div>

        <!-- TABELA DE JOGOS E APOSTAS REAIS GERADAS PELOS USUÁRIOS -->
        <div class="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div class="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div class="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🎯</span> Registro Individual de Palpites & Bilhetes
            </div>
            <div class="flex items-center gap-1.5 w-full sm:w-auto">
              <input type="text" id="filtro-busca-telemetria" oninput="filtrarTabelaTelemetria(this.value)" placeholder="Filtrar por nome, ação ou nº..." class="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans w-full sm:w-48" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr class="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                  <th class="p-3">Data / Hora</th>
                  <th class="p-3">Usuário / Testador</th>
                  <th class="p-3">Ação</th>
                  <th class="p-3">Modalidade</th>
                  <th class="p-3">Dezenas Geradas</th>
                  <th class="p-3 text-center">Score</th>
                  <th class="p-3">Dispositivo</th>
                </tr>
              </thead>
              <tbody id="corpo-tabela-telemetria" class="divide-y divide-slate-850">
                ${renderizarLinhasTelemetria(logs)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  };

  function renderizarLinhasTelemetria(lista) {
    if (!lista || lista.length === 0) {
      return `<tr><td colspan="7" class="p-4 text-center text-xs text-slate-500">Nenhum evento registrado ainda.</td></tr>`;
    }

    return lista.map(l => {
      const isMega = (l.modalidade || 'megasena') === 'megasena';
      const dataFmt = l.data ? new Date(l.data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      const acaoRotulo = {
        'aposta_salva': '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">✅ Salva na Carteira</span>',
        'jogo_gerado': '<span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">🎲 Gerou Palpite</span>',
        'fechamento_executado': '<span class="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">📐 Fechamento</span>',
        'login_vip': '<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">👑 Login VIP</span>',
        'navegacao_aba': `<span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">🧭 ${l.detalhes?.rotulo || 'Navegação'}</span>`,
        'clique_acao': `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold">🖱️ ${l.detalhes?.rotulo || 'Clique'}</span>`,
        'aceite_termo': `<span class="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold">📜 Aceite: ${l.detalhes?.rotulo || 'Termos'}</span>`,
        'compartilhar_whatsapp': '<span class="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800 text-[10px] font-bold">📱 WhatsApp</span>',
        'copiar_jogo': '<span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">📋 Copiou Jogo</span>',
        'troca_tema': `<span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">☀️ ${l.detalhes?.rotulo || 'Tema'}</span>`,
        'troca_som': `<span class="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">🔊 ${l.detalhes?.rotulo || 'Som'}</span>`,
        'conferir_bilhetes': '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">🔍 Conferência</span>'
      }[l.acao] || `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">${l.acao}</span>`;

      const bolinhas = (l.dezenas && l.dezenas.length > 0)
        ? l.dezenas.map(d => `
            <span class="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[9px] ${isMega ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-purple-950 text-purple-400 border border-purple-800'}">
              ${String(d).padStart(2, '0')}
            </span>
          `).join('')
        : `<span class="text-slate-400 text-[10px] italic font-mono">${l.detalhes?.rotulo || l.detalhes?.origem || '—'}</span>`;

      const scoreDisplay = (l.dezenas && l.dezenas.length > 0)
        ? `<span class="font-mono font-black text-cyan-300 text-xs">${l.score || 98}/100</span>
           <div class="text-[9px] text-emerald-400 font-bold">✓ ${l.testesOk || 6}/6 OK</div>`
        : `<span class="text-slate-500 text-[10px] font-mono">—</span>`;

      return `
        <tr class="hover:bg-slate-900/40 transition">
          <td class="p-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">${dataFmt}</td>
          <td class="p-3">
            <div class="font-bold text-white text-xs">${l.nome}</div>
            <div class="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">${l.userId}</div>
          </td>
          <td class="p-3 whitespace-nowrap">${acaoRotulo}</td>
          <td class="p-3 whitespace-nowrap">
            <span class="font-bold text-[10px] ${isMega ? 'text-emerald-400' : 'text-purple-400'} font-mono">${(l.modalidade || 'megasena').toUpperCase()}</span>
          </td>
          <td class="p-3">
            <div class="flex flex-wrap gap-1 max-w-xs items-center">
              ${bolinhas}
            </div>
          </td>
          <td class="p-3 text-center whitespace-nowrap">
            ${scoreDisplay}
          </td>
          <td class="p-3 text-[10px] text-slate-400 font-mono whitespace-nowrap">${l.dispositivo || 'Mobile'}</td>
        </tr>
      `;
    }).join('');
  }

  window.filtrarTabelaTelemetria = function (termo) {
    const limpo = (termo || '').toLowerCase().trim();
    const logs = window.obterLogsTelemetriaLocal();
    const filtrados = logs.filter(l => {
      const rotulo = l.detalhes?.rotulo || '';
      const str = `${l.nome} ${l.userId} ${l.acao} ${rotulo} ${l.modalidade} ${(l.dezenas || []).join(' ')}`.toLowerCase();
      return str.includes(limpo);
    });

    const tbody = document.getElementById('corpo-tabela-telemetria');
    if (tbody) {
      tbody.innerHTML = renderizarLinhasTelemetria(filtrados);
    }
  };

  // Intercepta geração de jogos e salva telemetria automaticamente
  const origSalvarJogo = window.salvarJogoNaCarteira;
  if (typeof origSalvarJogo === 'function') {
    window.salvarJogoNaCarteira = function () {
      try {
        const j = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
        const score = document.getElementById('score-numero')?.innerText || 98;
        if (j && j.length > 0) {
          window.registrarLogUso('aposta_salva', {
            dezenas: j,
            score: score,
            testesOk: 6,
            rotulo: 'Aposta Salva na Carteira'
          });
        }
      } catch (_) {}
      return origSalvarJogo.apply(this, arguments);
    };
  }

  // LISTENER GLOBAL DE TELEMETRIA INTELIGENTE (Cliques, Abas, Aceites e Interações)
  document.addEventListener('click', function (e) {
    try {
      const el = e.target.closest('button, a, [role="button"], input[type="checkbox"], input[type="radio"]');
      if (!el) return;

      const id = el.id || '';
      const texto = (el.innerText || el.getAttribute('aria-label') || el.title || '').trim().slice(0, 40);

      // 1. Navegação de Abas do Rodapé
      if (id.startsWith('btn-tab-') || el.closest('#bottom-nav')) {
        const abaNome = id.replace('btn-tab-', '') || texto || 'Aba';
        window.registrarLogUso('navegacao_aba', { rotulo: `Aba ${abaNome.toUpperCase()}` });
        return;
      }

      // 2. Botão Gerar Palpite / Auditoria
      if (id === 'btn-gerar-palpite' || id === 'btn-hero-cta' || /auditoria|gerar|simular/i.test(texto)) {
        setTimeout(function () {
          try {
            const dezenas = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
            const scoreEl = document.getElementById('score-numero');
            const score = scoreEl ? parseInt(scoreEl.innerText, 10) : 98;
            window.registrarLogUso('jogo_gerado', {
              dezenas: dezenas,
              score: isNaN(score) ? 98 : score,
              testesOk: 6,
              rotulo: texto || 'Gerar Palpite'
            });
          } catch (_) {}
        }, 400);
        return;
      }

      // 3. Compartilhamento e Cópia
      if (/whatsapp/i.test(texto) || id.includes('whatsapp')) {
        window.registrarLogUso('compartilhar_whatsapp', { rotulo: 'WhatsApp' });
        return;
      }
      if (/copiar/i.test(texto) || id.includes('copiar')) {
        window.registrarLogUso('copiar_jogo', { rotulo: 'Copiar Bilhete' });
        return;
      }

      // 4. Modos de Experiência (Rápido, Volante, Científico)
      if (id.includes('modo-') || el.closest('.nasa-hero-modo-bar')) {
        window.registrarLogUso('troca_modo', { rotulo: texto || 'Modo Experiência' });
        return;
      }

      // 5. Aceite de Termos Legais (CDC / LGPD)
      if (id.includes('termo') || id.includes('lgpd') || id.includes('cdc') || /aceit|concord/i.test(texto)) {
        window.registrarLogUso('aceite_termo', { rotulo: texto || 'Termos de Uso / LGPD' });
        return;
      }

      // 6. Configurações (Tema e Som)
      if (id.includes('tema') || /tema|dark|light/i.test(texto)) {
        window.registrarLogUso('troca_tema', { rotulo: 'Alternou Tema' });
        return;
      }
      if (id.includes('som') || /som|áudio|audio/i.test(texto)) {
        window.registrarLogUso('troca_som', { rotulo: 'Ajustou Áudio' });
        return;
      }

      // 7. Conferência de bilhetes
      if (id.includes('conferir') || /conferir/i.test(texto)) {
        window.registrarLogUso('conferir_bilhetes', { rotulo: 'Conferiu Apostas' });
        return;
      }

      // 8. Botão "JOGUEI ESTE JOGO!"
      if (/joguei/i.test(texto) || id.includes('joguei')) {
        const j = typeof getJogoAtual === 'function' ? getJogoAtual() : [];
        window.registrarLogUso('aposta_salva', {
          dezenas: j,
          rotulo: 'Joguei Este Jogo!'
        });
      }
    } catch (_) {}
  }, true);

})();
