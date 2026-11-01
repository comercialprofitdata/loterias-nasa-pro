// ===================================================================
// APRESENTAÇÃO DO PRIMEIRO ACESSO
// ===================================================================
// Mostra para que serve o app, confirma os 18 anos e leva direto ao 1º jogo.

const BOAS_VINDAS_CHAVE = 'nasa_boas_vindas_v1';

const BOAS_VINDAS_PASSOS = [
  { titulo: 'Seu próximo jogo em um toque', texto: 'Gere um jogo de Mega-Sena ou Lotofácil, ou escolha suas próprias dezenas.', bolas: [7, 18, 23, 34, 41, 56] },
  { titulo: 'Nada de bilhete perdido', texto: 'Salve seus jogos e veja a conferência com o resultado da Caixa em um só lugar.', icone: '✓' },
  { titulo: 'Ciência, não achismo', texto: 'Dados oficiais da Caixa e matemática de verdade para você entender cada jogo: chance real, custo e histórico.', icone: '∑' },
  { titulo: 'Combinado entre nós', texto: 'Todas as combinações têm a mesma chance. A ciência mostra os fatos, mas ninguém prevê resultados nem garante prêmios.', icone: '18+', confirmar: true }
];

function abrirBoasVindas() {
  let passo = 0;
  const tela = document.createElement('div');
  tela.id = 'boas-vindas';
  tela.setAttribute('role', 'dialog');
  tela.setAttribute('aria-modal', 'true');
  tela.setAttribute('aria-labelledby', 'boas-vindas-titulo');
  document.body.appendChild(tela);

  const concluir = () => {
    try { localStorage.setItem(BOAS_VINDAS_CHAVE, new Date().toISOString()); } catch {}
    tela.remove();
    if (typeof iniciarJogo === 'function') iniciarJogo();
  };

  const desenhar = () => {
    const atual = BOAS_VINDAS_PASSOS[passo];
    const arte = atual.bolas
      ? `<div class="bv-bolas">${atual.bolas.map((n) => `<span>${String(n).padStart(2, '0')}</span>`).join('')}</div>`
      : `<div class="bv-icone">${atual.icone}</div>`;

    tela.innerHTML = `
      <div class="bv-conteudo">
        ${arte}
        <h1 id="boas-vindas-titulo">${atual.titulo}</h1>
        <p>${atual.texto}</p>
      </div>
      <div class="bv-rodape">
        ${atual.confirmar ? `
          <label class="bv-idade">
            <input type="checkbox" id="bv-maior-idade" />
            <span>Tenho 18 anos ou mais e li os <a href="privacidade.html" target="_blank" rel="noopener">termos e a privacidade</a>.</span>
          </label>` : ''}
        <div class="bv-pontos" aria-hidden="true">
          ${BOAS_VINDAS_PASSOS.map((_, i) => `<i class="${i === passo ? 'ativo' : ''}"></i>`).join('')}
        </div>
        <button type="button" id="bv-avancar" ${atual.confirmar ? 'disabled' : ''}>
          ${atual.confirmar ? 'Gerar meu primeiro jogo' : 'Continuar'}
        </button>
      </div>`;

    const avancar = tela.querySelector('#bv-avancar');
    tela.querySelector('#bv-maior-idade')?.addEventListener('change', (e) => { avancar.disabled = !e.target.checked; });
    avancar.addEventListener('click', () => {
      if (atual.confirmar) { concluir(); return; }
      passo++;
      desenhar();
    });
    avancar.focus();
  };

  desenhar();
}

document.addEventListener('DOMContentLoaded', () => {
  let visto = true;
  try { visto = Boolean(localStorage.getItem(BOAS_VINDAS_CHAVE)); } catch { visto = false; }
  if (!visto) setTimeout(abrirBoasVindas, 50);
});
