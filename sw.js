// Service worker: cache-first offline shell + stale-while-revalidate for Google Fonts.
const VERSION = 'zeroday-v20';
const FONT_CACHE = 'zeroday-fonts';

const MODULES = [
  'main', 'game', 'screens', 'render', 'config', 'core', 'audio', 'input', 'sprites', 'world', 'physics',
  'dialog', 'hud', 'puzzle', 'fx', 'combat', 'player', 'hack', 'enemies', 'boss', 'ally', 'interact', 'assets', 'scene',
].map((name) => `js/${name}.js`);

const ART = [
  'hero_idle', 'hero_run', 'hero_jump', 'hero_shoot', 'gle_idle', 'gle_run', 'gle_jump', 'gle_shoot', 'byte', 'byte_pink', 'portrait_byte_pink', 'drone', 'crawler', 'turret', 'boss',
  'tile_city', 'tile_dc', 'tile_core', 'title_art', 'portrait_hero', 'portrait_byte', 'portrait_boss', 'portrait_gleyce', 'gleyce_capsule',
  'bg_city_far', 'bg_city_near', 'bg_dc_far', 'bg_dc_near', 'bg_core_far', 'bg_core_near',
  ...['hero', 'gle'].flatMap((who) => ['idle', 'run', 'jump', 'shoot'].map((pose) => `anim_${who}_${pose}`)),
].map((name) => `assets/${name}.webp`).concat('assets/anims.json');

const PRECACHE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  ...MODULES,
  ...ART,
];

const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const keep = new Set([VERSION, FONT_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(VERSION)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => { if (response.ok || response.type === 'opaque') cache.put(request, response.clone()); return response; })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isFont(url)) event.respondWith(staleWhileRevalidate(request));
  else if (url.origin === self.location.origin) event.respondWith(cacheFirst(request));
});
