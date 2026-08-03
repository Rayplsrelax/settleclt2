/**
 * In-memory single-use OAuth nonce store.
 *
 * Each OAuth flow generates a random nonce that is stored both in a signed
 * cookie and server-side. On callback, the nonce is atomically consumed
 * (deleted) — a second attempt with the same nonce is rejected. This prevents
 * replay attacks where a captured callback URL + cookie is submitted again.
 *
 * Nonces auto-expire after their TTL to prevent unbounded memory growth.
 */

type NonceEntry = {
  expiresAt: number;
};

const store = new Map<string, NonceEntry>();

/** Purge expired entries to prevent unbounded growth. */
function purgeExpired(now: number): void {
  for (const key of Array.from(store.keys())) {
    const entry = store.get(key);
    if (entry && entry.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function registerOAuthNonce(nonce: string, ttlMs: number): void {
  const now = Date.now();
  purgeExpired(now);
  store.set(nonce, { expiresAt: now + ttlMs });
}

/**
 * Atomically consume a nonce. Returns true if the nonce was valid and
 * had not been consumed before; returns false if the nonce is unknown,
 * already consumed, or expired.
 */
export function consumeOAuthNonce(nonce: string): boolean {
  const now = Date.now();
  purgeExpired(now);
  const entry = store.get(nonce);
  if (!entry) return false;
  if (entry.expiresAt <= now) {
    store.delete(nonce);
    return false;
  }
  // Delete first so a concurrent second consumer cannot succeed.
  store.delete(nonce);
  return true;
}

/** Test-only: clear all nonces. */
export function clearOAuthNonceStore(): void {
  store.clear();
}
