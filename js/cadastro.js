// ===================================================================
// CADASTRO AO SALVAR: e-mail e telefone validados
// ===================================================================
// Ninguém novo usa o app sem cadastro. Quem já tinha jogos ou conta continua.

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
  if (localStorage.getItem('loterias_nasa_visitor_lead')) return true;
  if (typeof usuarioSessao !== 'undefined' && usuarioSessao && !['visitante', 'google_oauth'].includes(usuarioSessao.tipo)) return true;
  return Array.isArray(carteiraJogos) && carteiraJogos.length > 0;
}

let acaoAposCadastro = null;

window.exigirLeadAntesDeSalvar = function () {
  if (temAcessoSemCadastro()) return true;
  abrirCadastroVisitante();
  return false;
};

/** Guarda a ação de salvar para concluí-la assim que o cadastro terminar. */
window.salvarDepoisDoCadastro = (acao) => { acaoAposCadastro = acao; };

function ligarCadastro() {
  const original = window.submeterCadastroVisitante;
  window.submeterCadastroVisitante = async function (evento) {
    evento.preventDefault();
    const campoEmail = document.getElementById('input-visitante-email');
    const campoCelular = document.getElementById('input-visitante-telefone');
    const email = campoEmail.value.trim() ? validarEmail(campoEmail.value) : { valor: '' };
    const celular = validarCelular(campoCelular.value);
    const erro = email.erro || celular.erro;
    if (erro) {
      toast(erro, '⚠️');
      (email.erro ? campoEmail : campoCelular).focus();
      return;
    }
    campoEmail.value = email.valor;
    campoCelular.value = celular.valor;
    await original.call(this, evento);
    if (localStorage.getItem('loterias_nasa_visitor_lead') && acaoAposCadastro) {
      const acao = acaoAposCadastro;
      acaoAposCadastro = null;
      acao();
    }
  };

  const modal = document.getElementById('modal-cadastro-visitante');
  if (!modal) return;
  modal.querySelector('.inline-block')?.remove();
  const campoEmail = document.getElementById('input-visitante-email');
  campoEmail.required = false;
  campoEmail.placeholder = 'Opcional';
  const rotuloEmail = modal.querySelector('label[for="input-visitante-email"]');
  if (rotuloEmail) rotuloEmail.textContent = 'E-mail (opcional)';
  const rotuloCelular = modal.querySelector('label[for="input-visitante-telefone"]');
  if (rotuloCelular) rotuloCelular.textContent = 'Celular com DDD';
  const titulo = modal.querySelector('h2');
  const subtitulo = titulo?.nextElementSibling;
  if (titulo) titulo.textContent = 'Crie seu acesso';
  if (subtitulo) subtitulo.textContent = 'Cadastre-se para usar o Meu Volante PRO.';
  const opcional = document.createElement('label');
  opcional.className = 'flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed font-sans';
  opcional.innerHTML = '<input id="check-visitante-novidades" type="checkbox" class="mt-0.5 accent-cyan-500" /><span>Quero receber novidades por e-mail e WhatsApp (opcional).</span>';
  document.getElementById('check-visitante-consentimento')?.closest('label')?.after(opcional);
  const botao = modal.querySelector('button[type="submit"]');
  if (botao) botao.textContent = 'Entrar no app';
  const aceite = document.getElementById('check-visitante-consentimento')?.nextElementSibling;
  if (aceite) aceite.innerHTML = 'Tenho 18 anos ou mais e li a <a href="privacidade.html" target="_blank" rel="noopener" class="underline">Política de Privacidade</a>.';
}

/** Tela obrigatória: sem botão de fechar, e só sai depois do cadastro. */
function exigirCadastroNaEntrada() {
  if (temAcessoSemCadastro()) return;
  const modal = document.getElementById('modal-cadastro-visitante');
  if (!modal) return;
  modal.dataset.obrigatorio = '1';
  modal.style.zIndex = '8000';
  modal.querySelector('button[aria-label="Fechar cadastro"]')?.classList.add('hidden');
  const fechar = window.fecharCadastroVisitante;
  window.fecharCadastroVisitante = function (...args) {
    if (temAcessoSemCadastro()) {
      delete modal.dataset.obrigatorio;
      return fechar.apply(this, args);
    }
  };
  if (window.NASA_SUPABASE_CONFIG?.googleEnabled && !document.getElementById('bv-google')) {
    const google = document.createElement('button');
    google.type = 'button';
    google.id = 'bv-google';
    google.className = 'w-full py-3 bg-white text-slate-900 font-bold text-sm rounded-xl';
    google.textContent = 'Preencher com Google';
    google.addEventListener('click', () => loginComGoogle());
    modal.querySelector('form')?.before(google);
  }
  // Google traz nome e e-mail; o celular ainda é obrigatório.
  const concluir = window.concluirLoginOAuth;
  window.concluirLoginOAuth = function (dados) {
    const retorno = concluir.call(this, dados);
    document.getElementById('input-visitante-nome').value = dados.nome || '';
    document.getElementById('input-visitante-email').value = dados.email || '';
    abrirCadastroVisitante();
    document.getElementById('input-visitante-telefone')?.focus();
    return retorno;
  };
  abrirCadastroVisitante();
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  ligarCadastro();
  exigirCadastroNaEntrada();
}, 200));
