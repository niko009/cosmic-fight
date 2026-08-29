const CACHE = 'cosmic-fight-shell-v5';
const SHELL = ['/', '/manifest.webmanifest', '/logo-mark.svg', '/ship-vanguard.svg'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => { event.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))])); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/') || new URL(event.request.url).pathname.startsWith('/hubs/')) return;
  const url = new URL(event.request.url);
  const request = (event.request.mode === 'navigate' || url.pathname === '/version.json') ? new Request(event.request, { cache: 'no-store' }) : event.request;
  event.respondWith(fetch(request).then(response => { if (response.ok && url.origin === self.location.origin) { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); } return response; }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/'))));
});
