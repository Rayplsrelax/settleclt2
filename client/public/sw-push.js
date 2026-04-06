/**
 * Push Notification Service Worker
 * Handles incoming push events and notification clicks.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag || "settle-clt-notification",
      data: {
        url: data.actionUrl || "/",
      },
      actions: data.actionUrl
        ? [{ action: "open", title: "View" }]
        : [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Settle CLT", options)
    );
  } catch (e) {
    console.error("[SW] Failed to show notification:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});
