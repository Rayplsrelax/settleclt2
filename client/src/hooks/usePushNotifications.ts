import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type PushState = "unsupported" | "denied" | "granted" | "default" | "loading";

/**
 * Hook for managing browser push notification registration.
 * Handles service worker registration, permission requests, and subscription management.
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const saveSub = trpc.notifications.savePushSubscription.useMutation();
  const removeSub = trpc.notifications.removePushSubscription.useMutation();

  // Check current state on mount
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission;
    setState(permission as PushState);

    // Check for existing subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setSubscription(sub);
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!user) return;

    try {
      setState("loading");

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw-push.js");
      await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission as PushState);
        return;
      }

      // Create push subscription
      // Using a VAPID public key - in production this should come from the server
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This is a placeholder VAPID key - replace with real one when push server is set up
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkGs-GDjN1_fSjp_eYXJNEEIKPocChVlqDFlHkqNDs"
        ) as BufferSource,
      });

      // Save subscription to server
      const subJson = sub.toJSON();
      await saveSub.mutateAsync({
        endpoint: sub.endpoint,
        p256dh: subJson.keys?.p256dh || "",
        auth: subJson.keys?.auth || "",
      });

      setSubscription(sub);
      setState("granted");
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
      setState("denied");
    }
  }, [user, saveSub]);

  const unsubscribe = useCallback(async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await removeSub.mutateAsync({ endpoint: subscription.endpoint });
        setSubscription(null);
      }
      setState("default");
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    }
  }, [subscription, removeSub]);

  return {
    state,
    isSubscribed: !!subscription,
    subscribe,
    unsubscribe,
    isSupported: state !== "unsupported",
  };
}

/** Convert a base64 string to Uint8Array for VAPID key */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
