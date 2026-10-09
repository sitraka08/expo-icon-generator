'use client';
import { useEffect, useRef, useState } from 'react';
import { studio, useStudio } from '@/lib/store';
import { SDKS, sdkById } from '@/lib/sdk';
import { collectIssues } from '@/lib/assets';
import { Icon } from './Icon';

function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open, close, ref]);
}

function SdkMenu() {
  const { p } = useStudio();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  useDismiss(open, close, wrap);
  useEffect(() => { if (open) wrap.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(); }, [open]);
  const move = (e: React.KeyboardEvent) => {
    const items = [...(wrap.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
    if (e.key === 'Escape') { close(); btn.current?.focus(); }
  };
  return (
    <div className="menu-wrap" ref={wrap}>
      <button ref={btn} className="btn ghost sdk-btn" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="sdk-label">Expo SDK</span><span className="mono">{p.project.sdk}</span><Icon name="chev" size="sm" />
      </button>
      {open && (
        <div className="menu" role="listbox" aria-label="Expo SDK version" onKeyDown={move}>
          {SDKS.map((s) => (
            <button key={s.id} role="option" type="button" aria-selected={s.id === p.project.sdk} className="opt" style={{ gridTemplateColumns: '1fr auto' }}
              onClick={() => { studio.setSdk(s.id); close(); btn.current?.focus(); }}>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><b className="mono">SDK {s.id}</b>{s.tag && <span className="tag new">{s.tag}</span>}</span>
              {s.id === p.project.sdk && <span className="tick"><Icon name="check" size="sm" /></span>}
              <small style={{ gridColumn: '1 / -1' }}>{s.summary}</small>
            </button>
          ))}
          <div className="menu-foot">Rules are bundled with this app and not yet verified against Expo’s published schema.</div>
        </div>
      )}
    </div>
  );
}

function MoreMenu() {
  const { ui } = useStudio();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), wrap);
  const run = (fn: () => void) => () => { fn(); setOpen(false); };
  return (
    <div className="menu-wrap" ref={wrap}>
      <button className="icon-btn" type="button" aria-label="Project menu" aria-haspopup="menu" aria-expanded={open} data-tip="Project menu" onClick={() => setOpen(!open)}><Icon name="more" /></button>
      {open && (
        <div className="menu right" role="menu" aria-label="Project menu">
          <button role="menuitem" type="button" onClick={run(() => studio.newProject())}><Icon name="plus" size="sm" />New project</button>
          <button role="menuitem" type="button" onClick={run(() => studio.resetAsset(ui.asset))}><Icon name="reset" size="sm" />Reset current asset</button>
          <button role="menuitem" type="button" onClick={run(() => { studio.resetAll(); studio.toast('info', 'Everything reset', 'Press Ctrl+Z to undo.'); })}><Icon name="trash" size="sm" />Reset everything</button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onExport }: { onExport: () => void }) {
  const { p, ui, theme, save, canUndo, canRedo } = useStudio();
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);
  const issues = collectIssues(p);
  const errs = issues.filter((i) => i.sev === 'error').length;
  const warns = issues.filter((i) => i.sev === 'warn').length;
  const saveLabel = save === 'saved' ? 'Saved in this browser' : save === 'saving' ? 'Saving…' : save === 'partial' ? 'Saved without images' : save === 'error' ? 'Not saved' : '';
  const platformLabel = ui.platform === 'split' ? 'Android + iOS' : ui.platform === 'android' ? 'Android' : 'iOS';
  const commit = (v: string) => { studio.rename(v); setEditing(false); };
  return (
    <header className="topbar" role="banner">
      <a className="brand" href="./" aria-label="Expo Asset Studio">
        <svg className="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" className="logo-bg" /><circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="16" cy="16" r="2.6" fill="currentColor" /></svg>
        <span className="brand-name">Expo Asset Studio</span>
      </a>
      <span className="tb-sep" aria-hidden="true" />
      <div className="proj">
        {editing ? (
          <input ref={input} className="proj-input" defaultValue={p.project.name} maxLength={48} aria-label="Project name"
            onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); if (e.key === 'Escape') setEditing(false); }} />
        ) : (
          <button className="proj-btn" type="button" aria-label={`Project ${p.project.name}. Rename`} title="Rename project" onClick={() => setEditing(true)}>
            <span>{p.project.name}</span><Icon name="pencil" size="sm" />
          </button>
        )}
      </div>
      <SdkMenu />
      <span className="chip mode-chip" title="Current preview platform">Preview · {platformLabel}</span>
      <span className="spacer" />
      {saveLabel && <span className={`save ${save}`} role="status" title="Your project is stored only in this browser (localStorage). Nothing is uploaded."><i /><span>{saveLabel}</span></span>}
      <div className="tb-group" role="group" aria-label="History">
        <button className="icon-btn" type="button" aria-label="Undo" data-tip="Undo  Ctrl+Z" disabled={!canUndo} onClick={() => studio.undo()}><Icon name="undo" /></button>
        <button className="icon-btn" type="button" aria-label="Redo" data-tip="Redo  Ctrl+Shift+Z" disabled={!canRedo} onClick={() => studio.redo()}><Icon name="redo" /></button>
      </div>
      <button className="icon-btn" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} data-tip="Toggle theme" onClick={() => studio.setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>
      <MoreMenu />
      <button className="btn primary" id="exportBtn" type="button" onClick={onExport} aria-label={`Export${errs ? `, ${errs} errors` : warns ? `, ${warns} warnings` : ''}`}>
        <Icon name="download" size="sm" /><span>Export</span>
        {(errs || warns) ? <span className="badge" aria-hidden="true">{errs || warns}</span> : null}
      </button>
    </header>
  );
}
