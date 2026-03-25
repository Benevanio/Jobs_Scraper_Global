const inflight = new Map();

export async function withRequestDedup(key: string, fn: { (): Promise<any>; (): Promise<any>; }) {
  if (inflight.has(key)) {
    return inflight.get(key);
  }
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
