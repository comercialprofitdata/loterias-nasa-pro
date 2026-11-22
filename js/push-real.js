// =========================================================================
// LOTOLAB — CLIENTE DE PUSH REAL EM SEGUNDO PLANO (WEB PUSH VAPID + TWA)
// Registra inscrição PushManager no Service Worker e sincroniza com Supabase.
// =========================================================================
(function () {
  'use strict';

  function base64UrlParaUint8Array(base64Url) {
    const pad = '='.repeat((4 - (base64Url.length % 4)) % 4);
    const b64 = (base64Url + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function suportado() {
    return typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'PushManager' in window
      && 'Notification' in window;
  }

  async function salvarInscricaoNoSupabase(subscription) {
    const json = subscription.toJSON();
    const endpoint = json?.endpoint;
    const p256dh = json?.keys?.p256dh;
    const auth = json?.keys?.auth;
    if (!endpoint || !p256dh || !auth) return false;

    const cliente = typeof window.obterClienteSupabase === 'function' ? window.obterClienteSupabase() : null;
    if (!cliente) return false;

    let userId = null;
    try {
      const { data } = await cliente.auth.getSession();
      userId = data?.session?.user?.id || null;
    } catch {}

    const plataforma = (window.matchMedia?.('(display-mode: standalone)').matches || document.referrer.startsWith('android-app://'))
      ? 'android_twa'
      : 'web';

    const { error } = await cliente.from('push_subscriptions').upsert({
      endpoint,
      p256dh,
      auth,
      user_id: userId,
      plataforma,
      ativo: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });

    return !error;
  }

  async function ativar() {
    if (!suportado()) return { ok: false, motivo: 'Navegador sem suporte a Push.' };
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, motivo: 'Permissão negada pelo aparelho.' };

    try { localStorage.setItem('lotolab_aviso_20h30', '1'); } catch {}

    const vapidKey = window.NASA_SUPABASE_CONFIG?.vapidPublicKey || '';
    if (!vapidKey) {
      return { ok: true, modo: 'local', motivo: 'Alertas locais ativados (aguardando chave VAPID do servidor).' };
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaUint8Array(vapidKey)
      });
    }
    const salvo = await salvarInscricaoNoSupabase(sub);
    return { ok: true, modo: salvo ? 'push_real' : 'local', endpoint: sub.endpoint };
  }

  async function desativar() {
    try { localStorage.removeItem('lotolab_aviso_20h30'); } catch {}
    if (!suportado()) return true;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        const cliente = typeof window.obterClienteSupabase === 'function' ? window.obterClienteSupabase() : null;
        if (cliente && endpoint) {
          await cliente.from('push_subscriptions').update({ ativo: false }).eq('endpoint', endpoint);
        }
      }
    } catch {}
    return true;
  }

  async function status() {
    if (!suportado()) return { suportado: false, ativo: false };
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return { suportado: true, permissao: Notification.permission, ativo: Boolean(sub), pushReal: Boolean(sub) };
    } catch {
      return { suportado: true, permissao: Notification.permission, ativo: false, pushReal: false };
    }
  }

  window.pushReal = { suportado, ativar, desativar, status };
})();
