// Falcon Pharma Impex — Service Worker
// Ilovani internetsiz ham OCHILADIGAN qiladi (offline-first PWA)
//
// MUHIM TUZATISH (#kritik): avvalgi versiya JS fayllarni "keshdan birinchi"
// (cache-first) strategiyasi bilan yuklardi — bu degani, GitHub'da yangi
// tuzatish chiqarilgandan keyin ham, brauzer ESKI, keshlangan app.js/app5.js
// fayllarni ishlatishda davom etardi, chunki CACHE_NAME hech qachon
// o'zgarmagan edi. Bu — ko'p sonli tuzatishlarning "ishlamayotganday"
// ko'rinishining asosiy sababi bo'lgan bo'lishi mumkin edi.
//
// Endi: JS/HTML fayllar uchun "tarmoqdan birinchi" (network-first) strategiya —
// har doim ENG YANGI versiyani olishga harakat qiladi, faqat internet
// bo'lmasa keshga qaytadi. Rasm/manifest kabi kam o'zgaradigan fayllar esa
// hamon tezlik uchun keshdan olinadi.
const CACHE_NAME = 'fpi-cache-v3'; // MUHIM: har safar app*.js o'zgarganda, bu raqamni oshiring (v4, v5...)!
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
// Bu fayllar tez-tez o'zgaradi — HAR DOIM tarmoqdan (eng yangisidan) olinishi kerak
const NETWORK_FIRST_EXT = ['.js', '.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => console.warn('SW: keshlab bo\'lmadi:', url, err))
        )
      );
    })
  );
  self.skipWaiting(); // Yangi versiya darhol faollashsin, eski kutib turmasin
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim(); // Barcha ochiq oynalarda darhol yangi SW ishlatilsin
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Apps Script (backend API) so'rovlarini hech qachon keshlamaymiz
  if (url.includes('script.google.com')) {
    return;
  }

  const isNetworkFirst = NETWORK_FIRST_EXT.some((ext) => url.includes(ext)) || event.request.mode === 'navigate';

  if (isNetworkFirst) {
    // TARMOQDAN BIRINCHI: har doim eng yangi versiyani olishga harakat qilamiz
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Internet yo'q — keshdagi (eski bo'lsa ham) versiyani ishlatamiz
          return caches.match(event.request).then((cached) => cached || caches.match('./index.html'));
        })
    );
  } else {
    // KESHDAN BIRINCHI: rasm/manifest kabi kam o'zgaradigan fayllar uchun (tezroq)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
