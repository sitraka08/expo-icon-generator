export type Platform = 'android' | 'ios';
export type PlatformMode = Platform | 'split';
export type AssetId = 'icon' | 'adaptive' | 'splash';
export type Mask = 'circle' | 'squircle' | 'rounded' | 'square' | 'teardrop';
export type Severity = 'error' | 'warn' | 'info';

/** Immutable once created, so history snapshots can share it. */
export interface ImageRef {
  readonly src: string;
  readonly name: string;
  readonly w: number;
  readonly h: number;
  readonly type: string;
  readonly alpha: boolean;
  readonly bytes: number;
}

export interface Transform { scale: number; x: number; y: number }

export interface Project {
  project: { name: string; sdk: string };
  icon: Transform & { image: ImageRef | null; bg: string; darkEnabled: boolean; darkBg: string };
  adaptive: {
    fg: Transform & { image: ImageRef | null };
    bgMode: 'color' | 'image';
    bgColor: string;
    bgImage: ImageRef | null;
    mono: { enabled: boolean; source: 'foreground' | 'upload'; image: ImageRef | null };
  };
  splash: {
    image: ImageRef | null;
    size: number; x: number; y: number;
    bg: string;
    resizeMode: string;
    darkEnabled: boolean;
    darkBg: string;
  };
  paths: Record<string, string>;
}

export interface Ui {
  asset: AssetId;
  platform: PlatformMode;
  appearance: 'light' | 'dark';
  view: 'preview' | 'config' | 'files';
  mask: Mask;
  adaptiveMode: 'masks' | 'layers' | 'launcher';
  safe: boolean;
  zoom: 'fit' | number;
  mobile: 'config' | 'preview';
  configScope: 'fragment' | 'complete';
  configOnly: 'all' | AssetId;
}

export interface Issue {
  sev: Severity;
  asset?: AssetId | 'project';
  msg: string;
  /** Optional one-click remedy */
  action?: { label: string; run: 'sdk-latest' | 'switch-android' };
}

export interface AssetFile {
  id: string;
  asset: AssetId;
  name: string;
  format: 'PNG';
  w: number;
  h: number;
  defaultPath: string;
  note: string;
  render: () => HTMLCanvasElement;
}

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
