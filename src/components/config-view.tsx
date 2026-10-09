"use client";
import { useState } from "react";
import { studio, useStudio } from "@/lib/store";
import { ASSETS, buildConfig, collectIssues, allFiles } from "@/lib/assets";
import { sdkById } from "@/lib/sdk";
import { Icon } from "./icon";
import { IssueList, Message, Segmented } from "./controls";
import { FileRow } from "./file-row";
import { Button } from "./ui/button";
import { cn } from "@/lib/cn";
import type { AssetId } from "@/lib/types";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export function highlight(line: string) {
  return esc(line).replace(
    /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
    (m, str, colon, bool, num) => {
      if (str)
        return colon
          ? `<span class="tk-k">${str}</span><span class="tk-p">${colon}</span>`
          : `<span class="tk-s">${str}</span>`;
      if (bool) return `<span class="tk-b">${bool}</span>`;
      if (num) return `<span class="tk-n">${num}</span>`;
      return m;
    },
  );
}

export function Code({ json }: { json: string }) {
  return (
    <pre
      className="code"
      tabIndex={0}
      aria-label="Generated Expo configuration"
    >
      <code>
        {json.split("\n").map((l, i) => (
          <span
            className="ln"
            key={i}
            dangerouslySetInnerHTML={{ __html: highlight(l) || " " }}
          />
        ))}
      </code>
    </pre>
  );
}

export function CopyButton({
  text,
  label = "Copy",
  variant = "outline",
  size = "sm",
}: {
  text: string;
  label?: string;
  variant?: "outline" | "default";
  size?: "sm" | "default";
}) {
  const [done, setDone] = useState(false);
  const go = async () => {
    const ok = await copyText(text);
    if (ok) {
      setDone(true);
      studio.toast(
        "success",
        "Configuration copied",
        "Paste it into your app.json or app.config.json.",
      );
      setTimeout(() => setDone(false), 1800);
    } else
      studio.toast(
        "error",
        "Copy failed",
        "Your browser blocked clipboard access. Select the text and copy it manually.",
      );
  };
  return (
    <Button
      variant={variant}
      size={size}
      onClick={go}
      aria-live="polite"
      className={cn("min-w-[88px]", done && "border-ok text-ok")}
    >
      <span
        key={String(done)}
        className="inline-flex animate-in items-center gap-1.5 fade-in-0 zoom-in-90 duration-200"
      >
        <Icon name={done ? "check" : "copy"} size="sm" />
        {done ? "Copied" : label}
      </span>
    </Button>
  );
}

export function ConfigView() {
  const { p, ui } = useStudio();
  const ready = ASSETS.filter((a) => a.ready(p));
  const only: "all" | AssetId = ready.some((a) => a.id === ui.configOnly)
    ? ui.configOnly
    : "all";
  const cfg = buildConfig(p, ui.configScope, only);
  const json = JSON.stringify(cfg, null, 2);
  const issues = collectIssues(p);
  const errs = issues.filter((i) => i.sev === "error");
  const sdk = sdkById(p.project.sdk);
  const files = allFiles(p);
  const empty = !ready.length;
  return (
    <div className="pane">
      <div className="code-card">
        <div className="code-bar">
          <Segmented
            label="Configuration scope"
            value={ui.configScope}
            onChange={(v) => studio.patchUi({ configScope: v })}
            options={[
              { v: "fragment", label: "Fragment" },
              { v: "complete", label: "Complete app.json" },
            ]}
          />
          <Segmented
            label="Asset section"
            value={only}
            onChange={(v) => studio.patchUi({ configOnly: v })}
            options={[
              { v: "all", label: "All" },
              ...ready.map((a) => ({
                v: a.id,
                label:
                  a.id === "icon"
                    ? "Icon"
                    : a.id === "adaptive"
                      ? "Adaptive"
                      : "Splash",
              })),
            ]}
          />
          <span className="grow">
            <CopyButton
              text={json}
              label={
                ui.configScope === "fragment" ? "Copy fragment" : "Copy config"
              }
            />
          </span>
        </div>
        {empty ? (
          <div className="empty">
            <div className="art">
              <Icon name="code" size="lg" />
            </div>
            <h2>No configuration yet</h2>
            <p>
              Add an image to an asset and its Expo configuration appears here.
            </p>
          </div>
        ) : (
          <Code json={json} />
        )}
      </div>
      <div className="side-col">
        <div className="card">
          <h3>
            Validation <span className="right">SDK {sdk.id}</span>
          </h3>
          {errs.length ? (
            <Message kind="error">
              {errs.length} error{errs.length > 1 ? "s" : ""} block export. Fix
              them in the editor — your changes are kept.
            </Message>
          ) : (
            <Message kind="success">
              Structural checks passed. SDK rules are bundled and not yet
              verified against Expo’s schema.
            </Message>
          )}
          <IssueList
            issues={issues.filter(
              (i) => i.sev !== "info" || i.asset === "project",
            )}
          />
        </div>
        <div className="card">
          <h3>
            Generated files <span className="right hint">{files.length}</span>
          </h3>
          {files.length ? (
            files.map((f) => <FileRow key={f.id} f={f} compact />)
          ) : (
            <span className="hint">None yet.</span>
          )}
        </div>
        <Button onClick={() => studio.patchUi({ view: "preview" })}>
          <Icon name="phone" size="sm" />
          Back to visual editor
        </Button>
      </div>
    </div>
  );
}
