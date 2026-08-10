// Falcon Pharma Impex — Service Worker
// Ilovani internetsiz ham OCHILADIGAN qiladi (offline-first PWA)
const CACHE_NAME = 'fpi-cache-v1'; // Yangi versiya chiqarganda bu raqamni oshiring (masalan v2, v3...)
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './app2.js',
  './app3.js',
  './app4.js',
  './app4_manager.js',
  './app5.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './tashkent_tumanlar.geojson',
];

// O'RNATISH: barcha asosiy fayllarni keshga oldindan yuklab qo'yamiz
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Har bir faylni alohida qo'shamiz — biror fayl topilmasa ham, boshqalari saqlanib qolsin
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn('SW: keshlab bo\'lmadi:', url, err))
        )
      );
    })
  );
  self.skipWaiting(); // Yangi versiya darhol faollashsin
});

// FAOLLASHTIRISH: eski keshlarni tozalaymiz
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// SO'ROVLARNI USHLAB OLISH:
// - Apps Script (API) so'rovlari — har doim internetdan (tarmoqdan) so'raladi, keshlanmaydi
//   (chunki bu jonli ma'lumot — vizit saqlash, login va h.k.)
// - Boshqa barcha fayllar (HTML/JS/CSS/rasm) — avval keshdan, topilmasa tarmoqdan
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Apps Script so'rovlarini (backend API) keshlab bo'lmaydi — har doim tarmoqqa yuboramiz
  if (url.includes('script.google.com')) {
    return; // brauzerning o'zi to'g'ridan-to'g'ri tarmoqqa yuboradi, SW aralashmaydi
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached; // Keshda bor — darhol qaytaramiz (tez, internetsiz ham ishlaydi)
      return fetch(event.request)
        .then((response) => {
          // Muvaffaqiyatli yuklangan yangi faylni ham keshga qo'shib qo'yamiz
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Internet ham yo'q, keshda ham yo'q — asosiy sahifani qaytaramiz (bo'sh ekran o'rniga)
          if (event.request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
