// ===================================================================
// UPGRADE MODAL - Mobile-First High-Converting Paywall & Plans
// ===================================================================

const UPGRADE_CONFIG = {
  plans: [
    {
      id: 'avulso',
      name: 'Passe Avulso 1 Jogo',
      price: 'R$ 5,90',
      period: 'pagamento único',
      badge: 'EXPERIMENTAR',
      icon: '🎯',
      color: 'emerald',
      cta: 'Liberar 1 Jogo',
      features: [
        '3 apostas geradas',
        'Todos os indicadores do jogo',
        'Score de eficiência e raio-x detalhado'
      ]
    },
    {
      id: 'mensal',
      name: 'Astronauta PRO',
      price: 'R$ 29,90',
      period: '/mês · recorrente',
      badge: '',
      icon: '🚀',
      color: 'cyan',
      featured: true,
      cta: 'Assinar Plano PRO',
      features: [
        'Geração ilimitada de apostas e matrizes 4x4',
        'Bateria completa dos 6 testes em tempo real',
        'Fechamentos matemáticos C(n,k) ilimitados',
        'Conferência instantânea e carteira em nuvem'
      ]
    },
    {
      id: 'anual',
      name: 'Apollo VIP Anual',
      price: 'R$ 197',
      period: '/ano · R$ 16,41/mês',
      badge: 'ECONOMIZE 45%',
      icon: '👑',
      color: 'amber',
      cta: 'Assinar anual',
      features: [
        'Todos os recursos do plano PRO liberados',
        'Economia direta de 45% (R$ 16,41/mês)',
        'Carteira e bolões sem limite'
      ]
    }
  ]
};

// Initialize upgrade modal on load
document.addEventListener('DOMContentLoaded', function() {
  createUpgradeModal();
  console.log('✅ Upgrade modal initialized (Mobile-First)');
});

/**
 * Create upgrade modal HTML
 */
function createUpgradeModal() {
  if (document.getElementById('modal-upgrade-nasa')) return;

  const modal = document.createElement('div');
  modal.id = 'modal-upgrade-nasa';
  modal.className = 'modal-upgrade-backdrop';
  modal.innerHTML = generateUpgradeModalHTML();

  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) fecharModalUpgrade();
  });
}

/**
 * Generate upgrade modal HTML
 */
function generateUpgradeModalHTML() {
  return `
    <div class="modal-upgrade-content">
      <!-- Top Bar: Non-overlapping Badge + Clean Close Button -->
      <div class="modal-upgrade-topbar">
        <div class="modal-upgrade-badge">
          <span>🔬</span>
          <span>PLANOS NASA PRO</span>
        </div>
        <button id="btn-close-upgrade-modal" class="modal-upgrade-close" title="Fechar" type="button" onclick="fecharModalUpgrade(); tocarBeep('click');">
          ✕
        </button>
      </div>

      <!-- Header -->
      <div class="modal-upgrade-header">
        <h2 class="modal-upgrade-title">Organize seus jogos sem limite</h2>
        <p class="modal-upgrade-subtitle">
          Mais jogos, carteira e bolões. Isso não aumenta suas chances.
        </p>
      </div>

      <!-- Paid Plans -->
      <div class="modal-upgrade-plans">
        ${UPGRADE_CONFIG.plans.map(plan => `
          <div class="modal-upgrade-plan-card modal-upgrade-plan-${plan.color} ${plan.featured ? 'modal-upgrade-plan-featured' : ''}">
            <div class="modal-upgrade-plan-top">
              <div class="modal-upgrade-plan-info">
                <span class="modal-upgrade-plan-icon">${plan.icon}</span>
                <div>
                  <h3 class="modal-upgrade-plan-name">${plan.name}</h3>
                  <div class="modal-upgrade-plan-price-row">
                    <span class="modal-upgrade-price-value">${plan.price}</span>
                    <span class="modal-upgrade-price-period">${plan.period}</span>
                  </div>
                </div>
              </div>
              ${plan.badge ? `<span class="modal-upgrade-plan-badge modal-badge-${plan.color}">${plan.badge}</span>` : ''}
            </div>

            <ul class="modal-upgrade-plan-features">
              ${plan.features.map(f => `<li><span class="check-icon">✓</span> <span>${f}</span></li>`).join('')}
            </ul>

            <button type="button" class="modal-upgrade-plan-cta modal-upgrade-cta-${plan.color}"
                    onclick="processarUpgrade('${plan.id}'); tocarBeep('click');">
              ${plan.cta}
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Free Tier Compact Box -->
      <div class="modal-upgrade-free-box">
        <div class="modal-upgrade-free-info">
          <span class="free-gift-icon">🎁</span>
          <div>
            <strong>Plano Gratuito Ativo</strong>
            <p>Cadastre-se para ganhar 3 análises completas de cortesia.</p>
          </div>
        </div>
      </div>

      <!-- Footer Trust Signals -->
      <div class="modal-upgrade-footer">
        <div class="modal-upgrade-trust">
          <span>⚡ PIX instantâneo</span>
          <span>•</span>
          <span>🔒 Checkout Seguro Asaas</span>
          <span>•</span>
          <span>🛡️ Cancele a qualquer momento</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Open upgrade modal
 */
function abrirModalUpgrade(origin = 'home') {
  let modal = document.getElementById('modal-upgrade-nasa');
  if (!modal) {
    createUpgradeModal();
    modal = document.getElementById('modal-upgrade-nasa');
  }

  if (modal) {
    // Reset to plan selection if it was displaying checkout
    const content = modal.querySelector('.modal-upgrade-content');
    if (content && !content.querySelector('.modal-upgrade-plans')) {
      modal.innerHTML = generateUpgradeModalHTML();
      document.getElementById('btn-close-upgrade-modal')?.addEventListener('click', fecharModalUpgrade);
    }

    modal.classList.add('modal-upgrade-active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    tocarBeep('whoosh');
    console.log(`📊 Upgrade modal opened from: ${origin}`);
  }
}

/**
 * Close upgrade modal
 */
function fecharModalUpgrade() {
  const modal = document.getElementById('modal-upgrade-nasa');
  if (modal) {
    modal.classList.remove('modal-upgrade-active');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    console.log('✅ Upgrade modal closed');
  }
}

/**
 * Process upgrade selection
 */
function processarUpgrade(planId) {
  console.log(`🎯 Upgrade selected: ${planId}`);

  if (planId === 'free') {
    fecharModalUpgrade();
    toast('Você já tem o plano gratuito ativo', '🏠');
    return;
  }

  // REGRA DE OURO FREEMIUM: O usuário precisa ter uma conta antes de ir para qualquer cobrança!
  const usuarioNaoLogado = !usuarioSessao || usuarioSessao.tipo === 'visitante' || !usuarioSessao.email;
  if (usuarioNaoLogado) {
    fecharModalUpgrade();
    toast('Crie sua conta grátis em 1 toque antes de assinar!', '🎁');
    setTimeout(() => {
      if (typeof abrirModalAuth === 'function') {
        abrirModalAuth();
      } else if (typeof abrirModalAuthOuPerfil === 'function') {
        abrirModalAuthOuPerfil();
      }
    }, 300);
    return;
  }

  if (typeof mostrarCheckoutReal === 'function') {
    mostrarCheckoutReal(planId);
  } else {
    toast('Carregando gateway de pagamento...', '⏳');
  }
}

function mostrarCheckoutAvulso() {
  return processarUpgrade('avulso');
}

function mostrarCheckoutAnual() {
  return processarUpgrade('anual');
}

console.log('🎨 Upgrade modal module loaded');
