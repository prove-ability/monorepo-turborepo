const CACHE_NAME = 'crowed-rank-v2';

// 설치 이벤트 - 빈 캐시로 시작 (런타임 캐싱만 사용)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      console.log('Cache opened');
      // 설치 시에는 캐싱하지 않음 (Next.js는 동적 chunks를 사용)
      return Promise.resolve();
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트 (Network First 전략)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시에 저장
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request);
      })
  );
});
