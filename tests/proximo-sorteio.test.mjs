import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Em 14/11/2026 o app mostrou "Terça (17/11) • 15/11/2026 às 20h": duas datas
// no mesmo texto. A data do próximo sorteio só pode vir da Caixa.

function recorte(codigo, inicioTexto, fimTexto) {
  const inicio = codigo.indexOf(inicioTexto);
  const fim = codigo.indexOf(fimTexto, inicio);
  assert.notEqual(inicio, -1, `Esperava encontrar: ${inicioTexto}`);
  assert.notEqual(fim, -1, `Esperava encontrar: ${fimTexto}`);
  return codigo.slice(inicio, fim);
}

const compartilhar = fs.readFileSync('js/whatsapp-share.js', 'utf8');
const sorteios = fs.readFileSync('js/sorteios-reais.js', 'utf8');

function infoCom({ salvos = null, baseMega = [], agora }) {
  const funcao = recorte(compartilhar, 'function obterInfoProximoSorteio(modalidade) {', '/** Jogos salvos antes desta correção');
  class DataFixa extends Date {
    constructor(...args) { if (args.length) super(...args); else super(agora.getTime()); }
  }
  return new Function('obterSorteiosSalvos', 'baseConcursosMega', 'baseConcursosLoto', 'calcularProximoSorteio', 'Date',
    `${funcao}\nreturn obterInfoProximoSorteio('megasena');`)(
    () => salvos, baseMega, [], () => assert.fail('a data não pode ser calculada por calendário'), DataFixa);
}

const sabado = new Date(2026, 10, 14, 18, 0, 0);

test('com a data oficial da Caixa, o próximo sorteio tem uma data só, sem hora inventada', () => {
  const info = infoCom({ salvos: { megasena: { concurso: 3086, dataBR: '15/11/2026', dataOficial: true, dia: 'Terça (17/11)' } }, agora: sabado });
  assert.equal(info.concurso, '#3086');
  assert.equal(info.data, '15/11/2026');
  assert.equal(info.rotulo, 'Domingo, 15/11/2026');
  assert.doesNotMatch(JSON.stringify(info), /17\/11|Terça|20h/);
});

test('sem data oficial, o app mostra o concurso e nenhuma data', () => {
  const info = infoCom({ salvos: { megasena: { concurso: 3086, dataBR: '17/11/2026', dataOficial: false } }, agora: sabado });
  assert.equal(info.concurso, '#3086');
  assert.equal(info.data, '—');
  assert.equal(info.rotulo, '');
});

test('sem sincronização, o concurso vem do último conhecido e a data fica em branco', () => {
  const info = infoCom({ baseMega: [{ concurso: 3085 }], agora: sabado });
  assert.equal(info.concurso, '#3086');
  assert.equal(info.data, '—');
});

test('data oficial que já passou não é usada, e o número do concurso não é adivinhado', () => {
  const info = infoCom({ salvos: { megasena: { concurso: 3086, dataBR: '15/11/2026', dataOficial: true } }, agora: new Date(2026, 10, 18, 9, 0, 0) });
  assert.equal(info.concurso, 'Próximo Oficial');
  assert.equal(info.data, '—');
});

test('no dia do sorteio a data continua valendo', () => {
  const info = infoCom({ salvos: { megasena: { concurso: 3086, dataBR: '15/11/2026', dataOficial: true } }, agora: new Date(2026, 10, 15, 8, 30, 0) });
  assert.equal(info.data, '15/11/2026');
});

test('o rótulo do dia não empurra o domingo para terça', () => {
  const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const SORTEIOS_CALENDARIO = { megasena: { hora: 20 }, lotofacil: { hora: 20 } };
  const funcao = recorte(sorteios, 'function formatarDataProximoCaixa(', '/**\n * Próximo sorteio de uma modalidade');
  const formatar = new Function('NOMES_DIAS', 'SORTEIOS_CALENDARIO', `${funcao}\nreturn formatarDataProximoCaixa;`)(NOMES_DIAS, SORTEIOS_CALENDARIO);

  const rotulo = formatar('15/11/2026', 'megasena', sabado);
  assert.match(rotulo, /Domingo/);
  assert.match(rotulo, /15\/11/);
  assert.doesNotMatch(rotulo, /Terça|17\/11/);
  assert.match(formatar('15/11/2026', 'megasena', new Date(2026, 10, 15, 8, 0, 0)), /^Hoje \(Domingo\)$/);
  assert.match(formatar('15/11/2026', 'megasena', new Date(2026, 10, 15, 11, 30, 0)), /apuração/);
});

test('jogos salvos com duas datas ficam só com a data oficial', () => {
  const funcao = recorte(compartilhar, 'function corrigirDatasDosJogosSalvos() {', '\nwindow.corrigirDatasDosJogosSalvos');
  const carteira = [
    { data: 'Terça (17/11) • 15/11/2026 às 20h' },
    { data: 'Hoje (Domingo) às 20h' },
    { data: '12/11/2026' },
    { data: 'Data oficial a confirmar' },
    { data: '—' }
  ];
  let gravou = 0;
  const corrigidos = new Function('carteiraJogos', 'salvarCarteiraStorage', `${funcao}\nreturn corrigirDatasDosJogosSalvos();`)(carteira, () => { gravou++; });
  assert.equal(corrigidos, 2);
  assert.equal(gravou, 1);
  assert.deepEqual(carteira.map((b) => b.data), ['15/11/2026', '—', '12/11/2026', 'Data oficial a confirmar', '—']);
});
