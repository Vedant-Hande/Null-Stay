/* NullStay — Web Push service worker */
self.addEventListener("push", (event) => {
  let data = {
    title: "NullStay",
    body: "You have a new notification",
    url: "/notifications",
    icon: "/img/nullstay-notification.svg",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/img/nullstay-notification.svg",
      badge: "/img/nullstay-notification.svg",
      tag: data.tag || "nullstay-push",
      data: { url: data.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
