import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('js/app.js', 'utf8');

function recorte(codigo, inicioTexto, fimTexto) {
  const inicio = codigo.indexOf(inicioTexto);
  const fim = codigo.indexOf(fimTexto, inicio);
  assert.notEqual(inicio, -1, `Esperava encontrar: ${inicioTexto}`);
  assert.notEqual(fim, -1, `Esperava encontrar: ${fimTexto}`);
  return codigo.slice(inicio, fim);
}

// Usa as regras do próprio app.js, sem cópia: avaliação do jogo e sugestão de troca.
function carregarSugestao() {
  const codigo = [
    recorte(app, '    function combinacao(n, k) {', '    const LOTO_CONFIG = {'),
    recorte(app, '    const LOTO_CONFIG = {', '    let modalidadeAtual'),
    recorte(app, '    function avaliarJogo(jogo, modalidade) {', '    // SIMULADOR DE DESEMPENHO HISTÓRICO'),
    recorte(app, '    const INDICADORES_MEGA = [', '    window.sugerirTroca = sugerirTroca;'),
    'return { avaliarJogo, sugerirTroca };'
  ].join('\n');
  return new Function('window', codigo)({});
}

const incomuns = (avaliarJogo, jogo) => avaliarJogo(jogo, 'megasena').testes.filter((t) => t.s === 'Alerta').length;

test('jogo sem indicador incomum não recebe sugestão de troca', () => {
  const { avaliarJogo, sugerirTroca } = carregarSugestao();
  const jogo = [3, 18, 19, 45, 49, 52];
  assert.equal(incomuns(avaliarJogo, jogo), 0);
  assert.equal(sugerirTroca(jogo, [], [], 'megasena'), null);
});

test('a troca sugerida reduz os indicadores incomuns e não cria nenhum novo', () => {
  const { avaliarJogo, sugerirTroca } = carregarSugestao();
  const jogo = [3, 14, 15, 16, 38, 52];
  const antes = avaliarJogo(jogo, 'megasena').testes.map((t) => t.s === 'Alerta');
  const sugestao = sugerirTroca(jogo, [], [], 'megasena');

  assert.ok(sugestao.sai && sugestao.entra);
  assert.ok(jogo.includes(sugestao.sai));
  assert.ok(!jogo.includes(sugestao.entra));
  const novo = jogo.filter((n) => n !== sugestao.sai).concat(sugestao.entra).sort((a, b) => a - b);
  const depois = avaliarJogo(novo, 'megasena').testes.map((t) => t.s === 'Alerta');
  assert.ok(depois.filter(Boolean).length < antes.filter(Boolean).length);
  depois.forEach((incomum, i) => assert.ok(!incomum || antes[i], `indicador ${i + 1} não pode passar a incomum`));
});

test('a troca nunca tira dezena fixa nem põe dezena proibida, e é sempre a mesma', () => {
  const { sugerirTroca } = carregarSugestao();
  const jogo = [3, 14, 15, 16, 38, 52];
  const livre = sugerirTroca(jogo, [], [], 'megasena');
  const comRegras = sugerirTroca(jogo, [livre.sai], [livre.entra], 'megasena');

  assert.notEqual(comRegras.sai, livre.sai);
  assert.notEqual(comRegras.entra, livre.entra);
  assert.deepEqual(sugerirTroca(jogo, [], [], 'megasena'), livre);
});

test('trocas seguidas terminam: cada uma deixa o jogo com menos indicadores incomuns', () => {
  const { avaliarJogo, sugerirTroca } = carregarSugestao();
  let jogo = [1, 2, 3, 11, 12, 21];
  let passos = 0;
  for (; passos < 10; passos++) {
    const sugestao = sugerirTroca(jogo, [], [], 'megasena');
    if (!sugestao || sugestao.sai === null) break;
    const antes = incomuns(avaliarJogo, jogo);
    jogo = jogo.filter((n) => n !== sugestao.sai).concat(sugestao.entra).sort((a, b) => a - b);
    assert.ok(incomuns(avaliarJogo, jogo) < antes);
  }
  assert.ok(passos <= 6, 'no máximo uma troca por indicador');
});

test('quando todas as dezenas são fixas não há troca, e o app diz isso em vez de inventar', () => {
  const { sugerirTroca } = carregarSugestao();
  const jogo = [3, 14, 15, 16, 38, 52];
  const sugestao = sugerirTroca(jogo, jogo, [], 'megasena');
  assert.equal(sugestao.sai, null);
  assert.equal(sugestao.entra, null);
});

test('os textos da troca e dos indicadores não prometem vantagem', () => {
  const tela = fs.readFileSync('index.html', 'utf8');
  const trecho = recorte(app, '    const INDICADORES_MEGA = [', '    function aplicarSubstituicao(');
  assert.doesNotMatch(trecho, /recomendad|ideal|perfeit|balancead|aprovad/i);
  assert.match(trecho, /A chance de ganhar é a mesma/);
  const indicadores = recorte(tela, 'id="card-bateria-testes"', 'id="card-sugestao-troca"');
  assert.doesNotMatch(indicadores, /VALIDAÇÃO MATEMÁTICA|Viciadas|Impede|Equilibrada/);
});

// ---------------------------------------------------------------- Bolão

function carregarBolao() {
  const janela = {};
  const documento = { addEventListener() {}, getElementById: () => null };
  const guardado = { getItem: () => '[]', setItem() {} };
  new Function('window', 'document', 'localStorage', fs.readFileSync('js/bolao.js', 'utf8'))(janela, documento, guardado);
  return janela.bolaoRegras;
}

const bolaoBase = (extra = {}) => ({
  id: 1, nome: 'Família', modalidade: 'megasena', destino: 'virada', modo: 'caixa', dezenas: 6, cotas: 2, minhasCotas: 1,
  jogos: [[1, 12, 23, 34, 45, 56], [2, 13, 24, 35, 46, 57], [3, 14, 25, 36, 47, 58]],
  participantes: [{ nome: 'Ana', cotas: 1, pagou: true }, { nome: 'Bruno', cotas: 1, pagou: false }],
  prazo: '2026-12-20', guardiao: 'Ana', premioPequeno: 'dividir', ...extra
});

test('o rateio do bolão soma só os jogos do próprio bolão', () => {
  const { calcularRateio } = carregarBolao();
  const r = calcularRateio(bolaoBase());
  assert.equal(r.total, 18);
  assert.equal(r.valorCota, 9);
  assert.equal(r.distribuidas, 2);
  assert.equal(r.recebido, 9);
  assert.equal(r.falta, 9);
  assert.equal(calcularRateio(bolaoBase({ dezenas: 7, jogos: [[1, 2, 3, 4, 5, 6, 7]] })).total, 42);
});

test('um bolão dentro das regras da CAIXA não gera aviso', () => {
  const { avisosDaCaixa } = carregarBolao();
  assert.deepEqual(avisosDaCaixa(bolaoBase()), []);
});

test('o bolão avisa quando a cota ou o total ficam abaixo do mínimo da CAIXA', () => {
  const { avisosDaCaixa } = carregarBolao();
  const cotaBaixa = avisosDaCaixa(bolaoBase({ cotas: 10 }));
  assert.equal(cotaBaixa.length, 1);
  assert.match(cotaBaixa[0], /cota custa no mínimo R\$\s7,00/);
  assert.match(cotaBaixa[0], /no máximo 2 cotas/);

  const totalBaixo = avisosDaCaixa(bolaoBase({ jogos: [[1, 12, 23, 34, 45, 56]] }));
  assert.ok(totalBaixo.some((a) => /no mínimo R\$\s18,00/.test(a)));
});

test('a Lotofácil de 15 números aceita no máximo 7 cotas na CAIXA', () => {
  const { avisosDaCaixa } = carregarBolao();
  const quinze = Array.from({ length: 15 }, (_, i) => i + 1);
  const avisos = avisosDaCaixa(bolaoBase({ modalidade: 'lotofacil', destino: 'proximo', dezenas: 15, cotas: 8, jogos: Array(10).fill(quinze) }));
  assert.ok(avisos.some((a) => /de 2 a 7 cotas/.test(a)));
});

test('o bolão aponta jogos repetidos', () => {
  const { jogosRepetidos } = carregarBolao();
  assert.deepEqual(jogosRepetidos(bolaoBase()), []);
  const repetido = bolaoBase({ jogos: [[1, 12, 23, 34, 45, 56], [56, 45, 34, 23, 12, 1]] });
  assert.deepEqual(jogosRepetidos(repetido), [[1, 2]]);
});

test('os textos do bolão para o grupo dizem que não são comprovante da CAIXA', () => {
  const { textoConvite, textoPagamentos, textoJogos } = carregarBolao();
  const bolao = bolaoBase();
  for (const texto of [textoConvite(bolao), textoPagamentos(bolao), textoJogos(bolao)]) {
    assert.match(texto, /Não é comprovante da CAIXA/);
    assert.doesNotMatch(texto, /COMPROVANTE OFICIAL/);
    assert.match(texto, /Mega da Virada 2026/);
  }
  assert.match(textoConvite(bolao), /Pagamento até: 20\/12\/2026/);
  assert.match(textoPagamentos(bolao), /✅ Ana · 1 cota · R\$\s9,00/);
  assert.match(textoPagamentos(bolao), /⏳ Bruno/);
  assert.match(textoJogos(bolao), /Jogo 3: 03 - 14 - 25 - 36 - 47 - 58/);
});

test('a tela Gerar tem as abas Jogo e Bolão e carrega os dois arquivos novos', () => {
  const tela = fs.readFileSync('index.html', 'utf8');
  const sw = fs.readFileSync('sw.js', 'utf8');
  assert.match(tela, /id="gerar-aba-jogo"/);
  assert.match(tela, /id="gerar-aba-bolao"/);
  assert.match(tela, /id="gerar-painel-jogo"/);
  assert.match(tela, /id="gerar-painel-bolao"/);
  for (const arquivo of ['tela-gerar.js', 'bolao.js']) {
    assert.match(tela, new RegExp(`js/${arquivo.replace('.', '\\.')}\\?v=`));
    assert.match(sw, new RegExp(`'\\./js/${arquivo.replace('.', '\\.')}'`));
  }
});
