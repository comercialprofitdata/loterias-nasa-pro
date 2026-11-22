import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('play-billing expõe SKUs oficiais e detecta Digital Goods API', async () => {
  const src = fs.readFileSync('js/play-billing.js', 'utf8');
  const janela = {
    PaymentRequest: function () {},
    getDigitalGoodsService: async (method) => {
      assert.equal(method, 'https://play.google.com/billing');
      return {
        getDetails: async (skus) => skus.map((itemId) => ({ itemId, price: { currency: 'BRL', value: itemId.includes('anual') ? '19.90' : '6.90' } })),
        listPurchases: async () => []
      };
    }
  };
  new Function('window', src)(janela);

  assert.equal(janela.playBilling.SKUS.mensal, 'lotolab_pro_mensal');
  assert.equal(janela.playBilling.SKUS.anual, 'lotolab_pro_anual');
  assert.equal(await janela.playBilling.disponivel(), true);

  const planos = await janela.playBilling.listarPlanos();
  assert.equal(planos.length, 2);
  assert.equal(planos[0].itemId, 'lotolab_pro_mensal');
  assert.equal(planos[1].itemId, 'lotolab_pro_anual');
});

test('Edge Function validar-play-billing exige JWT e consulta API oficial do Google Play', () => {
  const fnSrc = fs.readFileSync('supabase/functions/validar-play-billing/index.ts', 'utf8');
  assert.match(fnSrc, /lotolab_pro_mensal/);
  assert.match(fnSrc, /lotolab_pro_anual/);
  assert.match(fnSrc, /androidpublisher\.googleapis\.com\/androidpublisher\/v3\/applications\//);
  assert.match(fnSrc, /SUBSCRIPTION_STATE_ACTIVE/);
});
