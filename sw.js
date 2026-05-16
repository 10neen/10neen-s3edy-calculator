const CACHE_NAME = 'saidi-calc-v2';
const ASSETS = [
  './',
  './index.html',
  './calculator-style.css',
  './calculator-script.js',
  './productData.js',
  './saidi-logo.PNG',
  './manifest.json'
];

// تثبيت ملف الـ Service Worker وحفظ الملفات في الكاش الداخلي للموبايل
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل وتنظيف الكاش القديم عند التحديث
self.addEventListener('activate', (e) => {
  e.waitUntil(
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

// استدعاء الملفات من الكاش في حالة انقطاع الإنترنت نهائياً لضمان استمرار الشغل
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});