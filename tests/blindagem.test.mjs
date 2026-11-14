import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Barreiras contra as quebras de 04/11/2026: volante em 6 colunas, campo
// removido do HTML travando o Gerar, id duplicado e acento corrompido.

const html = fs.readFileSync('index.html', 'utf8');
const arquivosDeTela = [
  'index.html',
  'sw.js',
  ...fs.readdirSync('js').filter((n) => n.endsWith('.js')).map((n) => `js/${n}`),
  ...fs.readdirSync('css').filter((n) => n.endsWith('.css')).map((n) => `css/${n}`),
];

test('o volante da Mega-Sena tem 10 colunas no HTML, no código e no CSS', () => {
  assert.match(html, /id="volante-grid" class="[^"]*\bgrid-cols-10\b[^"]*\bclassic-10x6\b/);
  assert.match(fs.readFileSync('js/app.js', 'utf8'), /grid\.className = 'grid grid-cols-10 classic-10x6 /);
  const css = fs.readFileSync('css/redesign.css', 'utf8');
  const regrasDoVolante = [...css.matchAll(/#volante-grid\.grid-cols-10[^{]*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(regrasDoVolante.length > 0, 'deve haver regra de colunas para o volante');
  regrasDoVolante
    .filter((regra) => regra.includes('grid-template-columns'))
    .forEach((regra) => assert.match(regra, /repeat\(10,/, 'nenhuma regra pode tirar as 10 colunas do volante'));
});

test('os campos que o código da tela Gerar usa existem no HTML', () => {
  const obrigatorios = [
    'view-volante', 'modalidade-label', 'qtd-selecionadas', 'max-selecao-label',
    'label-qtd-ativa', 'container-seletores-qtd',
    'btn-qtd-jogos-1', 'btn-qtd-jogos-2', 'btn-qtd-jogos-3', 'btn-qtd-jogos-5',
    'txt-btn-gerar-principal', 'container-abas-jogos-gerados', 'lista-abas-jogos-gerados',
    'label-titulo-jogo-ativo', 'custo-jogo-selecionado', 'display-meu-jogo',
    'alerta-jogo-ja-jogado', 'txt-btn-joguei-jogo', 'btn-whatsapp-lote', 'txt-whatsapp-botao',
    'volante-titulo-tipo', 'btn-modo-normal', 'btn-modo-fixo', 'btn-modo-proibido',
    'painel-regras-ativas', 'volante-grid', 'legenda-volante',
    'card-matriz-4x4-box', 'painel-score-telemetria', 'card-bateria-testes',
    'teste-card-1', 'teste-card-2', 'teste-card-3', 'teste-card-4', 'teste-card-5', 'teste-card-6',
    'badge-total-testes-ok', 'card-sugestao-troca', 'conteudo-sugestao-troca',
    'bolao-nome', 'bolao-cotas',
  ];
  const faltando = obrigatorios.filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(faltando, [], `campos removidos do HTML: ${faltando.join(', ')}`);
});

test('nenhum id aparece duas vezes no HTML', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  assert.deepEqual(repetidos, [], `ids repetidos: ${repetidos.join(', ')}`);
});

test('as seções do HTML abrem e fecham na ordem certa', () => {
  // Um </div> a menos já escondeu o Bolão dentro do painel do Jogo.
  const inicio = html.indexOf('<section id="view-volante"');
  const fim = html.indexOf('</section>', inicio);
  const trecho = html.slice(inicio, fim);
  const abre = (trecho.match(/<div\b/g) || []).length;
  const fecha = (trecho.match(/<\/div>/g) || []).length;
  assert.equal(abre, fecha, 'a tela Gerar tem <div> sem fechar ou fechado a mais');
});

test('os arquivos da tela estão em UTF-8 sem BOM, sem CRLF e sem acento corrompido', () => {
  const corrompido = /Ã[\u0080-¿]|â€|ðŸ|Â[ -¿]/;
  const problemas = [];
  for (const arquivo of arquivosDeTela) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    if (texto.charCodeAt(0) === 0xFEFF) problemas.push(`${arquivo}: BOM`);
    if (texto.includes('\r')) problemas.push(`${arquivo}: CRLF`);
    if (corrompido.test(texto)) problemas.push(`${arquivo}: acento corrompido`);
  }
  assert.deepEqual(problemas, []);
});
