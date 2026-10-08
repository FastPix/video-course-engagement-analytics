'use client';
// Rewatch density matrix from reference/prototype-v3.html (S16). Rows are lessons, columns are 10% slices.
import { Chip, esc, plural, STATUS_TONE } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import type { Lesson, LessonStats } from '@/lib/types';

const STOPS = [[232, 222, 250], [180, 140, 240], [109, 34, 205], [52, 12, 110]];

/** 0..1 to the prototype's purple ramp. */
export function heat(v: number): string {
  v = Math.min(1, v);
  if (v < 0.04) return '#F4F1F8';
  const t = v * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(t)), f = t - i;
  return `rgb(${STOPS[i].map((x, k) => Math.round(x + (STOPS[i + 1][k] - x) * f)).join(',')})`;
}

export default function Heatmap({ rows, selected, onSelect, onOpen }: {
  rows: { L: Lesson; s: LessonStats }[];
  selected: string;
  onSelect: (lid: string) => void;
  onOpen: (lid: string) => void;
}) {
  const density = (s: LessonStats, j: number) => s.rewatchBins10[j] / Math.max(1, s.started);
  const mx = Math.max(0.01, ...rows.flatMap(({ s }) => s.rewatchBins10.map((_, j) => density(s, j))));
  const hi = CONFIG.lessons.highlightPct;
  return (
    <table className="mx">
      <tbody>
        <tr>
          <th className="l">Lesson</th>
          {Array.from({ length: 10 }, (_, j) => <th key={j}>{j * 10}%</th>)}
          <th style={{ textAlign: 'right', paddingRight: 10 }}>Not finished</th>
          <th style={{ textAlign: 'right', paddingRight: 10 }}>Left &lt;30%</th>
          <th className="l">Status</th>
        </tr>
        {rows.map(({ L, s }) => {
          const notFinished = 100 - s.finishedPct;
          return (
            <tr key={L.lid} className={`r${L.lid === selected ? ' sel' : ''}`} data-testid="lesson-row" data-lid={L.lid}
              onClick={() => onSelect(L.lid)} onDoubleClick={() => onOpen(L.lid)} style={{ cursor: 'pointer' }}>
              <td className="name">{L.n}. {L.title} <span className="c-sub" style={{ fontSize: 11, fontWeight: 400 }}>{L.size}</span></td>
              {s.rewatchBins10.map((n, j) => (
                <td key={j} style={{ width: '5.2%' }}>
                  <div className="cell" data-testid="heat-cell" style={{ background: heat(density(s, j) / mx) }}
                    data-tip={`<b>${esc(L.title)}</b><br>${j * 10} to ${j * 10 + 10}% · ${plural(n, 'rewatch event')}`} />
                </td>
              ))}
              <td className={`num${notFinished >= hi ? ' c-coral' : ''}`}>{notFinished}%</td>
              <td className={`num${s.earlyPct >= hi ? ' c-coral' : ''}`}>{s.earlyPct}%</td>
              <td><Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
