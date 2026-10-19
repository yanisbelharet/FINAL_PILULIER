/* Service worker de l'app /app : notifications de nouvelles commandes (même app fermée). */
const CACHE = 'yanis-app';

const readValue = async (key) => {
  const res = await (await caches.open(CACHE)).match(key);
  return res ? res.text() : null;
};
const writeValue = async (key, value) => (await caches.open(CACHE)).put(key, new Response(String(value)));

const formatPrice = (n, currency) => `${Number(n || 0).toLocaleString('fr-FR')} ${currency === 'LYD' ? 'LYD' : 'DA'}`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    const options = { icon: '/app-icons/icon-192.png', badge: '/app-icons/badge-96.png', vibrate: [200, 100, 200], data: { url: '/app' } };
    try {
      const token = await readValue('/__token');
      const res = await fetch('/api/app/recent-orders', { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const orders = await res.json();
      const lastSeen = Number(await readValue('/__last-seen')) || 0;
      let fresh = orders.filter(o => Number(o.orderNumber) > lastSeen);
      if (!lastSeen) fresh = orders.slice(0, 1);
      if (orders[0] && orders[0].orderNumber) await writeValue('/__last-seen', orders[0].orderNumber);

      // Prévient l'app si elle est ouverte, pour rafraîchir les chiffres
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach(c => c.postMessage({ type: 'new-order' }));

      if (fresh.length === 0) {
        return self.registration.showNotification('🔔 Notifications actives', { ...options, body: 'Vous recevrez une alerte à chaque nouvelle commande.', tag: 'test' });
      }
      await Promise.all(fresh.slice(0, 3).reverse().map(o =>
        self.registration.showNotification(`🛒 Nouvelle commande #${o.displayId || o.orderNumber || ''}`, {
          ...options,
          body: `${formatPrice(o.price, o.currency)} · ${o.wilaya || ''}\n${o.name || ''}${o.productName ? ' — ' + o.productName : ''}`,
          tag: 'order-' + (o.orderNumber || o.id),
        })
      ));
    } catch (e) {
      return self.registration.showNotification('🛒 Nouvelle commande', { ...options, body: 'Ouvrez l\'app pour voir le détail.', tag: 'order-generic' });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = (event.notification.data && event.notification.data.url) || '/app';
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = all.find(c => new URL(c.url).pathname.startsWith('/app'));
    if (existing) return existing.focus();
    return self.clients.openWindow(url);
  })());
});
