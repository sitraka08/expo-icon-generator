'use client';
import { useId, useRef, useState, type ReactNode } from 'react';
import { studio, useStudio } from '@/lib/store';
import { defaultProject } from '@/lib/defaults';
import { clamp, fmtBytes, getPath, isHex } from '@/lib/util';
import { Icon } from './Icon';
import type { Issue } from '@/lib/types';

const DEF = defaultProject();

/* ── Collapsible section ── */
export function Section({ title, meta, defaultOpen = true, children }: { title: string; meta?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="sec">
      <button className="sec-head" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <Icon name="chev" size="sm" />
        {title}
        {meta ? <span className="meta">{meta}</span> : null}
      </button>
      {open && <div className="sec-body" id={id}>{children}</div>}
    </section>
  );
}

/* ── Field wrapper with optional reset + SDK gate ── */
export function Field({ label, htmlFor, tag, gate, onReset, dirty, tools, hint, children }: {
  label: string; htmlFor?: string; tag?: ReactNode;
  gate?: { ok: boolean; reason: string };
  onReset?: () => void; dirty?: boolean; tools?: ReactNode; hint?: ReactNode; children: ReactNode;
}) {
  const off = gate && !gate.ok;
  return (
    <div className={`field ${off ? 'off' : ''}`}>
      <div className="field-top">
        <label htmlFor={htmlFor}>{label}</label>
        {tag}
        <span className="tools">
          {tools}
          {onReset && dirty && !off && (
            <button type="button" className="icon-btn sm" aria-label={`Reset ${label}`} data-tip="Reset" onClick={onReset}><Icon name="reset" size="sm" /></button>
          )}
        </span>
      </div>
      <div className="ctl" aria-disabled={off || undefined}>{children}</div>
      {hint && !off && <div className="hint">{hint}</div>}
      {off && <Message kind="warn" icon="lock">{gate!.reason}</Message>}
    </div>
  );
}

/* ── Slider + number ── */
export function SliderField({ label, path, min, max, step = 1, unit = '', gate, hint }: {
  label: string; path: string; min: number; max: number; step?: number; unit?: string; gate?: { ok: boolean; reason: string }; hint?: ReactNode;
}) {
  const { p } = useStudio();
  const id = useId();
  const v: number = getPath(p, path);
  const def: number = getPath(DEF, path);
  const set = (n: number) => studio.set(path, clamp(Number.isFinite(n) ? n : def, min, max), path);
  return (
    <Field label={label} htmlFor={id} gate={gate} dirty={v !== def} onReset={() => studio.set(path, def, path + ':reset')} hint={hint}>
      <div className="slider">
        <input id={id} type="range" min={min} max={max} step={step} value={v} style={{ ['--p' as string]: `${((v - min) / (max - min)) * 100}%` }}
          onChange={(e) => set(Number(e.target.value))} disabled={gate ? !gate.ok : false} />
        <span><input type="number" aria-label={`${label} value`} min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} disabled={gate ? !gate.ok : false} /><span className="unit">{unit}</span></span>
      </div>
    </Field>
  );
}

/* ── Colour ── */
export function ColorField({ label, path, gate, hint }: { label: string; path: string; gate?: { ok: boolean; reason: string }; hint?: ReactNode }) {
  const { p } = useStudio();
  const id = useId();
  const v: string = getPath(p, path);
  const def: string = getPath(DEF, path);
  const ok = isHex(v);
  const full = (s: string) => (s.length === 4 ? '#' + [...s.slice(1)].map((c) => c + c).join('') : s);
  return (
    <Field label={label} htmlFor={id} gate={gate} dirty={v.toLowerCase() !== def.toLowerCase()} onReset={() => studio.set(path, def, path + ':reset')} hint={hint}>
      <div className="color">
        <input type="color" aria-label={`${label} picker`} value={ok ? full(v.trim()) : '#000000'} onChange={(e) => studio.set(path, e.target.value.toUpperCase(), path)} />
        <input id={id} type="text" spellCheck={false} className={ok ? '' : 'invalid'} value={v} aria-invalid={!ok} aria-describedby={ok ? undefined : id + '-e'}
          onChange={(e) => studio.set(path, e.target.value.startsWith('#') || !e.target.value ? e.target.value : '#' + e.target.value, path)} />
      </div>
      {!ok && <div className="err-msg" id={id + '-e'}><Icon name="error" size="sm" />Enter a hex colour like #FFCD00 or #FC0. The preview keeps the last valid colour and export is blocked.</div>}
    </Field>
  );
}

/* ── Segmented (radio group) ── */
export function Segmented<T extends string>({ label, value, options, onChange, full, hideLabel }: {
  label: string; value: T; options: { v: T; label: ReactNode; disabled?: boolean; title?: string }[]; onChange: (v: T) => void; full?: boolean; hideLabel?: boolean;
}) {
  const name = useId();
  return (
    <div className={`seg ${full ? 'full' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={o.v} title={o.title}>
          <input type="radio" name={name} value={o.v} checked={value === o.v} disabled={o.disabled} onChange={() => onChange(o.v)} />
          {o.label}
        </label>
      ))}
      {hideLabel ? null : null}
    </div>
  );
}

/* ── Switch ── */
export function Switch({ label, checked, onChange, tag, gate, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; tag?: ReactNode; gate?: { ok: boolean; reason: string }; hint?: ReactNode;
}) {
  const off = gate && !gate.ok;
  return (
    <div className="field">
      <label className="switch">
        <span>{label}{tag}</span>
        <input type="checkbox" role="switch" checked={checked && !off} disabled={off} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" />
      </label>
      {hint && !off && <div className="hint">{hint}</div>}
      {off && <Message kind="warn" icon="lock">{gate!.reason}</Message>}
    </div>
  );
}

/* ── Messages / compatibility ── */
export function Message({ kind = 'info', icon, children, action }: { kind?: 'info' | 'warn' | 'error' | 'success'; icon?: 'lock' | 'info' | 'alert' | 'error' | 'check'; children: ReactNode; action?: ReactNode }) {
  const ic = icon ?? (kind === 'error' ? 'error' : kind === 'warn' ? 'alert' : kind === 'success' ? 'check' : 'info');
  return (
    <div className={`msg ${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <Icon name={ic} size="sm" />
      <div>{children}{action ? <div className="act">{action}</div> : null}</div>
    </div>
  );
}

export function IssueList({ issues, onlyAsset }: { issues: Issue[]; onlyAsset?: string }) {
  const list = issues.filter((i) => !onlyAsset || i.asset === onlyAsset);
  if (!list.length) return null;
  return (
    <div className="msg-list">
      {list.map((i, n) => (
        <Message key={n} kind={i.sev === 'info' ? 'info' : i.sev === 'warn' ? 'warn' : 'error'}
          action={i.action ? <button type="button" className="btn sm" onClick={() => i.action!.run === 'sdk-latest' ? studio.setSdk('54') : studio.patchUi({ platform: 'android' })}>{i.action.label}</button> : undefined}>
          {i.msg}
        </Message>
      ))}
    </div>
  );
}

/* ── Upload ── */
export function Upload({ label, path, hint, optional }: { label: string; path: string; hint?: string; optional?: boolean }) {
  const { p, errors } = useStudio();
  const id = useId();
  const [over, setOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const im = getPath(p, path) as import('@/lib/types').ImageRef | null;
  const err = errors[path];
  const pick = (f?: File | null) => { if (f) studio.upload(f, path); if (ref.current) ref.current.value = ''; };

  return (
    <div className="field">
      <div className="field-top"><span className="lbl">{label}</span>{optional && <span className="tag">Optional</span>}</div>
      {im ? (
        <div className="file">
          <div className="thumb"><img src={im.src} alt="" /></div>
          <div style={{ minWidth: 0 }}>
            <div className="file-name" title={im.name}>{im.name}</div>
            <div className="file-meta mono"><span>{im.w}×{im.h}</span><span>{fmtBytes(im.bytes)}</span>{im.alpha ? <span className="tag ok">Transparent</span> : <span className="tag">Opaque</span>}</div>
          </div>
          <div className="file-actions">
            <label className="icon-btn sm" data-tip="Replace image" style={{ cursor: 'pointer' }}>
              <Icon name="upload" size="sm" />
              <input ref={ref} className="sr-only" type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" aria-label={`Replace ${label}`} onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <button type="button" className="icon-btn sm" aria-label={`Remove ${label}`} data-tip="Remove" onClick={() => studio.set(path, null, path + ':rm')}><Icon name="trash" size="sm" /></button>
          </div>
        </div>
      ) : (
        <label className={`drop ${over ? 'over' : ''} ${err ? 'invalid' : ''}`} htmlFor={id}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setOver(false); pick(e.dataTransfer.files[0]); }}>
          <Icon name="upload" size="lg" />
          <span><strong>Choose a file</strong> or drop it here</span>
          <span className="hint">{hint ?? 'PNG, JPEG or SVG · up to 10 MB'}</span>
          <input id={id} ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}
      {err && <div className="err-msg" role="alert"><Icon name="error" size="sm" /><span>{err}</span></div>}
      {!im && !optional && <button type="button" className="btn sm" style={{ justifySelf: 'start' }} onClick={() => studio.useSample(path)}><Icon name="sparkle" size="sm" />Try with a sample</button>}
    </div>
  );
}

export function SdkTag({ ok, since }: { ok: boolean; since: string }) {
  return ok ? <span className="tag ok"><Icon name="check" size="sm" />SDK {since}+</span> : <span className="tag warn"><Icon name="lock" size="sm" />Needs SDK {since}+</span>;
}
