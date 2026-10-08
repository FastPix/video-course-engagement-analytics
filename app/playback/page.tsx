'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DivergingBars from '@/components/charts/DivergingBars';
import { esc, PageHead, plural, Segmented, StatCard } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { lessonStats, playbackOrder } from '@/lib/model/lessons';
import { useStore } from '@/lib/store';
import type { Device } from '@/lib/types';

const DEVICES: Device[] = ['Android phone', 'iPhone', 'Desktop browser', 'Smart TV'];
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export default function PlaybackPage() {
  const router = useRouter();
  const { dataset, courseId } = useStore();
  const [dev, setDev] = useState<Device | 'All'>('All');

  const course = dataset?.courses.find(c => c.id === courseId);
  if (!dataset || !course) return <PageHead eyebrow="Course" title="Playback quality vs drop-off" insight="Loading the sample export…" />;

  const device = dev === 'All' ? undefined : dev;
  const stats = course.lessons.map(L => lessonStats(dataset, course.id, L.index, device));
  const byLid = new Map(course.lessons.map(L => [L.lid, L]));
  const buffer = stats.reduce((t, s) => t + s.exitsBuffer.length, 0);
  const exits = buffer + stats.reduce((t, s) => t + s.exitsClean.length, 0);
  const fix = stats.filter(s => s.status === 'Fix stream');
  const fixPct = CONFIG.lessons.fixStream.bufferExitPct;

  const views = dataset.views.filter(v => v.courseId === course.id);
  const D = DEVICES.map(d => {
    const vs = views.filter(v => v.device === d);
    const ex = vs.filter(v => v.end < CONFIG.finishedAt);
    return { d, views: vs.length, stall: pct(vs.filter(v => v.buffer !== null).length, vs.length), share: pct(ex.filter(v => v.bufferExit).length, ex.length), startup: vs.length ? vs.reduce((t, v) => t + v.startupSec, 0) / vs.length : 0 };
  }).filter(x => x.views);
  const worst = [...D].sort((a, b) => b.share - a.share)[0];

  const rows = playbackOrder(stats).map(s => {
    const L = byLid.get(s.lessonId)!;
    return {
      id: s.lessonId, label: `${L.n}. ${L.title}`, left: s.exitsBuffer.length, right: s.exitsClean.length, pct: s.bufferExitPct, strong: s.bufferExitPct >= fixPct,
      tip: `<b>${L.n}. ${esc(L.title)}</b><br>${plural(s.exitsBuffer.length, 'exit')} while buffering · ${s.exitsClean.length} on a clean stream<br>${s.bufferExitPct}% stream-related`,
    };
  });

  return (
    <>
      <PageHead
        eyebrow={`Course · ${course.name}`} title="Playback quality vs drop-off"
        insight={<><b>{pct(buffer, exits)}%</b> of early exits happened while the video was buffering.{' '}
          {fix.length
            ? <><b>{fix.map(s => byLid.get(s.lessonId)!.title).join(', ')}</b> {fix.length > 1 ? 'need' : 'needs'} a delivery fix, not a content fix.</>
            : 'No lesson is mainly a stream problem.'}</>}
        right={<Segmented value={dev} onChange={setDev} options={(['All', ...DEVICES] as (Device | 'All')[]).map(d => [d, d] as [Device | 'All', string])} />}
      />
      <div className="stats">
        <StatCard label="Early exits" value={exits} detail="views that ended before 97%" />
        <StatCard label="Left while buffering" value={`${pct(buffer, exits)}%`} detail={`${plural(buffer, 'exit')} had a stall just before`} tone="sky" />
        <StatCard label="Lessons to fix on delivery" value={fix.length} detail={`buffering explains ${fixPct}%+ of exits`} tone="sky" />
        <StatCard label="Worst device" value={worst?.d ?? '-'} detail={worst ? `${worst.share}% of its exits while buffering` : 'no views'} focus />
      </div>
      <div className="grid g-main">
        <div className="pn">
          <h3>Lesson or stream? Exits per lesson</h3>
          <div className="hint">Left of the line: learner left while the video was stalling. Right: left on a clean stream. Hover for numbers, click to open the lesson.</div>
          <DivergingBars rows={rows} onPick={lid => router.push(`/lessons/${encodeURIComponent(lid)}`)} />
        </div>
        <div className="pn">
          <h3>By device</h3>
          <div className="hint">Click a device to filter the whole page</div>
          <table className="t">
            <tbody>
              <tr><th>Device</th><th>Stalled</th><th>Buffer exits</th><th>Startup</th></tr>
              {D.map(x => (
                <tr key={x.d} className="hov" data-testid="device-row" aria-selected={dev === x.d}
                  style={{ cursor: 'pointer', ...(dev === x.d ? { background: 'var(--hover)' } : {}) }}
                  onClick={() => setDev(dev === x.d ? 'All' : x.d)}>
                  <td><b>{x.d}</b><br /><span className="c-sub" style={{ fontSize: 11 }}>{plural(x.views, 'view')}</span></td>
                  <td>{x.stall}%</td>
                  <td className={x.share >= fixPct ? 'c-sky' : ''}><b>{x.share}%</b></td>
                  <td>{x.startup.toFixed(1)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="note2" style={{ marginTop: 14 }}>
            An exit counts as <b>&quot;while buffering&quot;</b> when a <code className="mono">waiting</code> event comes just before the view ends with no <code className="mono">playing</code> in between.
          </div>
        </div>
      </div>
    </>
  );
}
