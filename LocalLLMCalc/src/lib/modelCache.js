// Generic TTL-based localStorage cache for model-source adapters.
// Stores { ts, data }. Falls back silently when storage is unavailable (quota,
// private mode, SSR). Callers may also request a stale entry if the source
// refresh is failing.

export function loadCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !data) return null;
    if (Date.now() - ts > ttlMs) return null;
    return data;
  } catch {
    return null;
  }
}

// Return cached data regardless of TTL. Used when a remote refresh fails and
// we'd rather show stale data than nothing.
export function loadStale(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (!ts || !data) return null;
    return { data, ageMs: Date.now() - ts };
  } catch {
    return null;
  }
}

export function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Quota exceeded, private mode, etc. — silent.
  }
}

export function invalidate(key) {
  try { localStorage.removeItem(key); } catch {}
}

// One-shot cleanup of legacy cache keys so they don't linger in users' browsers.
export function cleanupLegacyKeys(keys) {
  for (const k of keys) {
    try { localStorage.removeItem(k); } catch {}
  }
}
