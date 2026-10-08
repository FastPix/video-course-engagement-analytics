'use client';
import { useEffect, useState } from 'react';

/** Drop area for one or more CSV files (S10). */
export default function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);

  useEffect(() => {
    // A file dropped outside the zone must not open in the tab.
    const stop = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragover', stop);
    document.addEventListener('drop', stop);
    return () => { document.removeEventListener('dragover', stop); document.removeEventListener('drop', stop); };
  }, []);

  const take = (list: FileList | null) => { if (list?.length) onFiles([...list]); };

  return (
    <label
      className={`drop${over ? ' over' : ''}`}
      data-testid="drop-zone"
      onDragEnter={e => { e.preventDefault(); setOver(true); }}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
    >
      <input type="file" data-testid="file-input" accept=".csv,text/csv" multiple hidden onChange={e => { take(e.target.files); e.target.value = ''; }} />
      <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, margin: '0 auto 10px' }} aria-hidden>
        <path d="M12 16V4m0 0l-5 5m5-5l5 5" fill="none" stroke="#6D22CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" fill="none" stroke="#6D22CD" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <b style={{ fontSize: 15 }}>Drop your CSV here</b>
      <div className="c-sub" style={{ marginTop: 4 }}>or click to choose a file</div>
    </label>
  );
}
