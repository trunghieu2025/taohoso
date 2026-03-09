// Kill-switch Service Worker
// Khi browser detect file này khác với SW cũ, nó sẽ install SW mới
// SW mới sẽ tự xóa hết cache và unregister chính nó
self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(names.map(function (name) {
                return caches.delete(name);
            }));
        }).then(function () {
            return self.clients.matchAll();
        }).then(function (clients) {
            clients.forEach(function (client) {
                client.navigate(client.url);
            });
        }).then(function () {
            return self.registration.unregister();
        })
    );
});
