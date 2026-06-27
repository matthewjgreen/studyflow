/* Trackr service worker — receives Web Push messages and shows them as OS
   notifications, even when the app/tab is closed. */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Trackr', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Trackr'
  const options = {
    body: data.body || '',
    tag: data.tag, // collapses duplicate reminders for the same assignment
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing Trackr tab if one is open; otherwise open a new one.
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
