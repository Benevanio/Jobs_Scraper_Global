const inflight = new Map();

export async function withRequestDedup(key, fn) {
  if (inflight.has(key)) {
    return inflight.get(key);
  }
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
