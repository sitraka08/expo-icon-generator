import type { ImageRef } from './types';

export class ImageError extends Error {}

const OK = ['image/png', 'image/jpeg', 'image/svg+xml'];
const EXT: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml' };
const NICE: Record<string, string> = { webp: 'WebP', gif: 'GIF', bmp: 'BMP', tiff: 'TIFF', avif: 'AVIF', heic: 'HEIC', pdf: 'a PDF', ico: 'ICO' };

const cache = new Map<string, { el: HTMLImageElement; ok: boolean }>();
let onLoad: () => void = () => {};
export const setImageLoadHandler = (fn: () => void) => { onLoad = fn; };

/** Synchronous accessor for renderers: null until decoded (onLoad then triggers a repaint). */
export function imgEl(im: ImageRef | null): HTMLImageElement | null {
  if (!im) return null;
  let c = cache.get(im.src);
  if (!c) {
    const el = new Image();
    c = { el, ok: false };
    const entry = c;
    el.onload = () => { entry.ok = true; onLoad(); };
    el.src = im.src;
    cache.set(im.src, c);
  }
  return c.ok ? c.el : null;
}

export async function ensureLoaded(list: (ImageRef | null)[]) {
  await Promise.all(
    list.filter(Boolean).map(async (im) => {
      imgEl(im);
      const c = cache.get(im!.src)!;
      if (!c.ok) await c.el.decode().then(() => { c.ok = true; }).catch(() => {});
    })
  );
}

const readDataUrl = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new ImageError(`Could not read “${f.name}”.`));
    r.readAsDataURL(f);
  });

function svgSize(text: string): { w: number; h: number } | null {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;
  const num = (v: string | null) => (v && /^[\d.]+(px)?$/.test(v.trim()) ? parseFloat(v) : NaN);
  let w = num(svg.getAttribute('width'));
  let h = num(svg.getAttribute('height'));
  const vb = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if ((!w || !h) && vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) { w = vb[2]; h = vb[3]; }
  return w > 0 && h > 0 ? { w, h } : { w: 1024, h: 1024 };
}

/** Validates and decodes an uploaded file. Throws ImageError with a specific, user-facing message. */
export async function readImage(file: File): Promise<ImageRef> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = file.type || EXT[ext] || '';
  if (!OK.includes(type)) {
    const what = NICE[ext] ?? (type ? type.replace('image/', '').toUpperCase() : `“.${ext || 'unknown'}”`);
    throw new ImageError(`“${file.name}” is ${what}. Use PNG, JPEG or SVG — export it from your design tool first.`);
  }
  if (file.size > 10 * 1024 * 1024) throw new ImageError(`“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB — compress it or use an SVG.`);
  if (file.size === 0) throw new ImageError(`“${file.name}” is empty.`);

  const src = await readDataUrl(file);
  const el = new Image();
  el.src = src;
  try { await el.decode(); } catch { throw new ImageError(`“${file.name}” could not be decoded. The file may be corrupted or not a real ${type.replace('image/', '').toUpperCase()}.`); }

  let w = el.naturalWidth;
  let h = el.naturalHeight;
  if (type === 'image/svg+xml') {
    const dims = svgSize(await file.text());
    if (!dims) throw new ImageError(`“${file.name}” is not a valid SVG document.`);
    w = dims.w; h = dims.h;
  }
  if (Math.min(w, h) < 64) throw new ImageError(`“${file.name}” is ${w}×${h}px — too small to produce a usable asset. Use an image of at least 64px (1024px recommended).`);

  let alpha = false;
  if (type !== 'image/jpeg') {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      g.drawImage(el, 0, 0, 64, 64);
      const d = g.getImageData(0, 0, 64, 64).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break; }
    } catch { /* tainted canvas: leave false */ }
  }
  return Object.freeze({ src, name: file.name, w: Math.round(w), h: Math.round(h), type, alpha, bytes: file.size });
}

/** Built-in sample so the editor can be tried without an image. Transparent, rings mark. */
export function sampleImage(): ImageRef {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><circle cx="256" cy="256" r="190" fill="none" stroke="#111" stroke-width="44"/><circle cx="256" cy="256" r="84" fill="#FFCD00" stroke="#111" stroke-width="30"/><circle cx="410" cy="102" r="30" fill="#111"/></svg>`;
  return Object.freeze({ src: 'data:image/svg+xml;base64,' + btoa(svg), name: 'sample-mark.svg', w: 512, h: 512, type: 'image/svg+xml', alpha: true, bytes: svg.length });
}
