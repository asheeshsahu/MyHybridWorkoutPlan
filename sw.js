const CACHE_NAME = 'hybridfit-v1';
const urlsToCache = [
    '/app.html',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Time for your workout!',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'start', title: 'Start Workout' },
            { action: 'snooze', title: 'Snooze 10min' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('HybridFit', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'start') {
        event.waitUntil(
            clients.openWindow('/app.html')
        );
    } else if (event.action === 'snooze') {
        // Schedule another notification in 10 minutes
        setTimeout(() => {
            self.registration.showNotification('HybridFit', {
                body: 'Reminder: Time for your workout!',
                icon: 'icon-192.png'
            });
        }, 10 * 60 * 1000);
    }
});

// Background sync for offline workout logging
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-workouts') {
        event.waitUntil(syncWorkouts());
    }
});

async function syncWorkouts() {
    // Sync any pending workout data when back online
    console.log('Syncing workouts...');
}
