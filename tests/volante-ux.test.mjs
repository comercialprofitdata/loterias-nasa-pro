import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function carregarRemocaoDezena({ jogoInicial, fixosIniciais = [] }) {
  const codigo = fs.readFileSync('js/app.js', 'utf8');
  const inicio = codigo.indexOf('function removerDezenaDoJogo(num) {');
  const fim = codigo.indexOf('function setQtdJogosParaGerar(', inicio);
  assert.notEqual(inicio, -1, 'A função de remover dezenas deve existir');
  assert.notEqual(fim, -1, 'A função de remover dezenas deve terminar antes dos controles de quantidade');

  let jogo = [...jogoInicial];
  const fixos = [...fixosIniciais];
  const chamadas = { display: 0, volante: 0, analise: 0, indicadores: 0 };
  const executar = new Function(
    'window',
    'getJogoAtual',
    'setJogoAtual',
    'getFixos',
    'atualizarDisplayJogo',
    'renderizarVolante',
    'executarAnaliseDinamicaDoJogo',
    'executarAnaliseVitorio',
    `${codigo.slice(inicio, fim)}\nreturn removerDezenaDoJogo;`
  );
  const remover = executar(
    {},
    () => jogo,
    (novo) => { jogo = novo; },
    () => fixos,
    () => { chamadas.display++; },
    () => { chamadas.volante++; },
    () => { chamadas.analise++; },
    () => { chamadas.indicadores++; }
  );
  return { remover, chamadas, get jogo() { return jogo; }, fixos };
}

test('remover uma dezena do resumo atualiza o volante e desfaz a regra fixa dessa dezena', () => {
  const estado = carregarRemocaoDezena({ jogoInicial: [4, 15, 16, 22, 26, 31], fixosIniciais: [15, 26] });

  estado.remover(15);

  assert.deepEqual(estado.jogo, [4, 16, 22, 26, 31]);
  assert.deepEqual(estado.fixos, [26]);
  assert.deepEqual(estado.chamadas, { display: 1, volante: 1, analise: 1, indicadores: 1 });
});

test('tentar remover uma dezena que não está selecionada não altera o estado', () => {
  const estado = carregarRemocaoDezena({ jogoInicial: [4, 15, 16], fixosIniciais: [15] });

  estado.remover(38);

  assert.deepEqual(estado.jogo, [4, 15, 16]);
  assert.deepEqual(estado.fixos, [15]);
  assert.deepEqual(estado.chamadas, { display: 0, volante: 0, analise: 0, indicadores: 0 });
});

test('a sugestão de troca fica junto da grade e preferências avançadas organizadas', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/fluxo-jogo.css', 'utf8');

  assert.match(html, /id="card-sugestao-troca"/);
  assert.match(html, /Preferências avançadas · fixas e proibidas/);
  assert.match(css, /#volante-titulo-tipo \{ font-size: 12px/);
  assert.match(fs.readFileSync('js/app.js', 'utf8'), /Aplicar troca recomendada/);
});
