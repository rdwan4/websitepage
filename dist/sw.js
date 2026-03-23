self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const QURAN_CACHE = 'quran-pages-v1';

const padPage = (page) => String(page).padStart(3, '0');

const isQuranImageRequest = (requestUrl) => {
  return /\/page\d{3}\.png$/i.test(requestUrl);
};

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (!isQuranImageRequest(url)) return;

  event.respondWith(
    caches.open(QURAN_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const network = await fetch(event.request);
      cache.put(event.request, network.clone());
      return network;
    })
  );
});

const postToClient = async (source, payload) => {
  try {
    if (!source || !source.id) return;
    const client = await self.clients.get(source.id);
    if (client) client.postMessage(payload);
  } catch (_) {
    // ignore post message errors
  }
};

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type !== 'CACHE_QURAN_PAGES') return;

  event.waitUntil(
    (async () => {
      try {
        const baseUrl = (data.baseUrl || '').replace(/\/+$/, '');
        const total = Number(data.total || 604);
        const cache = await caches.open(QURAN_CACHE);
        let done = 0;

        for (let page = 1; page <= total; page += 1) {
          const url = `${baseUrl}/page${padPage(page)}.png`;
          const request = new Request(url, { mode: 'no-cors' });
          const cached = await cache.match(request);

          if (!cached) {
            try {
              const response = await fetch(request);
              await cache.put(request, response.clone());
            } catch (_) {
              // Continue caching remaining pages even when one fails.
            }
          }

          done += 1;
          await postToClient(event.source, {
            type: 'QURAN_CACHE_PROGRESS',
            done,
            total,
          });
        }

        await postToClient(event.source, { type: 'QURAN_CACHE_DONE' });
      } catch (error) {
        await postToClient(event.source, {
          type: 'QURAN_CACHE_ERROR',
          message: error?.message || 'Unknown cache error',
        });
      }
    })()
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json?.() || {};
  const { title, ...options } = data;

  if (!title) return;

  event.waitUntil(self.registration.showNotification(title, options));
});
