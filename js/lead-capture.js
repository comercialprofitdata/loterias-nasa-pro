// ===================================================================
// LEAD CAPTURE - Email/WhatsApp Collection on Home
// ===================================================================
// Estratégia: apareça na HOME, pega email + WhatsApp, oferece 1 jogo grátis
// Salva como visitor_lead no Supabase, localStorage marca como "já visto"

function mostrarModalLeadCapture() {
  // Check: já viu esse lead modal nessa sessão?
  const jaMostrou = sessionStorage.getItem('lead_modal_mostrado');
  if (jaMostrou) return;

  // Check: já é usuário logado?
  if (usuarioSessao && usuarioSessao.tipo !== 'visitante') return;

  // Criar modal
  const modal = document.createElement('div');
  modal.id = 'modal-lead-capture';
  modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-800/60 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl relative overflow-hidden font-sans">
      <!-- Fechar -->
      <button type="button" onclick="fecharModalLeadCapture()" class="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition">✕</button>

      <!-- Glow -->
      <div class="w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl absolute -top-20 -left-20 pointer-events-none"></div>

      <!-- Header -->
      <div class="text-center space-y-2 relative z-10 pt-2">
        <div class="text-4xl">🎯</div>
        <h2 class="text-xl font-black text-white">Comece Agora</h2>
        <p class="text-sm text-slate-300">Gere seu 1º jogo grátis e receba dicas exclusivas</p>
      </div>

      <!-- Form -->
      <form onsubmit="submeterLeadCapture(event)" class="space-y-3 relative z-10">
        <div>
          <label for="lead-nome" class="text-xs uppercase font-bold text-slate-400 block mb-1.5">Nome</label>
          <input id="lead-nome" type="text" required minlength="2" maxlength="120" placeholder="Como quer ser chamado" class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-sans text-sm" />
        </div>

        <div>
          <label for="lead-email" class="text-xs uppercase font-bold text-slate-400 block mb-1.5">Email</label>
          <input id="lead-email" type="email" required placeholder="seu@email.com" class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-sans text-sm" />
        </div>

        <div>
          <label for="lead-whatsapp" class="text-xs uppercase font-bold text-slate-400 block mb-1.5">WhatsApp <span class="text-slate-500">(opcional)</span></label>
          <input id="lead-whatsapp" type="tel" inputmode="tel" maxlength="20" placeholder="(00) 99999-9999" class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-sans text-sm" />
        </div>

        <label class="flex items-start gap-2 text-xs text-slate-400 leading-relaxed pt-1">
          <input id="lead-consent" type="checkbox" required class="mt-1.5 w-4 h-4 accent-emerald-500 cursor-pointer" />
          <span class="cursor-pointer">Aceito receber análises e ofertas exclusivas por email e WhatsApp</span>
        </label>

        <button type="submit" class="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-2 mt-4">
          <span>✨</span> Gerar Meu 1º Jogo Grátis
        </button>
      </form>

      <!-- Trust signals -->
      <div class="text-center text-[11px] text-slate-500 space-y-1 relative z-10 pt-2 border-t border-slate-800">
        <div>✓ Sem cartão de crédito</div>
        <div>✓ Acesso imediato ao volante</div>
        <div>✓ Seus dados 100% seguros (LGPD)</div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  sessionStorage.setItem('lead_modal_mostrado', 'true');
  tocarBeep('notification');
}

function fecharModalLeadCapture() {
  const modal = document.getElementById('modal-lead-capture');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => modal.remove(), 300);
  }
}

async function submeterLeadCapture(event) {
  event.preventDefault();
  tocarSomNasa('beep');

  const nome = document.getElementById('lead-nome')?.value.trim();
  const email = document.getElementById('lead-email')?.value.trim().toLowerCase();
  const whatsapp = document.getElementById('lead-whatsapp')?.value.trim() || '';
  const consent = document.getElementById('lead-consent')?.checked;

  if (!nome || nome.length < 2 || !email || !consent) {
    toast('Preencha nome, email e aceite os termos', '⚠️');
    return;
  }

  // Validar email básico
  if (!email.includes('@')) {
    toast('Email inválido', '⚠️');
    return;
  }

  // O banco valida phone entre 8 e 20 caracteres: um número pela metade
  // faria o insert inteiro falhar e o lead ser perdido.
  const whatsappDigitos = whatsapp.replace(/\D/g, '');
  if (whatsapp && whatsappDigitos.length < 10) {
    toast('WhatsApp incompleto. Corrija ou deixe em branco.', '⚠️');
    return;
  }

  try {
    // Salvar localmente
    const lead = {
      nome,
      email,
      whatsapp,
      consentimento: true,
      consentimentoEm: new Date().toISOString()
    };
    localStorage.setItem('loterias_nasa_visitor_lead', JSON.stringify(lead));

    // Tentar sincronizar com Supabase
    const cliente = obterClienteSupabase();
    let sincronizado = false;
    if (cliente) {
      const registro = {
        name: nome,
        email: email,
        marketing_consent: true,
        consent_at: lead.consentimentoEm,
        source: 'home_lead_capture'
      };
      // phone é opcional no formulário: só enviar quando preenchido, senão
      // o check de tamanho do banco rejeita a linha.
      if (whatsapp) registro.phone = whatsapp;

      const { error } = await cliente
        .from('visitor_leads')
        .upsert(registro, { onConflict: 'email', ignoreDuplicates: true });

      if (error) console.warn('Lead não sincronizado:', error.message);
      sincronizado = !error;
    }

    // Criar usuário visitante
    usuarioSessao = {
      nome: nome,
      email: email,
      telefone: whatsapp,
      avatar: '✨',
      tipo: 'visitante',
      plano: 'free'
    };
    localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
    atualizarPerfilUsuarioUI();

    // Fechar modal
    fecharModalLeadCapture();

    // Mensagem e redirecionar
    tocarSomNasa('sucesso');
    toast(sincronizado ? '🎉 Bem-vindo! Seu 1º jogo já está liberado' : '🎉 Pronto! Seu jogo está disponível', '✨');

    // Ir pra tela "Gerar"
    setTimeout(() => {
      if (typeof activateTab === 'function') {
        activateTab('gerar');
      }
    }, 800);

  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    toast('Erro ao processar. Tente novamente', '⚠️');
  }
}

// ===================================================================
// TRIGGER: mostrar modal ao carregar home (1x por sessão)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Aguardar um pouco pra não aparecer muito rápido
  setTimeout(() => {
    // Só mostrar se estamos na home (tab ativo)
    const tabAtivo = document.getElementById('tab-home')?.classList.contains('active');
    if (tabAtivo || typeof abaAtual === 'undefined') {
      mostrarModalLeadCapture();
    }
  }, 1200);

  // Se usuário clicar na aba HOME depois, mostrar novamente (1x)
  const tabHomeBtn = document.getElementById('tab-home');
  if (tabHomeBtn) {
    tabHomeBtn.addEventListener('click', () => {
      const jaMostrou = sessionStorage.getItem('lead_modal_mostrou_desta_vez');
      if (!jaMostrou && !usuarioSessao?.email) {
        setTimeout(() => mostrarModalLeadCapture(), 500);
        sessionStorage.setItem('lead_modal_mostrou_desta_vez', 'true');
      }
    });
  }
});

console.log('📧 Lead Capture module loaded');
