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
  assert.match(bolaoSrc, /\['megasena', 'lotofacil', 'quina'\]/);

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
