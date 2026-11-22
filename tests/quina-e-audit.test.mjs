import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('sanearBilhete preserva modalidade quina e dezenas de 1 a 80', () => {
  const appSrc = fs.readFileSync('js/app.js', 'utf8');
  const ini = appSrc.indexOf('function limparTextoRecursivo(');
  const fim = appSrc.indexOf('window.limparTextoRecursivo = limparTextoRecursivo;');
  assert.ok(ini > 0 && fim > ini);
  const janela = {};
  new Function('window', appSrc.slice(ini, fim + 55))(janela);

  const b = janela.sanearBilhete({
    id: 'q1',
    modalidade: 'quina',
    dezenas: [4, 17, 62, 79, 80, 81, 0]
  });
  assert.equal(b.modalidade, 'quina');
  assert.deepEqual(b.dezenas, [4, 17, 62, 79, 80]);
});

test('bolão aceita Quina nas regras da CAIXA e no seletor de modalidade', () => {
  const janela = {};
  const documento = { addEventListener() {}, getElementById: () => null };
  const guardado = { getItem: () => '[]', setItem() {} };
  const bolaoSrc = fs.readFileSync('js/bolao.js', 'utf8');
  new Function('window', 'document', 'localStorage', bolaoSrc)(janela, documento, guardado);

  assert.ok(janela.bolaoRegras.REGRAS_CAIXA.quina);
  assert.equal(janela.bolaoRegras.REGRAS_CAIXA.quina.preco, 2.5);
  assert.match(bolaoSrc, /\['megasena', 'lotofacil', 'quina'/);

  const rateio = janela.bolaoRegras.calcularRateio({
    id: 10, modalidade: 'quina', dezenas: 5, cotas: 2,
    jogos: [[1, 20, 40, 60, 80], [5, 15, 25, 65, 75], [2, 12, 32, 52, 72], [3, 13, 33, 53, 73]],
    participantes: [{ nome: 'A', cotas: 1, pagou: true }]
  });
  assert.equal(rateio.total, 10);
  assert.equal(rateio.valorCota, 5);
});

test('conferencia-real avalia faixas da Quina corretamente', () => {
  const src = fs.readFileSync('js/conferencia-real.js', 'utf8');
  const fn = new Function('window', 'document', `${src}; return { FAIXAS_PREMIACAO, avaliarBilhete };`);
  const { FAIXAS_PREMIACAO, avaliarBilhete } = fn({}, { addEventListener() {} });
  assert.equal(FAIXAS_PREMIACAO.quina.length, 4);

  const res = avaliarBilhete(
    { modalidade: 'quina', dezenas: [4, 17, 32, 55, 73] },
    {
      concurso: 6600,
      dezenas: [4, 17, 32, 55, 80],
      rateio: [{ acertos: 4, premio: 8500 }]
    }
  );
  assert.equal(res.acertos, 4);
  assert.equal(res.premiado, true);
  assert.equal(res.premioGanho, 8500);
});

test('index.html não possui query strings antigas de 20261115 e deploy inclui arquivos novos', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.doesNotMatch(html, /\?v=20261115/);
  const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
  assert.match(workflow, /baixar\.html/);
  assert.match(workflow, /favicon\.svg/);
  assert.match(workflow, /icon-light-192\.png/);
});

test('Lotomania (00-99, 50 dez, 0 acertos premia) e Dia de Sorte (01-31) funcionam ponta a ponta', () => {
  const appSrc = fs.readFileSync('js/app.js', 'utf8');
  const ini = appSrc.indexOf('function limparTextoRecursivo(');
  const fim = appSrc.indexOf('window.limparTextoRecursivo = limparTextoRecursivo;');
  const janela = {};
  new Function('window', appSrc.slice(ini, fim + 55))(janela);

  const bLoto = janela.sanearBilhete({
    id: 'lm1',
    modalidade: 'lotomania',
    dezenas: Array.from({ length: 50 }, (_, i) => i) // inclui 0 (00)
  });
  assert.equal(bLoto.modalidade, 'lotomania');
  assert.equal(bLoto.dezenas.length, 50);
  assert.equal(bLoto.dezenas[0], 0);

  const bDia = janela.sanearBilhete({
    id: 'ds1',
    modalidade: 'diadesorte',
    dezenas: [1, 7, 15, 22, 28, 30, 31, 32]
  });
  assert.equal(bDia.modalidade, 'diadesorte');
  assert.deepEqual(bDia.dezenas, [1, 7, 15, 22, 28, 30, 31]);

  const confSrc = fs.readFileSync('js/conferencia-real.js', 'utf8');
  const { avaliarBilhete } = new Function('window', 'document', `${confSrc}; return { avaliarBilhete };`)({}, { addEventListener() {} });

  // Lotomania 0 acertos premia!
  const resZero = avaliarBilhete(
    { modalidade: 'lotomania', dezenas: Array.from({ length: 50 }, (_, i) => i) },
    { concurso: 3001, dezenas: Array.from({ length: 20 }, (_, i) => 60 + i), rateio: [{ acertos: 0, premio: 120000 }] }
  );
  assert.equal(resZero.acertos, 0);
  assert.equal(resZero.premiado, true);
  assert.equal(resZero.premioGanho, 120000);

  // Dia de Sorte 7 acertos
  const resDia = avaliarBilhete(
    { modalidade: 'diadesorte', dezenas: [1, 7, 15, 22, 28, 30, 31] },
    { concurso: 1352, dezenas: [1, 7, 15, 22, 28, 30, 31], rateio: [{ acertos: 7, premio: 500000 }] }
  );
  assert.equal(resDia.acertos, 7);
  assert.equal(resDia.premiado, true);
  assert.equal(resDia.premioGanho, 500000);
});

test('bolão aceita todas as 5 loterias no seletor e nas regras da CAIXA', () => {
  const bolaoSrc = fs.readFileSync('js/bolao.js', 'utf8');
  const janela = {};
  new Function('window', 'document', 'localStorage', bolaoSrc)(janela, { addEventListener() {}, getElementById: () => null }, { getItem: () => '[]', setItem() {} });
  ['megasena', 'lotofacil', 'quina', 'lotomania', 'diadesorte'].forEach((m) => {
    assert.ok(janela.bolaoRegras.REGRAS_CAIXA[m], `falta regra para ${m}`);
  });
  assert.match(bolaoSrc, /\['megasena', 'lotofacil', 'quina', 'lotomania', 'diadesorte'\]/);
});
