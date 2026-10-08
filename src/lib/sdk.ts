/*
 * Versioned SDK compatibility definitions — the single source of truth for
 * what each Expo SDK supports. UI and generators read `rules`; nothing else
 * branches on a version number.
 *
 * `verified: false` — the rules are bundled with the app and have NOT been
 * validated against Expo's published schema. The UI says so rather than
 * claiming compatibility.
 */
import type { Project } from "./types";

export interface ResizeMode {
  value: string;
  label: string;
  deprecated?: boolean;
}
export interface SdkRules {
  splash: "legacy" | "plugin";
  splashOffset: boolean;
  splashResizeModes: ResizeMode[];
  iosIconVariants: boolean;
  monochrome: boolean;
}
export interface SdkDef {
  id: string;
  tag: string;
  summary: string;
  verified: boolean;
  rules: SdkRules;
}

const LEGACY_RESIZE: ResizeMode[] = [
  { value: "contain", label: "Contain" },
  { value: "cover", label: "Cover" },
  { value: "native", label: "Native", deprecated: true },
];
const PLUGIN_RESIZE: ResizeMode[] = [
  { value: "contain", label: "Contain" },
  { value: "cover", label: "Cover" },
];

const legacy: SdkRules = {
  splash: "legacy",
  splashOffset: true,
  splashResizeModes: LEGACY_RESIZE,
  iosIconVariants: false,
  monochrome: true,
};
const plugin: SdkRules = {
  splash: "plugin",
  splashOffset: false,
  splashResizeModes: PLUGIN_RESIZE,
  iosIconVariants: false,
  monochrome: true,
};

export const SDKS: SdkDef[] = [
  {
    id: "54",
    tag: "Latest",
    verified: false,
    summary: "expo-splash-screen plugin · iOS dark icon",
    rules: { ...plugin, iosIconVariants: true },
  },
  {
    id: "53",
    tag: "",
    verified: false,
    summary: "expo-splash-screen plugin",
    rules: { ...plugin },
  },
  {
    id: "52",
    tag: "",
    verified: false,
    summary: "expo-splash-screen plugin",
    rules: { ...plugin },
  },
  {
    id: "51",
    tag: "",
    verified: false,
    summary: "Top-level splash key · logo offset",
    rules: { ...legacy },
  },
  {
    id: "50",
    tag: "",
    verified: false,
    summary: "Top-level splash key · logo offset",
    rules: { ...legacy },
  },
];

export const sdkById = (id: string): SdkDef =>
  SDKS.find((s) => s.id === id) ?? SDKS[0];
export const rulesFor = (id: string): SdkRules => sdkById(id).rules;

/** What changes for the user's current settings when the SDK changes. Nothing is dropped silently. */
export function diffSDK(fromId: string, toId: string, s: Project): string[] {
  const a = rulesFor(fromId);
  const b = rulesFor(toId);
  const out: string[] = [];
  if (a.splash !== b.splash) {
    out.push(
      b.splash === "plugin"
        ? "Splash configuration moves from the top-level `splash` key to the `expo-splash-screen` plugin."
        : "Splash configuration moves from the `expo-splash-screen` plugin back to the top-level `splash` key.",
    );
  }
  if (a.splashOffset && !b.splashOffset && (s.splash.x || s.splash.y)) {
    out.push(
      `Splash logo offset is kept in your project but not applied: SDK ${toId} centers the image.`,
    );
  }
  if (a.iosIconVariants && !b.iosIconVariants && s.icon.darkEnabled) {
    out.push(
      `iOS dark icon is kept but will not be exported: not available in SDK ${toId}.`,
    );
  }
  if (!b.splashResizeModes.some((m) => m.value === s.splash.resizeMode)) {
    out.push(
      `Splash resize mode “${s.splash.resizeMode}” is not available in SDK ${toId}; “contain” is used until you change it.`,
    );
  }
  return out;
}
