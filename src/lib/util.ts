export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (s: string) => HEX.test(String(s).trim());
export const colorOr = (s: string, fallback: string) =>
  isHex(s) ? s.trim() : fallback;
export const slug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-expo-app";
export const fmtBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(0)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;

export function getPath(o: unknown, p: string): any {
  return p.split(".").reduce<any>((a, k) => (a == null ? a : a[k]), o);
}
export function setPath(o: any, p: string, v: unknown) {
  const ks = p.split(".");
  const last = ks.pop() as string;
  const t = ks.reduce((a, k) => a[k], o);
  t[last] = v;
}
/** Deep clone that shares frozen objects (images) — keeps history cheap. */
export function clone<T>(o: T): T {
  if (o === null || typeof o !== "object" || Object.isFrozen(o)) return o;
  if (Array.isArray(o)) return o.map(clone) as unknown as T;
  const r: any = {};
  for (const k in o) r[k] = clone((o as any)[k]);
  return r;
}
