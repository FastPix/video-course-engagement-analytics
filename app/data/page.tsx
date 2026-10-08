'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DropZone from '@/components/DropZone';
import { PageHead, plural, Select, toast } from '@/components/ui';
import { clearData, loadFiles, setTargetDate, useStore } from '@/lib/store';
import type { Dataset, LoadReport } from '@/lib/types';

const NEED: [string, string, string][] = [
  ['custom_1', 'Course ID', 'eamcet-phy'],
  ['custom_2', 'Lesson ID, number at the end', 'eamcet-phy-L03'],
  ['custom_3', 'Student ID', '24001'],
  ['view_start', 'When the view started', '2026-09-14 18:22:05'],
  ['video_duration', 'Video length in ms', '1080000'],
  ['view_max_playhead_position', 'Furthest point reached, ms', '812000'],
  ['events', 'Event list with positions', '[{"pt":0,"e":"play",...}]'],
];
const OPT: [string, string][] = [
  ['view_id', 'Removes duplicate rows'],
  ['view_total_content_playback_time', 'Real watch time'],
  ['video_title', 'Lesson name'],
  ['video_series', 'Course name'],
  ['device_type', 'Device'],
  ['os_name', 'Android or iOS'],
  ['video_startup_time', 'Startup time'],
];

const fmtD = (d: string | null) => d ? new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
const studentsOf = (ds: Dataset) => new Set(ds.learners.map(l => l.studentId)).size;

type Shown = { name: string; report: LoadReport; ok: boolean };

export default function DataPage() {
  const router = useRouter();
  const { dataset, fileName, targetDates, loading } = useStore();
  const [shown, setShown] = useState<Shown | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiNote, setApiNote] = useState(false);
  const [tab, setTab] = useState<'upload' | 'api'>('upload');
  const [showOpt, setShowOpt] = useState(false);
  const [days, setDays] = useState(7);

  async function take(files: File[]) {
    const name = files.map(f => f.name).join(', ');
    setBusy(true);
    try {
      const report = await loadFiles(await Promise.all(files.map(async f => ({ name: f.name, text: await f.text() }))), 'Your file');
      const ds = useStore.getState().dataset;
      const ok = !report.missingRequired.length && report.viewsUsed > 0;
      setShown({ name, report, ok });
      toast(ok && ds ? `Loaded ${plural(studentsOf(ds), 'student')} from ${name}` : `Could not load ${name}`);
    } catch {
      toast(`Could not load ${name}`);
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    await clearData();
    setShown(null);
    toast('Data cleared');
  }

  const n = dataset ? studentsOf(dataset) : 0;
  const nc = dataset?.courses.length ?? 0;
  const insight = !dataset ? 'No data loaded yet. Drop a FastPix views export to start.'
    : <>You are looking at <b>{fileName}</b>: {plural(n, 'student')} across {plural(nc, 'course')}.</>;

  const r = shown?.report;
  const missing = new Set(r?.missingRequired.map(m => m.split(' ')[0]));

  return (
    <div className="conn">
      <PageHead eyebrow="Data" title="Connector" insight={insight} />

      <div className="pn">
        <div className="pn-h">
          <h3>Load data</h3>
          <div className="conn-links">
            <Link href="/view">Video Data</Link>
            {dataset && <button type="button" data-testid="clear-data" onClick={clear}>Clear data</button>}
          </div>
        </div>
        <div className="ctabs" role="tablist" aria-label="Load data">
          <button type="button" role="tab" data-testid="load-tab-upload" aria-selected={tab === 'upload'} className={tab === 'upload' ? 'on' : ''} onClick={() => setTab('upload')}>Upload CSV</button>
          <button type="button" role="tab" data-testid="load-tab-api" aria-selected={tab === 'api'} className={tab === 'api' ? 'on' : ''} onClick={() => setTab('api')}>FastPix Exports API</button>
        </div>
        {tab === 'upload' ? (
          <div role="tabpanel">
            <DropZone onFiles={take} />
            <div className="hint" style={{ marginTop: 10 }}>The CSV from the FastPix exports API. Nothing leaves your browser.</div>
            {(busy || loading) && <div className="c-sub" style={{ marginTop: 12 }}>Reading file…</div>}
          </div>
        ) : (
          <div role="tabpanel" className="api">
            <div className="api-keys">
              <label className="c-sub">Access token ID<input id="api-token-id" className="inp" autoComplete="off" /></label>
              <label className="c-sub">Secret key<input id="api-secret" className="inp" type="password" autoComplete="off" /></label>
            </div>
            <div className="api-row">
              <div className="c-sub api-field">
                <span>Days</span>
                <Select id="api-days" label="Days" value={days} onChange={setDays} options={[1, 2, 3, 4, 5, 6, 7].map(d => [d, String(d)] as [number, string])} />
              </div>
              <button type="button" className="btn pri" id="api-list" onClick={() => setApiNote(true)}>List exports</button>
            </div>
            <div id="api-results" className="api-results">
              <div className="c-sub" style={{ fontSize: 12 }}>{apiNote ? 'The Exports API is not connected yet.' : 'Exports will appear here.'}</div>
            </div>
            {/* ponytail: no export can be picked until the API calls exist, so this stays disabled */}
            <button type="button" className="btn pri" id="api-load" disabled>Load selected into dashboard</button>
          </div>
        )}
      </div>

      {shown && r && (
        <div className="pn" style={{ marginTop: 16 }}>
          <div className="pn-h">
            <div><h3>{shown.ok ? 'File loaded' : 'Could not load this file'}</h3><div className="hint">{shown.name}</div></div>
            {shown.ok && <button type="button" className="btn pri" onClick={() => router.push('/readiness')}>Open Readiness →</button>}
          </div>
          {shown.ok && dataset ? (
            <>
              <div className="big4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                <div><span>Students</span><b data-testid="report-students">{studentsOf(dataset)}</b></div>
                <div><span>Courses</span><b data-testid="report-courses">{dataset.courses.length}</b></div>
                <div><span>Lessons</span><b data-testid="report-lessons">{dataset.courses.reduce((s, c) => s + c.lessons.length, 0)}</b></div>
                <div><span>Views used</span><b data-testid="report-views">{r.viewsUsed}</b></div>
              </div>
              <div className="kv">
                <div>Rows in file</div><div>{r.rows}</div>
                <div>Skipped, no student/course/lesson ID</div><div data-testid="report-skipped-ids">{r.skippedNoIds}</div>
                <div>Skipped, broken rows</div><div data-testid="report-skipped-broken">{r.skippedBroken}</div>
                {r.duplicates > 0 && <><div>Skipped, duplicate views</div><div>{r.duplicates}</div></>}
                <div>Date range</div><div>{fmtD(r.dateFrom)} to {fmtD(r.dateTo)}</div>
              </div>
            </>
          ) : (
            <div className="note2" style={{ background: 'var(--coral-soft)', borderColor: '#F6C5D3' }}>
              {r.missingRequired.length
                ? <>Missing required columns: <b>{r.missingRequired.join(', ')}</b>. Your current data is kept.</>
                : <>No usable rows in this file. Your current data is kept.</>}
            </div>
          )}
          <div className="sec">
            <h4>Column check</h4>
            {NEED.map(([k]) => (
              <div className="wk" key={k} data-testid={`col-${k}`}>
                <span>{k}</span>
                {missing.has(k) ? <span className="c-coral" style={{ fontWeight: 700 }}>missing</span> : <span className="c-mint" style={{ fontWeight: 700 }}>found</span>}
              </div>
            ))}
            {!r.missingRequired.length && OPT.map(([k]) => (
              <div className="wk" key={k} data-testid={`col-${k}`}>
                <span className="c-sub">{k}</span>
                {r.presentOptional.includes(k) ? <span className="c-mint">found</span> : <span className="c-sub">optional, not found</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="conn-cols">
        <div className="pn" data-testid="csv-needs">
          <h3>What the CSV needs</h3>
          <div className="hint">Column names can be snake_case or camelCase.</div>
          {([['You set these in the player', NEED.slice(0, 3)], ['Already in every FastPix export', NEED.slice(3)]] as const).map(([g, cols]) => (
            <div key={g} className="needs">
              <h4>{g}</h4>
              {cols.map(([k, d, e]) => (
                <div key={k} className="need"><code className="mono">{k}</code><span>{d}<small className="mono">{e}</small></span></div>
              ))}
            </div>
          ))}
          <button type="button" className="opt-toggle" data-testid="optional-toggle" aria-expanded={showOpt} aria-controls="optional-columns" onClick={() => setShowOpt(o => !o)}>
            <span aria-hidden>{showOpt ? '▾' : '▸'}</span> Optional columns ({OPT.length})
          </button>
          <div id="optional-columns" data-testid="optional-columns" className="needs" hidden={!showOpt}>
            {OPT.map(([k, d]) => <div key={k} className="need"><code className="mono">{k}</code><span>{d}</span></div>)}
          </div>
        </div>

        <div className="pn" data-testid="target-dates">
          <h3>Target date per course</h3>
          <div className="hint">Set the exam or course end date to add Pace to the readiness score.</div>
          {dataset?.courses.map(c => (
            <label key={c.id} className="tdate">
              <span>{c.name}</span>
              <input type="date" className="inp" data-testid={`target-${c.id}`} value={targetDates[c.id] ?? ''} onChange={e => setTargetDate(c.id, e.target.value)} />
            </label>
          ))}
          {!dataset && <div className="c-sub" style={{ fontSize: 12, marginTop: 10 }}>Load data to set target dates.</div>}
        </div>
      </div>
    </div>
  );
}
