const CACHE_NAME = 'mi-calendario-pwa-v2026-11-14-v4';
const OFFLINE_URL = './index.html';
const APP_SHELL = [
  './',
  './index.html',
  './privacy.html',
  './manifest.webmanifest',
  './icon.svg',
  './mi-calendario-icon-192.png',
  './mi-calendario-icon-512.png',
  './screenshot-mobile-1.png',
  './screenshot-mobile-2.png',
  './screenshot-mobile-3.png',
  './screenshot-mobile-4.png',
  './screenshot-mobile-5.png',
  './screenshot-wide-1.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('nager.at')) {
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached || caches.match(OFFLINE_URL));
        return cached || networkFetch;
      })
    );
  }
});

// Background Sync handler para respaldo y sincronización diferida
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calendario-data') {
    event.waitUntil(Promise.resolve());
  }
});

// Periodic Background Sync handler para actualización de caché y feriados

// Sincronización de alarmas en IndexedDB para el Service Worker
function openAlarmsIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mi_calendario_alarms_db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('alarms')) db.createObjectStore('alarms', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function checkDueAlarmsInSW() {
  try {
    const db = await openAlarmsIDB();
    const tx = db.transaction('alarms', 'readonly');
    const store = tx.objectStore('alarms');
    const all = await new Promise((res, rej) => {
      const r = store.getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const dow = now.getDay();

    for (const alarm of all) {
      if (!alarm || !alarm.enabled || !alarm.time) continue;
      const [hh, mm] = String(alarm.time).split(':').map(Number);
      if (!Number.isInteger(hh) || !Number.isInteger(mm)) continue;
      const alarmMin = hh * 60 + mm;
      const matchesDay =
        alarm.repeat === 'daily' ||
        (alarm.repeat === 'weekdays' && dow >= 1 && dow <= 5) ||
        (alarm.repeat === 'once' && alarm.date === todayKey);
      if (!matchesDay) continue;
      if (nowMin >= alarmMin && nowMin - alarmMin <= 30) {
        await self.registration.showNotification(alarm.title || 'Alarma Mi Calendario', {
          body: `Recordatorio programado (${alarm.time})`,
          icon: './mi-calendario-icon-192.png',
          badge: './mi-calendario-icon-192.png',
          tag: `sw-alarm-${alarm.id}-${todayKey}`,
          renotify: true,
          requireInteraction: true,
          silent: false,
          vibrate: [500, 250, 500, 250, 800],
          data: { url: './' }
        });
      }
    }
  } catch (e) {}
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_ALARMS_NOW') {
    event.waitUntil(checkDueAlarmsInSW());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-alarms') {
    event.waitUntil(checkDueAlarmsInSW());
  } else if (event.tag === 'update-calendario-cache') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest']))
    );
  }
});

// Push Notifications handler para avisos de turnos, medicamentos y controles
self.addEventListener('push', (event) => {
  let data = { title: 'Mi Calendario', body: 'Tienes un recordatorio pendiente.', icon: './mi-calendario-icon-192.png' };
  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || './mi-calendario-icon-192.png',
      badge: './mi-calendario-icon-192.png',
      silent: false,
      requireInteraction: true,
      vibrate: [500, 250, 500],
      data: { url: data.url || './' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
