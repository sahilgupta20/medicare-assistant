// MediCare Assistant Service Worker
const CACHE_NAME = 'medicare-assistant-v1'
const urlsToCache = [
  '/',
  '/medications',
  '/manifest.json'
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Service Worker: Caching important files')
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('❌ Cache failed for some files:', error)
          return Promise.resolve()
        })
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete')
        return self.skipWaiting()
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cache)
            return caches.delete(cache)
          }
        })
      )
    }).then(() => {
      console.log('✅ Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Helper function to check if request should be cached
function shouldCacheRequest(request) {
  // Only cache GET requests
  if (request.method !== 'GET') return false
  
  // Don't cache chrome-extension, moz-extension, or other browser extension requests
  if (request.url.startsWith('chrome-extension://') || 
      request.url.startsWith('moz-extension://') ||
      request.url.startsWith('safari-extension://') ||
      request.url.startsWith('ms-browser-extension://')) {
    return false
  }
  
  // Don't cache data: URLs
  if (request.url.startsWith('data:')) return false
  
  // Don't cache blob: URLs
  if (request.url.startsWith('blob:')) return false
  
  // Only cache same-origin requests (your website)
  try {
    const requestUrl = new URL(request.url)
    const currentUrl = new URL(self.location)
    return requestUrl.origin === currentUrl.origin
  } catch (e) {
    return false
  }
}

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip requests we shouldn't cache
  if (!shouldCacheRequest(event.request)) {
    return
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          console.log('📥 Caching:', event.request.url)
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch((error) => {
              console.log('❌ Failed to cache:', event.request.url, error)
            })
          })
        }
        return response
      })
      .catch((error) => {
        console.log('🌐 Network failed, trying cache for:', event.request.url)
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('✅ Served from cache:', event.request.url)
            return cachedResponse
          }
          
          // If it's a navigation request and we don't have it cached, return the main page
          if (event.request.destination === 'document') {
            return caches.match('/').then((homeResponse) => {
              if (homeResponse) {
                return homeResponse
              }
              // Fallback offline page
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>MediCare Assistant - Offline</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                    .pill { font-size: 48px; margin-bottom: 20px; }
                  </style>
                </head>
                <body>
                  <div class="pill">💊</div>
                  <h1>MediCare Assistant</h1>
                  <p>You're currently offline, but your medication information is still accessible.</p>
                  <p>Please check your internet connection and try again.</p>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              })
            })
          }
          
          // For other resources, return a simple offline message
          return new Response('Content not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          })
        })
      })
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag)
  event.notification.close()

  // Handle different notification actions
  if (event.action === 'taken') {
    console.log('✅ User marked medication as taken')
  } else if (event.action === 'snooze') {
    console.log('😴 User snoozed medication reminder')
    // Schedule another notification in 10 minutes
    setTimeout(() => {
      self.registration.showNotification('Medication Reminder (Snoozed)', {
        body: event.notification.body,
        icon: '/icon-192.png',
        tag: event.notification.tag + '-snoozed',
        requireInteraction: true
      })
    }, 10 * 60 * 1000)
  }

  // Focus or open the app window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/medications') && 'focus' in client) {
          return client.focus()
        }
      }
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/medications')
      }
    })
  )
})

// Handle service worker messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📦 Service Worker: Received skip waiting message')
    self.skipWaiting()
  }
})