'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import RetentionCurve from '@/components/charts/RetentionCurve';
import { Chip, PageHead, plural, Segmented, StatCard, STATUS_TONE, type Tone } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { lessonStats } from '@/lib/model/lessons';
import { useStore } from '@/lib/store';
import type { Device, Health } from '@/lib/types';

const DEVICES: [Device | 'All', string][] = [['All', 'All'], ['Android phone', 'Android'], ['iPhone', 'iPhone'], ['Desktop browser', 'Desktop'], ['Smart TV', 'TV']];
const HEALTH_TONE: Record<Health, Tone> = { Active: 'mint', Cooling: 'amber', 'Gone quiet': 'coral', Finished: 'accent' };
const legend = (bg: string, label: string, round = false, w = 9, h = 9) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: w, height: h, borderRadius: round ? '50%' : 2, background: bg }} />{label}</span>
);

export default function LessonPage() {
  const router = useRouter();
  const lid = decodeURIComponent(useParams<{ lessonId: string }>().lessonId);
  const { dataset, courseId } = useStore();
  const [dev, setDev] = useState<Device | 'All'>('All');

  const crumb = (label: string) => <div className="crumb"><Link href="/lessons" style={{ textDecoration: 'none' }}>← Lessons</Link> &nbsp;/&nbsp; {label}</div>;
  if (!dataset) return <>{crumb(lid)}<PageHead eyebrow="Course" title="Lesson" insight="Loading the sample export…" /></>;
  const course = dataset.courses.find(c => c.id === courseId && c.lessons.some(L => L.lid === lid)) ?? dataset.courses.find(c => c.lessons.some(L => L.lid === lid));
  const L = course?.lessons.find(x => x.lid === lid);
  if (!course || !L) return <>{crumb(lid)}<PageHead eyebrow="Lessons" title="Lesson" insight="This lesson ID is not in the loaded data." /></>;

  const device = dev === 'All' ? undefined : dev;
  const s = lessonStats(dataset, course.id, L.index, device);
  const prev = course.lessons[L.index - 1], next = course.lessons[L.index + 1];
  const go = (id: string) => router.push(`/lessons/${encodeURIComponent(id)}`);
  const stuck = dataset.learners
    .filter(l => l.courseId === course.id && (!device || l.device === device) && l.maxPos[L.index] !== null && l.maxPos[L.index]! < CONFIG.finishedAt)
    .sort((a, b) => b.idle - a.idle);
  const byDevice = DEVICES.slice(1).map(([d, label]) => ({ d: d as Device, label, s: lessonStats(dataset, course.id, L.index, d as Device) })).filter(x => x.s.started > 0);

  return (
    <>
      {crumb(`Lesson ${L.n}`)}
      <PageHead
        eyebrow={`Course · ${course.name}`} title={`${L.n}. ${L.title}`}
        insight={<><Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip>&nbsp; {s.reason}</>}
        right={
          <div className="picker">
            <button type="button" className="btn ghost" disabled={!prev} onClick={() => prev && go(prev.lid)}>← Lesson {L.n - 1 || ''}</button>
            <button type="button" className="btn ghost" disabled={!next} onClick={() => next && go(next.lid)}>Lesson {next ? L.n + 1 : ''} →</button>
          </div>
        }
      />
      <div className="stats">
        <StatCard testId="stat-started" label="Started" value={s.started} detail={`${plural(s.views, 'view')} · ${L.size} · ${L.durationMin} min`} />
        <StatCard testId="stat-finished" label="Finished" value={`${s.finishedPct}%`} detail="reached the end eventually" />
        <StatCard testId="stat-early" label="Left before 30%" value={`${s.earlyPct}%`} detail="on their first view" tone={s.earlyPct >= CONFIG.lessons.rewrite.earlyPctWithLowFinish ? 'coral' : undefined} />
        <StatCard testId="stat-notfinished" label="Not finished" value={`${100 - s.finishedPct}%`} detail="started but never reached the end" focus />
      </div>
      <div className="grid g-main">
        <div className="pn">
          <div className="pn-h">
            <div><h3>Audience retention, first view</h3><div className="hint">Share of learners still watching at each point. Move along the curve to read it.</div></div>
            <div data-testid="device-filter"><Segmented value={dev} onChange={setDev} options={DEVICES} /></div>
          </div>
          {s.started ? <RetentionCurve s={s} durationMin={L.durationMin} /> : <div className="c-sub" style={{ padding: '40px 0', textAlign: 'center' }}>No views on this device.</div>}
          <div className="ctl" style={{ marginTop: 10, gap: 16 }}>
            {legend('#6D22CD', 'Still watching', false, 14, 3)}{legend('#12A46B', 'Rewatch events')}{legend('#2F6BDB', 'Left while buffering', true, 8, 8)}{legend('#A49DAF', 'Left on clean stream', true, 8, 8)}
          </div>
        </div>
        <div className="pn">
          <h3>Learners stuck here</h3>
          <div className="hint">Started but not finished, longest idle first. Click to open.</div>
          <div style={{ maxHeight: 430, overflow: 'auto' }}>
            {stuck.slice(0, 30).map(l => (
              <div key={l.studentId} className="stuck" data-testid="stuck-row" onClick={() => router.push(`/learners/${encodeURIComponent(l.studentId)}`)}>
                <span><b>{l.studentId}</b><br /><span className="c-sub" style={{ fontSize: 11.5 }}>stopped at {Math.round(l.maxPos[L.index]! * 100)}% · {l.device}</span></span>
                <span style={{ textAlign: 'right' }}><Chip tone={HEALTH_TONE[l.health]}>{l.idle}d idle</Chip></span>
              </div>
            ))}
            {!stuck.length && <div className="c-sub" style={{ padding: '20px 0' }}>Nobody stuck here.</div>}
          </div>
        </div>
      </div>
      <div className="grid g-2" style={{ marginTop: 16 }}>
        <div className="pn">
          <h3>Finish rate by device</h3>
          <div className="hint">Share of starters on each device who reached the end. Click a device to filter the page.</div>
          <div style={{ marginTop: 12 }}>
            {byDevice.map(x => (
              <div key={x.d} className="wk" onClick={() => setDev(dev === x.d ? 'All' : x.d)} style={dev === x.d ? { color: 'var(--brand)', fontWeight: 700 } : undefined}>
                <span style={{ minWidth: 80 }}>{x.label}</span>
                <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pbar" style={{ width: '100%' }}><div style={{ width: `${x.s.finishedPct}%`, background: '#6D22CD' }} /></span>
                </span>
                <b style={{ minWidth: 40, textAlign: 'right' }}>{x.s.finishedPct}%</b>
                <span className="c-sub" style={{ minWidth: 70, textAlign: 'right' }}>{x.s.started} started</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pn">
          <h3>Playback on this lesson</h3>
          <div className="hint">Was the stream part of the problem?</div>
          <div className="big4">
            <div><span>Views with a stall</span><b>{s.stallPct}%</b></div>
            <div><span>Exits while buffering</span><b className={s.bufferExitPct >= CONFIG.lessons.fixStream.bufferExitPct ? 'c-sky' : ''}>{s.bufferExitPct}%</b></div>
            <div><span>Avg startup</span><b>{s.avgStartupSec.toFixed(1)}s</b></div>
            <div><span>Rewatch events</span><b>{s.rewatches}</b></div>
          </div>
          <button type="button" className="btn" style={{ width: '100%' }} onClick={() => router.push('/playback')}>See playback quality for all lessons →</button>
        </div>
      </div>
    </>
  );
}
