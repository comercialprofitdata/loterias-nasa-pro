// ===================================================================
// ACESSO VIP
// ===================================================================
// O código é conferido no servidor. Aqui fica só o resultado, revalidado a cada
// abertura: um código desativado no painel perde o acesso na próxima vez.

const VIP_CHAVE = 'meu_volante_vip';

function lerVip() {
  try { return JSON.parse(localStorage.getItem(VIP_CHAVE) || 'null'); } catch { return null; }
}

function vipVigente() {
  const vip = lerVip();
  return Boolean(vip) && (!vip.validoAte || new Date(vip.validoAte) > new Date());
}

function obterVipAtivo() {
  const vip = lerVip();
  return vipVigente() ? { validoAte: vip.validoAte || null } : null;
}
window.obterVipAtivo = obterVipAtivo;

function rotuloAcessoVip(vip) {
  if (!vip) return 'Sem conta conectada';
  const validade = vip.validoAte
    ? `até ${new Date(vip.validoAte).toLocaleDateString('pt-BR')}`
    : 'vitalício';
  return `Sem conta • VIP por cupom ${validade}`;
}
window.rotuloAcessoVip = rotuloAcessoVip;

async function conferirCodigoVip(codigo) {
  const contato = JSON.parse(localStorage.getItem('loterias_nasa_visitor_lead') || 'null');
  const { data, error } = await obterClienteSupabase().rpc('resgatar_codigo_vip', {
    p_codigo: codigo,
    p_aparelho: idDoAparelho(),
    p_contato: contato?.email || contato?.telefone || null
  });
  if (error) throw error;
  return data;
}

function liberarVip() {
  planoUsuario = 'pro';
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao) usuarioSessao.plano = 'pro';
  window.atualizarVisualPlano?.();
  window.aplicarGateCientificoNasa?.();
  window.sincronizarHeaderStatusUsuario?.();
  window.atualizarDadosDrawer?.();
}

async function revalidarVipSalvo() {
  const salvo = lerVip();
  if (!salvo) return false;
  if (vipVigente()) liberarVip();

  try {
    const resposta = await conferirCodigoVip(salvo.codigo);
    if (resposta?.ok) {
      localStorage.setItem(VIP_CHAVE, JSON.stringify({ codigo: salvo.codigo, validoAte: resposta.valido_ate }));
      liberarVip();
      return true;
    }

    localStorage.removeItem(VIP_CHAVE);
    const contaRestaurada = await window.restaurarSessaoSupabase?.();
    if (!contaRestaurada) {
      if (typeof window.aplicarPlano === 'function') window.aplicarPlano(false, 'cupom VIP recusado');
      else {
        planoUsuario = 'free';
        window.atualizarVisualPlano?.();
        window.aplicarGateCientificoNasa?.();
      }
      window.sincronizarHeaderStatusUsuario?.();
      window.atualizarDadosDrawer?.();
    }
    return false;
  } catch (error) {
    console.warn('Não foi possível revalidar o acesso VIP; mantendo o último resultado válido:', error.message);
    return vipVigente();
  }
}

async function resgatarVip(codigo) {
  const limpo = String(codigo || '').trim().toUpperCase();
  if (!limpo) return { ok: false, mensagem: 'Digite o código.' };
  try {
    const resposta = await conferirCodigoVip(limpo);
    if (!resposta?.ok) {
      const mensagens = { usado: 'Este código já foi usado.', expirado: 'Este código expirou.' };
      return { ok: false, mensagem: mensagens[resposta?.motivo] || 'Código inválido.' };
    }
    localStorage.setItem(VIP_CHAVE, JSON.stringify({ codigo: limpo, validoAte: resposta.valido_ate }));
    liberarVip();
    window.registrarEvento?.('resgatou_vip');
    return { ok: true, mensagem: `Acesso VIP ativado, ${resposta.nome}!` };
  } catch {
    return { ok: false, mensagem: 'Não foi possível conferir agora. Tente de novo.' };
  }
}
window.resgatarCupomVip = async (codigo) => {
  const resultado = await resgatarVip(codigo);
  toast(resultado.mensagem, resultado.ok ? '✅' : '⚠️');
  return resultado.ok;
};

function abrirResgateVip() {
  window.fecharModalUpgrade?.();
  window.fecharDrawerPerfil?.();
  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <form class="folha">
      <h2>Código VIP</h2>
      <label for="campo-vip">Digite o código que você recebeu</label>
      <input id="campo-vip" type="text" autocomplete="off" autocapitalize="characters" placeholder="VIP-XXXXXXXXXXXX" />
      <p class="gastos-nota" id="vip-mensagem" role="status"></p>
      <button type="submit">Ativar</button>
      <button type="button" class="folha-sair">Agora não</button>
    </form>`;
  document.body.appendChild(fundo);
  fundo.querySelector('.folha-sair').addEventListener('click', () => fundo.remove());
  fundo.querySelector('form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const resultado = await resgatarVip(fundo.querySelector('input').value);
    fundo.querySelector('#vip-mensagem').textContent = resultado.mensagem;
    if (resultado.ok) setTimeout(() => fundo.remove(), 1200);
  });
  fundo.querySelector('input').focus();
}
window.abrirResgateVip = abrirResgateVip;

function botaoVip() {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'fluxo-link vip-link';
  botao.textContent = 'Tenho um código VIP';
  botao.addEventListener('click', abrirResgateVip);
  return botao;
}

document.addEventListener('DOMContentLoaded', () => setTimeout(async () => {
  // A assinatura não pode rebaixar quem tem VIP vigente.
  const aplicar = window.aplicarPlano;
  if (typeof aplicar === 'function') {
    window.aplicarPlano = (ehPro, origem) => aplicar(ehPro || vipVigente(), origem);
  }

  const abrirPlanos = window.abrirModalUpgrade;
  if (typeof abrirPlanos === 'function') {
    window.abrirModalUpgrade = function (...args) {
      const retorno = abrirPlanos.apply(this, args);
      const rodape = document.querySelector('#modal-upgrade-nasa .modal-upgrade-footer');
      if (rodape && !rodape.parentElement.querySelector('.vip-link')) rodape.before(botaoVip());
      return retorno;
    };
  }

  const abrirMenu = window.abrirDrawerPerfil;
  if (typeof abrirMenu === 'function') {
    window.abrirDrawerPerfil = function (...args) {
      const retorno = abrirMenu.apply(this, args);
      const linha = document.getElementById('drawer-admin-row');
      if (linha && !linha.parentElement.querySelector('.vip-link')) linha.before(botaoVip());
      return retorno;
    };
  }

  // Link enviado ao testador: ?vip=CODIGO
  const parametros = new URLSearchParams(window.location.search);
  const doLink = parametros.get('vip');
  if (doLink) {
    parametros.delete('vip');
    const resto = parametros.toString();
    history.replaceState(history.state, '', window.location.pathname + (resto ? `?${resto}` : ''));
    await window.resgatarCupomVip(doLink);
    return;
  }

  await revalidarVipSalvo();
}, 400));
