// ===================================================================
// ASSINATURA - o servidor decide quem é PRO
// ===================================================================
// Até aqui o plano vinha de planoUsuario (memória) e de localStorage. Com
// pagamento real isso não se sustenta: localStorage é editável pelo usuário
// e não acompanha a pessoa entre aparelhos. A tabela subscriptions, escrita
// só pelo webhook do gateway, passa a ser a fonte da verdade.
//
// Limite honesto: o app é client-side, então quem abrir o console ainda
// consegue forçar planoUsuario e ver as análises, que são calculadas no
// próprio navegador. Isso barra a burla casual e sincroniza o acesso entre
// dispositivos — não substitui validação no servidor para dado sensível.

const ASSINATURA_CONFIG = {
  chaveCache: 'nasa_assinatura_cache',
  revalidarAposMs: 6 * 60 * 60 * 1000
};

function planosQueDaoPro(planCode) {
  return ['avulso', 'mensal', 'anual', 'pro'].includes(String(planCode || '').toLowerCase());
}

function assinaturaVigente(registro) {
  if (!registro) return false;
  if (registro.status !== 'active' && registro.status !== 'trial') return false;
  if (!registro.valid_until) return true;
  return new Date(registro.valid_until).getTime() > Date.now();
}

function aplicarPlano(ehPro, origem) {
  const alvo = ehPro ? 'pro' : 'free';

  if (typeof planoUsuario !== 'undefined' && planoUsuario === alvo) return;

  planoUsuario = alvo;
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao) {
    usuarioSessao.plano = alvo;
  }

  if (typeof atualizarVisualPlano === 'function') atualizarVisualPlano();
  if (typeof aplicarGateCientificoNasa === 'function') aplicarGateCientificoNasa();

  console.log(`Plano definido como ${alvo} (${origem})`);
}

async function sincronizarAssinatura({ silencioso = true } = {}) {
  const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
  if (!cliente) return null;

  try {
    const { data: sessao } = await cliente.auth.getSession();
    if (!sessao?.session?.user) {
      // Visitante: o trial local do science-gate segue valendo.
      return null;
    }

    const { data, error } = await cliente
      .from('subscriptions')
      .select('plan_code, status, valid_until')
      .eq('user_id', sessao.session.user.id)
      .order('valid_until', { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);

    const assinatura = data?.[0];
    const ehPro = assinaturaVigente(assinatura) && planosQueDaoPro(assinatura.plan_code);

    aplicarPlano(ehPro, 'servidor');

    try {
      localStorage.setItem(
        ASSINATURA_CONFIG.chaveCache,
        JSON.stringify({ ehPro, verificadoEm: Date.now() })
      );
    } catch {
      // Cache é conveniência; seguir sem ele é aceitável.
    }

    if (!silencioso) {
      toast(ehPro ? 'Assinatura ativa confirmada' : 'Nenhuma assinatura ativa', ehPro ? '✅' : 'ℹ️');
    }

    return ehPro;
  } catch (err) {
    console.warn('Não foi possível verificar a assinatura:', err.message);

    // Offline: mantém o último veredito do servidor por uma janela curta,
    // para o assinante não perder acesso por queda de rede.
    try {
      const cache = JSON.parse(localStorage.getItem(ASSINATURA_CONFIG.chaveCache) || 'null');
      if (cache && Date.now() - cache.verificadoEm < ASSINATURA_CONFIG.revalidarAposMs) {
        aplicarPlano(cache.ehPro, 'cache offline');
        return cache.ehPro;
      }
    } catch {
      // Cache ilegível: segue sem ele.
    }

    return null;
  }
}

/** Chamado após o retorno do checkout, quando o webhook pode ainda não ter chegado. */
async function aguardarConfirmacaoPagamento({ tentativas = 6, intervaloMs = 5000 } = {}) {
  toast('Confirmando seu pagamento...', '⏳');

  for (let i = 0; i < tentativas; i++) {
    const ehPro = await sincronizarAssinatura({ silencioso: true });

    if (ehPro) {
      tocarSomNasa('sucesso');
      toast('Pagamento confirmado! Acesso PRO liberado.', '🎉');
      return true;
    }

    await new Promise((resolver) => setTimeout(resolver, intervaloMs));
  }

  // PIX costuma confirmar em segundos; cartão pode passar por análise.
  toast(
    'Pagamento em processamento. O acesso é liberado assim que o banco confirmar.',
    '⏳'
  );
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  // No app da loja não há venda: a assinatura não pode rebaixar o acesso liberado.
  if (window.contextoLoja?.ativo()) return;

  setTimeout(() => sincronizarAssinatura({ silencioso: true }), 1200);

  // Voltando do checkout do Asaas em outra aba/janela.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) sincronizarAssinatura({ silencioso: true });
  });
});

window.assinatura = {
  sincronizar: () => sincronizarAssinatura({ silencioso: false }),
  aguardarPagamento: aguardarConfirmacaoPagamento
};

console.log('💳 Assinatura carregada. Debug: window.assinatura.sincronizar()');
