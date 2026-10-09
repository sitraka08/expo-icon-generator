'use client';
import { studio, useStudio } from '@/lib/store';
import { Icon } from './Icon';

export function Toasts() {
  const { toasts } = useStudio();
  return (
    <div className="toasts" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          <Icon name={t.kind === 'success' ? 'check' : t.kind === 'error' ? 'error' : t.kind === 'warn' ? 'alert' : 'info'} />
          <div><b>{t.title}</b>{t.body && <p>{t.body.replace(/`/g, '')}</p>}</div>
          <button type="button" className="icon-btn" aria-label="Dismiss notification" onClick={() => studio.dismiss(t.id)}><Icon name="x" size="sm" /></button>
        </div>
      ))}
    </div>
  );
}
