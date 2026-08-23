// src/utils/logOnce.js
const seen = new Set();

export function logOnce(key, ...args) {
  if (import.meta.env.PROD) return;

  // Persist across StrictMode double-mounts and HMR
  const storageKey = `logOnce:${key}`;
  if (sessionStorage.getItem(storageKey) || seen.has(key)) return;

  seen.add(key);
  sessionStorage.setItem(storageKey, '1');
  // Use console.debug so you can hide/show via devtools level
  console.debug(...args);
}
