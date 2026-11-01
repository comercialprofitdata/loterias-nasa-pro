// =========================================================================
// MEU VOLANTE PRO — PROGRAMA DOS 20 TESTADORES GOOGLE PLAY (CLOSED TEST)
// =========================================================================
(function () {
  'use strict';

  const STORAGE_KEY = 'loterias_nasa_testers_vip_v1';
  const META_TESTADORES = 20;

  function obterTestadores() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function salvarTestadorLocal(testador) {
    const lista = obterTestadores();
    // Evita duplicatas por email
    const index = lista.findIndex(t => t.email.toLowerCase() === testador.email.toLowerCase());
    if (index >= 0) {
      lista[index] = { ...lista[index], ...testador };
    } else {
      lista.push(testador);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return lista;
  }

  function criarOuObterModalTestadores() {
    let modal = document.getElementById('modal-testadores-vip');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-testadores-vip';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md hidden';
      modal.innerHTML = `
        <div class="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-slate-100">
          <!-- Header -->
          <div class="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-300 text-lg">👥</span>
              <div>
                <h3 class="font-black text-sm sm:text-base text-emerald-400">Programa de Testadores VIP</h3>
                <p class="text-[11px] text-slate-400">Grupo fechado de 20 pioneiros para homologação na Google Play</p>
              </div>
            </div>
            <button onclick="fecharModalTestadoresVIP()" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">✕</button>
          </div>

          <!-- Corpo -->
          <div id="corpo-modal-testadores" class="p-4 sm:p-6 overflow-y-auto space-y-4">
            <!-- Barra de Progresso -->
            <div class="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div class="flex justify-between items-center text-xs mb-1.5">
                <span class="font-bold text-slate-300">Vagas Confirmadas</span>
                <span id="label-progresso-testadores" class="font-black text-emerald-400">0 / 20</span>
              </div>
              <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div id="barra-progresso-testadores" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-0 transition-all duration-500"></div>
              </div>
              <p class="text-[10px] text-slate-500 mt-2">
                O Google exige 20 testadores participando por 14 dias para liberar o app na Play Store.
              </p>
            </div>

            <!-- Formulário de Inscrição -->
            <form id="form-cadastro-testador" onsubmit="event.preventDefault(); window.cadastrarTestadorVIP();" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Nome Completo</label>
                <input type="text" id="testador-nome" required placeholder="Seu nome" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">E-mail Google Play (Gmail)</label>
                  <input type="email" id="testador-email" required placeholder="seu.email@gmail.com" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-300 mb-1">WhatsApp (com DDD)</label>
                  <input type="tel" id="testador-whatsapp" required placeholder="(11) 99999-9999" class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500">
                </div>
              </div>
              <button type="submit" class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition">
                🎯 Confirmar Minha Vaga como Testador VIP
              </button>
            </form>

            <!-- Ações Rápidas -->
            <div class="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <button type="button" onclick="window.compartilharConviteTestadoresWhatsApp()" class="flex-1 py-2 px-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition">
                <span>💬 Convidar Amigos no WhatsApp</span>
              </button>
              <button type="button" onclick="window.exportarListaGooglePlayCSV()" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
                <span>📋 Exportar CSV Play Console</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  function atualizarVisualProgresso() {
    const lista = obterTestadores();
    const count = lista.length;
    const pct = Math.min(100, Math.round((count / META_TESTADORES) * 100));

    const label = document.getElementById('label-progresso-testadores');
    const barra = document.getElementById('barra-progresso-testadores');

    if (label) label.innerText = `${count} / ${META_TESTADORES} (${pct}%)`;
    if (barra) barra.style.width = `${pct}%`;
  }

  window.fecharModalTestadoresVIP = function () {
    const modal = document.getElementById('modal-testadores-vip');
    if (modal) modal.classList.add('hidden');
  };

  window.abrirProgramaTestadoresVIP = function () {
    const modal = criarOuObterModalTestadores();
    atualizarVisualProgresso();
    modal.classList.remove('hidden');
  };

  window.cadastrarTestadorVIP = async function () {
    const nomeEl = document.getElementById('testador-nome');
    const emailEl = document.getElementById('testador-email');
    const zapEl = document.getElementById('testador-whatsapp');

    if (!nomeEl || !emailEl || !zapEl) return;

    const testador = {
      nome: nomeEl.value.trim(),
      email: emailEl.value.trim(),
      whatsapp: zapEl.value.trim(),
      cadastradoEm: new Date().toISOString()
    };

    if (!testador.email.includes('@')) {
      alert('Por favor, informe um e-mail válido.');
      return;
    }

    salvarTestadorLocal(testador);
    atualizarVisualProgresso();

    // Sincroniza com Supabase se disponível
    try {
      if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
        await window.supabaseClient.from('visitor_leads').insert([{
          name: testador.nome,
          email: testador.email,
          phone: testador.whatsapp,
          source: 'google_play_tester',
          consent: true
        }]);
      }
    } catch (e) {
      console.warn('Sync remoto testador:', e);
    }

    nomeEl.value = '';
    emailEl.value = '';
    zapEl.value = '';

    if (typeof window.toast === 'function') {
      window.toast('🎉 Vaga confirmada no Programa de Testadores!', '');
    }
    if (typeof window.tocarBeep === 'function') window.tocarBeep('success');
  };

  window.compartilharConviteTestadoresWhatsApp = function () {
    const texto = 
      `*Convite Exclusivo - Meu Volante PRO*\n\n` +
      `Fui convidado para o grupo pioneiro de 20 testadores do *Meu Volante PRO* antes do lançamento na Google Play Store!\n\n` +
      `Se você aposta na Mega-Sena ou Lotofácil e quer testar as matrizes gratuitamente, garanta uma das 20 vagas:\n` +
      `${window.location.origin}${window.location.pathname}?programa=testadores`;

    if (typeof window.abrirWhatsApp === 'function') {
      window.abrirWhatsApp({ texto: texto });
    } else {
      window.location.href = `whatsapp://send?text=${encodeURIComponent(texto)}`;
    }
  };

  window.exportarListaGooglePlayCSV = function () {
    const lista = obterTestadores();
    if (lista.length === 0) {
      if (typeof window.toast === 'function') {
        window.toast('Nenhum testador cadastrado ainda.', '⚠️');
      } else {
        alert('Nenhum testador cadastrado ainda.');
      }
      return;
    }

    // Google Play Console espera uma lista simples de e-mails, 1 por linha ou CSV
    const csvContent = "data:text/csv;charset=utf-8," + lista.map(t => t.email).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `google_play_testadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window.toast === 'function') {
      window.toast(`Exportados ${lista.length} e-mails para o Google Play Console!`, '📋');
    }
  };

  // Abre automaticamente se vier com ?programa=testadores na URL
  window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('programa') === 'testadores') {
      setTimeout(() => {
        window.abrirProgramaTestadoresVIP();
      }, 500);
    }
  });
})();
