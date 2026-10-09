'use client';
import { useEffect, useRef, useState } from 'react';
import { studio, useStudio } from '@/lib/store';
import { allFiles, buildConfig, collectIssues } from '@/lib/assets';
import { buildZip, download, zipTree } from '@/lib/export';
import { fmtBytes } from '@/lib/util';
import { Icon } from './Icon';
import { CopyButton, Code } from './ConfigView';
import { IssueList, Message, Segmented } from './controls';
import { FileRow } from './FileRow';
import { onOpenExport, type ExportTab } from './exportBus';

interface Done { name: string; count: number; size: number }

export function ExportDialog() {
  const { p } = useStudio();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ExportTab>('zip');
  const [readme, setReadme] = useState(true);
  const [fullConfig, setFullConfig] = useState(true);
  const [scope, setScope] = useState<'fragment' | 'complete'>('fragment');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  useEffect(() => onOpenExport((t) => { setTab(t); setDone(null); setFail(null); setOpen(true); }), []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const files = allFiles(p);
  const issues = collectIssues(p);
  const errors = issues.filter((i) => i.sev === 'error');
  const warns = issues.filter((i) => i.sev === 'warn');
  const blocked = errors.length > 0;
  const tree = zipTree(p, { readme, fullConfig });
  const cfgJson = JSON.stringify(buildConfig(p, scope), null, 2);

  const run = async () => {
    setBusy(true); setFail(null);
    try {
      const { blob, count, name } = await buildZip(p, { readme, fullConfig });
      download(blob, name);
      setDone({ name, count, size: blob.size });
      studio.toast('success', 'Export ready', `${name} · ${count} files`);
    } catch (e) {
      setFail(e instanceof Error ? e.message : 'Unknown error');
    }
    setBusy(false);
  };

  const choices: { v: ExportTab; icon: 'package' | 'file' | 'code'; title: string; sub: string }[] = [
    { v: 'zip', icon: 'package', title: 'ZIP package', sub: 'Assets, config and README' },
    { v: 'files', icon: 'file', title: 'Individual files', sub: 'Download PNGs one by one' },
    { v: 'config', icon: 'code', title: 'Copy configuration', sub: 'Fragment or full app.json' },
  ];

  return (
    <dialog ref={ref} className="dlg" aria-labelledby="exportTitle" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === ref.current) setOpen(false); }}>
      <div className="dlg-head">
        <h2 id="exportTitle">{done ? 'Export complete' : 'Export assets'}</h2>
        <button type="button" className="icon-btn" aria-label="Close export dialog" onClick={() => setOpen(false)}><Icon name="x" /></button>
      </div>

      {done ? (
        <>
          <div className="dlg-body">
            <div className="success">
              <div className="big"><Icon name="check" /></div>
              <h3>{done.count} files exported</h3>
              <p className="mono">{done.name} · {fmtBytes(done.size)}</p>
              <ol className="steps">
                <li>Extract the archive into your Expo project root.</li>
                <li>Merge <span className="mono">expo-config.fragment.json</span> into your <span className="mono">app.json</span>.</li>
                <li>Rebuild with <span className="mono">npx expo prebuild --clean</span>.</li>
              </ol>
              {warns.length > 0 && <Message kind="warn">Exported with {warns.length} warning{warns.length > 1 ? 's' : ''}. Review them in the Config tab.</Message>}
            </div>
          </div>
          <div className="dlg-foot">
            <button type="button" className="btn" onClick={() => setDone(null)}>Export again</button>
            <button type="button" className="btn primary" onClick={() => setOpen(false)}>Done</button>
          </div>
        </>
      ) : (
        <>
          <div className="dlg-sum">
            <span className="chip mono">SDK {p.project.sdk}</span>
            <span className="chip">{files.length} file{files.length === 1 ? '' : 's'}</span>
            {errors.length > 0 && <span className="tag err"><Icon name="error" size="sm" />{errors.length} error{errors.length > 1 ? 's' : ''}</span>}
            {warns.length > 0 && <span className="tag warn"><Icon name="alert" size="sm" />{warns.length} warning{warns.length > 1 ? 's' : ''}</span>}
            {!errors.length && !warns.length && <span className="tag ok"><Icon name="check" size="sm" />No warnings</span>}
          </div>
          <div className="dlg-body">
            <div className="choices" role="radiogroup" aria-label="Export type">
              {choices.map((c) => (
                <label className="choice" key={c.v}>
                  <input type="radio" name="export-type" checked={tab === c.v} onChange={() => setTab(c.v)} />
                  <b><Icon name={c.icon} size="sm" />{c.title}</b><small>{c.sub}</small>
                </label>
              ))}
            </div>

            {blocked && (
              <Message kind="error"><b>Export is blocked.</b> Fix {errors.length === 1 ? 'this error' : 'these errors'} in the editor — your changes are kept.</Message>
            )}
            <IssueList issues={[...errors, ...warns]} />

            {tab === 'zip' && (
              <>
                <div className="tree" aria-label="Archive contents">
                  {tree.map((r) => (
                    <div key={r.path}>
                      <Icon name={r.kind === 'asset' ? 'image' : r.kind === 'config' ? 'code' : 'file'} size="sm" />
                      {r.path.includes('/') ? <><span className="dir">{r.path.slice(0, r.path.lastIndexOf('/') + 1)}</span>{r.path.slice(r.path.lastIndexOf('/') + 1)}</> : r.path}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <label className="check"><input type="checkbox" checked={readme} onChange={(e) => setReadme(e.target.checked)} />Include README.md</label>
                  <label className="check"><input type="checkbox" checked={fullConfig} onChange={(e) => setFullConfig(e.target.checked)} />Include complete app.json</label>
                </div>
              </>
            )}
            {tab === 'files' && (
              <div style={{ display: 'grid', gap: 8 }}>
                {files.length ? files.map((f) => <FileRow key={f.id} f={f} />) : <Message kind="info">Nothing to download yet.</Message>}
              </div>
            )}
            {tab === 'config' && (
              <div className="code-card" style={{ maxHeight: 300 }}>
                <div className="code-bar">
                  <Segmented label="Configuration scope" value={scope} onChange={setScope} options={[{ v: 'fragment', label: 'Fragment' }, { v: 'complete', label: 'Complete' }]} />
                  <span className="grow"><CopyButton text={cfgJson} label="Copy" /></span>
                </div>
                <Code json={cfgJson} />
              </div>
            )}
            {fail && <Message kind="error" action={<button type="button" className="btn sm" onClick={run}>Try again</button>}><b>Export failed.</b> {fail}</Message>}
          </div>
          <div className="dlg-foot">
            <span className="grow">{blocked ? 'Resolve errors to enable export.' : warns.length ? 'Warnings don’t block export.' : ''}</span>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Back to editor</button>
            {tab === 'zip' && <button type="button" className="btn primary" disabled={blocked || busy || !files.length} onClick={run}><Icon name="download" size="sm" />{busy ? 'Building…' : 'Download ZIP'}</button>}
            {tab === 'config' && <CopyButton className="btn primary" text={cfgJson} label="Copy configuration" />}
            {tab === 'files' && <button type="button" className="btn primary" onClick={() => setOpen(false)}>Done</button>}
          </div>
        </>
      )}
    </dialog>
  );
}
