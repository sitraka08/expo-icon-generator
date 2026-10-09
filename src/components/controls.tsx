"use client";
import { useId, useRef, useState, type ReactNode } from "react";
import { studio, useStudio } from "@/lib/store";
import { defaultProject } from "@/lib/defaults";
import { clamp, fmtBytes, getPath, isHex } from "@/lib/util";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { Issue, ImageRef } from "@/lib/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Switch as UiSwitch } from "./ui/switch";
import { Tip } from "./ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

export { Segmented } from "./ui/toggle-group";
const DEF = defaultProject();
type Gate = { ok: boolean; reason: string };

/* ── Collapsible section ── */
export function Section({
  title,
  meta,
  defaultOpen = true,
  children,
}: {
  title: string;
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-border"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold outline-none transition-colors hover:bg-muted focus-visible:bg-muted">
        <Icon
          name="chev"
          size="sm"
          className="text-muted-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90"
        />
        {title}
        {meta ? (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-3.5 px-4 pb-4 pt-0.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Field wrapper with optional reset + SDK gate ── */
export function Field({
  label,
  htmlFor,
  tag,
  gate,
  onReset,
  dirty,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  tag?: ReactNode;
  gate?: Gate;
  onReset?: () => void;
  dirty?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  const off = gate && !gate.ok;
  return (
    <div className="grid gap-1.5">
      <div className="flex min-h-[22px] items-center gap-2">
        <label htmlFor={htmlFor} className="text-[12.5px] font-medium">
          {label}
        </label>
        {tag}
        {onReset && dirty && !off && (
          <Tip label="Reset">
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto -my-1 size-6"
              aria-label={`Reset ${label}`}
              onClick={onReset}
            >
              <Icon name="reset" size="sm" />
            </Button>
          </Tip>
        )}
      </div>
      <div
        className={cn(off && "pointer-events-none opacity-50")}
        aria-disabled={off || undefined}
      >
        {children}
      </div>
      {hint && !off && (
        <div className="text-xs text-muted-foreground">{hint}</div>
      )}
      {off && (
        <Message kind="warn" icon="lock">
          {gate!.reason}
        </Message>
      )}
    </div>
  );
}

/* ── Slider + number ── */
export function SliderField({
  label,
  path,
  min,
  max,
  step = 1,
  unit = "",
  gate,
  hint,
}: {
  label: string;
  path: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  gate?: Gate;
  hint?: ReactNode;
}) {
  const { p } = useStudio();
  const id = useId();
  const v: number = getPath(p, path);
  const def: number = getPath(DEF, path);
  const set = (n: number) =>
    studio.set(path, clamp(Number.isFinite(n) ? n : def, min, max), path);
  const disabled = gate ? !gate.ok : false;
  return (
    <Field
      label={label}
      htmlFor={id}
      gate={gate}
      dirty={v !== def}
      onReset={() => studio.set(path, def, path + ":reset")}
      hint={hint}
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[v]}
          onValueChange={([n]) => set(n)}
          disabled={disabled}
          aria-label={label}
        />
        <span className="flex items-center">
          <Input
            type="number"
            aria-label={`${label} value`}
            min={min}
            max={max}
            step={step}
            value={v}
            disabled={disabled}
            onChange={(e) => set(Number(e.target.value))}
            className="h-7 w-[68px] text-right font-mono text-xs"
          />
          <span className="ml-1 w-3 text-[11.5px] text-muted-foreground">
            {unit}
          </span>
        </span>
      </div>
    </Field>
  );
}

/* ── Colour ── */
export function ColorField({
  label,
  path,
  gate,
  hint,
}: {
  label: string;
  path: string;
  gate?: Gate;
  hint?: ReactNode;
}) {
  const { p } = useStudio();
  const id = useId();
  const v: string = getPath(p, path);
  const def: string = getPath(DEF, path);
  const ok = isHex(v);
  const full = (s: string) =>
    s.length === 4 ? "#" + [...s.slice(1)].map((c) => c + c).join("") : s;
  return (
    <Field
      label={label}
      htmlFor={id}
      gate={gate}
      dirty={v.toLowerCase() !== def.toLowerCase()}
      onReset={() => studio.set(path, def, path + ":reset")}
      hint={hint}
    >
      <div className="grid grid-cols-[32px_1fr] gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={ok ? full(v.trim()) : "#000000"}
          onChange={(e) => studio.set(path, e.target.value.toUpperCase(), path)}
          className="h-8 w-8 cursor-pointer appearance-none rounded-md border border-input bg-card p-[3px] transition-[border-color,transform] hover:border-muted-foreground active:scale-95 [&::-webkit-color-swatch]:rounded-[3px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          id={id}
          spellCheck={false}
          value={v}
          aria-invalid={!ok}
          aria-describedby={ok ? undefined : id + "-e"}
          className="font-mono text-xs uppercase"
          onChange={(e) =>
            studio.set(
              path,
              e.target.value.startsWith("#") || !e.target.value
                ? e.target.value
                : "#" + e.target.value,
              path,
            )
          }
        />
      </div>
      {!ok && (
        <div
          className="mt-1.5 flex animate-in items-start gap-1.5 text-xs text-err fade-in-0 slide-in-from-top-1"
          id={id + "-e"}
          role="alert"
        >
          <Icon name="error" size="sm" className="mt-px" />
          Enter a hex colour like #FFCD00 or #FC0. The preview keeps the last
          valid colour and export is blocked.
        </div>
      )}
    </Field>
  );
}

/* ── Switch ── */
export function Switch({
  label,
  checked,
  onChange,
  tag,
  gate,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tag?: ReactNode;
  gate?: Gate;
  hint?: ReactNode;
}) {
  const off = gate && !gate.ok;
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium"
        >
          {label}
          {tag}
        </label>
        <UiSwitch
          id={id}
          checked={checked && !off}
          disabled={off}
          onCheckedChange={onChange}
        />
      </div>
      {hint && !off && (
        <div className="text-xs text-muted-foreground">{hint}</div>
      )}
      {off && (
        <Message kind="warn" icon="lock">
          {gate!.reason}
        </Message>
      )}
    </div>
  );
}

/* ── Messages / compatibility ── */
const MSG = {
  info: "bg-muted text-subtle",
  warn: "bg-warn-bg text-warn",
  error: "bg-err-bg text-err",
  success: "bg-ok-bg text-ok",
} as const;
export function Message({
  kind = "info",
  icon,
  children,
  action,
}: {
  kind?: keyof typeof MSG;
  icon?: "lock" | "info" | "alert" | "error" | "check";
  children: ReactNode;
  action?: ReactNode;
}) {
  const ic =
    icon ??
    (kind === "error"
      ? "error"
      : kind === "warn"
        ? "alert"
        : kind === "success"
          ? "check"
          : "info");
  return (
    <div
      role={kind === "error" ? "alert" : undefined}
      className={cn(
        "grid animate-in grid-cols-[16px_1fr] gap-2 rounded-md px-2.5 py-2 text-[12.5px] leading-snug fade-in-0 slide-in-from-top-1 duration-200",
        MSG[kind],
      )}
    >
      <Icon name={ic} size="sm" className="mt-0.5" />
      <div>
        {children}
        {action ? <div className="mt-1.5">{action}</div> : null}
      </div>
    </div>
  );
}

export function IssueList({
  issues,
  onlyAsset,
}: {
  issues: Issue[];
  onlyAsset?: string;
}) {
  const list = issues.filter((i) => !onlyAsset || i.asset === onlyAsset);
  if (!list.length) return null;
  return (
    <div className="grid gap-1.5">
      {list.map((i, n) => (
        <Message
          key={n}
          kind={i.sev === "info" ? "info" : i.sev === "warn" ? "warn" : "error"}
          action={
            i.action ? (
              <Button
                size="sm"
                onClick={() =>
                  i.action!.run === "sdk-latest"
                    ? studio.setSdk("54")
                    : studio.patchUi({ platform: "android" })
                }
              >
                {i.action.label}
              </Button>
            ) : undefined
          }
        >
          {i.msg}
        </Message>
      ))}
    </div>
  );
}

/* ── Upload ── */
export function Upload({
  label,
  path,
  hint,
  optional,
}: {
  label: string;
  path: string;
  hint?: string;
  optional?: boolean;
}) {
  const { p, errors } = useStudio();
  const id = useId();
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const im = getPath(p, path) as ImageRef | null;
  const err = errors[path];
  const pick = (f?: File | null) => {
    if (f) studio.upload(f, path);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex min-h-[22px] items-center gap-2">
        <span className="text-[12.5px] font-medium">{label}</span>
        {optional && <Badge>Optional</Badge>}
      </div>
      {im ? (
        <div className="grid animate-in grid-cols-[44px_1fr_auto] items-center gap-2.5 rounded-lg border border-border bg-muted p-2 fade-in-0 zoom-in-95 duration-200">
          <div className="thumb grid size-11 place-items-center overflow-hidden rounded-md">
            <img src={im.src} alt="" className="max-h-full max-w-full" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium" title={im.name}>
              {im.name}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground">
              <span>
                {im.w}×{im.h}
              </span>
              <span>{fmtBytes(im.bytes)}</span>
              {im.alpha ? (
                <Badge variant="ok">Transparent</Badge>
              ) : (
                <Badge>Opaque</Badge>
              )}
            </div>
          </div>
          <div className="flex">
            <Tip label="Replace image">
              <label className="relative grid size-7 cursor-pointer place-items-center rounded-md text-subtle transition-colors hover:bg-accent hover:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <Icon name="upload" size="sm" />
                <input
                  ref={ref}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,.svg"
                  aria-label={`Replace ${label}`}
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </label>
            </Tip>
            <Tip label="Remove">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${label}`}
                onClick={() => studio.set(path, null, path + ":rm")}
              >
                <Icon name="trash" size="sm" />
              </Button>
            </Tip>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "relative grid cursor-pointer place-items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-input bg-muted px-3.5 py-5 text-center transition-[border-color,background-color,transform] duration-150 hover:border-primary hover:bg-brand-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
            over && "scale-[1.01] border-primary bg-brand-soft",
            err && "border-err bg-err-bg",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOver(false);
            pick(e.dataTransfer.files[0]);
          }}
        >
          <Icon
            name="upload"
            size="lg"
            className={cn(
              "text-subtle transition-transform duration-200",
              over && "-translate-y-0.5",
            )}
          />
          <span>
            <strong className="font-semibold">Choose a file</strong> or drop it
            here
          </span>
          <span className="text-xs text-muted-foreground">
            {hint ?? "PNG, JPEG or SVG · up to 10 MB"}
          </span>
          <input
            id={id}
            ref={ref}
            type="file"
            className="sr-only"
            accept="image/png,image/jpeg,image/svg+xml,.svg"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
      )}
      {err && (
        <div
          className="flex animate-in items-start gap-1.5 text-xs text-err fade-in-0 slide-in-from-top-1"
          role="alert"
        >
          <Icon name="error" size="sm" className="mt-px" />
          <span>{err}</span>
        </div>
      )}
      {!im && !optional && (
        <Button
          size="sm"
          className="justify-self-start"
          onClick={() => studio.useSample(path)}
        >
          <Icon name="sparkle" size="sm" />
          Try with a sample
        </Button>
      )}
    </div>
  );
}

export function SdkTag({ ok, since }: { ok: boolean; since: string }) {
  return ok ? (
    <Badge variant="ok">
      <Icon name="check" size="sm" />
      SDK {since}+
    </Badge>
  ) : (
    <Badge variant="warn">
      <Icon name="lock" size="sm" />
      Needs SDK {since}+
    </Badge>
  );
}
