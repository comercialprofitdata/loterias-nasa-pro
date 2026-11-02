// ===================================================================
// TROCA DO APP ANTIGO
// ===================================================================
// O Android só deixa a pessoa desinstalar um app, e o pacote antigo não pode
// ser atualizado por outro nome. Quando ele abre o site, conduzimos a troca.

const PACOTE_ANTIGO = 'android-app://io.github.vitoriobergamobrazil.twa';

function abrirTrocaDoApp() {
  const tela = document.createElement('div');
  tela.id = 'troca-app';
  tela.setAttribute('role', 'dialog');
  tela.setAttribute('aria-modal', 'true');
  tela.innerHTML = `
    <div class="troca-conteudo">
      <img src="./icon-192.png" alt="" width="88" height="88" />
      <h1>O app agora é Meu Volante PRO</h1>
      <p>Esta versão foi substituída. Seus jogos deste aparelho continuam guardados no navegador.</p>
      <ol>
        <li>Baixe e instale o app novo.</li>
        <li>Abra o Meu Volante e confira seus jogos.</li>
        <li>Segure o ícone deste app antigo e toque em Desinstalar.</li>
      </ol>
      <a href="./download/MeuVolantePRO.apk" download>Baixar o app novo</a>
    </div>`;
  document.body.appendChild(tela);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.referrer.startsWith(PACOTE_ANTIGO)) setTimeout(abrirTrocaDoApp, 300);
});
