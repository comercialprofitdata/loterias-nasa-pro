// =========================================================================
// MEU VOLANTE PRO — SERVICE WORKER v1.0
// Estratégia: Cache-First para assets estáticos, Network-First para dados
// =========================================================================

const CACHE_NAME = 'loterias-nasa-pro-v20261101.13';
const CACHE_STATIC = 'nasa-static-v20261101.13';

// Assets críticos para funcionamento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './css/app.css',
  './js/app.js',
  './js/error-trap.js',
  './js/feedback-testadores.js',
  './js/simulador-retrospectivo.js',
  './js/volante-impressao.js',
  './js/testadores-vip.js',
  './js/carteira-gestao.js',
  './js/admin-telemetria.js',
  './js/historico-oficial.js',
  './js/whatsapp-share.js',
  './js/upgrade-modal.js',
  './js/caixa-api.js',
  './js/historico-real.js',
  './js/sorteios-reais.js',
  './js/conferencia-real.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap'
];

// =========================================================================
// INSTALL: Pré-cacheia todos os assets críticos
// =========================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      // Tenta cachear assets críticos, ignora falhas individuais
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(() => console.warn('[SW] Falha ao cachear:', url))
        )
      );
    }).then(() => {
      self.skipWaiting(); // Ativa imediatamente sem esperar aba fechar
    })
  );
});

// =========================================================================
// ACTIVATE: Limpa caches antigos e toma controle imediato
// =========================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_STATIC && cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Controla todas as abas abertas imediatamente
    })
  );
});

// =========================================================================
// FETCH: Estratégia Cache-First para assets, Network-First para APIs externas
// =========================================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições de extensões de navegador
  if (!event.request.url.startsWith('http')) return;

  // Para APIs externas (Caixa, etc.) — Network-First com fallback
  const isApiRequest = url.hostname !== self.location.hostname &&
    !url.hostname.includes('cdn.tailwindcss.com') &&
    !url.hostname.includes('fonts.googleapis.com') &&
    !url.hostname.includes('github.io');

  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para HTML/CSS/JS locais — Network-First com fallback para cache (garante atualização imediata no celular)
  const isLocalCode = url.hostname === self.location.hostname || url.hostname.includes('github.io');
  if (isLocalCode && !url.pathname.endsWith('.png')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para imagens e CDNs — Cache-First com atualização em background
  event.respondWith(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Retorna cache imediatamente se disponível; atualiza em background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// =========================================================================
// PUSH NOTIFICATIONS (Preparado para alertas de concurso)
// =========================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🎯 Meu Volante PRO';
  const options = {
    body: data.body || 'Novo resultado disponível!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'nasa-loterias-notification',
    requireInteraction: false,
    data: { url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

console.log('[SW] Meu Volante PRO Service Worker v1.0 — Operacional!');
