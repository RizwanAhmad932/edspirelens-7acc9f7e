import { lazy, ComponentType } from "react";

/**
 * Lazy import that survives stale deploys/caches.
 * If a chunk 404s (old hashed filename), retry once, then force a
 * one-time hard reload so the browser fetches the new index manifest.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key: string,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // one silent retry (transient network / partially updated CDN)
      await new Promise((r) => setTimeout(r, 400));
      try {
        return await factory();
      } catch (err2) {
        const flag = `chunk-reload:${key}`;
        if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, "1");
          // drop stale caches/SW so the reload gets fresh assets
          try {
            if ("caches" in window) {
              const names = await caches.keys();
              await Promise.all(names.map((n) => caches.delete(n)));
            }
            if ("serviceWorker" in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {
            /* ignore */
          }
          window.location.reload();
          // never resolves; page is reloading
          return await new Promise<{ default: T }>(() => {});
        }
        throw err2;
      }
    }
  });
}
