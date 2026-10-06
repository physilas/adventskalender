self.addEventListener("push", (event) => {
  event.waitUntil(self.registration.showNotification("Psst, Pia …", {
    body: "Heute ist der 6. Dezember. Vielleicht möchtest du Paul gleich etwas ins Ohr flüstern. ♥",
    icon: "../pia-und-paul-github/icon-pia-paul-192.png?v=2",
    badge: "../pia-und-paul-github/icon-pia-paul-192.png?v=2",
    tag: "pia-sixth-december-reminder-test",
    renotify: true,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((window) => new URL(window.url).origin === self.location.origin);
    return existing ? existing.focus() : clients.openWindow("./");
  }));
});
