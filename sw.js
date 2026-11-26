const CACHE_NAME = 'saidi-calc-v3.5';
const ASSETS = [
  './',
  './index.html',
  './calculator-style.css',
  './calculator-script.js',
  './productData.js',
  './saidi-logo.png',
  './manifest.json'
];

// تثبيت الخدمة وحفظ الملفات الأساسية للأوفلاين
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          // تجاهل أي ملف خارجي مثل الخطوط إذا لم يتوفر وقت التثبيت
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة ومسح أي كاش قديم فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية شبكة أولاً مع رجوع للكاش عند انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
