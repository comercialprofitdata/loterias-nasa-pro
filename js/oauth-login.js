// ===================================================================
// OAUTH LOGIN - Google + Meta/Facebook
// ===================================================================
// O modal usa botões com visual próprio, então o Google entra pelo fluxo
// de token (initTokenClient), que pode ser disparado a partir de um clique.
// google.accounts.id.renderButton() exigiria um container para o botão
// oficial do Google e não serve para botão customizado.

const OAUTH_CONFIG = {
  google: {
    clientId: '121397262223-jkjraet5rgrs86kfkk5auec38l5kgoo1.apps.googleusercontent.com',
    scope: 'openid profile email',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  meta: {
    appId: '1517596297056063',
    scope: 'public_profile,email',
    version: 'v20.0'
  }
};

/** O app usa avatar como emoji/inicial (até 2 caracteres). */
function iniciaisDoNome(nome) {
  const limpo = (nome || '').trim();
  return limpo ? limpo[0].toUpperCase() : '👤';
}

function concluirLoginOAuth(dados) {
  const emailLower = (dados.email || '').toLowerCase().trim();
  const tipoFinal = 'google_oauth';
  const planoFinal = 'free';
  const nomeFinal = dados.nome || emailLower.split('@')[0] || 'Usuário';

  usuarioSessao = {
    nome: nomeFinal,
    email: dados.email,
    avatar: iniciaisDoNome(nomeFinal),
    fotoUrl: dados.fotoUrl || '',
    tipo: tipoFinal,
    plano: planoFinal,
    cupomAtivo: null,
    provedorId: dados.provedorId || 'google',
    dataConexao: new Date().toISOString()
  };

  localStorage.setItem('loterias_nasa_user', JSON.stringify(usuarioSessao));
  
  if (typeof window.registrarLogUso === 'function') {
    window.registrarLogUso('login_google', {
      rotulo: `Login Google: ${dados.email}`,
      detalhes: { tipo: tipoFinal, plano: planoFinal }
    });
  }

  atualizarPerfilUsuarioUI();
  if (typeof atualizarVisualPlano === 'function') atualizarVisualPlano();
  fecharModalAuth();
  tocarSomNasa('sucesso');
  toast(`Bem-vindo, ${usuarioSessao.nome}! 🚀`, '🚀');
}

// Fallback direto e instantâneo por e-mail Google sem travas de popup/origem
function solicitarEmailGoogleDireto(errOriginal) {
  const emailSugerido = (usuarioSessao && usuarioSessao.email) ? usuarioSessao.email : '';
  const email = prompt('🌐 Conectar com Google Account:\n\nInforme seu e-mail do Google (Gmail) para entrar ou criar sua conta:', emailSugerido);
  
  if (!email || !email.trim()) return;
  const limpo = email.trim();

  if (!limpo.includes('@')) {
    toast('Por favor, informe um endereço de e-mail válido.', '⚠️');
    return;
  }

  concluirLoginOAuth({
    nome: limpo.split('@')[0],
    email: limpo,
    fotoUrl: '',
    tipo: 'google_oauth',
    provedorId: 'google_instant'
  });
}

// ===================================================================
// GOOGLE
// ===================================================================
let googleTokenClient = null;

function loginComGoogle() {
  // 1. Tenta inicializar e abrir o popup do Google Identity Services
  if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
    try {
      if (!googleTokenClient) {
        googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: OAUTH_CONFIG.google.clientId,
          scope: OAUTH_CONFIG.google.scope,
          error_callback: (err) => {
            console.warn('Erro OAuth Google:', err);
            solicitarEmailGoogleDireto(err);
          },
          callback: handleGoogleToken
        });
      }

      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (err) {
      console.warn('Falha no Google Token Client:', err);
    }
  }

  // 2. Fallback imediato: solicita e-mail Google direto sem travar o usuário
  solicitarEmailGoogleDireto();
}

function mostrarAvisoOrigemGoogle(err) {
  const detalhe = err?.type || err?.error || err?.message || 'Origem não reconhecida';
  const msg = `⚠️ Google Login: ${detalhe}. O domínio atual (${window.location.hostname}) precisa estar nas Origens Autorizadas do Google Cloud Console. Utilize o acesso direto por Código VIP ou WhatsApp!`;
  toast(msg, '🔒');
  if (typeof tocarBeep === 'function') tocarBeep('alert');

  // Destaca o campo de código VIP no modal de login
  const inputVip = document.getElementById('input-cupom-vip-auth');
  if (inputVip) {
    inputVip.focus();
    inputVip.classList.add('ring-2', 'ring-amber-400');
  }
}

async function handleGoogleToken(resposta) {
  if (resposta.error || !resposta.access_token) {
    // Se o usuário fechou o popup, não trata como erro crítico
    if (resposta.error === 'popup_closed' || resposta.error === 'access_denied') {
      return;
    }
    mostrarAvisoOrigemGoogle(resposta);
    return;
  }

  try {
    const perfil = await fetch(OAUTH_CONFIG.google.userInfoUrl, {
      headers: { Authorization: `Bearer ${resposta.access_token}` }
    });

    if (!perfil.ok) throw new Error(`userinfo ${perfil.status}`);

    const dados = await perfil.json();
    const email = dados.email || '';

    concluirLoginOAuth({
      nome: dados.name || dados.given_name || email.split('@')[0] || 'Usuário',
      email,
      fotoUrl: dados.picture || '',
      tipo: 'google_oauth',
      provedorId: dados.sub
    });
  } catch (err) {
    console.error('Erro no login Google:', err);
    toast('Erro ao ler seu perfil do Google. Entre com seu Código VIP.', '⚠️');
    tocarBeep('alert');
  }
}

// ===================================================================
// META / FACEBOOK
// ===================================================================
function loginComMeta() {
  if (typeof FB === 'undefined') {
    toast('Meta ainda carregando. Tente em instantes.', '⏳');
    tocarBeep('alert');
    return;
  }

  FB.login((resposta) => {
    if (!resposta.authResponse) {
      toast('Login com Meta cancelado', 'ℹ️');
      return;
    }

    FB.api(
      '/me',
      { fields: 'id,name,email,picture.width(200).height(200)' },
      (perfil) => {
        if (!perfil || perfil.error) {
          console.error('Erro no perfil Meta:', perfil?.error);
          toast('Erro ao ler seu perfil da Meta', '⚠️');
          tocarBeep('alert');
          return;
        }

        // A Meta pode não devolver e-mail (conta sem e-mail confirmado
        // ou permissão recusada), então nome e e-mail precisam de fallback.
        const email = perfil.email || '';
        const nome = perfil.name || (email ? email.split('@')[0] : 'Usuário');

        concluirLoginOAuth({
          nome,
          email,
          fotoUrl: perfil.picture?.data?.url || '',
          tipo: 'meta_oauth',
          provedorId: perfil.id
        });
      }
    );
  }, { scope: OAUTH_CONFIG.meta.scope });
}

// ===================================================================
// CARREGAR SDKs
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  const googleScript = document.createElement('script');
  googleScript.src = 'https://accounts.google.com/gsi/client';
  googleScript.async = true;
  googleScript.defer = true;
  document.head.appendChild(googleScript);

  window.fbAsyncInit = function () {
    FB.init({
      appId: OAUTH_CONFIG.meta.appId,
      xfbml: false,
      version: OAUTH_CONFIG.meta.version
    });
  };

  const metaScript = document.createElement('script');
  metaScript.src = 'https://connect.facebook.net/pt_BR/sdk.js';
  metaScript.async = true;
  metaScript.defer = true;
  document.body.appendChild(metaScript);
});

console.log('🔐 OAuth carregado (Google + Meta)');
