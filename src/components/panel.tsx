"use client";
import { studio, useStudio } from "@/lib/store";
import { ASSETS, collectIssues, assetDef } from "@/lib/assets";
import { rulesFor } from "@/lib/sdk";
import type { AssetId } from "@/lib/types";
import {
  ColorField,
  Field,
  IssueList,
  Section,
  Segmented,
  SdkTag,
  SliderField,
  Switch,
  Upload,
  Message,
} from "./controls";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Icon, type IconName } from "./icon";

const TAB_ICON: Record<AssetId, IconName> = {
  icon: "app",
  adaptive: "layers",
  splash: "phone",
};
const TAB_LABEL: Record<AssetId, string> = {
  icon: "App icon",
  adaptive: "Adaptive",
  splash: "Splash",
};

function ResetAsset({ id }: { id: AssetId }) {
  return (
    <Button
      size="sm"
      className="justify-self-start"
      onClick={() => studio.resetAsset(id)}
    >
      <Icon name="reset" size="sm" />
      Reset {assetDef(id).label.toLowerCase()}
    </Button>
  );
}

function IconPanel() {
  const { p } = useStudio();
  const r = rulesFor(p.project.sdk);
  const issues = collectIssues(p);
  return (
    <>
      <Section title="Source image" defaultOpen>
        <Upload
          label="Icon image"
          path="icon.image"
          hint="PNG, JPEG or SVG · 1024×1024 recommended"
        />
      </Section>
      <Section title="Position & scale" defaultOpen>
        <SliderField
          label="Scale"
          path="icon.scale"
          min={10}
          max={200}
          unit="%"
          hint="100% fits the longest side to the canvas."
        />
        <SliderField
          label="Horizontal offset"
          path="icon.x"
          min={-50}
          max={50}
          unit="%"
        />
        <SliderField
          label="Vertical offset"
          path="icon.y"
          min={-50}
          max={50}
          unit="%"
        />
        <Button
          size="sm"
          className="justify-self-start"
          onClick={() =>
            studio.setMany(
              [
                ["icon.scale", 100],
                ["icon.x", 0],
                ["icon.y", 0],
              ],
              "icon:reset-pos",
            )
          }
        >
          <Icon name="reset" size="sm" />
          Reset position & scale
        </Button>
      </Section>
      <Section title="Background">
        <ColorField
          label="Background colour"
          path="icon.bg"
          hint="Fills transparent areas. iOS icons cannot have an alpha channel."
        />
      </Section>
      <Section title="Platform options" meta="iOS">
        <Switch
          label="Dark appearance icon"
          checked={p.icon.darkEnabled}
          onChange={(v) => studio.set("icon.darkEnabled", v)}
          tag={<SdkTag ok={r.iosIconVariants} since="54" />}
          gate={{
            ok: r.iosIconVariants,
            reason: `Dark icon variants are not available in SDK ${p.project.sdk}. Your choice is kept; switch to SDK 54 or later to export it.`,
          }}
          hint="Exports a second icon used when iOS is in dark mode."
        />
        {p.icon.darkEnabled && r.iosIconVariants && (
          <ColorField label="Dark background" path="icon.darkBg" />
        )}
        {!r.iosIconVariants && p.icon.darkEnabled && (
          <Button
            size="sm"
            className="justify-self-start"
            onClick={() => studio.setSdk("54")}
          >
            Use SDK 54
          </Button>
        )}
      </Section>
      <Section
        title="Compatibility"
        meta={`SDK ${p.project.sdk}`}
      >
        <IssueList issues={issues} onlyAsset="icon" />
        <Message kind="info">
          Output: <span className="mono">icon.png</span> · 1024×1024 · PNG,
          flattened.
        </Message>
      </Section>
      <Section title="Advanced">
        <ResetAsset id="icon" />
      </Section>
    </>
  );
}

function AdaptivePanel() {
  const { p } = useStudio();
  const r = rulesFor(p.project.sdk);
  const a = p.adaptive;
  const issues = collectIssues(p);
  return (
    <>
      <Section title="Foreground layer" defaultOpen>
        <Upload
          label="Foreground"
          path="adaptive.fg.image"
          hint="Transparent PNG or SVG · keep the artwork inside the safe zone"
        />
        <SliderField
          label="Scale"
          path="adaptive.fg.scale"
          min={10}
          max={150}
          unit="%"
          hint="61% keeps a full-bleed image inside the 66dp safe zone."
        />
        <SliderField
          label="Horizontal offset"
          path="adaptive.fg.x"
          min={-30}
          max={30}
          unit="%"
        />
        <SliderField
          label="Vertical offset"
          path="adaptive.fg.y"
          min={-30}
          max={30}
          unit="%"
        />
      </Section>
      <Section title="Background layer">
        <Segmented
          label="Background type"
          full
          value={a.bgMode}
          onChange={(v) => studio.set("adaptive.bgMode", v)}
          options={[
            { v: "color", label: "Colour" },
            { v: "image", label: "Image" },
          ]}
        />
        {a.bgMode === "color" ? (
          <ColorField
            label="Background colour"
            path="adaptive.bgColor"
            hint="Written to config as backgroundColor — no file is generated."
          />
        ) : (
          <Upload
            label="Background image"
            path="adaptive.bgImage"
            hint="Covers the full 108dp canvas"
          />
        )}
      </Section>
      <Section title="Monochrome layer" meta="Android 13+">
        <Switch
          label="Themed (monochrome) icon"
          checked={a.mono.enabled}
          onChange={(v) => studio.set("adaptive.mono.enabled", v)}
          gate={{
            ok: r.monochrome,
            reason: `Monochrome icons are not available in SDK ${p.project.sdk}.`,
          }}
          hint="Android tints this layer with the user’s wallpaper colours."
        />
        {a.mono.enabled && (
          <>
            <Segmented
              label="Monochrome source"
              full
              value={a.mono.source}
              onChange={(v) => studio.set("adaptive.mono.source", v)}
              options={[
                { v: "foreground", label: "From foreground" },
                { v: "upload", label: "Upload" },
              ]}
            />
            {a.mono.source === "upload" && (
              <Upload
                label="Monochrome image"
                path="adaptive.mono.image"
                hint="Single-colour shape on transparency"
              />
            )}
          </>
        )}
      </Section>
      <Section
        title="Compatibility"
        meta={`SDK ${p.project.sdk}`}
      >
        <IssueList issues={issues} onlyAsset="adaptive" />
        <Message kind="info">
          Layers stay separate: the foreground is never flattened onto the
          background.
        </Message>
      </Section>
      <Section title="Advanced">
        <ResetAsset id="adaptive" />
      </Section>
    </>
  );
}

function SplashPanel() {
  const { p } = useStudio();
  const r = rulesFor(p.project.sdk);
  const plugin = r.splash === "plugin";
  const issues = collectIssues(p);
  const sp = p.splash;
  return (
    <>
      <Section title="Logo" defaultOpen>
        <Upload
          label="Logo or image"
          path="splash.image"
          hint="Transparent PNG or SVG works best"
        />
        <SliderField
          label={plugin ? "Logo width" : "Logo size"}
          path="splash.size"
          min={5}
          max={100}
          unit="%"
          hint={
            plugin
              ? `Exported as imageWidth: ${Math.round((sp.size / 100) * 390)} (dp, 390dp reference screen).`
              : "Share of the screen width."
          }
        />
        <SliderField
          label="Horizontal offset"
          path="splash.x"
          min={-40}
          max={40}
          unit="%"
          gate={{
            ok: r.splashOffset,
            reason: `SDK ${p.project.sdk} centers the splash image — offsets need SDK 51 or earlier. Your values are kept.`,
          }}
        />
        <SliderField
          label="Vertical offset"
          path="splash.y"
          min={-40}
          max={40}
          unit="%"
          gate={{
            ok: r.splashOffset,
            reason: `SDK ${p.project.sdk} centers the splash image — offsets need SDK 51 or earlier. Your values are kept.`,
          }}
        />
      </Section>
      <Section title="Background">
        <ColorField label="Background colour" path="splash.bg" />
        <Switch
          label="Dark appearance"
          checked={sp.darkEnabled}
          onChange={(v) => studio.set("splash.darkEnabled", v)}
          hint="Uses a different background when the device is in dark mode."
        />
        {sp.darkEnabled && (
          <ColorField label="Dark background" path="splash.darkBg" />
        )}
      </Section>
      <Section title="Platform options">
        <Field
          label="Resize mode"
          htmlFor="resize"
          hint="How the image fits the screen."
        >
          <Select
            value={sp.resizeMode}
            onValueChange={(v) => studio.set("splash.resizeMode", v)}
          >
            <SelectTrigger id="resize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {!r.splashResizeModes.some((m) => m.value === sp.resizeMode) && (
                <SelectItem value={sp.resizeMode}>
                  {sp.resizeMode} (unavailable)
                </SelectItem>
              )}
              {r.splashResizeModes.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                  {m.deprecated ? " — deprecated" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Message kind="info">
          Configured through{" "}
          {plugin ? (
            <>
              <span className="mono">expo-splash-screen</span> plugin
            </>
          ) : (
            <>
              the top-level <span className="mono">splash</span> key
            </>
          )}{" "}
          for SDK {p.project.sdk}.
        </Message>
      </Section>
      <Section
        title="Compatibility"
        meta={`SDK ${p.project.sdk}`}
      >
        <IssueList issues={issues} onlyAsset="splash" />
        <Message kind="info">
          Android 12+ renders launch screens through the system API; the real
          result can differ slightly from the simulation.
        </Message>
      </Section>
      <Section title="Advanced">
        <ResetAsset id="splash" />
      </Section>
    </>
  );
}

export function Panel() {
  const { p, ui } = useStudio();
  return (
    <aside className="panel" id="panel" aria-label="Configuration">
      <Tabs
        value={ui.asset}
        onValueChange={(v) => studio.patchUi({ asset: v as AssetId })}
        className="border-b border-border p-3"
      >
        <TabsList
          className="grid w-full grid-cols-3 gap-1 rounded-lg bg-secondary p-1"
          aria-label="Asset"
        >
          {ASSETS.map((a) => (
            <TabsTrigger
              key={a.id}
              value={a.id}
              className="relative flex-col gap-1 rounded-md px-1 pb-1.5 pt-2 text-xs transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-[var(--lift)] data-[state=inactive]:hover:text-foreground"
            >
              <span className="grid size-6 place-items-center rounded-[5px] transition-colors duration-200 group-data-[state=active]:bg-brand [[data-state=active]_&]:bg-brand [[data-state=active]_&]:text-brand-foreground">
                <Icon name={TAB_ICON[a.id]} size="sm" />
              </span>
              {TAB_LABEL[a.id]}
              {a.ready(p) && (
                <span
                  className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-ok"
                  title="Ready to export"
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div
        className="panel-body animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
        id="panelBody"
        key={ui.asset}
      >
        {ui.asset === "icon" ? (
          <IconPanel />
        ) : ui.asset === "adaptive" ? (
          <AdaptivePanel />
        ) : (
          <SplashPanel />
        )}
      </div>
      <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        About me ·{" "}
        <a
          href="https://sitraka.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-brand"
        >
          sitraka.vercel.app
        </a>
      </footer>
    </aside>
  );
}
