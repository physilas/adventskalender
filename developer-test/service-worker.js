self.addEventListener("push", (event) => {
  event.waitUntil(self.registration.showNotification("Adventskalender · Test", {
    body: "Deine Testbenachrichtigung ist angekommen! ♥",
    icon: "../pia-und-paul-github/icon-pia-paul-192.png?v=2",
    badge: "../pia-und-paul-github/icon-pia-paul-192.png?v=2",
    tag: "pia-sixth-december-reminder-test",
    renotify: true,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((window) => window.url.startsWith(self.registration.scope));
    return existing ? existing.focus() : clients.openWindow("./");
  }));
});
