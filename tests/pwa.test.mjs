import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PWA: manifest.json está configurado e válido', () => {
  assert.ok(fs.existsSync('manifest.json'), 'manifest.json deve existir');
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
  
  assert.ok(manifest.name, 'Manifest deve ter name');
  assert.ok(manifest.short_name, 'Manifest deve ter short_name');
  assert.ok(manifest.start_url, 'Manifest deve ter start_url');
  assert.ok(['standalone', 'fullscreen'].includes(manifest.display), 'Display deve ser standalone ou fullscreen');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'Deve conter pelo menos 2 ícones');
  
  for (const icon of manifest.icons) {
    const iconPath = icon.src.replace(/^\.\//, '');
    assert.ok(fs.existsSync(iconPath), `Ícone referenciado ${icon.src} deve existir no disco`);
  }
});

test('PWA: Service Worker (sw.js) declara assets existentes', () => {
  assert.ok(fs.existsSync('sw.js'), 'sw.js deve existir');
  const swContent = fs.readFileSync('sw.js', 'utf-8');
  
  assert.match(swContent, /const CACHE_NAME = 'loterias-nasa-pro-v/, 'Deve ter versão de cache');
  assert.match(swContent, /const ASSETS_TO_CACHE = \[/, 'Deve ter array de assets');
  
  // Extrai paths locais de ASSETS_TO_CACHE
  const match = swContent.match(/const ASSETS_TO_CACHE = \[([\s\S]*?)\];/);
  assert.ok(match, 'ASSETS_TO_CACHE deve ser parseável');
  
  const rawList = match[1];
  const items = rawList
    .split(',')
    .map(s => s.trim().replace(/['"]/g, ''))
    .filter(s => s.startsWith('./') && !s.endsWith('/'));

  for (const item of items) {
    const localPath = item.replace(/^\.\//, '');
    assert.ok(fs.existsSync(localPath), `Asset ${item} em sw.js deve existir no disco`);
  }
});

test('PWA: index.html é válido e carrega arquivos essenciais', () => {
  assert.ok(fs.existsSync('index.html'), 'index.html deve existir');
  const html = fs.readFileSync('index.html', 'utf-8');
  
  assert.ok(html.includes('<meta name="viewport"'), 'Deve conter meta viewport');
  assert.ok(html.includes('manifest.json'), 'Deve linkar manifest.json');
  assert.ok(html.includes('css/app.css'), 'Deve linkar css/app.css');
  assert.ok(html.includes('js/app.js'), 'Deve carregar js/app.js');
  assert.ok(html.includes('js/historico-oficial.js'), 'Deve carregar a base oficial');
  assert.ok(html.includes('js/whatsapp-share.js'), 'Deve carregar whatsapp-share.js');
});

test('Play Store: assetlinks.json existe e é válido', () => {
  const assetLinksPath = path.join('.well-known', 'assetlinks.json');
  assert.ok(fs.existsSync(assetLinksPath), '.well-known/assetlinks.json deve existir para TWA');
  
  const content = JSON.parse(fs.readFileSync(assetLinksPath, 'utf-8'));
  assert.ok(Array.isArray(content), 'assetlinks.json deve ser uma lista de declarações');
  assert.ok(content.length > 0, 'assetlinks.json não pode estar vazio');
  assert.ok(content[0].relation, 'Deve conter o campo relation');
  assert.ok(content[0].target, 'Deve conter o campo target');
});
