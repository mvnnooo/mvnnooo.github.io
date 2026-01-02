const CACHE_NAME = 'mvnnooo-v1';
const STATIC_ASSETS = [
    '/MVNNOOO-Website/',
    '/MVNNOOO-Website/index.html',
    '/MVNNOOO-Website/manifest.webmanifest',
    '/MVNNOOO-Website/offline.html',
    '/MVNNOOO-Website/assets/css/styles.css',
    '/MVNNOOO-Website/assets/js/app.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إرجاع النسخة المخزنة إذا كانت موجودة
                if (response) {
                    return response;
                }
                
                // تحميل من الشبكة
                return fetch(event.request)
                    .then(response => {
                        // لا نخزن الاستجابات غير الناجحة
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // تخزين الاستجابة في الذاكرة المؤقتة
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        // عند عدم الاتصال، عرض صفحة offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('/MVNNOOO-Website/offline.html');
                        }
                        return new Response('No internet connection', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// تلقي الرسائل من الصفحة
self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
