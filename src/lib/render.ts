import type { ImageRef, Mask, Project, Transform } from './types';
import { imgEl } from './images';
import { colorOr } from './util';

export const mk = (w: number, h = w) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** Draw `im` contained in a `box`-sized square centered on (cx, cy). */
function drawContain(g: CanvasRenderingContext2D, im: ImageRef | null, box: number, cx: number, cy: number): boolean {
  const el = imgEl(im);
  if (!el || !im) return false;
  const ar = im.w / im.h;
  const w = ar >= 1 ? box : box * ar;
  const h = ar >= 1 ? box / ar : box;
  g.drawImage(el, cx - w / 2, cy - h / 2, w, h);
  return true;
}

export function drawLayer(g: CanvasRenderingContext2D, size: number, im: ImageRef | null, t: Transform) {
  return drawContain(g, im, (size * t.scale) / 100, size / 2 + (t.x / 100) * size, size / 2 + (t.y / 100) * size);
}

export function renderIcon(s: Project, size: number, dark = false) {
  const c = mk(size);
  const g = c.getContext('2d')!;
  g.fillStyle = dark ? colorOr(s.icon.darkBg, '#111111') : colorOr(s.icon.bg, '#FFFFFF');
  g.fillRect(0, 0, size, size);
  drawLayer(g, size, s.icon.image, s.icon);
  return c;
}

export const renderAdaptiveFg = (s: Project, size: number) => {
  const c = mk(size);
  drawLayer(c.getContext('2d')!, size, s.adaptive.fg.image, s.adaptive.fg);
  return c;
};

export function renderAdaptiveBg(s: Project, size: number) {
  const c = mk(size);
  const g = c.getContext('2d')!;
  g.fillStyle = colorOr(s.adaptive.bgColor, '#E6F4FE');
  g.fillRect(0, 0, size, size);
  const im = s.adaptive.bgImage;
  const el = s.adaptive.bgMode === 'image' ? imgEl(im) : null;
  if (el && im) {
    const k = Math.max(size / im.w, size / im.h); // cover
    g.drawImage(el, (size - im.w * k) / 2, (size - im.h * k) / 2, im.w * k, im.h * k);
  }
  return c;
}

export function renderMono(s: Project, size: number) {
  const c = mk(size);
  const g = c.getContext('2d')!;
  const a = s.adaptive;
  const upload = a.mono.source === 'upload' && a.mono.image;
  drawLayer(g, size, upload ? a.mono.image : a.fg.image, a.fg);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#000';
  g.fillRect(0, 0, size, size);
  return c;
}

/** Splash logo placement: size is % of screen width; offsets % of width / height. */
export function drawSplash(g: CanvasRenderingContext2D, w: number, h: number, s: Project, opts: { bg?: string | null; offsets: boolean }) {
  if (opts.bg) { g.fillStyle = opts.bg; g.fillRect(0, 0, w, h); }
  const sp = s.splash;
  drawContain(g, sp.image, (w * sp.size) / 100, w / 2 + (opts.offsets ? (sp.x / 100) * w : 0), h / 2 + (opts.offsets ? (sp.y / 100) * h : 0));
}

export function renderSplashFile(s: Project, plugin: boolean) {
  if (plugin) {
    const c = mk(1024);
    drawContain(c.getContext('2d')!, s.splash.image, 1024, 512, 512);
    return c;
  }
  const c = mk(1284, 2778);
  drawSplash(c.getContext('2d')!, 1284, 2778, s, { offsets: true });
  return c;
}

/* ---------- Masks ---------- */
const RADII: Record<Mask, number | number[]> = { circle: 0.5, squircle: 0, rounded: 0.26, square: 0.06, teardrop: [0.5, 0.5, 0.5, 0.08] };

export function maskPath(g: CanvasRenderingContext2D, mask: Mask | 'ios', x: number, y: number, size: number) {
  g.beginPath();
  if (mask === 'squircle' || mask === 'ios') {
    const n = mask === 'ios' ? 5 : 4; // superellipse exponent
    const r = size / 2;
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * Math.PI * 2;
      const cs = Math.cos(t), sn = Math.sin(t);
      const px = x + r + r * Math.sign(cs) * Math.abs(cs) ** (2 / n);
      const py = y + r + r * Math.sign(sn) * Math.abs(sn) ** (2 / n);
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    return;
  }
  const rad = RADII[mask];
  const r = Array.isArray(rad) ? rad.map((v) => v * size) : rad * size;
  g.roundRect(x, y, size, size, r);
}

/** Paint `src` into `canvas`, clipped to the given mask, at device-pixel resolution. */
export function paintMasked(canvas: HTMLCanvasElement, src: HTMLCanvasElement, mask: Mask | 'ios' | 'none') {
  const g = canvas.getContext('2d')!;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  if (mask !== 'none') { maskPath(g, mask, 0, 0, canvas.width); g.clip(); }
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, canvas.width, canvas.height);
  g.restore();
}
