const CACHE_NAME = 'syndex-pwa-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('[SW] Fallo al cachear recurso inicial:', url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NUNCA interceptar peticiones de API, Supabase, archivos ROM gigantes (.gba), WebAssembly (.wasm) ni partidas (.sav)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/roms/') ||
    url.pathname.endsWith('.gba') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.sav') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar copia fresca en cache solo para recursos estáticos estándar (NO binarios pesados)
        if (response && response.status === 200 && response.type === 'basic') {
          // No cachear recursos de más de 2MB en Cache Storage para no colapsar la cuota móvil
          const contentLength = Number(response.headers.get('content-length')) || 0;
          if (contentLength === 0 || contentLength < 2 * 1024 * 1024) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
