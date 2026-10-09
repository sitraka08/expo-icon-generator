import type { AssetFile, AssetId, Issue, Json, Project } from './types';
import { rulesFor, sdkById, SDKS } from './sdk';
import { colorOr, isHex, slug } from './util';
import { renderAdaptiveBg, renderAdaptiveFg, renderIcon, renderMono, renderSplashFile } from './render';

export interface AssetDef {
  id: AssetId;
  label: string;
  short: string;
  ready: (s: Project) => boolean;
  files: (s: Project) => AssetFile[];
  config: (s: Project, p: (id: string) => string) => Record<string, Json>;
  issues: (s: Project) => Issue[];
}

export const pathOf = (s: Project, f: Pick<AssetFile, 'id' | 'defaultPath'>) => s.paths[f.id] || f.defaultPath;

const upscale = (im: { w: number; h: number; type: string }, px: number) => (im.type === 'image/svg+xml' ? 1 : px / Math.max(im.w, im.h));

function imageIssues(label: string, im: Project['icon']['image'], asset: AssetId, drawnPx: number, out: Issue[]) {
  if (!im) return;
  if (Math.abs(im.w / im.h - 1) > 0.02) out.push({ sev: 'warn', asset, msg: `${label}: ${im.w}×${im.h} is not square. It is fitted inside the square canvas without cropping.` });
  const up = upscale(im, drawnPx);
  if (up > 1.05) out.push({ sev: 'warn', asset, msg: `${label}: ${im.w}×${im.h} will be upscaled ${up.toFixed(1)}× and may look soft. Use a larger image or an SVG.` });
}

export const ASSETS: AssetDef[] = [
  {
    id: 'icon', label: 'App icon', short: 'icon.png',
    ready: (s) => !!s.icon.image,
    files: (s) => {
      const r = rulesFor(s.project.sdk);
      const f: AssetFile[] = [{ id: 'icon', asset: 'icon', name: 'icon.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/icon.png', note: 'Flattened onto the background colour (no alpha).', render: () => renderIcon(s, 1024) }];
      if (s.icon.darkEnabled && r.iosIconVariants) f.push({ id: 'icon-dark', asset: 'icon', name: 'icon-dark.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/icon-dark.png', note: 'iOS dark appearance.', render: () => renderIcon(s, 1024, true) });
      return f;
    },
    config: (s, p) => {
      const r = rulesFor(s.project.sdk);
      const c: Record<string, Json> = { icon: p('icon') };
      if (s.icon.darkEnabled && r.iosIconVariants) c.ios = { icon: { light: p('icon'), dark: p('icon-dark') } };
      return c;
    },
    issues: (s) => {
      const out: Issue[] = [];
      const r = rulesFor(s.project.sdk);
      if (!isHex(s.icon.bg)) out.push({ sev: 'error', asset: 'icon', msg: `Icon background “${s.icon.bg}” is not a valid hex colour (e.g. #FFFFFF).` });
      if (s.icon.darkEnabled && !isHex(s.icon.darkBg)) out.push({ sev: 'error', asset: 'icon', msg: `Dark icon background “${s.icon.darkBg}” is not a valid hex colour.` });
      if (s.icon.darkEnabled && !r.iosIconVariants) out.push({ sev: 'warn', asset: 'icon', msg: `iOS dark icon is kept in your project but not exported: it is not available in SDK ${s.project.sdk}.`, action: { label: 'Use latest SDK', run: 'sdk-latest' } });
      const im = s.icon.image;
      imageIssues('Icon', im, 'icon', (1024 * s.icon.scale) / 100, out);
      if (im?.alpha) out.push({ sev: 'info', asset: 'icon', msg: 'Transparency is flattened onto the background colour: iOS rejects icons with an alpha channel.' });
      return out;
    },
  },
  {
    id: 'adaptive', label: 'Adaptive icon', short: 'Android layers',
    ready: (s) => !!s.adaptive.fg.image,
    files: (s) => {
      const a = s.adaptive;
      const f: AssetFile[] = [{ id: 'adaptive-fg', asset: 'adaptive', name: 'adaptive-icon.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/adaptive-icon.png', note: 'Foreground layer, transparent.', render: () => renderAdaptiveFg(s, 1024) }];
      if (a.bgMode === 'image' && a.bgImage) f.push({ id: 'adaptive-bg', asset: 'adaptive', name: 'adaptive-icon-background.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/adaptive-icon-background.png', note: 'Background layer image.', render: () => renderAdaptiveBg(s, 1024) });
      if (a.mono.enabled && rulesFor(s.project.sdk).monochrome && (a.mono.source === 'foreground' || a.mono.image)) f.push({ id: 'adaptive-mono', asset: 'adaptive', name: 'adaptive-icon-monochrome.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/adaptive-icon-monochrome.png', note: 'Themed icon layer (Android 13+).', render: () => renderMono(s, 1024) });
      return f;
    },
    config: (s, p) => {
      const a = s.adaptive;
      const ai: Record<string, Json> = { foregroundImage: p('adaptive-fg') };
      if (a.bgMode === 'image' && a.bgImage) ai.backgroundImage = p('adaptive-bg');
      else ai.backgroundColor = colorOr(a.bgColor, '#E6F4FE');
      if (a.mono.enabled && rulesFor(s.project.sdk).monochrome && (a.mono.source === 'foreground' || a.mono.image)) ai.monochromeImage = p('adaptive-mono');
      return { android: { adaptiveIcon: ai } };
    },
    issues: (s) => {
      const out: Issue[] = [];
      const a = s.adaptive;
      if (a.bgMode === 'color' && !isHex(a.bgColor)) out.push({ sev: 'error', asset: 'adaptive', msg: `Background colour “${a.bgColor}” is not a valid hex colour.` });
      if (a.bgMode === 'image' && !a.bgImage) out.push({ sev: 'warn', asset: 'adaptive', msg: 'Background is set to “Image” but none is uploaded: the colour is used instead.' });
      if (a.mono.enabled && a.mono.source === 'upload' && !a.mono.image) out.push({ sev: 'warn', asset: 'adaptive', msg: 'Monochrome is set to “Upload” but no image was added: the layer is not exported.' });
      const fg = a.fg.image;
      imageIssues('Foreground', fg, 'adaptive', (1024 * a.fg.scale) / 100, out);
      if (fg) {
        if (fg.type === 'image/jpeg' || !fg.alpha) out.push({ sev: 'warn', asset: 'adaptive', msg: `Foreground has no transparency (${fg.type === 'image/jpeg' ? 'JPEG' : 'opaque PNG'}): it will cover the whole background layer.` });
        const ar = fg.w / fg.h;
        const extent = Math.max(ar >= 1 ? 1 : ar, ar >= 1 ? 1 / ar : 1) * (108 * a.fg.scale) / 100;
        const off = Math.max(Math.abs(a.fg.x), Math.abs(a.fg.y)) * 1.08;
        if (extent / 2 + off > 33) out.push({ sev: 'warn', asset: 'adaptive', msg: 'Foreground reaches beyond the 66dp safe zone: launcher masks (circle, squircle) may crop its edges.' });
      }
      return out;
    },
  },
  {
    id: 'splash', label: 'Splash screen', short: 'Launch screen',
    ready: (s) => !!s.splash.image,
    files: (s) => {
      const plugin = rulesFor(s.project.sdk).splash === 'plugin';
      return [plugin
        ? { id: 'splash', asset: 'splash', name: 'splash-icon.png', format: 'PNG', w: 1024, h: 1024, defaultPath: './assets/splash-icon.png', note: 'Logo only, transparent. Sized by imageWidth.', render: () => renderSplashFile(s, true) } as AssetFile
        : { id: 'splash', asset: 'splash', name: 'splash.png', format: 'PNG', w: 1284, h: 2778, defaultPath: './assets/splash.png', note: 'Full-screen canvas with the logo placed on it.', render: () => renderSplashFile(s, false) } as AssetFile];
    },
    config: (s, p) => {
      const r = rulesFor(s.project.sdk);
      const bg = colorOr(s.splash.bg, '#FFFFFF');
      const dark = s.splash.darkEnabled ? { image: p('splash'), backgroundColor: colorOr(s.splash.darkBg, '#000000') } : null;
      const rm = r.splashResizeModes.some((m) => m.value === s.splash.resizeMode) ? s.splash.resizeMode : 'contain';
      if (r.splash === 'plugin') {
        const opts: Record<string, Json> = { image: p('splash'), imageWidth: Math.round((s.splash.size / 100) * 390), resizeMode: rm, backgroundColor: bg };
        if (dark) opts.dark = dark;
        const plugins: Json = [['expo-splash-screen', opts]];
        return { plugins };
      }
      const sp: Record<string, Json> = { image: p('splash'), resizeMode: rm, backgroundColor: bg };
      if (dark) sp.dark = dark;
      const out: Record<string, Json> = { splash: sp };
      return out;
    },
    issues: (s) => {
      const out: Issue[] = [];
      const r = rulesFor(s.project.sdk);
      if (!isHex(s.splash.bg)) out.push({ sev: 'error', asset: 'splash', msg: `Splash background “${s.splash.bg}” is not a valid hex colour.` });
      if (s.splash.darkEnabled && !isHex(s.splash.darkBg)) out.push({ sev: 'error', asset: 'splash', msg: `Dark splash background “${s.splash.darkBg}” is not a valid hex colour.` });
      if (!r.splashOffset && (s.splash.x || s.splash.y)) out.push({ sev: 'warn', asset: 'splash', msg: `Logo offset is ignored: SDK ${s.project.sdk} centers the splash image.`, action: undefined });
      const mode = r.splashResizeModes.find((m) => m.value === s.splash.resizeMode);
      if (!mode) out.push({ sev: 'warn', asset: 'splash', msg: `Resize mode “${s.splash.resizeMode}” is not available in SDK ${s.project.sdk}; “contain” is exported instead.` });
      else if (mode.deprecated) out.push({ sev: 'warn', asset: 'splash', msg: `Resize mode “${mode.label.toLowerCase()}” is deprecated in SDK ${s.project.sdk}. Prefer “contain”.` });
      imageIssues('Splash logo', s.splash.image, 'splash', r.splash === 'plugin' ? 1024 : (1284 * s.splash.size) / 100, out);
      return out;
    },
  },
];

export const assetDef = (id: AssetId) => ASSETS.find((a) => a.id === id)!;
export const readyAssets = (s: Project) => ASSETS.filter((a) => a.ready(s));
export const allFiles = (s: Project): AssetFile[] => readyAssets(s).flatMap((a) => a.files(s));

export function collectIssues(s: Project): Issue[] {
  const out: Issue[] = [];
  const ready = readyAssets(s);
  ASSETS.forEach((a) => {
    if (a.ready(s)) out.push(...a.issues(s));
    else {
      // Invalid values are errors even before an image is present only when the asset is exported.
      out.push({ sev: 'info', asset: a.id, msg: `${a.label} has no image and is not part of the export.` });
    }
  });
  const files = allFiles(s);
  const seen = new Map<string, string>();
  files.forEach((f) => {
    const p = pathOf(s, f);
    if (!/^\.\/[\w\-./]+\.png$/i.test(p) || p.includes('..')) out.push({ sev: 'error', asset: f.asset, msg: `Path “${p}” for ${f.name} must look like ./assets/name.png.` });
    const key = p.toLowerCase();
    if (seen.has(key)) out.push({ sev: 'error', asset: f.asset, msg: `${f.name} and ${seen.get(key)} both write to ${p}. Give each file a unique path.` });
    else seen.set(key, f.name);
  });
  if (!ready.length) out.push({ sev: 'error', asset: 'project', msg: 'Nothing to export yet: upload an image for at least one asset.' });
  if (files.length) out.push({ sev: 'info', asset: 'project', msg: 'Extracting the archive overwrites files at the same paths in your project. Merge the configuration manually.' });
  const sdk = sdkById(s.project.sdk);
  if (!sdk.verified) out.push({ sev: 'info', asset: 'project', msg: `Rules for SDK ${sdk.id} are bundled with this app and not yet verified against Expo's published schema. Review the output before shipping.` });
  return out;
}

/* ---------- Config generation ---------- */
function merge(a: any, b: any) {
  for (const k in b) {
    if (Array.isArray(b[k])) a[k] = (a[k] ?? []).concat(b[k]);
    else if (b[k] && typeof b[k] === 'object') a[k] = merge(a[k] ?? {}, b[k]);
    else a[k] = b[k];
  }
  return a;
}

export function buildConfig(s: Project, scope: 'fragment' | 'complete', only: 'all' | AssetId = 'all') {
  const p = (id: string) => {
    const f = allFiles(s).find((x) => x.id === id);
    return f ? pathOf(s, f) : `./assets/${id}.png`;
  };
  const frag: Record<string, Json> = {};
  readyAssets(s).filter((a) => only === 'all' || a.id === only).forEach((a) => merge(frag, a.config(s, p)));
  if (scope === 'fragment') return { expo: frag };
  const dark = (s.icon.darkEnabled && rulesFor(s.project.sdk).iosIconVariants) || s.splash.darkEnabled;
  const base: Record<string, Json> = { name: s.project.name, slug: slug(s.project.name), version: '1.0.0', orientation: 'portrait' };
  if (dark) base.userInterfaceStyle = 'automatic';
  return { expo: merge(base, frag) };
}

export function sdkLatest() { return SDKS[0].id; }
