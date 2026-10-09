'use client';
import { studio, useStudio } from '@/lib/store';
import { allFiles, ASSETS, collectIssues } from '@/lib/assets';
import { Icon } from './Icon';
import { Button } from './ui/button';
import { FileRow } from './FileRow';
import { IssueList, Message } from './controls';
import { openExport } from './exportBus';

export function FilesView() {
  const { p } = useStudio();
  const files = allFiles(p);
  const issues = collectIssues(p).filter((i) => i.sev !== 'info');
  return (
    <div className="files-pane">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <strong style={{ fontSize: 15 }}>Generated files</strong>
          <div className="hint">{files.length} file{files.length === 1 ? '' : 's'} · paths are editable and relative to your project root</div>
        </div>
        <Button className="ml-auto" onClick={() => openExport('zip')} disabled={!files.length}><Icon name="package" size="sm" />Export ZIP</Button>
      </div>
      {!files.length && <Message kind="info">No files yet. Add an image to the App icon, Adaptive icon or Splash screen to generate assets.</Message>}
      {ASSETS.map((a) => {
        const fs = files.filter((f) => f.asset === a.id);
        if (!fs.length) return null;
        return (
          <div key={a.id} style={{ display: 'grid', gap: 8 }}>
            <span className="cap">{a.label}</span>
            {fs.map((f) => <FileRow key={f.id} f={f} editable />)}
          </div>
        );
      })}
      <IssueList issues={issues} />
    </div>
  );
}
