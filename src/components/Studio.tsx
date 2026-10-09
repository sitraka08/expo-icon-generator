'use client';
import { useEffect, useRef, useState } from 'react';
import { studio, useStudio } from '@/lib/store';
import { Icon } from './Icon';
import { Topbar } from './Topbar';
import { Panel } from './Panel';
import { Workspace } from './Workspace';
import { ExportDialog } from './ExportDialog';
import { Toaster } from './ui/sonner';
import { TooltipProvider } from './ui/tooltip';
import { openExport } from './exportBus';

const PRIMARY = { icon: 'icon.image', adaptive: 'adaptive.fg.image', splash: 'splash.image' } as const;

export function Studio() {
  const { ui, hydrated } = useStudio();
  const [drag, setDrag] = useState(false);
  const depth = useRef(0);
  const asset = useRef(ui.asset);
  asset.current = ui.asset;

  useEffect(() => { studio.hydrate(); }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const t = e.target as HTMLElement;
      if (t.closest('input[type="text"], input[type="number"], textarea, select')) return;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? studio.redo() : studio.undo(); }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); studio.redo(); }
    };
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');
    const enter = (e: DragEvent) => { if (hasFiles(e)) { depth.current++; setDrag(true); } };
    const leave = (e: DragEvent) => { if (hasFiles(e) && --depth.current <= 0) { depth.current = 0; setDrag(false); } };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); depth.current = 0; setDrag(false);
      const f = e.dataTransfer?.files[0];
      if (f) studio.upload(f, PRIMARY[asset.current]);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('dragenter', enter); window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over); window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('dragenter', enter); window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over); window.removeEventListener('drop', drop);
    };
  }, []);

  return (
    <TooltipProvider>
      <a className="skip" href="#panel">Skip to configuration</a>
      <Topbar onExport={() => openExport('zip')} />
      <main className="app" data-mobile={ui.mobile} aria-busy={!hydrated}>
        <Panel />
        <Workspace />
        {drag && (
          <div className="drop-overlay" style={{ position: 'fixed', inset: 12, zIndex: 80 }}>
            <div><Icon name="upload" size="lg" /><strong>Drop to set the {ui.asset === 'icon' ? 'app icon' : ui.asset === 'adaptive' ? 'foreground layer' : 'splash logo'}</strong><span>PNG, JPEG or SVG</span></div>
          </div>
        )}
      </main>
      <nav className="mobile-switch" aria-label="Mobile view">
        <button type="button" className={ui.mobile === 'config' ? 'on' : ''} onClick={() => studio.patchUi({ mobile: 'config' })}>Configure</button>
        <button type="button" className={ui.mobile === 'preview' ? 'on' : ''} onClick={() => studio.patchUi({ mobile: 'preview' })}>Preview</button>
      </nav>
      <ExportDialog />
      <Toaster />
    </TooltipProvider>
  );
}
