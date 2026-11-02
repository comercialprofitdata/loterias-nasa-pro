// ===================================================================
// CONTA: menu, senha e acesso do dono
// ===================================================================

function mostrarAcessoDono() {
  document.getElementById('drawer-admin-row')?.classList.remove('hidden');
  document.getElementById('sidebar-nav-admin')?.classList.remove('hidden');
}

// O servidor diz quem é dono: vale para qualquer forma de entrar na conta.
async function conferirDono() {
  const cliente = obterClienteSupabase();
  if (!cliente) return;
  const { data: sessao } = await cliente.auth.getSession();
  if (!sessao?.session) return;
  const { data } = await cliente.rpc('is_owner');
  if (data === true) mostrarAcessoDono();
}

// O pagamento precisa de conta com senha, para a compra valer em qualquer aparelho.
function pedirContaParaComprar(plano) {
  sessionStorage.setItem('meu_volante_plano_pendente', plano);
  window.fecharModalUpgrade?.();
  window.abrirModalAuth?.();
  window.alternarAbaAuth?.('cadastrar');
  const contato = JSON.parse(localStorage.getItem('loterias_nasa_visitor_lead') || 'null');
  const nome = document.getElementById('input-auth-nome');
  const email = document.getElementById('input-auth-email');
  if (nome && contato?.nome) nome.value = contato.nome;
  if (email && contato?.email) email.value = contato.email;
  toast('Crie uma senha para concluir a compra. Se já tem conta, toque em Entrar.', '🔒');
}
window.pedirContaParaComprar = pedirContaParaComprar;

function retomarCompra() {
  const plano = sessionStorage.getItem('meu_volante_plano_pendente');
  if (!plano) return;
  sessionStorage.removeItem('meu_volante_plano_pendente');
  setTimeout(() => {
    window.abrirModalUpgrade?.('retomar');
    window.mostrarCheckoutReal?.(plano);
  }, 800);
}

function acaoContaNoMenu() {
  window.fecharDrawerPerfil?.();
  if (!usuarioSessao || usuarioSessao.tipo === 'visitante') {
    window.abrirModalAuth?.();
    return;
  }
  confirmarAcaoDialog('Deseja sair da sua conta?', () => fazerLogout(), 'Sair', 'Sair da conta');
}
window.acaoContaNoMenu = acaoContaNoMenu;

function ligarVerSenha(campo) {
  if (!campo || campo.dataset.verSenha) return;
  campo.dataset.verSenha = '1';
  const caixa = document.createElement('div');
  caixa.className = 'senha-caixa';
  campo.before(caixa);
  caixa.appendChild(campo);
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'senha-ver';
  botao.textContent = 'Ver';
  botao.setAttribute('aria-label', 'Mostrar senha');
  botao.addEventListener('click', () => {
    const oculta = campo.type === 'password';
    campo.type = oculta ? 'text' : 'password';
    botao.textContent = oculta ? 'Ocultar' : 'Ver';
    botao.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');
  });
  caixa.appendChild(botao);
}

async function esqueciSenha() {
  const email = document.getElementById('input-auth-email')?.value.trim();
  if (!email) {
    toast('Digite seu e-mail e toque de novo em Esqueci a senha.', '⚠️');
    document.getElementById('input-auth-email')?.focus();
    return;
  }
  const { error } = await obterClienteSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`
  });
  toast(error ? 'Não foi possível enviar agora. Tente mais tarde.' : 'Se a conta existir, enviamos o link para o seu e-mail.', error ? '⚠️' : '✅');
}

function abrirNovaSenha() {
  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <form class="folha">
      <h2>Criar nova senha</h2>
      <label for="campo-nova-senha">Mínimo de 8 caracteres</label>
      <input id="campo-nova-senha" type="password" minlength="8" required autocomplete="new-password" />
      <p class="gastos-nota" id="nova-senha-mensagem" role="status"></p>
      <button type="submit">Salvar senha</button>
    </form>`;
  document.body.appendChild(fundo);
  const campo = fundo.querySelector('input');
  ligarVerSenha(campo);
  fundo.querySelector('form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const { error } = await obterClienteSupabase().auth.updateUser({ password: campo.value });
    if (error) {
      fundo.querySelector('#nova-senha-mensagem').textContent = 'Não foi possível salvar. Peça um novo link.';
      return;
    }
    toast('Senha alterada.', '✅');
    fundo.remove();
  });
  campo.focus();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  ligarVerSenha(document.getElementById('input-auth-senha'));

  const envio = document.getElementById('btn-submit-auth');
  if (envio && !document.getElementById('auth-esqueci')) {
    const esqueci = document.createElement('button');
    esqueci.type = 'button';
    esqueci.id = 'auth-esqueci';
    esqueci.className = 'fluxo-link vip-link';
    esqueci.textContent = 'Esqueci a senha';
    esqueci.addEventListener('click', esqueciSenha);
    envio.after(esqueci);
  }

  const abrirMenu = window.abrirDrawerPerfil;
  window.abrirDrawerPerfil = function (...args) {
    const retorno = abrirMenu.apply(this, args);
    conferirDono();
    const texto = document.getElementById('drawer-txt-auth');
    if (texto && usuarioSessao && usuarioSessao.tipo !== 'visitante') texto.innerText = 'Sair da conta';
    return retorno;
  };

  const cliente = obterClienteSupabase();
  cliente?.auth.onAuthStateChange((evento) => {
    if (evento === 'PASSWORD_RECOVERY') setTimeout(abrirNovaSenha, 0);
    if (evento === 'SIGNED_IN') {
      conferirDono();
      retomarCompra();
    }
  });
  conferirDono();
}, 500));
