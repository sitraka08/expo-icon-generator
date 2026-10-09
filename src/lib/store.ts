"use client";
import { useSyncExternalStore } from "react";
import { toast as sonner } from "sonner";
import type { AssetId, ImageRef, Project, Ui } from "./types";
import { clone, getPath, setPath, slug } from "./util";
import { defaultProject, defaultUi } from "./defaults";
import { diffSDK, sdkById } from "./sdk";
import {
  readImage,
  ImageError,
  sampleImage,
  setImageLoadHandler,
} from "./images";

export type ToastKind = "success" | "warn" | "error" | "info";
type SaveState = "idle" | "saving" | "saved" | "partial" | "error";

export interface Snapshot {
  p: Project;
  ui: Ui;
  theme: "light" | "dark";
  save: SaveState;
  canUndo: boolean;
  canRedo: boolean;
  errors: Record<string, string>;
  hydrated: boolean;
  tick: number; // bumps when an image finishes decoding so canvases repaint
}

const KEY = "expo-asset-studio:v1";
let p: Project = defaultProject();
let ui: Ui = defaultUi();
let theme: "light" | "dark" = "light";
let save: SaveState = "idle";
let errors: Record<string, string> = {};
let hydrated = false;
let tick = 0;
let past: Project[] = [];
let future: Project[] = [];
let last: Project = p;
let lastKey: string | null = null;
let lastT = 0;
let snap: Snapshot;
const subs = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

const build = (): Snapshot => ({
  p,
  ui,
  theme,
  save,
  canUndo: past.length > 0,
  canRedo: future.length > 0,
  errors,
  hydrated,
  tick,
});
const emit = () => {
  snap = build();
  subs.forEach((f) => f());
};
snap = build();

setImageLoadHandler(() => {
  tick++;
  emit();
});

function freezeImages(o: any) {
  if (!o || typeof o !== "object") return;
  if (typeof o.src === "string" && typeof o.w === "number") {
    Object.freeze(o);
    return;
  }
  Object.values(o).forEach(freezeImages);
}
function merge<T>(base: T, over: any): T {
  if (over === undefined) return base;
  if (
    base &&
    typeof base === "object" &&
    !Array.isArray(base) &&
    over &&
    typeof over === "object"
  ) {
    const r: any = { ...base };
    for (const k in over)
      r[k] =
        k in (base as any) &&
        (base as any)[k] !== null &&
        typeof (base as any)[k] === "object"
          ? merge((base as any)[k], over[k])
          : over[k];
    return r;
  }
  return over as T;
}

function persist() {
  save = "saving";
  emit();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const body = {
      p,
      ui: {
        asset: ui.asset,
        platform: ui.platform,
        appearance: ui.appearance,
        mask: ui.mask,
      },
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(body));
      save = "saved";
    } catch {
      try {
        const lite = JSON.parse(
          JSON.stringify(body, (k, v) => (k === "src" ? "" : v)),
        );
        localStorage.setItem(KEY, JSON.stringify(lite));
        save = "partial";
      } catch {
        save = "error";
      }
    }
    emit();
  }, 500);
}

function commit(key?: string) {
  const now = Date.now();
  if (key && key === lastKey && now - lastT < 800) lastT = now;
  else {
    past.push(last);
    if (past.length > 100) past.shift();
    future = [];
    lastKey = key ?? null;
    lastT = now;
  }
  last = p;
  persist();
}

export const studio = {
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  },
  getSnapshot: () => snap,

  hydrate() {
    if (hydrated) return;
    try {
      const t = localStorage.getItem("eas-theme");
      theme =
        t === "dark" || t === "light" ? t : "light";
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const j = JSON.parse(raw);
        const merged = merge(defaultProject(), j.p);
        freezeImages(merged);
        const strip = (im: ImageRef | null) => (im && !im.src ? null : im);
        merged.icon.image = strip(merged.icon.image);
        merged.adaptive.fg.image = strip(merged.adaptive.fg.image);
        merged.adaptive.bgImage = strip(merged.adaptive.bgImage);
        merged.adaptive.mono.image = strip(merged.adaptive.mono.image);
        merged.splash.image = strip(merged.splash.image);
        p = merged;
        last = p;
        ui = { ...ui, ...(j.ui ?? {}) };
        save = "saved";
      }
    } catch {
      /* corrupted storage: start fresh */
    }
    hydrated = true;
    emit();
  },

  /** Update a project value by dotted path. `key` coalesces rapid edits (slider drags) into one undo step. */
  set(path: string, value: unknown, key?: string) {
    if (getPath(p, path) === value) return;
    p = clone(p);
    setPath(p, path, value);
    commit(key ?? path);
  },
  setMany(entries: [string, unknown][], key?: string) {
    p = clone(p);
    entries.forEach(([path, v]) => setPath(p, path, v));
    commit(key);
  },
  patchUi(patch: Partial<Ui>) {
    ui = { ...ui, ...patch };
    if (patch.asset || patch.platform) persist();
    else emit();
  },
  setTheme(t: "light" | "dark") {
    theme = t;
    try {
      localStorage.setItem("eas-theme", t);
    } catch {}
    document.documentElement.setAttribute("data-theme", t);
    emit();
  },
  rename(name: string) {
    const n = name.trim().slice(0, 48);
    if (n && n !== p.project.name) studio.set("project.name", n, "rename");
  },

  setSdk(id: string) {
    const from = p.project.sdk;
    if (id === from) return;
    const notes = diffSDK(from, id, p);
    studio.set("project.sdk", id, "sdk");
    if (notes.length)
      studio.toast(
        "warn",
        `Switched to SDK ${id} — ${notes.length} setting${notes.length > 1 ? "s need" : " needs"} review`,
        notes.join("\n"),
      );
    else
      studio.toast(
        "success",
        `Switched to SDK ${id}`,
        `All current settings are compatible. ${sdkById(id).summary}.`,
      );
  },

  async upload(file: File, path: string) {
    try {
      const im = await readImage(file);
      errors = { ...errors };
      delete errors[path];
      studio.set(path, im, "upload:" + path + Date.now());
      studio.toast(
        "success",
        "Image added",
        `${im.name} · ${im.w}×${im.h}${im.alpha ? " · transparent" : ""}`,
      );
    } catch (e) {
      const msg =
        e instanceof ImageError
          ? e.message
          : "The file could not be processed.";
      errors = { ...errors, [path]: msg };
      emit();
      studio.toast("error", "Image rejected", msg);
    }
  },
  useSample(path: string) {
    studio.set(path, sampleImage(), "sample:" + path);
    errors = { ...errors };
    delete errors[path];
    emit();
  },
  clearError(path: string) {
    if (errors[path]) {
      errors = { ...errors };
      delete errors[path];
      emit();
    }
  },

  undo() {
    if (!past.length) return;
    future.push(p);
    p = past.pop()!;
    last = p;
    lastKey = null;
    persist();
  },
  redo() {
    if (!future.length) return;
    past.push(p);
    p = future.pop()!;
    last = p;
    lastKey = null;
    persist();
  },

  resetAsset(id: AssetId) {
    const d = defaultProject();
    const keep = p.project;
    p = clone(p);
    (p as any)[id] = (d as any)[id];
    p.project = keep;
    // drop custom paths for this asset
    const prefix =
      id === "icon" ? "icon" : id === "adaptive" ? "adaptive" : "splash";
    p.paths = Object.fromEntries(
      Object.entries(p.paths).filter(([k]) => !k.startsWith(prefix)),
    );
    errors = {};
    commit();
    studio.toast("info", "Asset reset", "Settings restored to defaults.");
  },
  resetAll(name?: string) {
    const d = defaultProject();
    if (name) d.project.name = name;
    d.project.sdk = p.project.sdk;
    p = d;
    errors = {};
    commit();
  },
  newProject() {
    studio.resetAll("my-expo-app");
    studio.toast("success", "New project", "Started from defaults.");
  },

  toast(kind: ToastKind, title: string, body?: string) {
    const opts = {
      description: body?.replace(/`/g, ""),
      duration: kind === "error" || kind === "warn" ? 9000 : 4000,
    };
    if (kind === "success") sonner.success(title, opts);
    else if (kind === "error") sonner.error(title, opts);
    else if (kind === "warn") sonner.warning(title, opts);
    else sonner.info(title, opts);
  },
  slug,
};

export const useStudio = (): Snapshot =>
  useSyncExternalStore(
    studio.subscribe,
    studio.getSnapshot,
    studio.getSnapshot,
  );
