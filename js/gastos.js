// ===================================================================
// GASTOS, ORÇAMENTO E REVISÃO DO JOGO
// ===================================================================
// Mostra fatos verificáveis: quanto foi registrado, a chance exata e o custo.
// Nada aqui sugere que uma combinação tem mais chance que outra.

const JOGOS_REGRAS = {
  megasena: { universo: 60, sorteadas: 6, preco: 6, faixas: [[6, 'Sena'], [5, 'Quina'], [4, 'Quadra']] },
  lotofacil: { universo: 25, sorteadas: 15, preco: 3.5, faixas: [[15, '15 pontos'], [14, '14 pontos'], [13, '13 pontos'], [12, '12 pontos'], [11, '11 pontos']] }
};
const ORCAMENTO_CHAVE = 'meu_volante_orcamento_mensal';

function combinacoesExatas(n, k) {
  if (k < 0 || k > n) return 0;
  let total = 1;
  for (let i = 1; i <= k; i++) total = (total * (n - k + i)) / i;
  return Math.round(total);
}

function formatarBRL(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function custoDoJogo(modalidade, qtdDezenas) {
  const regra = JOGOS_REGRAS[modalidade] || JOGOS_REGRAS.megasena;
  return combinacoesExatas(qtdDezenas, regra.sorteadas) * regra.preco;
}

function custoDoBilhete(bilhete) {
  return custoDoJogo(bilhete.modalidade, (bilhete.dezenas || []).length);
}
window.custoDoBilhete = custoDoBilhete;

/** Chance de um jogo acertar exatamente cada faixa em um concurso. */
function chancesDoJogo(modalidade, qtdDezenas) {
  const { universo, sorteadas, faixas } = JOGOS_REGRAS[modalidade];
  const total = combinacoesExatas(universo, sorteadas);
  return faixas.map(([acertos, nome]) => {
    const casos = combinacoesExatas(qtdDezenas, acertos) * combinacoesExatas(universo - qtdDezenas, sorteadas - acertos);
    return { nome, umEm: casos ? Math.round(total / casos) : null };
  });
}

function obterOrcamento() {
  try { return Number(localStorage.getItem(ORCAMENTO_CHAVE)) || 0; } catch { return 0; }
}

function mesDoBilhete(bilhete) {
  const registro = new Date(bilhete.dataRegistro || '');
  if (!Number.isNaN(registro.getTime())) return `${registro.getFullYear()}-${String(registro.getMonth() + 1).padStart(2, '0')}`;
  const partes = String(bilhete.data || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return partes ? `${partes[3]}-${partes[2]}` : null;
}

function resumoPorMes() {
  const meses = {};
  (Array.isArray(carteiraJogos) ? carteiraJogos : []).forEach((b) => {
    const mes = mesDoBilhete(b);
    if (!mes) return;
    meses[mes] = meses[mes] || { gasto: 0, premios: 0 };
    meses[mes].gasto += custoDoBilhete(b);
    meses[mes].premios += Number(b.premioGanho || 0);
  });
  return meses;
}

function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

function htmlPainelGastos() {
  const meses = resumoPorMes();
  const atual = meses[mesAtual()] || { gasto: 0, premios: 0 };
  const orcamento = obterOrcamento();
  const pct = orcamento ? Math.min(100, Math.round((atual.gasto / orcamento) * 100)) : 0;
  const passou = orcamento && atual.gasto > orcamento;
  const linhaOrcamento = orcamento
    ? `<div class="gastos-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i class="${passou ? 'passou' : ''}" style="width:${pct}%"></i></div>
       <p class="gastos-nota">${passou ? `${formatarBRL(atual.gasto - orcamento)} acima do limite que você definiu.` : `Restam ${formatarBRL(orcamento - atual.gasto)} do seu limite.`}</p>`
    : '<p class="gastos-nota">Defina um limite mensal para acompanhar quanto você joga.</p>';

  return `
    <div class="gastos-topo">
      <div>
        <span class="gastos-rotulo">Registrado este mês</span>
        <strong>${formatarBRL(atual.gasto)}${orcamento ? ` <small>de ${formatarBRL(orcamento)}</small>` : ''}</strong>
      </div>
      <button type="button" class="gastos-editar" onclick="abrirOrcamento()">${orcamento ? 'Alterar limite' : 'Definir limite'}</button>
    </div>
    ${linhaOrcamento}`;
}

function htmlHistoricoMensal() {
  const meses = Object.entries(resumoPorMes()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  if (!meses.length) return '';
  const nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `
    <table class="gastos-tabela">
      <thead><tr><th>Mês</th><th>Gastos</th><th>Prêmios</th></tr></thead>
      <tbody>${meses.map(([mes, v]) => `<tr><td>${nomes[Number(mes.slice(5)) - 1]}/${mes.slice(2, 4)}</td><td>${formatarBRL(v.gasto)}</td><td>${formatarBRL(v.premios)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="gastos-nota">Valores calculados com o preço atual da aposta. Confira sempre seu comprovante.</p>`;
}

function renderizarGastos() {
  // O limite mensal foi movido para a tela Carteira conforme solicitado pelo usuário
  const painelInicio = document.getElementById('painel-gastos-inicio');
  if (painelInicio) {
    painelInicio.remove();
  }

  const lista = document.getElementById('total-bilhetes-salvos');
  const carteira = document.getElementById('carteira-subview-bilhetes');
  if (lista && carteira) {
    let painel = document.getElementById('painel-gastos-carteira');
    if (!painel) {
      painel = document.createElement('div');
      painel.id = 'painel-gastos-carteira';
      painel.className = 'gastos-painel';
      carteira.prepend(painel);
    }
    painel.innerHTML = htmlPainelGastos() + htmlHistoricoMensal();
  }
}
window.renderizarGastos = renderizarGastos;

function abrirOrcamento() {
  const atual = obterOrcamento();
  const fundo = document.createElement('div');
  fundo.className = 'folha-fundo';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `
    <form class="folha">
      <h2>Limite mensal</h2>
      <p>Quanto você quer gastar com loterias por mês? Só você vê este valor.</p>
      <label for="campo-orcamento">Valor em reais</label>
      <input id="campo-orcamento" type="number" inputmode="decimal" min="0" step="1" value="${atual || ''}" placeholder="Ex: 100" />
      <button type="submit">Salvar limite</button>
      <button type="button" class="folha-sair">Agora não</button>
    </form>`;
  document.body.appendChild(fundo);
  const fechar = () => fundo.remove();
  fundo.querySelector('.folha-sair').addEventListener('click', fechar);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
  fundo.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const valor = Number(fundo.querySelector('input').value) || 0;
    try { localStorage.setItem(ORCAMENTO_CHAVE, String(valor)); } catch {}
    fechar();
    renderizarGastos();
  });
  fundo.querySelector('input').focus();
}
window.abrirOrcamento = abrirOrcamento;

function dezenasAtuais() {
  return typeof getJogoAtual === 'function' ? [...getJogoAtual()] : [];
}

/** Fatos sobre o jogo na tela: chance, custo e o que muda se ganhar. */
function renderizarRevisaoDoJogo() {
  const display = document.getElementById('display-meu-jogo');
  if (!display) return;
  let revisao = document.getElementById('revisao-jogo');
  if (!revisao) {
    revisao = document.createElement('div');
    revisao.id = 'revisao-jogo';
    // display.after(revisao);
  }

  const modalidade = typeof modalidadeAtual !== 'undefined' ? modalidadeAtual : 'megasena';
  const regra = JOGOS_REGRAS[modalidade];
  const dezenas = dezenasAtuais();
  if (dezenas.length < regra.sorteadas) {
    revisao.innerHTML = `<p>Marque pelo menos ${regra.sorteadas} dezenas.</p>`;
    return;
  }

  const custo = custoDoJogo(modalidade, dezenas.length);
  const principal = chancesDoJogo(modalidade, dezenas.length)[0];
  const orcamento = obterOrcamento();
  const gastoMes = (resumoPorMes()[mesAtual()] || { gasto: 0 }).gasto;
  const avisos = [];
  if (orcamento && gastoMes + custo > orcamento) avisos.push(`Este jogo passa ${formatarBRL(gastoMes + custo - orcamento)} do seu limite do mês.`);
  if (modalidade === 'megasena' && dezenas.every((d) => d <= 31)) avisos.push('Só dezenas até 31 lembram datas. Se ganhar, talvez divida o prêmio com mais gente. Sua chance não muda.');

  revisao.innerHTML = `
    <div class="revisao-linha"><span>Chance de ${principal.nome.toLowerCase()}</span><strong>1 em ${principal.umEm.toLocaleString('pt-BR')}</strong></div>
    <div class="revisao-linha"><span>Custo</span><strong>${formatarBRL(custo)}</strong></div>
    ${avisos.map((a) => `<p class="revisao-aviso">${a}</p>`).join('')}`;

  const tabela = document.getElementById('tabela-chances');
  if (tabela) {
    tabela.innerHTML = `
      <h3>Suas chances reais em um concurso</h3>
      <table class="gastos-tabela"><tbody>${chancesDoJogo(modalidade, dezenas.length).map((c) => `<tr><td>${c.nome}</td><td>1 em ${c.umEm.toLocaleString('pt-BR')}</td></tr>`).join('')}</tbody></table>
      <p class="gastos-nota">Cálculo exato de combinatória. Todas as combinações com a mesma quantidade de dezenas têm a mesma chance.</p>`;
  }
}
window.renderizarRevisaoDoJogo = renderizarRevisaoDoJogo;
