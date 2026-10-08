'use client';
import Papa from 'papaparse';
import { useMemo, useState } from 'react';
import { esc, PageHead, Select } from '@/components/ui';
import { useStore } from '@/lib/store';

const PER_PAGE = 50;

/** Page indexes to show: first, last, and the current page with one on each side. null marks a gap. */
function pageList(p: number, pages: number): (number | null)[] {
  const keep = [...new Set([0, p - 1, p, p + 1, pages - 1])].filter(n => n >= 0 && n < pages).sort((a, b) => a - b);
  return keep.flatMap((n, i) => (i && n - keep[i - 1] > 1 ? [null, n] : [n]));
}
const MAX_CELL = 60;

/** The loaded CSV exactly as uploaded: every column in file order, every row (S10). */
export default function ViewPage() {
  const { files } = useStore();
  const [fileIdx, setFileIdx] = useState(0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const file = files[Math.min(fileIdx, files.length - 1)];
  const parsed = useMemo(() => {
    if (!file) return { header: [] as string[], rows: [] as string[][] };
    const { data } = Papa.parse<string[]>(file.text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' });
    const [header = [], ...rows] = data;
    return { header, rows };
  }, [file]);

  if (!file) return <PageHead eyebrow="Data" title="Video Data" insight="No data loaded yet." />;

  const needle = q.trim().toLowerCase();
  const rows = needle ? parsed.rows.filter(r => r.some(c => c.toLowerCase().includes(needle))) : parsed.rows;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const p = Math.min(page, pages - 1);
  const shown = rows.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
  const from = rows.length ? p * PER_PAGE + 1 : 0, to = p * PER_PAGE + shown.length;

  return (
    <>
      <div className="ph"><div><div className="eyebrow">Data</div><h1>Video Data</h1></div></div>
      <div className="pn">
        <div className="fbar">
          <input type="search" data-testid="view-search" placeholder="Search any cell" aria-label="Search any cell" value={q}
            onChange={e => { setQ(e.target.value); setPage(0); }} />
          {files.length > 1 && (
            <Select label="File" value={fileIdx} onChange={i => { setFileIdx(i); setPage(0); }} options={files.map((f, i) => [i, f.name] as [number, string])} />
          )}
          <span style={{ flex: 1 }} />
          <span className="c-sub">{parsed.header.length} columns</span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
          <table className="t" data-testid="view-table">
            <thead>
              <tr>{parsed.header.map((h, i) => <th key={i} className="mono" style={{ position: 'sticky', top: 0, background: '#fff' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i} className="hov" data-testid="view-row">
                  {parsed.header.map((_, j) => {
                    const v = r[j] ?? '';
                    const long = v.length > MAX_CELL;
                    return <td key={j} className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11.5 }} data-tip={long ? esc(v) : undefined}>{long ? v.slice(0, MAX_CELL) + '…' : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <div className="c-sub" style={{ padding: 30, textAlign: 'center' }}>No rows match this search.</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="c-sub" data-testid="view-count">Page {p + 1} of {pages} · rows {from} to {to} of {rows.length}</span>
          <span style={{ flex: 1 }} />
          <nav className="mini" aria-label="Pages" data-testid="view-pager">
            <button type="button" aria-label="Previous page" disabled={p === 0} onClick={() => setPage(p - 1)}>‹</button>
            {pageList(p, pages).map((n, i) => n === null
              ? <span key={`gap${i}`} className="c-sub" style={{ padding: '5px 4px' }}>…</span>
              : <button key={n} type="button" className={n === p ? 'pri' : ''} aria-current={n === p ? 'page' : undefined} onClick={() => setPage(n)}>{n + 1}</button>)}
            <button type="button" aria-label="Next page" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>›</button>
          </nav>
        </div>
      </div>
    </>
  );
}
