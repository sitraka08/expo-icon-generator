'use client';
import { useEffect, useRef, useState } from 'react';
import { studio, useStudio } from '@/lib/store';
import { SDKS } from '@/lib/sdk';
import { collectIssues } from '@/lib/assets';
import { Icon } from './Icon';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tip } from './ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

function SdkMenu() {
  const { p } = useStudio();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="group gap-1.5 data-[state=open]:bg-accent" aria-label={`Expo SDK ${p.project.sdk}. Change version`}>
          <span className="sdk-label text-muted-foreground">Expo SDK</span><span className="font-mono">{p.project.sdk}</span>
          <Icon name="chev" size="sm" className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Expo SDK version</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={p.project.sdk} onValueChange={(v) => studio.setSdk(v)}>
          {SDKS.map((s) => (
            <DropdownMenuRadioItem key={s.id} value={s.id} className="flex-col items-start gap-0.5 py-2">
              <span className="flex items-center gap-2"><b className="font-mono font-semibold">SDK {s.id}</b>{s.tag && <Badge variant="brand">{s.tag}</Badge>}</span>
              <span className="text-xs text-muted-foreground">{s.summary}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11.5px] leading-snug text-muted-foreground">Rules are bundled with this app and not yet verified against Expo’s published schema.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu() {
  const { ui } = useStudio();
  return (
    <DropdownMenu>
      <Tip label="Project menu">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Project menu"><Icon name="more" /></Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => studio.newProject()}><Icon name="plus" size="sm" />New project</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => studio.resetAsset(ui.asset)}><Icon name="reset" size="sm" />Reset current asset</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { studio.resetAll(); studio.toast('info', 'Everything reset', 'Press Ctrl+Z to undo.'); }} className="text-err data-[highlighted]:bg-err-bg"><Icon name="trash" size="sm" />Reset everything</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <svg className="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" className="logo-bg" /><circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" /><circle cx="16" cy="16" r="2.6" fill="currentColor" /></svg>
        <span className="brand-name">Expo Asset Studio</span>
      </a>
      <span className="tb-sep" aria-hidden="true" />
      <div className="proj">
        {editing ? (
          <Input ref={input} className="h-8 w-48 animate-in fade-in-0 zoom-in-95" defaultValue={p.project.name} maxLength={48} aria-label="Project name"
            onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); if (e.key === 'Escape') setEditing(false); }} />
        ) : (
          <Tip label="Rename project">
            <Button variant="ghost" className="max-w-[220px] gap-2" aria-label={`Project ${p.project.name}. Rename`} onClick={() => setEditing(true)}>
              <span className="truncate">{p.project.name}</span><Icon name="pencil" size="sm" className="text-muted-foreground" />
            </Button>
          </Tip>
        )}
      </div>
      <SdkMenu />
      <Badge variant="brand" className="mode-chip h-6 px-2 text-[11.5px]" title="Current preview platform">Preview · {platformLabel}</Badge>
      <span className="spacer" />
      {saveLabel && <span className={`save ${save}`} role="status" title="Your project is stored only in this browser (localStorage). Nothing is uploaded."><i /><span>{saveLabel}</span></span>}
      <div className="tb-group" role="group" aria-label="History">
        <Tip label="Undo  Ctrl+Z"><Button variant="ghost" size="icon" aria-label="Undo" disabled={!canUndo} onClick={() => studio.undo()}><Icon name="undo" /></Button></Tip>
        <Tip label="Redo  Ctrl+Shift+Z"><Button variant="ghost" size="icon" aria-label="Redo" disabled={!canRedo} onClick={() => studio.redo()}><Icon name="redo" /></Button></Tip>
      </div>
      <Tip label="Toggle theme">
        <Button variant="ghost" size="icon" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => studio.setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <span key={theme} className="animate-in spin-in-45 fade-in-0 zoom-in-50 duration-300"><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></span>
        </Button>
      </Tip>
      <MoreMenu />
      <Button variant="default" id="exportBtn" onClick={onExport} aria-label={`Export${errs ? `, ${errs} errors` : warns ? `, ${warns} warnings` : ''}`}>
        <Icon name="download" size="sm" /><span>Export</span>
        {(errs || warns) ? <Badge variant="brand" aria-hidden="true" className="ml-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10.5px]">{errs || warns}</Badge> : null}
      </Button>
    </header>
  );
}
