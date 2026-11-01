// ===================================================================
// CONTEXTO DE EXECUÇÃO - app da Play Store x navegador
// ===================================================================
// A política Google Play Payments proíbe cobrar conteúdo digital por fora do
// Play Billing dentro de um app da loja — e proíbe até mencionar o pagamento
// externo ou linkar para ele. Na web essa restrição não existe.
//
// Mesma base de código: no navegador o checkout aparece; dentro do TWA ele é
// removido. Isso permite publicar na loja agora, sem esperar a integração do
// Play Billing, e continuar vendendo pelo site.

/**
 * Detecta execução dentro da Trusted Web Activity (o app Android).
 * O Chrome define document.referrer como android-app://<pacote> quando a
 * página é aberta pela TWA.
 */
function rodandoComoAppDaLoja() {
  try {
    // Grava na sessão: o referrer se perde ao voltar do login ou recarregar.
    if (document.referrer.startsWith('android-app://')) {
      sessionStorage.setItem('nasa_modo_loja', '1');
      return true;
    }

    // Só em ambiente local: em produção, ?loja=1 liberaria o Pro de graça.
    const parametros = new URLSearchParams(window.location.search);
    const ambienteLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (ambienteLocal && parametros.get('loja') === '1') {
      sessionStorage.setItem('nasa_modo_loja', '1');
      return true;
    }

    return sessionStorage.getItem('nasa_modo_loja') === '1';
  } catch {
    return false;
  }
}

const MODO_LOJA = rodandoComoAppDaLoja();

/**
 * Remove da interface tudo que leve a pagamento externo. O plano gratuito e
 * o teste de 3 dias continuam disponíveis: nenhum dos dois cobra nada.
 */
function ocultarVendaExterna() {
  if (!MODO_LOJA) return;

  document.documentElement.classList.add('modo-loja');

  const estilo = document.createElement('style');
  estilo.id = 'estilo-modo-loja';
  estilo.textContent = `
    .modo-loja #btn-status-plano,
    .modo-loja #banner-cta-pro-volante,
    .modo-loja .modal-upgrade-plan-card:not(.modal-upgrade-plan-slate),
    .modo-loja .science-lock-overlay,
    .modo-loja [data-venda-externa] {
      display: none !important;
    }

    /* Sem paywall no app da loja, o conteúdo bloqueado volta a aparecer. */
    .modo-loja .science-lock-blurred > *:not(.science-lock-overlay) {
      filter: none !important;
      user-select: auto !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(estilo);

  // Sem venda no app, não faz sentido manter o conteúdo travado: o usuário
  // da loja recebe o app completo. Cobrar viria depois, pelo Play Billing.
  if (typeof planoUsuario !== 'undefined') {
    planoUsuario = 'pro';
    if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
      usuarioSessao.plano = 'pro';
    }
  }

  if (typeof aplicarGateCientificoNasa === 'function') aplicarGateCientificoNasa();

  console.log('📱 Modo loja: venda externa desativada');
}

/** Chamado pelos pontos que abririam checkout. */
function vendaBloqueadaNaLoja() {
  if (!MODO_LOJA) return false;

  if (typeof toast === 'function') {
    toast('Todos os recursos estão liberados nesta versão.', '✨');
  }
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  ocultarVendaExterna();

  if (!MODO_LOJA) return;

  // Intercepta as aberturas de paywall que restarem em qualquer caminho.
  requestAnimationFrame(() => {
    if (typeof window.abrirModalPaywall === 'function') {
      const original = window.abrirModalPaywall;
      window.abrirModalPaywall = function (...args) {
        if (vendaBloqueadaNaLoja()) return;
        return original.apply(this, args);
      };
    }

    if (typeof window.abrirModalUpgrade === 'function') {
      const original = window.abrirModalUpgrade;
      window.abrirModalUpgrade = function (...args) {
        if (vendaBloqueadaNaLoja()) return;
        return original.apply(this, args);
      };
    }
  });
});

window.contextoLoja = {
  ativo: () => MODO_LOJA,
  forcar: () => {
    sessionStorage.setItem('nasa_modo_loja', '1');
    location.reload();
  },
  desligar: () => {
    sessionStorage.removeItem('nasa_modo_loja');
    location.reload();
  }
};

console.log(`🏷️ Contexto: ${MODO_LOJA ? 'app da loja' : 'navegador'}`);
