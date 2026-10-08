'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Calendar from '@/components/charts/Calendar';
import PlanLine, { gapDay } from '@/components/charts/PlanLine';
import { Chip, PageHead, plural, type Tone } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { asOf } from '@/lib/model/history';
import { ACTION_LABEL, useStore } from '@/lib/store';
import type { Band, Course, View } from '@/lib/types';

const DAY = 86_400_000;
const PART_TIP = 'Purple bar shows the part watched. Green ticks are rewatches. Blue dot is a stall.';
const PLAY_TIP = 'clean: no buffering. stalled: buffered but kept watching. left buffering: quit while buffering.';
const BAND_TONE: Record<Band, Tone> = { Ready: 'mint', Building: 'amber', 'At-risk': 'coral' };
const BAND_COL: Record<Band, string> = { Ready: '#12A46B', Building: '#D99A00', 'At-risk': '#E0245E' };
const PARTS = [['completion', 'Completion'], ['consistency', 'Consistency'], ['recency', 'Recency'], ['momentum', 'Momentum'], ['pace', 'Pace']] as const;
/** "an 8 min", "an 11 min", "an 18 min", "an 80 min"; "a" otherwise. */
const article = (n: number) => (/^8/.test(String(n)) || n === 11 || n === 18 ? 'an' : 'a');
const mmss = (sec: number) => { const s = Math.round(sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

function Session({ v, course, when, open, onToggle }: { v: View; course: Course; when: string; open: boolean; onToggle: () => void }) {
  const L = course.lessons[v.lesson];
  return (
    <div className={`sess${open ? ' open' : ''}`} data-testid="session-row">
      <div className="h" role="button" tabIndex={0} aria-expanded={open} onClick={onToggle} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}>
        <span className="c-sub">{when}</span>
        <span><b>{L.n}. {L.title}</b></span>
        <span>{mmss(v.watchSec)}</span>
        <span>
          <svg viewBox="0 0 200 14" style={{ width: '100%' }} preserveAspectRatio="none" aria-hidden>
            <rect x="0" y="5" width="200" height="4" rx="2" fill="#ECE8F1" />
            <rect x={v.start * 200} y="4" width={Math.max(2, (v.end - v.start) * 200)} height="6" rx="3" fill="#6D22CD" />
            {v.rewatches.map((p, i) => <rect key={i} x={p * 200 - 1} y="1" width="2.5" height="12" fill="#12A46B" />)}
            {v.buffer !== null && <circle cx={v.buffer * 200} cy="7" r="4" fill="#2F6BDB" />}
          </svg>
        </span>
        <span className="c-sub">{v.rewatches.length ? plural(v.rewatches.length, 'rewatch', 'rewatches') : '-'}</span>
        <span>{v.bufferExit ? <Chip tone="sky">left buffering</Chip> : v.buffer !== null ? <Chip tone="sky">stalled</Chip> : <Chip>clean</Chip>}</span>
        <span className="c-sub">▾</span>
      </div>
      <div className="b" data-testid="session-events">
        {open && (
          <div className="sp">
            <div className="sp-col">
              <h5>Playback events</h5>
              <div className="evlist">
                {v.events.map((e, i) => (
                  <div key={i} className="evrow" data-testid="event-row"><span className="t">{mmss(e.pt / 1000)}</span><span className="e">{e.e}</span></div>
                ))}
              </div>
            </div>
            <div className="sp-col">
              <h5>This session</h5>
              <div className="facts" data-testid="session-facts">
                <div className="fr"><span className="k">Watched</span><span className="v">{Math.round(v.start * 100)}% → {Math.round(v.end * 100)}% <small>of {article(L.durationMin)} {L.durationMin} min lesson</small></span></div>
                <div className="fr"><span className="k">Watch time</span><span className="v">{mmss(v.watchSec)} <small>pauses and buffering not counted</small></span></div>
                <div className="fr"><span className="k">Course</span><span className="v mono">{v.courseId}</span></div>
                <div className="fr"><span className="k">Lesson</span><span className="v mono">{v.lessonId}</span></div>
                <div className="fr"><span className="k">Student</span><span className="v mono">{v.studentId}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearnerPage() {
  const router = useRouter();
  const id = decodeURIComponent(useParams<{ studentId: string }>().studentId);
  const { dataset, courseId } = useStore();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const crumb = <div className="crumb"><Link href="/learners" style={{ textDecoration: 'none' }}>← Learners</Link> &nbsp;/&nbsp; {id}</div>;
  if (!dataset) return <>{crumb}<PageHead eyebrow="Course" title={`Learner ${id}`} insight="Loading the sample export…" /></>;
  const l = dataset.learners.find(x => x.studentId === id && x.courseId === courseId) ?? dataset.learners.find(x => x.studentId === id);
  const course = l && dataset.courses.find(c => c.id === l.courseId);
  if (!l || !course) return <>{crumb}<PageHead eyebrow="Learners" title={`Learner ${id}`} insight="This student ID is not in the loaded data." /></>;

  const dateOf = (ago: number) => new Date(dataset.today - ago * DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const N = course.lessons.length;
  const s = l.score;
  const hasTarget = l.daysLeft !== undefined;
  const prev = asOf(dataset, 7).learners.find(x => x.studentId === l.studentId && x.courseId === l.courseId);
  const verdict = l.health === 'Finished' ? 'has finished the course' : l.action ? l.action.reason.charAt(0).toLowerCase() + l.action.reason.slice(1) : 'is on track';

  const w = CONFIG.score.weights, scale = hasTarget ? 1 - CONFIG.score.paceWeight : 1;
  const weightOf = (k: string) => (k === 'pace' ? CONFIG.score.paceWeight : w[k as keyof typeof w] * scale);
  const tone = (p: number) => (p >= CONFIG.score.bands.ready / 100 ? '#12A46B' : p >= CONFIG.score.bands.building / 100 ? '#D99A00' : '#E0245E');

  const pace = s.parts.pace ?? 0;
  const mom = l.watchPrev14 ? Math.round((l.watch14 / l.watchPrev14 - 1) * 100) : null;
  const idleCls = l.idle > CONFIG.health.goneQuietAfterDays ? 'c-coral' : l.idle >= CONFIG.health.coolingFromDays ? 'c-amber' : '';

  const unfinished = course.lessons.filter((_, i) => l.maxPos[i] !== null && l.maxPos[i]! < CONFIG.finishedAt);
  const next = course.lessons.find((_, i) => l.maxPos[i] === null);

  const minutesByAgo = new Map<number, number>();
  for (const v of l.views) minutesByAgo.set(v.daysAgo, (minutesByAgo.get(v.daysAgo) ?? 0) + v.watchSec / 60);
  const total = course.lessons.reduce((t, L) => t + L.durationMin, 0);
  const cum: number[] = [];
  let acc = 0;
  for (let d = 0; d < l.enrolled; d++) { acc += minutesByAgo.get(l.enrolled - 1 - d) ?? 0; cum.push(Math.min(acc, total)); }
  const days = l.enrolled + (l.daysLeft ?? 0);
  const gap = hasTarget ? gapDay(cum, total, days) : null;

  const sessions = [...l.views].reverse();
  return (
    <>
      {crumb}
      <PageHead eyebrow={`Course · ${course.name}`} title={`Learner ${l.studentId}`} insight={`${l.studentId} ${verdict}.`} />
      <div className="grid g-learner">
        <div className="pn">
          <div className="who">
            <div className="ava"><svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} aria-hidden><circle cx="12" cy="8" r="4" fill="#fff" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#fff" /></svg></div>
            <div>
              <b style={{ fontSize: 15 }}>{l.studentId}</b>
              <div className="c-sub" style={{ fontSize: 11 }}>Student ID · custom_3</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span data-testid="learner-band" style={{ display: 'contents' }}><Chip tone={BAND_TONE[s.band]}>{s.band}</Chip></span>
                {prev && prev.score.band !== s.band && <Chip>was {prev.score.band} {dateOf(7)}</Chip>}
              </div>
            </div>
          </div>
          <div className="big4">
            {hasTarget
              ? <div><span>Target date in</span><b className={l.daysLeft! <= CONFIG.actions.tutorDaysLeft ? 'c-coral' : ''}>{l.daysLeft}d</b></div>
              : <div><span>Days idle</span><b className={idleCls}>{l.idle}d</b></div>}
            <div><span>Readiness</span><b data-testid="learner-score" style={{ color: BAND_COL[s.band] }}>{s.value}</b></div>
            {hasTarget
              ? <div><span>Pace</span><b className={pace < CONFIG.actions.tutorPaceBelow ? 'c-coral' : 'c-mint'}>{pace >= 1 ? 'On pace' : `-${Math.round((1 - pace) * 100)}%`}</b></div>
              : <div><span>Momentum</span><b className={mom === null ? '' : mom < 0 ? 'c-coral' : 'c-mint'}>{mom === null ? (l.watch14 ? 'New' : '-') : `${mom > 0 ? '+' : ''}${mom}%`}</b></div>}
            <div><span>Last watched</span><b className={idleCls}>{l.idle === 0 ? 'Today' : `${l.idle}d ago`}</b></div>
          </div>
          <div className="sec" style={{ marginTop: 0 }}>
            <h4>Score breakdown</h4>
            {PARTS.filter(([k]) => k !== 'pace' || hasTarget).map(([k, name]) => {
              const p = s.parts[k] ?? 0, wt = weightOf(k);
              return (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '84px 1fr 44px', gap: 8, alignItems: 'center', margin: '8px 0', fontSize: 12 }}>
                  <span className="c-sub">{name}</span>
                  <span className="pbar" style={{ width: '100%' }}><div style={{ width: `${Math.round(p * 100)}%`, background: tone(p) }} /></span>
                  <span style={{ textAlign: 'right' }}><b>{Math.round(p * wt * 100)}</b><span className="c-sub">/{Math.round(wt * 100)}</span></span>
                </div>
              );
            })}
          </div>
          <div className="kv" style={{ marginTop: 6 }}>
            <div>First view</div><div>{dateOf(l.enrolled - 1)}</div>
            {hasTarget && <><div>Target date</div><div>{dateOf(-l.daysLeft!)}</div></>}
            <div>Lessons done</div><div>{l.completed} / {N}</div>
            <div>Study days, last 2 weeks</div><div>{l.activeDays14}</div>
            <div>Main device</div><div>{l.device}</div>
          </div>
          <div className="sec">
            <h4>Unfinished lessons</h4>
            {unfinished.map(L => (
              <div key={L.lid} className="wk" onClick={() => router.push(`/lessons/${encodeURIComponent(L.lid)}`)}>
                <span>{L.n}. {L.title}</span>
                <span className="c-amber" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>stopped {Math.round(l.maxPos[L.index]! * 100)}%</span>
              </div>
            ))}
            {next && (
              <div className="wk" onClick={() => router.push(`/lessons/${encodeURIComponent(next.lid)}`)}>
                <span>{next.n}. {next.title}</span><span className="c-sub" style={{ whiteSpace: 'nowrap' }}>not started</span>
              </div>
            )}
            {!unfinished.length && !next && <div className="c-sub" style={{ fontSize: 12 }}>None. Every lesson is finished.</div>}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {hasTarget && (
            <div className="pn" style={{ marginBottom: 16 }}>
              <div className="pn-h">
                <div>
                  <h3>Watch time against the plan</h3>
                  <div className="hint">{gap !== null ? `The gap opened on ${dateOf(l.enrolled - 1 - gap)} (day ${gap + 1}) and has not closed.` : 'No lasting gap against the plan.'}</div>
                </div>
                <div className="ctl" style={{ gap: 16 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ display: 'inline-block', width: 16, height: 3, background: '#6D22CD', borderRadius: 2 }} />Actual</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginLeft: 18 }}><span style={{ display: 'inline-block', width: 16, borderTop: '2px dashed #A49DAF' }} />Plan</span>
                </div>
              </div>
              <PlanLine cum={cum} total={total} days={days} label={d => dateOf(l.enrolled - 1 - d)} targetLabel={`Target date · ${dateOf(-l.daysLeft!)}`} />
            </div>
          )}
          <div className="pn">
            <div className="pn-h">
              <div><h3>Study rhythm</h3><div className="hint">Each square is a day, columns are weeks. Brighter means more minutes watched. Pink is the current idle streak.</div></div>
              <div className="ctl">{l.idle} day idle streak</div>
            </div>
            <div style={{ overflowX: 'auto' }}><Calendar minutesByAgo={minutesByAgo} days={l.enrolled} idle={l.idle} label={dateOf} /></div>
          </div>
          <div className="pn" style={{ marginTop: 16 }}>
            <div className="pn-h"><div>
              <h3>Viewing sessions · {l.views.length}</h3>
              <div className="hint">Most recent first. Click a session to see the playback events FastPix captured.</div>
            </div></div>
            <div className="sess-scroll"><div className="sess-list">
            {sessions.length > 0 && (
              <div className="sess-head" data-testid="session-head">
                <span>Date</span><span>Lesson</span><span>Watched</span>
                <span className="tip-h" tabIndex={0} data-tip={PART_TIP}>Part of video</span>
                <span>Rewatches</span>
                <span className="tip-h" tabIndex={0} data-tip={PLAY_TIP}>Playback</span>
                <span aria-hidden />
              </div>
            )}
            {sessions.slice(0, 12).map((v, k) => <Session key={k} v={v} course={course} when={v.daysAgo === 0 ? 'Today' : dateOf(v.daysAgo)} open={openIdx === k} onToggle={() => setOpenIdx(openIdx === k ? null : k)} />)}
            </div></div>
            {sessions.length > 12 && <div className="c-sub" style={{ fontSize: 11.5, padding: '6px 2px' }}>+ {sessions.length - 12} older sessions</div>}
            {!sessions.length && <div className="c-sub">No sessions yet.</div>}
          </div>
          <div className="cmd" data-testid="next-step">
            <div className="tx">
              <small>Suggested next step{l.action && ` · ${ACTION_LABEL[l.action.kind]}`}</small>
              {l.action ? l.action.reason + '.' : l.health === 'Finished' ? 'Finished the course. No action needed.' : 'On track. No action needed.'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
