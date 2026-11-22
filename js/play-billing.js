// ===================================================================
// GOOGLE PLAY BILLING (Digital Goods API + Payment Request API)
// ===================================================================
// Permite vender assinaturas nativas do Google Play dentro da TWA
// cumprindo 100% a política Google Play Payments.
// Só fica ativo quando o app roda na Google Play com os SKUs criados.
(function () {
  'use strict';

  const PAYMENT_METHOD = 'https://play.google.com/billing';
  const SKUS = {
    mensal: 'lotolab_pro_mensal',
    anual: 'lotolab_pro_anual'
  };

  let dgServicePromise = null;

  async function obterServicoDigitalGoods() {
    if (typeof window === 'undefined' || typeof window.getDigitalGoodsService !== 'function') {
      return null;
    }
    if (!dgServicePromise) {
      dgServicePromise = window.getDigitalGoodsService(PAYMENT_METHOD).catch(() => null);
    }
    return dgServicePromise;
  }

  async function disponivel() {
    const svc = await obterServicoDigitalGoods();
    return Boolean(svc && typeof window.PaymentRequest === 'function');
  }

  async function listarPlanos() {
    const svc = await obterServicoDigitalGoods();
    if (!svc || typeof svc.getDetails !== 'function') return [];
    try {
      const detalhes = await svc.getDetails(Object.values(SKUS));
      return Array.isArray(detalhes) ? detalhes : [];
    } catch {
      return [];
    }
  }

  async function validarCompraNoServidor(sku, purchaseToken) {
    const base = window.NASA_SUPABASE_CONFIG?.url;
    const anon = window.NASA_SUPABASE_CONFIG?.anonKey;
    const cliente = typeof obterClienteSupabase === 'function' ? obterClienteSupabase() : null;
    if (!base || !cliente) return { ok: false, motivo: 'Cliente Supabase indisponível' };

    const { data } = await cliente.auth.getSession();
    const jwt = data?.session?.access_token;
    if (!jwt) return { ok: false, motivo: 'Faça login antes de concluir a assinatura.' };

    const res = await fetch(`${base}/functions/v1/validar-play-billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        ...(anon ? { apikey: anon } : {})
      },
      body: JSON.stringify({ sku, purchaseToken })
    });
    const corpo = await res.json().catch(() => ({}));
    return { ok: res.ok && Boolean(corpo.ativo), ...corpo };
  }

  async function assinar(planoId) {
    const sku = SKUS[planoId] || planoId;
    if (!Object.values(SKUS).includes(sku)) {
      throw new Error('SKU de assinatura inválido');
    }
    const ok = await disponivel();
    if (!ok) {
      throw new Error('Google Play Billing indisponível neste navegador');
    }

    const request = new window.PaymentRequest(
      [{ supportedMethods: PAYMENT_METHOD, data: { sku } }],
      { total: { label: 'LotoLab PRO', amount: { currency: 'BRL', value: '0.00' } } }
    );

    const response = await request.show();
    const purchaseToken = response?.details?.purchaseToken;
    if (!purchaseToken) {
      await response.complete('fail');
      throw new Error('Compra sem purchaseToken do Google Play');
    }

    const validacao = await validarCompraNoServidor(sku, purchaseToken);
    if (validacao.ok) {
      await response.complete('success');
      if (typeof window.toast === 'function') window.toast('✅ Assinatura PRO ativada via Google Play!', '👑');
      if (typeof window.atualizarVisualPlano === 'function') window.atualizarVisualPlano();
      return { ok: true, sku, purchaseToken };
    }

    await response.complete('fail');
    throw new Error(validacao.motivo || 'Não foi possível validar a assinatura na Google Play');
  }

  async function restaurarCompras() {
    const svc = await obterServicoDigitalGoods();
    if (!svc || typeof svc.listPurchases !== 'function') return [];
    try {
      const compras = await svc.listPurchases();
      const validas = [];
      for (const c of compras || []) {
        if (c?.itemId && c?.purchaseToken) {
          const v = await validarCompraNoServidor(c.itemId, c.purchaseToken);
          if (v.ok) validas.push(c);
        }
      }
      return validas;
    } catch {
      return [];
    }
  }

  window.playBilling = {
    PAYMENT_METHOD,
    SKUS,
    disponivel,
    listarPlanos,
    assinar,
    restaurarCompras
  };
})();
