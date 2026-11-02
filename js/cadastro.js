// ===================================================================
// CADASTRO AO SALVAR: e-mail e telefone validados
// ===================================================================
// Sem conta, a pessoa gera 1 jogo de amostra. Para o resto, cria uma conta só.
// Quem já tinha cadastro, jogos ou login continua sem barreira.

const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
]);
const DOMINIOS_COM_ERRO = {
  'gmal.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.com.br': 'gmail.com',
  'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'yaho.com.br': 'yahoo.com.br'
};
const DOMINIOS_DESCARTAVEIS = new Set(['mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com']);

function validarEmail(valor) {
  const email = String(valor || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) return { erro: 'Confira o e-mail digitado.' };
  const dominio = email.split('@')[1];
  if (DOMINIOS_COM_ERRO[dominio]) return { erro: `Você quis dizer @${DOMINIOS_COM_ERRO[dominio]}?` };
  if (DOMINIOS_DESCARTAVEIS.has(dominio)) return { erro: 'Use um e-mail pessoal, não um temporário.' };
  return { valor: email };
}

function validarCelular(valor) {
  let numeros = String(valor || '').replace(/\D/g, '');
  if (numeros.length === 13 && numeros.startsWith('55')) numeros = numeros.slice(2);
  if (numeros.length !== 11) return { erro: 'Informe o celular com DDD: 11 números.' };
  if (!DDDS_VALIDOS.has(Number(numeros.slice(0, 2)))) return { erro: 'Esse DDD não existe.' };
  if (numeros[2] !== '9') return { erro: 'Informe um número de celular, que começa com 9.' };
  if (/^(\d)\1+$/.test(numeros.slice(2))) return { erro: 'Confira o número digitado.' };
  return { valor: numeros };
}

window.validarEmail = validarEmail;
window.validarCelular = validarCelular;

function temAcessoSemCadastro() {
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao && usuarioSessao.tipo !== 'visitante') return true;
  return Array.isArray(carteiraJogos) && carteiraJogos.length > 0;
}

let acaoAposCadastro = null;

function abrirContaNova(mensagem) {
  window.abrirModalAuth?.();
  window.alternarAbaAuth?.('cadastrar');
  if (mensagem) toast(mensagem, '🔒');
}

window.exigirLeadAntesDeSalvar = function () {
  if (temAcessoSemCadastro()) return true;
  abrirContaNova('Crie sua conta para salvar seus jogos.');
  return false;
};

/** Guarda a ação de salvar para concluí-la assim que a conta for criada. */
window.salvarDepoisDoCadastro = (acao) => { acaoAposCadastro = acao; };

window.limitarGeracaoGratuita = function (qtd) {
  if (temAcessoSemCadastro()) return qtd;

  const amostras = Number(localStorage.getItem('meu_volante_amostras') || 0);
  if (amostras >= 1) {
    abrirContaNova('Gostou? Crie sua conta para gerar mais jogos e salvar.');
    return 0;
  }

  localStorage.setItem('meu_volante_amostras', '1');
  window.setQtdJogosParaGerar?.(1);
  return 1;
};

async function criarConta(evento) {
  const nome = document.getElementById('input-auth-nome').value.trim();
  const senha = document.getElementById('input-auth-senha').value;
  const email = validarEmail(document.getElementById('input-auth-email').value);
  const celular = validarCelular(document.getElementById('input-auth-celular').value);
  const erro = nome.length < 2 ? 'Informe seu nome.' : email.erro || celular.erro
    || (senha.length < 8 ? 'A senha precisa ter pelo menos 8 caracteres.' : '');
  if (erro) {
    toast(erro, '⚠️');
    return;
  }

  const cliente = obterClienteSupabase();
  if (!cliente) {
    toast('Autenticação indisponível. Tente novamente mais tarde.', '⚠️');
    return;
  }
  const { data, error } = await cliente.auth.signUp({
    email: email.valor,
    password: senha,
    options: { data: { full_name: nome, phone: celular.valor }, emailRedirectTo: `${window.location.origin}/` }
  });
  if (error || data?.user?.identities?.length === 0) {
    toast(error ? 'Não foi possível criar a conta. Confira os dados.' : 'Este e-mail já tem conta. Toque em Entrar.', '⚠️');
    return;
  }
  const consentimentoEm = new Date().toISOString();
  const { error: erroContato } = await cliente.from('visitor_leads').insert({
    name: nome,
    email: email.valor,
    phone: celular.valor,
    marketing_consent: Boolean(document.getElementById('check-auth-novidades')?.checked),
    consent_at: consentimentoEm,
    source: 'conta'
  });
  if (erroContato && erroContato.code !== '23505') console.warn('Contato não registrado:', erroContato.message);

  if (!data.session) {
    acaoAposCadastro = null;
    window.alternarAbaAuth?.('entrar');
    toast('Conta criada. Confirme o e-mail e depois entre para salvar seus jogos.', '📧');
    return;
  }

  const sessaoRestaurada = await window.restaurarSessaoSupabase?.();
  if (!sessaoRestaurada) {
    toast('Conta criada, mas não foi possível carregar sua sessão. Entre novamente.', '⚠️');
    return;
  }

  localStorage.setItem('loterias_nasa_visitor_lead', JSON.stringify({ nome, email: email.valor, telefone: celular.valor, consentimentoEm }));
  window.fecharModalAuth?.();
  toast('Conta criada.', '✅');

  if (acaoAposCadastro) {
    const acao = acaoAposCadastro;
    acaoAposCadastro = null;
    acao();
  }
}

function montarContaUnica() {
  const senha = document.getElementById('input-auth-senha');
  const blocoSenha = senha?.closest('.senha-caixa')?.parentElement || senha?.parentElement;
  if (blocoSenha && !document.getElementById('campo-auth-celular')) {
    const campo = document.createElement('div');
    campo.id = 'campo-auth-celular';
    campo.className = 'hidden';
    campo.innerHTML = `
      <label for="input-auth-celular" class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Celular com DDD</label>
      <input id="input-auth-celular" type="tel" inputmode="tel" maxlength="20" placeholder="(00) 00000-0000" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans" />
      <label class="flex items-start gap-2 text-slate-400 leading-relaxed font-sans mt-2" style="font-size:12px">
        <input id="check-auth-novidades" type="checkbox" class="mt-0.5 accent-cyan-500" />
        <span>Quero receber avisos de resultado e novidades por e-mail e WhatsApp (opcional).</span>
      </label>`;
    blocoSenha.after(campo);
  }
  const alternar = window.alternarAbaAuth;
  window.alternarAbaAuth = function (aba, ...resto) {
    const retorno = alternar.call(this, aba, ...resto);
    const criando = aba === 'cadastrar';
    document.getElementById('campo-auth-celular')?.classList.toggle('hidden', !criando);
    const esqueci = document.getElementById('auth-esqueci');
    if (esqueci) {
      esqueci.classList.toggle('hidden', criando);
      esqueci.style.display = criando ? 'none' : '';
    }
    document.getElementById('input-auth-senha')?.setAttribute('placeholder', criando ? 'Mínimo de 8 caracteres' : 'Sua senha');
    return retorno;
  };

  const enviar = window.submeterFormularioAuth;
  window.submeterFormularioAuth = async function (evento) {
    if (document.getElementById('campo-auth-celular')?.classList.contains('hidden')) return enviar.call(this, evento);
    evento.preventDefault();
    return criarConta(evento);
  };

  window.abrirCadastroVisitante = () => abrirContaNova();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(montarContaUnica, 700));
