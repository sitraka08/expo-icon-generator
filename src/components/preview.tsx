"use client";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { studio, useStudio } from "@/lib/store";
import { assetDef, allFiles, collectIssues, pathOf } from "@/lib/assets";
import { rulesFor } from "@/lib/sdk";
import type { AssetId, Mask, Platform, Project } from "@/lib/types";
import {
  drawSplash,
  mk,
  paintMasked,
  renderAdaptiveBg,
  renderAdaptiveFg,
  renderIcon,
  renderMono,
  maskPath,
} from "@/lib/render";
import { colorOr } from "@/lib/util";
import { Icon } from "./icon";
import { IssueList, Message } from "./controls";
import { Button } from "./ui/button";

export const MASKS: { v: Mask; label: string }[] = [
  { v: "circle", label: "Circle" },
  { v: "squircle", label: "Squircle" },
  { v: "rounded", label: "Rounded" },
  { v: "square", label: "Square" },
  { v: "teardrop", label: "Teardrop" },
];
const PRIMARY: Record<AssetId, string> = {
  icon: "icon.image",
  adaptive: "adaptive.fg.image",
  splash: "splash.image",
};
const DW = 300,
  DH = 620;

/* Canvas that repaints on every render (cheap; sources are small). */
function Cv({
  w,
  h = w,
  draw,
  className,
  label,
  style,
}: {
  w: number;
  h?: number;
  draw: (c: HTMLCanvasElement) => void;
  className?: string;
  label?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) draw(ref.current);
  });
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

function useFit(
  ref: React.RefObject<HTMLElement | null>,
  w: number,
  h: number,
  count: number,
) {
  const [fit, setFit] = useState(0.8);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      const r = el.getBoundingClientRect();
      const availW = r.width - 24 - (count - 1) * 40;
      const availH = r.height - 130;
      setFit(Math.max(0.35, Math.min(1.15, availH / h, availW / (w * count))));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, w, h, count]);
  return fit;
}

function lum(hex: string) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return (
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) /
    255
  );
}

/* ── Device frame ── */
function Device({
  platform,
  zoom,
  dark,
  children,
}: {
  platform: Platform;
  zoom: number;
  dark: boolean;
  children: ReactNode;
}) {
  return (
    <div className="dev-wrap" style={{ width: DW * zoom, height: DH * zoom }}>
      <div
        className={`device ${platform}`}
        style={{
          transform: `scale(${zoom})`,
          color: dark ? "#f6f4ef" : "#111",
        }}
        role="img"
        aria-label={`Simulated ${platform === "android" ? "Android" : "iOS"} device`}
      >
        <div className="screen">{children}</div>
        {platform === "android" ? (
          <span className="cam" />
        ) : (
          <span className="island" />
        )}
      </div>
    </div>
  );
}

function StatusBar({ platform }: { platform: Platform }) {
  return (
    <div className="statusbar" aria-hidden="true">
      <span>{platform === "ios" ? "9:41" : "12:30"}</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
          <rect x="0" y="6" width="3" height="4" rx="1" />
          <rect x="4" y="4" width="3" height="6" rx="1" />
          <rect x="8" y="2" width="3" height="8" rx="1" />
          <rect x="12" y="0" width="2" height="10" rx="1" opacity=".35" />
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10">
          <rect
            x=".5"
            y=".5"
            width="18"
            height="9"
            rx="3"
            fill="none"
            stroke="currentColor"
            opacity=".5"
          />
          <rect
            x="2"
            y="2"
            width="12"
            height="6"
            rx="1.5"
            fill="currentColor"
          />
        </svg>
      </span>
    </div>
  );
}

const NAMES = [
  "Notes",
  "Mail",
  "Maps",
  "Photos",
  "Music",
  "Clock",
  "Camera",
  "Files",
  "Weather",
  "Wallet",
  "Health",
  "Books",
];
const TINTS = [0.5, 0.7, 0.35, 0.6, 0.45, 0.8, 0.4, 0.65, 0.55, 0.3, 0.75, 0.5];

function Home({
  platform,
  dark,
  ours,
  label,
  maskCls,
}: {
  platform: Platform;
  dark: boolean;
  ours: (c: HTMLCanvasElement) => void;
  label: string;
  maskCls: string;
}) {
  const wall = dark
    ? "linear-gradient(160deg,#25262b,#0f1013)"
    : "linear-gradient(160deg,#e9e6dc,#cfd3dc)";
  const phCls = platform === "ios" ? "m-ios" : maskCls;
  const tiles = NAMES.slice(0, 11);
  tiles.splice(5, 0, "__ours");
  return (
    <>
      <div className="wall" style={{ background: wall }} />
      <StatusBar platform={platform} />
      <div className="launcher">
        {tiles.map((n, i) =>
          n === "__ours" ? (
            <div className="app-tile" key="ours">
              <Cv w={100} draw={ours} label={`${label} icon`} />
              <span style={{ fontWeight: 600 }}>{label}</span>
            </div>
          ) : (
            <div className="app-tile" key={n}>
              <div
                className={`ph ${phCls}`}
                style={{ opacity: TINTS[i % TINTS.length] + 0.3 }}
              />
              <span>{n}</span>
            </div>
          ),
        )}
      </div>
      <div className="dock">
        {platform === "ios" ? (
          [0, 1, 2, 3].map((i) => <div key={i} className={`ph ${phCls}`} />)
        ) : (
          <>
            <div style={{ display: "flex", gap: 22 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`ph ${phCls}`} />
              ))}
            </div>
            <div className="search">Search</div>
          </>
        )}
      </div>
      <span className="homebar" />
    </>
  );
}

/* ── Overlays on generated assets ── */
function IconGuide() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="M50 0 C 90 0 100 10 100 50 S 90 100 50 100 S 0 90 0 50 S 10 0 50 0Z"
        fill="none"
        stroke="#b3261e"
        strokeWidth=".8"
        strokeDasharray="2 2"
        opacity=".9"
      />
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="14"
        fill="none"
        stroke="#0b0b0b"
        strokeWidth=".7"
        strokeDasharray="3 2"
        opacity=".7"
      />
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="14"
        fill="none"
        stroke="#fff"
        strokeWidth=".7"
        strokeDasharray="0 2.5"
        strokeDashoffset="2.5"
        opacity=".9"
      />
    </svg>
  );
}
function AdaptiveGuide() {
  const k = 100 / 108;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect
        x={18 * k}
        y={18 * k}
        width={72 * k}
        height={72 * k}
        fill="none"
        stroke="#0b0b0b"
        strokeWidth=".7"
        strokeDasharray="3 2"
      />
      <rect
        x={18 * k}
        y={18 * k}
        width={72 * k}
        height={72 * k}
        fill="none"
        stroke="#fff"
        strokeWidth=".7"
        strokeDasharray="0 2.5"
        strokeDashoffset="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r={33 * k}
        fill="none"
        stroke="#ffcd00"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r={33 * k}
        fill="none"
        stroke="#0b0b0b"
        strokeWidth=".4"
      />
    </svg>
  );
}

function SafeToggle() {
  const { ui } = useStudio();
  return (
    <Button
      variant={ui.safe ? "brand" : "outline"}
      aria-pressed={ui.safe}
      onClick={() => studio.patchUi({ safe: !ui.safe })}
    >
      <Icon name="scan" size="sm" />
      Safe area
    </Button>
  );
}

/* ── Asset cards ── */
function GeneratedCard({
  p,
  asset,
  ar,
  children,
  guide,
}: {
  p: Project;
  asset: AssetId;
  ar?: string;
  children: ReactNode;
  guide?: ReactNode;
}) {
  const { ui } = useStudio();
  const files = allFiles(p).filter((f) => f.asset === asset);
  const f = files[0];
  return (
    <div className="card">
      <h3>
        <span className="cap gen">Generated</span>
        <span className="right mono hint">{f ? `${f.w}×${f.h}` : ""}</span>
      </h3>
      <div
        className="asset-view checker"
        style={
          ar
            ? {
                aspectRatio: ar,
                width:
                  ar
                    .split(" / ")
                    .map(Number)
                    .reduce((a, b) => a / b) < 1
                    ? "58%"
                    : "100%",
                justifySelf: "center",
              }
            : undefined
        }
      >
        {children}
        {ui.safe && guide}
      </div>
      {f && (
        <div className="hint mono" style={{ wordBreak: "break-all" }}>
          {pathOf(p, f)}
        </div>
      )}
      <div className="hint">This is the actual file that will be exported.</div>
    </div>
  );
}

/* ── Previews per asset ── */
function IconPreview({ platforms }: { platforms: Platform[] }) {
  const { p, ui } = useStudio();
  const stage = useRef<HTMLDivElement>(null);
  const fit = useFit(stage, DW, DH, platforms.length);
  const zoom = ui.zoom === "fit" ? fit : ui.zoom;
  const src = renderIcon(p, 192);
  const dark = ui.appearance === "dark";
  const label =
    p.project.name.length > 9
      ? p.project.name.slice(0, 8) + "…"
      : p.project.name;
  return (
    <div className="stage">
      <div className="stage-main" ref={stage}>
        <div className="devices">
          {platforms.map((pl) => (
            <div className="dev-col" key={pl}>
              <span className="cap sim">
                Simulated ·{" "}
                {pl === "android" ? "Android launcher" : "iOS home screen"}
              </span>
              <Device platform={pl} zoom={zoom} dark={dark}>
                <Home
                  platform={pl}
                  dark={dark}
                  label={label}
                  maskCls={`m-${ui.mask}`}
                  ours={(c) =>
                    paintMasked(c, src, pl === "ios" ? "ios" : ui.mask)
                  }
                />
              </Device>
            </div>
          ))}
        </div>
        <p className="info-bar">
          {platforms.includes("android") && (
            <>
              Android launchers apply their own shape ({ui.mask}); legacy icons
              may be inset on Android 8+ — define an adaptive icon for full
              control.{" "}
            </>
          )}
          {platforms.includes("ios") && (
            <>
              iOS applies a rounded superellipse mask itself and rejects
              transparent icons.
            </>
          )}
        </p>
      </div>
      <div className="stage-side">
        <GeneratedCard p={p} asset="icon" guide={<IconGuide />}>
          <Cv
            w={512}
            draw={(c) => {
              const g = c.getContext("2d")!;
              g.clearRect(0, 0, 512, 512);
              g.drawImage(renderIcon(p, 512), 0, 0);
            }}
            label="Generated app icon"
          />
        </GeneratedCard>
        <div className="card">
          <h3>Rendered sizes</h3>
          <div className="sizes">
            {[60, 40, 29, 20].map((s) => (
              <figure key={s}>
                <Cv
                  w={s * 2}
                  h={s * 2}
                  draw={(c) => paintMasked(c, src, "ios")}
                  style={{ width: s, height: s }}
                />
                <figcaption>{s}px</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <SafeToggle />
      </div>
    </div>
  );
}

function composite(p: Project, size: number) {
  const c = mk(size);
  const g = c.getContext("2d")!;
  g.drawImage(renderAdaptiveBg(p, size), 0, 0);
  g.drawImage(renderAdaptiveFg(p, size), 0, 0);
  return c;
}
function paintAdaptive(
  canvas: HTMLCanvasElement,
  comp: HTMLCanvasElement,
  mask: Mask,
  safe: boolean,
) {
  const g = canvas.getContext("2d")!;
  const N = canvas.width;
  g.clearRect(0, 0, N, N);
  g.save();
  maskPath(g, mask, 0, 0, N);
  g.clip();
  const s = comp.width;
  g.imageSmoothingQuality = "high";
  g.drawImage(
    comp,
    (s * 18) / 108,
    (s * 18) / 108,
    (s * 72) / 108,
    (s * 72) / 108,
    0,
    0,
    N,
    N,
  );
  g.restore();
  if (safe) {
    g.beginPath();
    g.arc(N / 2, N / 2, (N / 2) * (66 / 72), 0, Math.PI * 2);
    g.lineWidth = Math.max(2, N / 60);
    g.setLineDash([N / 30, N / 40]);
    g.strokeStyle = "#ffcd00";
    g.stroke();
    g.lineWidth = Math.max(1, N / 120);
    g.strokeStyle = "#0b0b0b";
    g.stroke();
  }
}

function AdaptivePreview() {
  const { p, ui } = useStudio();
  const stage = useRef<HTMLDivElement>(null);
  const fit = useFit(stage, DW, DH, 1);
  const zoom = ui.zoom === "fit" ? fit : ui.zoom;
  const comp = composite(p, 432);
  const dark = ui.appearance === "dark";
  const a = p.adaptive;
  const monoOn = a.mono.enabled && rulesFor(p.project.sdk).monochrome;
  const label =
    p.project.name.length > 9
      ? p.project.name.slice(0, 8) + "…"
      : p.project.name;
  const mode = ui.adaptiveMode;
  return (
    <div className="stage">
      <div
        className="stage-main"
        ref={stage}
        style={
          mode !== "launcher"
            ? { justifyContent: "flex-start", paddingTop: 8, overflow: "auto" }
            : undefined
        }
      >
        {mode === "masks" && (
          <>
            <span className="cap sim">Simulated · launcher masks</span>
            <div className="masks">
              {MASKS.map((m) => (
                <button
                  key={m.v}
                  type="button"
                  className={`mask-item ${ui.mask === m.v ? "sel" : ""}`}
                  onClick={() => studio.patchUi({ mask: m.v })}
                  aria-pressed={ui.mask === m.v}
                  style={{
                    cursor: "pointer",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  <Cv
                    w={192}
                    draw={(c) => paintAdaptive(c, comp, m.v, ui.safe)}
                    label={`${m.label} mask preview`}
                  />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <p className="info-bar">
              Only the central 72dp of the 108dp canvas is visible. Anything
              outside the mask is cropped; keep key artwork inside the dashed
              safe-zone circle.
            </p>
          </>
        )}
        {mode === "layers" && (
          <>
            <span className="cap gen">Generated · separate layers</span>
            <div className="stack-scene">
              <div
                className="stack"
                role="img"
                aria-label="Exploded view of adaptive icon layers"
              >
                {[
                  {
                    k: "Background",
                    z: 0,
                    draw: (c: HTMLCanvasElement) =>
                      c
                        .getContext("2d")!
                        .drawImage(renderAdaptiveBg(p, 400), 0, 0, 380, 380),
                  },
                  {
                    k: "Foreground",
                    z: 70,
                    draw: (c: HTMLCanvasElement) => {
                      const g = c.getContext("2d")!;
                      g.clearRect(0, 0, 380, 380);
                      g.drawImage(renderAdaptiveFg(p, 380), 0, 0);
                    },
                  },
                  ...(monoOn
                    ? [
                        {
                          k: "Monochrome",
                          z: 140,
                          draw: (c: HTMLCanvasElement) => {
                            const g = c.getContext("2d")!;
                            g.clearRect(0, 0, 380, 380);
                            g.drawImage(renderMono(p, 380), 0, 0);
                          },
                        },
                      ]
                    : []),
                ].map((l) => (
                  <div
                    key={l.k}
                    className="plane checker"
                    style={{ transform: `translateZ(${l.z}px)` }}
                  >
                    <Cv w={380} draw={l.draw} />
                  </div>
                ))}
              </div>
            </div>
            <div className="legend" aria-hidden="true">
              <span>
                <i style={{ background: "var(--ink)" }} />
                Foreground
              </span>
              <span>
                <i style={{ background: colorOr(a.bgColor, "#FFCD00") }} />
                Background
              </span>
              {monoOn && (
                <span>
                  <i style={{ background: "var(--ink-3)" }} />
                  Monochrome
                </span>
              )}
            </div>
            <p className="info-bar">
              {monoOn
                ? "Three separate files are exported."
                : "Background and foreground stay separate. Enable the monochrome layer for Android 13+ themed icons."}
            </p>
          </>
        )}
        {mode === "launcher" && (
          <>
            <span className="cap sim">
              Simulated · Android launcher · {ui.mask}
            </span>
            <Device platform="android" zoom={zoom} dark={dark}>
              <Home
                platform="android"
                dark={dark}
                label={label}
                maskCls={`m-${ui.mask}`}
                ours={(c) => paintAdaptive(c, comp, ui.mask, false)}
              />
            </Device>
          </>
        )}
      </div>
      <div className="stage-side">
        <GeneratedCard p={p} asset="adaptive" guide={<AdaptiveGuide />}>
          <Cv
            w={512}
            draw={(c) => {
              const g = c.getContext("2d")!;
              g.clearRect(0, 0, 512, 512);
              g.drawImage(renderAdaptiveFg(p, 512), 0, 0);
            }}
            label="Generated foreground layer"
          />
        </GeneratedCard>
        <div className="card">
          <h3>Guide</h3>
          <div className="hint" style={{ display: "grid", gap: 4 }}>
            <span>
              <b style={{ color: "var(--ink)" }}>Yellow circle</b> — 66dp safe
              zone
            </span>
            <span>
              <b style={{ color: "var(--ink)" }}>Dashed square</b> — 72dp
              visible area
            </span>
            <span>
              <b style={{ color: "var(--ink)" }}>Outer edge</b> — 108dp canvas
            </span>
          </div>
        </div>
        <SafeToggle />
      </div>
    </div>
  );
}

function SplashPreview({ platforms }: { platforms: Platform[] }) {
  const { p, ui } = useStudio();
  const stage = useRef<HTMLDivElement>(null);
  const fit = useFit(stage, DW, DH, platforms.length);
  const zoom = ui.zoom === "fit" ? fit : ui.zoom;
  const r = rulesFor(p.project.sdk);
  const dark = ui.appearance === "dark";
  const bg =
    dark && p.splash.darkEnabled
      ? colorOr(p.splash.darkBg, "#000000")
      : colorOr(p.splash.bg, "#FFFFFF");
  const textDark = lum(bg) > 0.55;
  const file = allFiles(p).find((f) => f.asset === "splash");
  return (
    <div className="stage">
      <div className="stage-main" ref={stage}>
        <div className="devices">
          {platforms.map((pl) => (
            <div className="dev-col" key={pl}>
              <span className="cap sim">
                Simulated · {pl === "android" ? "Android launch" : "iOS launch"}
              </span>
              <Device platform={pl} zoom={zoom} dark={!textDark}>
                <div className="splash-screen">
                  <Cv
                    w={564}
                    h={1204}
                    draw={(c) =>
                      drawSplash(c.getContext("2d")!, c.width, c.height, p, {
                        bg,
                        offsets: r.splashOffset,
                      })
                    }
                    label="Simulated splash screen"
                  />
                </div>
                <StatusBar platform={pl} />
                <span className="homebar" />
              </Device>
            </div>
          ))}
        </div>
        <p className="info-bar">
          {dark && !p.splash.darkEnabled
            ? "Dark appearance is off for this splash — the light colours are shown. "
            : ""}
          Simulated launch screen. The image is{" "}
          {r.splash === "plugin"
            ? "centered and sized with imageWidth"
            : "placed on a full-screen canvas"}
          .
        </p>
      </div>
      <div className="stage-side">
        <GeneratedCard
          p={p}
          asset="splash"
          ar={file ? `${file.w} / ${file.h}` : undefined}
        >
          <Cv
            w={file && file.h > file.w ? 360 : 512}
            h={file && file.h > file.w ? 780 : 512}
            draw={(c) => {
              if (!file) return;
              const g = c.getContext("2d")!;
              g.clearRect(0, 0, c.width, c.height);
              g.drawImage(file.render(), 0, 0, c.width, c.height);
            }}
            label="Generated splash file"
          />
        </GeneratedCard>
      </div>
    </div>
  );
}

/* ── Empty & invalid ── */
function EmptyState({ asset }: { asset: AssetId }) {
  const { errors } = useStudio();
  const path = PRIMARY[asset];
  const err = errors[path];
  const ref = useRef<HTMLInputElement>(null);
  const copy: Record<AssetId, [string, string]> = {
    icon: [
      "Start with your app icon",
      "Drop a square PNG, JPEG or SVG. 1024×1024 gives the sharpest result.",
    ],
    adaptive: [
      "Add your foreground layer",
      "Use a transparent PNG or SVG. Background and monochrome layers are configured separately.",
    ],
    splash: [
      "Add your logo",
      "A transparent PNG or SVG works best. Colour and size are set on the left.",
    ],
  };
  return (
    <div className={`empty ${err ? "err-state" : ""}`}>
      <div className="art">
        <Icon name={err ? "error" : "image"} size="lg" />
      </div>
      <h2>{err ? "This image can’t be used" : copy[asset][0]}</h2>
      <p role={err ? "alert" : undefined}>{err ?? copy[asset][1]}</p>
      <div className="row">
        <Button variant="default" onClick={() => ref.current?.click()}>
          <Icon name="upload" size="sm" />
          {err ? "Choose another file" : "Upload image"}
        </Button>
        <Button onClick={() => studio.useSample(path)}>
          <Icon name="sparkle" size="sm" />
          Try with a sample
        </Button>
      </div>
      <input
        ref={ref}
        className="sr-only"
        type="file"
        tabIndex={-1}
        aria-label="Upload image"
        accept="image/png,image/jpeg,image/svg+xml,.svg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) studio.upload(f, path);
          e.target.value = "";
        }}
      />
      <span className="hint">
        You can also drop a file anywhere on this page.
      </span>
    </div>
  );
}

export function PreviewView() {
  const { p, ui } = useStudio();
  const def = assetDef(ui.asset);
  if (!def.ready(p)) return <EmptyState asset={ui.asset} />;
  if (ui.asset === "adaptive") {
    if (ui.platform === "ios") {
      return (
        <div className="empty">
          <div className="art">
            <Icon name="lock" size="lg" />
          </div>
          <h2>Adaptive icons are Android-only</h2>
          <p>
            iOS uses the single App icon instead. Switch to Android to preview
            the layers, or edit the App icon for iOS.
          </p>
          <div className="row">
            <Button
              variant="default"
              onClick={() => studio.patchUi({ platform: "android" })}
            >
              Preview on Android
            </Button>
            <Button onClick={() => studio.patchUi({ asset: "icon" })}>
              Open App icon
            </Button>
          </div>
        </div>
      );
    }
    return <AdaptivePreview />;
  }
  const platforms: Platform[] =
    ui.platform === "split" ? ["android", "ios"] : [ui.platform];
  return ui.asset === "icon" ? (
    <IconPreview platforms={platforms} />
  ) : (
    <SplashPreview platforms={platforms} />
  );
}

export { collectIssues, IssueList, Message };
