// Afya Intelligence Service Worker
const CACHE_NAME = 'afya-intelligence-v1';
const CACHE_URLS = [
  '/',
  '/dashboard',
  '/profile',
  '/src/index.css',
  '/src/main.tsx',
  '/src/App.tsx',
  'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app resources');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
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
    }).then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Store successful API responses in cache for offline access
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle regular requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache POST requests or non-successful responses
          if (event.request.method !== 'GET' || !response.ok) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline symptom logging
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-symptoms') {
    event.waitUntil(syncOfflineSymptoms());
  }
});

// Push notifications for health alerts
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Health update available',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'health-alert'
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/icon-96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Afya Intelligence', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Sync offline symptoms when connection is restored
async function syncOfflineSymptoms() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineData = await cache.match('/offline-symptoms');
    
    if (offlineData) {
      const symptoms = await offlineData.json();
      
      for (const symptom of symptoms) {
        try {
          await fetch('/api/log_symptom', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${symptom.token}`
            },
            body: JSON.stringify(symptom.data)
          });
        } catch (error) {
          console.error('Failed to sync symptom:', error);
        }
      }
      
      // Clear offline data after successful sync
      await cache.delete('/offline-symptoms');
      console.log('Offline symptoms synced successfully');
    }
  } catch (error) {
    console.error('Error syncing offline symptoms:', error);
  }
}
