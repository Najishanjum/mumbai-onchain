/* Push notifications for the installed app. Loaded into the generated
   service worker (vite.config.ts → workbox.importScripts).

   Payload (JSON, sent by supabase/functions/send-push):
     { "title": "...", "body": "...", "url": "/?tab=people&person=…", "tag": "..." } */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Mumbai Onchain';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/favicon-64.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/' },
    })
  );
});

// Tapping a notification opens the app (or brings it forward) at its link.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ('focus' in win) {
          win.navigate(url).catch(() => {});
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
