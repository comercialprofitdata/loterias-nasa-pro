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
  // Cancelada continua valendo até o fim do período já pago.
  if (registro.status === 'canceled') return Boolean(registro.valid_until) && new Date(registro.valid_until).getTime() > Date.now();
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

async function cancelarAssinatura() {
  const cliente = obterClienteSupabase();
  const { data } = await cliente.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) {
    toast('Entre na sua conta para cancelar.', '⚠️');
    return;
  }
  const resposta = await fetch(`${window.NASA_SUPABASE_CONFIG.url}/functions/v1/cancelar-assinatura`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: window.NASA_SUPABASE_CONFIG.anonKey }
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    toast(corpo.erro || 'Não foi possível cancelar agora.', '⚠️');
    return;
  }
  const ate = corpo.validaAte ? new Date(corpo.validaAte).toLocaleDateString('pt-BR') : null;
  toast(ate ? `Renovação cancelada. Seu acesso vale até ${ate}.` : 'Renovação cancelada.', '✅');
  document.getElementById('drawer-cancelar-assinatura')?.remove();
}

async function mostrarCancelamentoNoMenu() {
  const cliente = obterClienteSupabase();
  const linha = document.getElementById('drawer-admin-row');
  if (!cliente || !linha || document.getElementById('drawer-cancelar-assinatura')) return;
  const { data: sessao } = await cliente.auth.getSession();
  if (!sessao?.session?.user) return;
  const { data } = await cliente.from('subscriptions').select('provider_subscription_id')
    .eq('user_id', sessao.session.user.id).eq('status', 'active').like('provider_subscription_id', 'sub_%').limit(1);
  if (!data?.length) return;
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'drawer-cancelar-assinatura';
  botao.className = 'gastos-editar';
  botao.style.width = '100%';
  botao.style.marginTop = '12px';
  botao.textContent = 'Cancelar assinatura';
  botao.addEventListener('click', () => confirmarAcaoDialog(
    'A renovação será cancelada. Você mantém o acesso até o fim do período já pago.',
    cancelarAssinatura,
    'Cancelar assinatura',
    'Cancelar renovação'
  ));
  linha.before(botao);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  const abrir = window.abrirDrawerPerfil;
  if (typeof abrir !== 'function') return;
  window.abrirDrawerPerfil = function (...args) {
    const retorno = abrir.apply(this, args);
    mostrarCancelamentoNoMenu();
    return retorno;
  };
}, 300));
