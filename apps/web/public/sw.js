const CACHE_NAME = 'crowed-rank-v3';

// 설치 이벤트 - 즉시 활성화
self.addEventListener('install', () => {
  console.log('[SW] Installing new service worker');
  // 대기 중인 Service Worker를 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트 - 모든 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker');
  event.waitUntil(
    Promise.all([
      // 1. 모든 이전 캐시 삭제
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // 2. 새 캐시 생성
      caches.open(CACHE_NAME).then(() => {
        console.log('[SW] New cache created:', CACHE_NAME);
      })
    ]).then(() => {
      // 3. 모든 클라이언트에서 즉시 제어권 가져오기
      return self.clients.claim();
    })
  );
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
