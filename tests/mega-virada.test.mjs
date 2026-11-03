import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function extrair(codigo, inicioTexto, fimTexto) {
  const inicio = codigo.indexOf(inicioTexto);
  const fim = codigo.indexOf(fimTexto, inicio);
  assert.notEqual(inicio, -1, `Esperava encontrar: ${inicioTexto}`);
  assert.notEqual(fim, -1, `Esperava encontrar: ${fimTexto}`);
  return codigo.slice(inicio, fim);
}

test('destino da Mega da Virada é identificado como palpite, sem data ou concurso inventado', () => {
  const codigo = fs.readFileSync('js/whatsapp-share.js', 'utf8');
  const funcao = extrair(codigo, 'function obterDestinoJogo(modalidade) {', '\nwindow.obterDestinoJogo');
  const obterDestino = new Function(
    'window',
    'obterInfoProximoSorteio',
    `${funcao}\nreturn obterDestinoJogo;`
  )({ estaPlanejandoMegaVirada: () => true }, () => assert.fail('Não deve consultar concurso regular'));

  assert.deepEqual(obterDestino('megasena'), {
    concurso: 'Mega da Virada 2026',
    data: 'Data oficial a confirmar',
    status: 'Palpite planejado • não é aposta oficial',
    tipo: 'mega_virada_2026'
  });
});

test('modo de planejamento não registra o jogo como aposta realizada', () => {
  const codigo = fs.readFileSync('js/whatsapp-share.js', 'utf8');
  const funcao = extrair(codigo, 'function marcarComoJogadoProximoConcurso() {', '\nfunction salvarJogoAtivoNaCarteira');
  let salvouPalpite = false;
  const marcarComoJogado = new Function(
    'window',
    'salvarJogoAtivoNaCarteira',
    `${funcao}\nreturn marcarComoJogadoProximoConcurso;`
  )({ estaPlanejandoMegaVirada: () => true }, () => { salvouPalpite = true; });

  marcarComoJogado();

  assert.equal(salvouPalpite, true);
  assert.ok(funcao.indexOf('if (window.estaPlanejandoMegaVirada') < funcao.indexOf('registradoComoJogado: true'));
});

test('palpite da Mega da Virada não é classificado como concurso passado', () => {
  const codigo = fs.readFileSync('js/carteira-gestao.js', 'utf8');
  const funcao = extrair(codigo, '  window.concursoOuDataEhPassado = function', '\n\n  window.setFiltroTempoCarteira');
  const windowFalso = { baseConcursosMega: [{ concurso: 3081 }] };
  new Function('window', `${funcao}\nreturn true;`)(windowFalso);

  assert.equal(windowFalso.concursoOuDataEhPassado('Mega da Virada 2026', 'Data oficial a confirmar', 'megasena'), false);
  assert.equal(windowFalso.concursoOuDataEhPassado('#3080', '01/01/2026', 'megasena'), true);
});

test('carteira rotula o planejamento e exclui-o da correção de datas de concursos regulares', () => {
  const codigo = fs.readFileSync('js/carteira-gestao.js', 'utf8');

  assert.match(codigo, /const ehPlanoMegaVirada = mod === 'megasena'/);
  assert.match(codigo, /const enc = !ehPlanoMegaVirada && numConc > 0/);
  assert.match(codigo, /Palpite salvo • não é aposta oficial/);
  assert.match(codigo, /const ehPassado = !ehPlanoMegaVirada && window\.concursoOuDataEhPassado/);
  assert.match(codigo, /Palpites planejados/);
  assert.match(codigo, /não são comprovantes nem registros de apostas oficiais/);
});

test('compartilhamento e impressão mantêm o aviso de que o planejamento não é uma aposta oficial', () => {
  const carteira = fs.readFileSync('js/carteira-gestao.js', 'utf8');
  const impressao = fs.readFileSync('js/volante-impressao.js', 'utf8');
  const compartilhamento = fs.readFileSync('js/whatsapp-share.js', 'utf8');

  assert.match(compartilhamento, /não é comprovante nem registro de aposta oficial/);
  assert.match(carteira, /Palpites planejados/);
  assert.match(impressao, /contexto\.planejamento/);
  assert.match(impressao, /não é comprovante nem registro de aposta oficial/);
  assert.match(impressao, /'Palpites' : 'Apostas'/);
});
