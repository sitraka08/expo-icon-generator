"use client";
import { useEffect, useState } from "react";
import { studio, useStudio } from "@/lib/store";
import { allFiles, buildConfig, collectIssues } from "@/lib/assets";
import { buildZip, download, zipTree } from "@/lib/export";
import { fmtBytes } from "@/lib/util";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";
import { CopyButton, Code } from "./config-view";
import { IssueList, Message, Segmented } from "./controls";
import { FileRow } from "./file-row";
import { onOpenExport, type ExportTab } from "./export-bus";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Done {
  name: string;
  count: number;
  size: number;
}

const CHOICES: { v: ExportTab; icon: IconName; title: string; sub: string }[] =
  [
    {
      v: "zip",
      icon: "package",
      title: "ZIP package",
      sub: "Assets, config and README",
    },
    {
      v: "files",
      icon: "file",
      title: "Individual files",
      sub: "Download PNGs one by one",
    },
    {
      v: "config",
      icon: "code",
      title: "Copy configuration",
      sub: "Fragment or full app.json",
    },
  ];

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
      <input
        type="checkbox"
        className="size-4 cursor-pointer accent-[var(--primary)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {children}
    </label>
  );
}

export function ExportDialog() {
  const { p } = useStudio();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ExportTab>("zip");
  const [readme, setReadme] = useState(true);
  const [fullConfig, setFullConfig] = useState(true);
  const [scope, setScope] = useState<"fragment" | "complete">("fragment");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  useEffect(
    () =>
      onOpenExport((t) => {
        setTab(t);
        setDone(null);
        setFail(null);
        setOpen(true);
      }),
    [],
  );

  const files = allFiles(p);
  const issues = collectIssues(p);
  const errors = issues.filter((i) => i.sev === "error");
  const warns = issues.filter((i) => i.sev === "warn");
  const blocked = errors.length > 0;
  const tree = zipTree(p, { readme, fullConfig });
  const cfgJson = JSON.stringify(buildConfig(p, scope), null, 2);

  const run = async () => {
    setBusy(true);
    setFail(null);
    try {
      const { blob, count, name } = await buildZip(p, { readme, fullConfig });
      download(blob, name);
      setDone({ name, count, size: blob.size });
      studio.toast("success", "Export ready", `${name} · ${count} files`);
    } catch (e) {
      setFail(e instanceof Error ? e.message : "Unknown error");
    }
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby="export-desc">
        <div className="px-5 pb-3.5 pt-[18px] pr-12">
          <DialogTitle>
            {done ? "Export complete" : "Export assets"}
          </DialogTitle>
          <DialogDescription id="export-desc" className="sr-only">
            Choose how to export your generated Expo assets.
          </DialogDescription>
        </div>

        {done ? (
          <>
            <div className="grid animate-in justify-items-center gap-3 px-5 pb-4 pt-2 text-center fade-in-0 zoom-in-95 duration-300">
              <div className="grid size-16 animate-in place-items-center rounded-full bg-brand text-brand-foreground zoom-in-50 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                <Icon name="check" size="lg" />
              </div>
              <h3 className="m-0 text-xl font-semibold">
                {done.count} files exported
              </h3>
              <p className="m-0 font-mono text-[13px] text-subtle">
                {done.name} · {fmtBytes(done.size)}
              </p>
              <ol className="grid w-full list-decimal gap-1.5 pl-5 text-left text-[13px] text-subtle">
                <li>Extract the archive into your Expo project root.</li>
                <li>
                  Merge{" "}
                  <span className="font-mono">expo-config.fragment.json</span>{" "}
                  into your <span className="font-mono">app.json</span>.
                </li>
                <li>
                  Rebuild with{" "}
                  <span className="font-mono">npx expo prebuild --clean</span>.
                </li>
              </ol>
              {warns.length > 0 && (
                <div className="w-full text-left">
                  <Message kind="warn">
                    Exported with {warns.length} warning
                    {warns.length > 1 ? "s" : ""}. Review them in the Config
                    tab.
                  </Message>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted px-5 py-3.5">
              <Button onClick={() => setDone(null)}>Export again</Button>
              <Button variant="default" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ExportTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex flex-wrap gap-2 px-5 pb-3.5">
              <Badge className="h-6 px-2 font-mono text-[11.5px]">
                SDK {p.project.sdk}
              </Badge>
              <Badge className="h-6 px-2 text-[11.5px]">
                {files.length} file{files.length === 1 ? "" : "s"}
              </Badge>
              {errors.length > 0 && (
                <Badge variant="err" className="h-6 px-2 text-[11.5px]">
                  <Icon name="error" size="sm" />
                  {errors.length} error{errors.length > 1 ? "s" : ""}
                </Badge>
              )}
              {warns.length > 0 && (
                <Badge variant="warn" className="h-6 px-2 text-[11.5px]">
                  <Icon name="alert" size="sm" />
                  {warns.length} warning{warns.length > 1 ? "s" : ""}
                </Badge>
              )}
              {!errors.length && !warns.length && (
                <Badge variant="ok" className="h-6 px-2 text-[11.5px]">
                  <Icon name="check" size="sm" />
                  No warnings
                </Badge>
              )}
            </div>
            <div className="grid min-h-0 flex-1 gap-3.5 overflow-y-auto px-5 pb-4">
              <TabsList
                aria-label="Export type"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {CHOICES.map((c) => (
                  <TabsTrigger
                    key={c.v}
                    value={c.v}
                    className={cn(
                      "h-auto flex-col items-start gap-0.5 rounded-lg bg-card p-3 text-left text-foreground shadow-[var(--lift)] transition-all duration-200 hover:bg-muted",
                      "data-[state=active]:bg-brand-soft data-[state=active]:shadow-[0_0_0_1.5px_var(--primary)]",
                    )}
                  >
                    <b className="flex items-center gap-2 font-semibold">
                      <Icon name={c.icon} size="sm" />
                      {c.title}
                    </b>
                    <small className="font-normal text-muted-foreground">
                      {c.sub}
                    </small>
                  </TabsTrigger>
                ))}
              </TabsList>

              {blocked && (
                <Message kind="error">
                  <b>Export is blocked.</b> Fix{" "}
                  {errors.length === 1 ? "this error" : "these errors"} in the
                  editor — your changes are kept.
                </Message>
              )}
              <IssueList issues={[...errors, ...warns]} />

              <TabsContent value="zip" className="grid gap-3.5">
                <div
                  className="grid rounded-md border border-border bg-muted px-3.5 py-3 font-mono text-xs leading-[1.9]"
                  aria-label="Archive contents"
                >
                  {tree.map((r, i) => (
                    <div
                      key={r.path}
                      className="flex animate-in items-center gap-2 fade-in-0 slide-in-from-left-1 fill-mode-backwards"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <Icon
                        name={
                          r.kind === "asset"
                            ? "image"
                            : r.kind === "config"
                              ? "code"
                              : "file"
                        }
                        size="sm"
                      />
                      {r.path.includes("/") ? (
                        <>
                          <span className="text-muted-foreground">
                            {r.path.slice(0, r.path.lastIndexOf("/") + 1)}
                          </span>
                          {r.path.slice(r.path.lastIndexOf("/") + 1)}
                        </>
                      ) : (
                        r.path
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-6">
                  <Check checked={readme} onChange={setReadme}>
                    Include README.md
                  </Check>
                  <Check checked={fullConfig} onChange={setFullConfig}>
                    Include complete app.json
                  </Check>
                </div>
              </TabsContent>
              <TabsContent value="files" className="grid gap-2">
                {files.length ? (
                  files.map((f) => <FileRow key={f.id} f={f} />)
                ) : (
                  <Message kind="info">Nothing to download yet.</Message>
                )}
              </TabsContent>
              <TabsContent value="config">
                <div className="code-card" style={{ maxHeight: 300 }}>
                  <div className="code-bar">
                    <Segmented
                      label="Configuration scope"
                      value={scope}
                      onChange={setScope}
                      options={[
                        { v: "fragment", label: "Fragment" },
                        { v: "complete", label: "Complete" },
                      ]}
                    />
                    <span className="grow">
                      <CopyButton text={cfgJson} label="Copy" />
                    </span>
                  </div>
                  <Code json={cfgJson} />
                </div>
              </TabsContent>
              {fail && (
                <Message
                  kind="error"
                  action={
                    <Button size="sm" onClick={run}>
                      Try again
                    </Button>
                  }
                >
                  <b>Export failed.</b> {fail}
                </Message>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-muted px-5 py-3.5">
              <span className="mr-auto text-xs text-muted-foreground">
                {blocked
                  ? "Resolve errors to enable export."
                  : warns.length
                    ? "Warnings don’t block export."
                    : ""}
              </span>
              <Button onClick={() => setOpen(false)}>Back to editor</Button>
              {tab === "zip" && (
                <Button
                  variant="default"
                  disabled={blocked || busy || !files.length}
                  onClick={run}
                >
                  <Icon name="download" size="sm" />
                  {busy ? "Building…" : "Download ZIP"}
                </Button>
              )}
              {tab === "config" && (
                <CopyButton
                  variant="default"
                  size="default"
                  text={cfgJson}
                  label="Copy configuration"
                />
              )}
              {tab === "files" && (
                <Button variant="default" onClick={() => setOpen(false)}>
                  Done
                </Button>
              )}
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
