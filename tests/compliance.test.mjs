import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Legal & LGPD: Política de Privacidade existe e é detalhada', () => {
  assert.ok(fs.existsSync('privacidade.html'), 'privacidade.html deve existir para Google Play e LGPD');
  const content = fs.readFileSync('privacidade.html', 'utf-8');
  assert.ok(content.length > 1000, 'privacidade.html deve ser um documento completo');
  assert.ok(content.toLowerCase().includes('lgpd'), 'Deve citar a LGPD');
  assert.ok(content.toLowerCase().includes('exclusão') || content.toLowerCase().includes('exclusao'), 'Deve citar exclusão de dados');
});

test('Legal & LGPD: Página de exclusão de conta existe (Requisito Play Store)', () => {
  assert.ok(fs.existsSync('excluir-conta.html'), 'excluir-conta.html deve existir para cumprir a política do Google Play');
  const content = fs.readFileSync('excluir-conta.html', 'utf-8');
  assert.ok(content.length > 500, 'excluir-conta.html deve conter instruções ou formulário');
});

test('Legal: Licença e isenções de responsabilidade', () => {
  assert.ok(fs.existsSync('LICENSE'), 'LICENSE deve existir');
  const readme = fs.readFileSync('README.md', 'utf-8');
  assert.ok(readme.includes('não declara vínculo oficial com ou MIT') || readme.includes('Meu Volante PRO'), 'README deve manter clareza sobre o posicionamento');
});
