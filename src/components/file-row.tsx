"use client";
import { useEffect, useRef, useState } from "react";
import { studio, useStudio } from "@/lib/store";
import { pathOf } from "@/lib/assets";
import { fileBlob, download } from "@/lib/export";
import type { AssetFile } from "@/lib/types";
import { Icon } from "./icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tip } from "./ui/tooltip";

export function FileRow({
  f,
  compact,
  editable,
}: {
  f: AssetFile;
  compact?: boolean;
  editable?: boolean;
}) {
  const { p, tick } = useStudio();
  const ref = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, c.width, c.height);
    const src = f.render();
    const k = Math.min(c.width / src.width, c.height / src.height);
    g.drawImage(
      src,
      (c.width - src.width * k) / 2,
      (c.height - src.height * k) / 2,
      src.width * k,
      src.height * k,
    );
  }, [f, tick]);
  const path = pathOf(p, f);
  const bad = !/^\.\/[\w\-./]+\.png$/i.test(path);
  const get = async () => {
    setBusy(true);
    try {
      const { blob, name } = await fileBlob(p, f.id);
      download(blob, name);
      studio.toast("success", `Downloaded ${name}`, `${f.w}×${f.h} PNG`);
    } catch (e) {
      studio.toast(
        "error",
        "Download failed",
        e instanceof Error ? e.message : "Could not render this file.",
      );
    }
    setBusy(false);
  };
  return (
    <div className={`frow ${compact ? "compact" : ""}`}>
      <div className="thumb">
        <canvas
          ref={ref}
          width={96}
          height={96}
          style={{ width: "100%", height: "100%" }}
          aria-hidden="true"
        />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="nm">
          <span className="mono">{f.name}</span>
          <span className="dims">
            {f.format} · {f.w}×{f.h}
          </span>
        </div>
        {editable ? (
          <>
            <Input
              className="mt-1 h-7 font-mono text-xs"
              type="text"
              spellCheck={false}
              aria-label={`Destination path for ${f.name}`}
              aria-invalid={bad}
              value={path}
              onChange={(e) =>
                studio.set(`paths.${f.id}`, e.target.value, "path:" + f.id)
              }
            />
            <div className="note">
              {bad ? "Use a path like ./assets/name.png" : f.note}
            </div>
          </>
        ) : (
          <div className="path-ro" title={path}>
            {path}
          </div>
        )}
      </div>
      {compact ? (
        <Tip label="Download">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${f.name}`}
            disabled={busy}
            onClick={get}
          >
            <Icon name="download" size="sm" />
          </Button>
        </Tip>
      ) : (
        <Button
          size="sm"
          aria-label={`Download ${f.name}`}
          disabled={busy}
          onClick={get}
        >
          <Icon name="download" size="sm" />
          Download
        </Button>
      )}
    </div>
  );
}
