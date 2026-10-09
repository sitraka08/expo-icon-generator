'use client';
import { studio, useStudio } from '@/lib/store';
import { allFiles } from '@/lib/assets';
import { Icon } from './Icon';
import { Segmented } from './controls';
import { MASKS, PreviewView } from './Preview';
import { ConfigView } from './ConfigView';
import { FilesView } from './FilesView';
import type { Mask } from '@/lib/types';

function PreviewTools() {
  const { ui, p } = useStudio();
  const adaptive = ui.asset === 'adaptive';
  const showsDevice = ui.asset !== 'adaptive' || ui.adaptiveMode === 'launcher';
  const androidShown = ui.platform !== 'ios';
  const zoomVal = ui.zoom === 'fit' ? null : ui.zoom;
  const step = (d: number) => studio.patchUi({ zoom: Math.min(1.5, Math.max(0.4, Math.round(((zoomVal ?? 0.8) + d) * 100) / 100)) });
  return (
    <div className="ws-tools" role="toolbar" aria-label="Preview options">
      {adaptive && (
        <Segmented label="Adaptive preview mode" value={ui.adaptiveMode} onChange={(v) => studio.patchUi({ adaptiveMode: v })}
          options={[{ v: 'masks', label: 'Masks' }, { v: 'layers', label: 'Layers' }, { v: 'launcher', label: 'Launcher' }]} />
      )}
      <Segmented label="Platform" value={ui.platform} onChange={(v) => studio.patchUi({ platform: v })}
        options={[{ v: 'android', label: 'Android' }, { v: 'ios', label: 'iOS', title: adaptive ? 'Adaptive icons are Android-only' : undefined }, ...(adaptive ? [] : [{ v: 'split' as const, label: 'Both' }])]} />
      <Segmented label="Appearance" value={ui.appearance} onChange={(v) => studio.patchUi({ appearance: v })}
        options={[{ v: 'light', label: <><Icon name="sun" size="sm" /><span className="sr-only">Light</span></>, title: 'Light appearance' }, { v: 'dark', label: <><Icon name="moon" size="sm" /><span className="sr-only">Dark</span></>, title: 'Dark appearance' }]} />
      {androidShown && ui.asset !== 'splash' && !(adaptive && ui.adaptiveMode === 'layers') && (
        <select aria-label="Android launcher shape" value={ui.mask} onChange={(e) => studio.patchUi({ mask: e.target.value as Mask })} style={{ width: 118, height: 34, borderRadius: 999 }}>
          {MASKS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
        </select>
      )}
      {showsDevice && (
        <div className="zoombar" role="group" aria-label="Zoom">
          <button type="button" className="icon-btn sm" aria-label="Zoom out" onClick={() => step(-0.1)}><Icon name="minus" size="sm" /></button>
          <span className="val" aria-live="polite">{zoomVal ? Math.round(zoomVal * 100) + '%' : 'Fit'}</span>
          <button type="button" className="icon-btn sm" aria-label="Zoom in" onClick={() => step(0.1)}><Icon name="plus" size="sm" /></button>
          <button type="button" className="icon-btn sm" aria-label="Fit to screen" aria-pressed={ui.zoom === 'fit'} onClick={() => studio.patchUi({ zoom: 'fit' })}><Icon name="fit" size="sm" /></button>
        </div>
      )}
      <span className="sr-only">{p.project.name}</span>
    </div>
  );
}

export function Workspace() {
  const { ui, p } = useStudio();
  const count = allFiles(p).length;
  const tabs = [
    { v: 'preview', label: 'Preview', icon: 'phone' as const },
    { v: 'config', label: 'Config', icon: 'code' as const },
    { v: 'files', label: 'Files', icon: 'file' as const },
  ];
  return (
    <section className="workspace" id="workspace" aria-label="Preview workspace">
      <div className="ws-head">
        <div className="seg" role="tablist" aria-label="Workspace view">
          {tabs.map((t) => (
            <button key={t.v} role="tab" type="button" aria-selected={ui.view === t.v} onClick={() => studio.patchUi({ view: t.v as 'preview' })}>
              <Icon name={t.icon} size="sm" />{t.label}{t.v === 'files' && <span className="count">{count}</span>}
            </button>
          ))}
        </div>
        {ui.view === 'preview' && <PreviewTools />}
      </div>
      <div className="ws-body">
        <div className="view">
          {ui.view === 'preview' ? <PreviewView /> : ui.view === 'config' ? <ConfigView /> : <FilesView />}
        </div>
      </div>
    </section>
  );
}
