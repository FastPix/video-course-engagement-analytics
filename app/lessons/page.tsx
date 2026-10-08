'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Heatmap, { heat } from '@/components/charts/Heatmap';
import { Chip, PageHead, plural, Segmented, STATUS_TONE } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { lessonStats } from '@/lib/model/lessons';
import { useStore } from '@/lib/store';
import type { LessonStats } from '@/lib/types';

type SortKey = 'notfinished' | 'early' | 'rewatch';
const SORT: Record<SortKey, (s: LessonStats) => number> = {
  notfinished: s => 100 - s.finishedPct,
  early: s => s.earlyPct,
  rewatch: s => s.rewatchPerStarter,
};

export default function LessonsPage() {
  const router = useRouter();
  const { dataset, courseId } = useStore();
  const [sort, setSort] = useState<SortKey>('notfinished');
  const [picked, setPicked] = useState<string | null>(null);

  const course = dataset?.courses.find(c => c.id === courseId);
  if (!dataset || !course) return <PageHead eyebrow="Course" title="Lessons" insight="Loading the sample export…" />;

  const all = course.lessons.map(L => ({ L, s: lessonStats(dataset, course.id, L.index) }));
  const rows = [...all].sort((a, b) => SORT[sort](b.s) - SORT[sort](a.s));
  const flagged = all.filter(x => x.s.status !== 'Healthy');
  const top = [...flagged].sort((a, b) => b.s.earlyPct + b.s.bufferExitPct - (a.s.earlyPct + a.s.bufferExitPct))[0];
  const sel = all.find(x => x.L.lid === picked) ?? rows.find(x => x.s.status !== 'Healthy') ?? rows[0];
  const open = (lid: string) => router.push(`/lessons/${encodeURIComponent(lid)}`);
  const notFinished = 100 - sel.s.finishedPct;

  return (
    <>
      <PageHead
        eyebrow={`Course · ${course.name}`} title="Lessons"
        insight={<><b>{flagged.length} of {plural(course.lessons.length, 'lesson')}</b> {flagged.length === 1 ? 'needs' : 'need'} attention.{top && <> Biggest issue: <b>{top.L.title}</b>.</>}</>}
        right={<Segmented value={sort} onChange={setSort} options={[['notfinished', 'Not finished'], ['early', 'Early exits'], ['rewatch', 'Rewatches']]} />}
      />
      <div className="grid g-main">
        <div className="pn">
          <div className="pn-h"><div>
            <h3>Rewatch density across each lesson</h3>
            <div className="hint">Columns are 10% slices of the video. Brighter means more learners went back to that part. Hover a cell, click a lesson to preview it, double-click to open it.</div>
          </div></div>
          <div style={{ overflowX: 'auto' }}>
            <Heatmap rows={rows} selected={sel.L.lid} onSelect={setPicked} onOpen={open} />
          </div>
          <div className="ctl" style={{ marginTop: 10 }}>
            Rewatch density {[0, 0.25, 0.5, 0.75, 1].map(v => <span key={v} style={{ display: 'inline-block', width: 24, height: 10, borderRadius: 3, background: heat(v || 0.05) }} />)} low → high
          </div>
        </div>
        <div className="pn" data-testid="lesson-preview">
          <div className="eyebrow" style={{ marginBottom: 4 }}>Lesson {sel.L.n} · {sel.L.size} · {sel.L.durationMin} min</div>
          <h3 style={{ fontSize: 16 }}>{sel.L.title}</h3>
          <div className="big4">
            <div><span>Started</span><b data-testid="preview-started">{sel.s.started}</b></div>
            <div><span>Finished</span><b data-testid="preview-finished">{sel.s.finishedPct}%</b></div>
            <div><span>Not finished</span><b data-testid="preview-notfinished" className={notFinished >= CONFIG.lessons.highlightPct ? 'c-coral' : ''}>{notFinished}%</b></div>
            <div><span>Exits while buffering</span><b data-testid="preview-buffer" className={sel.s.bufferExitPct >= CONFIG.lessons.fixStream.bufferExitPct ? 'c-sky' : ''}>{sel.s.bufferExitPct}%</b></div>
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 14 }}><Chip tone={STATUS_TONE[sel.s.status]}>{sel.s.status}</Chip>&nbsp; {sel.s.reason}</div>
          <button type="button" className="btn pri" data-testid="open-lesson" style={{ width: '100%' }} onClick={() => open(sel.L.lid)}>Open lesson detail →</button>
          <div className="sec">
            <h4>Reading the matrix</h4>
            <div className="mv"><i style={{ background: 'rgb(52,12,110)' }} /><span><b>Bright, few exits:</b> hard concept, lesson holds. Add a worked example.</span></div>
            <div className="mv"><i style={{ background: '#F4F1F8', border: '1px solid var(--line)' }} /><span><b>Dark, many early exits:</b> learners give up early. Content defect.</span></div>
            <div className="mv"><i style={{ background: 'linear-gradient(90deg,#F4F1F8,rgb(52,12,110))' }} /><span><b>Bright at the end:</b> the key step lands late. Re-cut.</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
