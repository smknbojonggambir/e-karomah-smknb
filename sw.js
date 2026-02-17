const CACHE_NAME = 'ekaromah-auto-v1'; // Ganti v1 ke v2 jika update kodingan
const OFFLINE_URL = 'index.html'; // Halaman cadangan jika offline total

// 1. Install: Cukup cache halaman utama saja dulu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Kita hanya pre-cache halaman index, sisanya otomatis nanti
      return cache.add(OFFLINE_URL);
    })
  );
  // Paksa SW baru untuk segera aktif
  self.skipWaiting();
});

// 2. Activate: Hapus cache lama agar HP siswa tidak penuh sampah
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Membersihkan cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Strategi "Cache First, Network Fallback, Save Automatically"
self.addEventListener('fetch', (event) => {
  
  // JANGAN cache data API Google Script (harus selalu online/baru)
  if (event.request.url.includes('script.google.com')) {
    return; 
  }

  // JANGAN cache request selain GET (misal POST data)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // A. Jika file ada di cache, berikan langsung (Loading Cepat)
      if (response) {
        return response;
      }

      // B. Jika tidak ada, ambil dari internet
      return fetch(event.request).then((networkResponse) => {
        // Cek validitas respon (harus sukses 200 OK)
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // C. FITUR OTOMATIS: Simpan file baru ke cache untuk kunjungan berikutnya
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // D. Jika internet mati dan file belum ada di cache, tampilkan halaman utama
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
