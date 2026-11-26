/// <reference types="vite/client" />

interface PrecacheEntry {
  url: string;
  revision?: string | null;
}

interface SWExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface SWFetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface SWGlobalScope {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
  skipWaiting(): Promise<void>;
  clients: {
    claim(): Promise<void>;
  };
  addEventListener(type: 'install' | 'activate', listener: (event: SWExtendableEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: SWFetchEvent) => void): void;
}

declare global {
  interface Window {
    __WB_MANIFEST: Array<PrecacheEntry | string>;
  }
}

const swSelf = self as unknown as SWGlobalScope;

const PRECACHE_NAME = 'boardcraft-precache-v1';
const RUNTIME_CACHE_NAME = 'boardcraft-runtime-v1';
const FONT_CACHE_NAME = 'boardcraft-fonts-v1';

const rawManifest = self.__WB_MANIFEST || [];
const precacheUrls = Array.from(
  new Set([
    '/',
    '/index.html',
    ...rawManifest.map((entry) => (typeof entry === 'string' ? entry : entry.url)),
  ])
);

swSelf.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          precacheUrls.map((url) => cache.add(new Request(url, { cache: 'reload' })))
        )
      )
      .then(() => swSelf.skipWaiting())
  );
});

swSelf.addEventListener('activate', (event) => {
  const validCaches = new Set([PRECACHE_NAME, RUNTIME_CACHE_NAME, FONT_CACHE_NAME]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !validCaches.has(key)).map((key) => caches.delete(key))
        )
      )
      .then(() => swSelf.clients.claim())
  );
});

swSelf.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip WebSocket, API, and non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws')) return;

  // Skip Vite dev-server module endpoints during development
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/@vite') ||
      url.pathname.startsWith('/@react-refresh') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/node_modules/'))
  ) {
    return;
  }

  // Cache-first for Google Fonts so typography works offline
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok || response.type === 'opaque') {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // Navigation requests: network-first with offline fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PRECACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedIndex =
            (await caches.match('/index.html', { ignoreSearch: true })) ||
            (await caches.match('/', { ignoreSearch: true }));
          return (
            cachedIndex ||
            new Response('Offline — BoardCraft shell not cached yet.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        })
    );
    return;
  }

  // Same-origin static assets: cache-first with runtime caching fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
    );
  }
});
