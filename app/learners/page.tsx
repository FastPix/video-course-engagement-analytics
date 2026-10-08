'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import FilterMenu from '@/components/FilterMenu';
import { Chip, esc, PageHead, plural, type Tone } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { urgency } from '@/lib/model/rules';
import { ACTION_LABEL, NO_FILTERS, useStore } from '@/lib/store';
import type { ActionKind, Band, Health, Learner } from '@/lib/types';

const BANDS: Band[] = ['Ready', 'Building', 'At-risk'];
const HEALTH: Health[] = ['Active', 'Cooling', 'Gone quiet', 'Finished'];
const KINDS: ActionKind[] = ['tutor_call', 'plan_reset', 'catch_up', 'nudge'];
const BAND_COL: Record<Band, string> = { Ready: '#12A46B', Building: '#D99A00', 'At-risk': '#E0245E' };
const HEALTH_TONE: Record<Health, Tone> = { Active: 'mint', Cooling: 'amber', 'Gone quiet': 'coral', Finished: 'accent' };
const KIND_TONE: Record<ActionKind, Tone> = { tutor_call: 'coral', plan_reset: 'coral', catch_up: 'accent', nudge: 'amber' };
const MAX_ROWS = 120;

type SortKey = 'urg' | 'id' | 'r' | 'pm' | 'prog' | 'idle' | 'dl' | 'loc';
const csvCell = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

export default function LearnersPage() {
  const router = useRouter();
  const { dataset, courseId, learnerFilters: F, setLearnerFilters } = useStore();
  const [menu, setMenu] = useState<string | null>(null);
  const openChange = useCallback((id: string) => (o: boolean) => setMenu(m => (o ? id : m === id ? null : m)), []);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'urg', dir: -1 });

  const course = dataset?.courses.find(c => c.id === courseId);
  if (!dataset || !course) return <PageHead eyebrow="Course" title="Learners" insight="Loading the sample export…" />;

  const hasTarget = !!course.targetDate;
  const N = course.lessons.length;
  const all = dataset.learners.filter(l => l.courseId === course.id);
  const pm = (l: Learner) => (hasTarget ? l.score.parts.pace ?? 0 : l.watchPrev14 ? l.watch14 / l.watchPrev14 : l.watch14 ? Infinity : 0);
  const KEY: Record<SortKey, (l: Learner) => number | string> = {
    urg: urgency, id: l => l.studentId, r: l => l.score.value, pm, prog: l => l.completed, idle: l => l.idle, dl: l => l.daysLeft ?? 0,
    // A to Z by city (or region when there is no city); "-" sorts last.
    loc: l => (l.location.city ?? l.location.region ?? '\uffff').toLowerCase(),
  };
  const ls = all
    .filter(l => (!F.q || l.studentId.toLowerCase().includes(F.q.trim().toLowerCase()))
      && (!F.band.length || F.band.includes(l.score.band))
      && (!F.health.length || F.health.includes(l.health))
      && (!F.action.length || (l.action && F.action.includes(l.action.kind))))
    .sort((a, b) => { const x = KEY[sort.key](a), y = KEY[sort.key](b); return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  const shown = ls.slice(0, MAX_ROWS);

  function exportCsv() {
    const rows = [['student_id', 'readiness', 'band', 'health', 'lessons_completed', 'days_idle', 'device', 'suggested_action', 'reason'],
      ...ls.map(l => [l.studentId, l.score.value, l.score.band, l.health, l.completed, l.idle, l.device, l.action ? ACTION_LABEL[l.action.kind] : '', l.action?.reason ?? ''])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n'], { type: 'text/csv' }));
    a.download = `${course!.id}-learners.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const th = (key: SortKey, label: string) => (
    <th className="s" onClick={() => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'urg' ? -1 : 1 }))}>
      {label}{sort.key === key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
    </th>
  );
  // Option counts are for the whole course, before any filter.
  const count = (f: (l: Learner) => boolean) => all.filter(f).length;
  const picks: { group: string; label: string; remove: () => void }[] = [
    ...F.band.map(v => ({ group: 'Readiness', label: v, remove: () => setLearnerFilters({ band: F.band.filter(x => x !== v) }) })),
    ...F.health.map(v => ({ group: 'Health', label: v, remove: () => setLearnerFilters({ health: F.health.filter(x => x !== v) }) })),
    ...F.action.map(v => ({ group: 'Action', label: ACTION_LABEL[v], remove: () => setLearnerFilters({ action: F.action.filter(x => x !== v) }) })),
  ];

  function pmCell(l: Learner) {
    if (hasTarget) {
      const p = l.score.parts.pace ?? 0;
      return <td className={p < CONFIG.actions.tutorPaceBelow ? 'c-coral' : 'c-mint'}>{p >= 1 ? 'on pace' : `-${Math.round((1 - p) * 100)}%`}</td>;
    }
    if (!l.watchPrev14) return <td className="c-sub">{l.watch14 ? 'new' : '-'}</td>;
    const d = Math.round((l.watch14 / l.watchPrev14 - 1) * 100);
    return <td className={d < 0 ? 'c-coral' : 'c-mint'}>{d > 0 ? '+' : ''}{d}%</td>;
  }

  return (
    <>
      <PageHead
        eyebrow={`Course · ${course.name}`} title="Learners"
        insight={<><b>{ls.length}</b> of {all.length} learners match. Filter to find a group, then export it.</>}
        right={<button type="button" className="btn" data-testid="export-csv" onClick={exportCsv}>Export CSV</button>}
      />
      <div className="pn">
        <div className="fbar fbar-b">
          <input type="search" data-testid="learner-search" placeholder="Search learner ID" aria-label="Search learner ID" value={F.q} onChange={e => setLearnerFilters({ q: e.target.value })} />
          <FilterMenu id="readiness" label="Readiness" picked={F.band} onChange={band => setLearnerFilters({ band })} open={menu === 'readiness'} onOpenChange={openChange('readiness')}
            options={BANDS.map(b => ({ value: b, label: b, dot: BAND_COL[b], count: count(l => l.score.band === b) }))} />
          <FilterMenu id="health" label="Health" picked={F.health} onChange={health => setLearnerFilters({ health })} open={menu === 'health'} onOpenChange={openChange('health')}
            options={HEALTH.map(h => ({ value: h, label: h, count: count(l => l.health === h) }))} />
          <FilterMenu id="action" label="Action" picked={F.action} onChange={action => setLearnerFilters({ action })} open={menu === 'action'} onOpenChange={openChange('action')}
            options={KINDS.map(k => ({ value: k, label: ACTION_LABEL[k], count: count(l => l.action?.kind === k) }))} />
          <span className="fcount" data-testid="learner-count" aria-live="polite">{plural(ls.length, 'learner')}</span>
        </div>
        {picks.length > 0 && (
          <div className="fpicks">
            {picks.map(p => (
              <span key={`${p.group}:${p.label}`} className="fpick" data-testid="filter-chip">
                {p.group}: {p.label}
                <button type="button" aria-label={`Remove ${p.group}: ${p.label}`} onClick={p.remove}>×</button>
              </span>
            ))}
            <button type="button" className="fclear" data-testid="filter-clear-all" onClick={() => setLearnerFilters(NO_FILTERS)}>Clear all</button>
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table className="t">
            <tbody>
              <tr>
                {th('id', 'Learner')}{th('r', 'Readiness')}<th>Health</th>{th('pm', hasTarget ? 'Pace' : 'Momentum')}{th('prog', 'Progress')}{th('idle', 'Last watched')}
                {hasTarget && th('dl', 'Target date in')}{th('loc', 'Location')}<th>Device</th>{th('urg', 'Suggested')}
              </tr>
              {shown.map(l => (
                  <tr key={l.studentId} className="hov" data-testid="learner-row" data-band={l.score.band} data-health={l.health} data-action={l.action?.kind ?? ''} style={{ cursor: 'pointer' }} onClick={() => router.push(`/learners/${encodeURIComponent(l.studentId)}`)}>
                    <td><b className="c-acc">{l.studentId}</b></td>
                    <td><span className="pbar"><div style={{ width: `${l.score.value}%`, background: BAND_COL[l.score.band] }} /></span><b>{l.score.value}</b></td>
                    <td><Chip tone={HEALTH_TONE[l.health]}>{l.health}</Chip></td>
                    {pmCell(l)}
                    <td><span className="pbar"><div style={{ width: `${Math.round((100 * l.completed) / N)}%`, background: '#6D22CD' }} /></span>{l.completed}/{N}</td>
                    <td>{l.idle === 0 ? 'today' : `${l.idle}d ago`}</td>
                    {hasTarget && <td className={(l.daysLeft ?? 0) <= CONFIG.actions.tutorDaysLeft ? 'c-coral' : ''}>{l.daysLeft}d</td>}
                    <td><span className="loc" data-testid="learner-location" data-tip={`<b>${esc(l.location.label)}</b>${l.location.country ? `<br>${esc(l.location.country)}` : ''}`}>{l.location.label}</span></td>
                    <td className="c-sub">{l.device}</td>
                    <td>{l.action ? <span data-tip={esc(l.action.reason)}><Chip tone={KIND_TONE[l.action.kind]}>{ACTION_LABEL[l.action.kind]}</Chip></span> : <span className="c-sub">-</span>}</td>
                  </tr>
              ))}
            </tbody>
          </table>
          {!ls.length && <div className="c-sub" style={{ padding: 30, textAlign: 'center' }}>No learners match these filters.</div>}
          {ls.length > MAX_ROWS && <div className="c-sub" style={{ padding: 10 }}>Showing {MAX_ROWS} of {ls.length}. Narrow the filters to see the rest.</div>}
        </div>
      </div>
    </>
  );
}
