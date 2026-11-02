// ===================================================================
// INSTALAR O APP E AVISO SEM INTERNET
// ===================================================================
// O Chrome no Android oferece a instalação direta. No iPhone não existe esse
// recurso, então mostramos o caminho pelo botão Compartilhar do Safari.

let pedidoDeInstalacao = null;
const INSTALAR_DISPENSADO = 'meu_volante_instalar_dispensado';

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  pedidoDeInstalacao = evento;
  mostrarCartaoInstalar();
});

window.addEventListener('appinstalled', () => {
  pedidoDeInstalacao = null;
  document.getElementById('cartao-instalar')?.remove();
  window.registrarEvento?.('instalou_app');
});

function appJaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
    || document.referrer.startsWith('android-app://');
}

function ehIphone() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function abrirPassosDeInstalacao() {
  const passos = ehIphone()
    ? ['Abra este site no Safari.', 'Toque em Compartilhar, o quadrado com a seta para cima.', 'Toque em Adicionar à Tela de Início e depois em Adicionar.']
    : ['Abra este site no Chrome.', 'Toque nos três pontos, no canto superior.', 'Toque em Instalar app ou Adicionar à tela inicial.'];
  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <div class="folha">
      <h2>Instalar o Meu Volante</h2>
      <ol class="instalar-passos">${passos.map((p) => `<li>${p}</li>`).join('')}</ol>
      <button type="button">Entendi</button>
    </div>`;
  document.body.appendChild(fundo);
  fundo.querySelector('button').addEventListener('click', () => fundo.remove());
}

async function instalarApp() {
  window.registrarEvento?.('tocou_instalar');
  if (!pedidoDeInstalacao) {
    abrirPassosDeInstalacao();
    return;
  }
  pedidoDeInstalacao.prompt();
  await pedidoDeInstalacao.userChoice;
  pedidoDeInstalacao = null;
}
window.instalarApp = instalarApp;

function mostrarCartaoInstalar() {
  if (appJaInstalado() || document.getElementById('cartao-instalar')) return;
  try { if (localStorage.getItem(INSTALAR_DISPENSADO)) return; } catch {}
  const hero = document.getElementById('home-btn-hero-primary')?.parentElement;
  if (!hero) return;

  const cartao = document.createElement('div');
  cartao.id = 'cartao-instalar';
  cartao.className = 'gastos-painel';
  cartao.innerHTML = `
    <div class="gastos-topo">
      <div><strong class="instalar-titulo">Tenha o app na sua tela inicial</strong><p class="gastos-nota">Abre mais rápido e sem a barra do navegador.</p></div>
      <button type="button" class="ritual-ver">Instalar</button>
    </div>
    <button type="button" class="fluxo-link">Agora não</button>`;
  cartao.querySelector('.ritual-ver').addEventListener('click', instalarApp);
  cartao.querySelector('.fluxo-link').addEventListener('click', () => {
    try { localStorage.setItem(INSTALAR_DISPENSADO, '1'); } catch {}
    cartao.remove();
  });
  hero.after(cartao);
}

function atualizarAvisoDeConexao() {
  let aviso = document.getElementById('aviso-sem-internet');
  if (navigator.onLine) {
    aviso?.remove();
    return;
  }
  if (aviso) return;
  aviso = document.createElement('div');
  aviso.id = 'aviso-sem-internet';
  aviso.setAttribute('role', 'status');
  aviso.textContent = 'Sem internet. Resultados e prêmios podem estar desatualizados.';
  document.body.appendChild(aviso);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  mostrarCartaoInstalar();
  atualizarAvisoDeConexao();
}, 400));
window.addEventListener('online', atualizarAvisoDeConexao);
window.addEventListener('offline', atualizarAvisoDeConexao);
