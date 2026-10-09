'use client';
import { studio, useStudio } from '@/lib/store';
import { allFiles } from '@/lib/assets';
import { Icon } from './Icon';
import { Segmented } from './controls';
import { MASKS, PreviewView } from './Preview';
import { ConfigView } from './ConfigView';
import { FilesView } from './FilesView';
import { Button } from './ui/button';
import { Tip } from './ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import type { Mask } from '@/lib/types';

function PreviewTools() {
  const { ui } = useStudio();
  const adaptive = ui.asset === 'adaptive';
  const showsDevice = ui.asset !== 'adaptive' || ui.adaptiveMode === 'launcher';
  const androidShown = ui.platform !== 'ios';
  const zoomVal = ui.zoom === 'fit' ? null : ui.zoom;
  const step = (d: number) => studio.patchUi({ zoom: Math.min(1.5, Math.max(0.4, Math.round(((zoomVal ?? 0.8) + d) * 100) / 100)) });
  return (
    <div className="ws-tools" role="toolbar" aria-label="Preview options">
      {adaptive && (
        <Segmented solid label="Adaptive preview mode" value={ui.adaptiveMode} onChange={(v) => studio.patchUi({ adaptiveMode: v })}
          options={[{ v: 'masks', label: 'Masks' }, { v: 'layers', label: 'Layers' }, { v: 'launcher', label: 'Launcher' }]} />
      )}
      <Segmented solid label="Platform" value={ui.platform} onChange={(v) => studio.patchUi({ platform: v })}
        options={[{ v: 'android', label: 'Android' }, { v: 'ios', label: 'iOS', title: adaptive ? 'Adaptive icons are Android-only' : undefined }, ...(adaptive ? [] : [{ v: 'split' as const, label: 'Both' }])]} />
      <Segmented solid label="Appearance" value={ui.appearance} onChange={(v) => studio.patchUi({ appearance: v })}
        options={[{ v: 'light', label: <><Icon name="sun" size="sm" /><span className="sr-only">Light</span></>, title: 'Light appearance' }, { v: 'dark', label: <><Icon name="moon" size="sm" /><span className="sr-only">Dark</span></>, title: 'Dark appearance' }]} />
      {androidShown && ui.asset !== 'splash' && !(adaptive && ui.adaptiveMode === 'layers') && (
        <Select value={ui.mask} onValueChange={(v) => studio.patchUi({ mask: v as Mask })}>
          <SelectTrigger aria-label="Android launcher shape" className="w-[118px]"><SelectValue /></SelectTrigger>
          <SelectContent>{MASKS.map((m) => <SelectItem key={m.v} value={m.v}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {showsDevice && (
        <div className="zoombar" role="group" aria-label="Zoom">
          <Tip label="Zoom out"><Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => step(-0.1)}><Icon name="minus" size="sm" /></Button></Tip>
          <span className="val" aria-live="polite">{zoomVal ? Math.round(zoomVal * 100) + '%' : 'Fit'}</span>
          <Tip label="Zoom in"><Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => step(0.1)}><Icon name="plus" size="sm" /></Button></Tip>
          <Tip label="Fit to screen"><Button variant="ghost" size="icon-sm" aria-label="Fit to screen" aria-pressed={ui.zoom === 'fit'} onClick={() => studio.patchUi({ zoom: 'fit' })}><Icon name="fit" size="sm" /></Button></Tip>
        </div>
      )}
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
        <Tabs value={ui.view} onValueChange={(v) => studio.patchUi({ view: v as 'preview' })}>
          <TabsList aria-label="Workspace view" className="h-12 gap-1">
            {tabs.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="relative h-full rounded-none px-3 text-[13px] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:ease-out hover:bg-transparent data-[state=active]:text-foreground data-[state=active]:after:scale-x-100">
                <Icon name={t.icon} size="sm" />{t.label}
                {t.v === 'files' && <Badge variant="brand" className="h-4 min-w-4 justify-center rounded-full px-1">{count}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {ui.view === 'preview' && <PreviewTools />}
      </div>
      <div className="ws-body">
        <div className="view animate-in fade-in-0 slide-in-from-bottom-1 duration-200" key={ui.view}>
          {ui.view === 'preview' ? <PreviewView /> : ui.view === 'config' ? <ConfigView /> : <FilesView />}
        </div>
      </div>
    </section>
  );
}
