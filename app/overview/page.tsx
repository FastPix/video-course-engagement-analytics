'use client';
import { useRouter } from 'next/navigation';
import Line from '@/components/charts/Line';
import StackedColumns from '@/components/charts/StackedColumns';
import { Chip, esc, PageHead, StatCard, STATUS_COL, STATUS_TONE } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { asOf } from '@/lib/model/history';
import { lessonStats } from '@/lib/model/lessons';
import { NO_FILTERS, useStore } from '@/lib/store';
import type { Health } from '@/lib/types';

const DAY = 86_400_000;
const WEEKS = 8;
const HEALTH: Health[] = ['Active', 'Cooling', 'Gone quiet', 'Finished'];
const HEALTH_COL: Record<Health, string> = { Active: '#12A46B', Cooling: '#D99A00', 'Gone quiet': '#E0245E', Finished: '#6D22CD' };

function delta(now: number, prev: number, badUp: boolean) {
  const d = now - prev;
  if (!d) return <span>no change vs last week</span>;
  return <><span className={(d > 0) === badUp ? 'up' : 'dn'}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}</span> vs last week</>;
}

export default function OverviewPage() {
  const router = useRouter();
  const { dataset, courseId, setLearnerFilters } = useStore();
  const course = dataset?.courses.find(c => c.id === courseId);
  if (!dataset || !course) return <PageHead eyebrow="Course" title="Course overview" insight="Loading the sample export…" />;

  const dateOf = (ago: number) => new Date(dataset.today - ago * DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const mine = <T extends { courseId: string }>(xs: T[]) => xs.filter(x => x.courseId === course.id);
  const ls = mine(dataset.learners);
  const prev = mine(asOf(dataset, 7).learners);
  const cnt = (h: Health, xs = ls) => xs.filter(l => l.health === h).length;

  // Oldest week first, "now" last.
  const weeks = Array.from({ length: WEEKS }, (_, i) => WEEKS - 1 - i);
  const health = weeks.map(w => {
    const xs = mine(asOf(dataset, w * 7).learners);
    const v = HEALTH.map(h => cnt(h, xs));
    return { label: w ? dateOf(w * 7) : 'Now', values: v, tip: `<b>${w ? `Week ending ${dateOf(w * 7)}` : 'This week'}</b><br>Active ${v[0]} · Cooling ${v[1]}<br>Gone quiet ${v[2]} · Finished ${v[3]}` };
  });
  const views = mine(dataset.views);
  const watch = weeks.map(w => views.filter(v => Math.floor(v.daysAgo / 7) === w).reduce((s, v) => s + v.watchSec, 0) / 3600);
  const [thisWeek, lastWeek] = [watch[WEEKS - 1], watch[WEEKS - 2]];
  const change = lastWeek ? Math.round((thisWeek / lastWeek - 1) * 100) : null;

  const stats = course.lessons.map(L => ({ L, s: lessonStats(dataset, course.id, L.index) }));
  const attention = stats.filter(x => x.s.status !== 'Healthy').sort((a, b) => b.s.earlyPct + b.s.bufferExitPct - (a.s.earlyPct + a.s.bufferExitPct)).slice(0, 4);
  const stuck = course.lessons.map((_, i) => ls.filter(l => l.completed === i && l.health !== 'Active' && l.health !== 'Finished').length);
  const k = stuck.indexOf(Math.max(...stuck));
  const tutor = ls.filter(l => l.action?.kind === 'tutor_call').length;
  const openLesson = (lid: string) => router.push(`/lessons/${encodeURIComponent(lid)}`);
  const { coolingFromDays: cool, goneQuietAfterDays: quiet } = CONFIG.health;

  const RW = 560, RH = 24, LW = 200;
  return (
    <>
      <PageHead
        eyebrow={`Course · ${course.name}`} title="Course overview"
        insight={stuck[k] > 0
          ? <><b>{cnt('Gone quiet')} of {ls.length}</b> learners have gone quiet. The biggest pile-up is in <b>lesson {k + 1}, {course.lessons[k].title}</b>.</>
          : <><b>{cnt('Gone quiet')} of {ls.length}</b> learners have gone quiet. No lesson has a pile-up.</>}
      />
      <div className="stats">
        <StatCard testId="stat-active" label="Active" value={cnt('Active')} tone="mint" detail={delta(cnt('Active'), cnt('Active', prev), false)} />
        <StatCard testId="stat-cooling" label={`Cooling · ${cool} to ${quiet} days idle`} value={cnt('Cooling')} tone="amber" detail={delta(cnt('Cooling'), cnt('Cooling', prev), true)} />
        <StatCard testId="stat-quiet" label={`Gone quiet · ${quiet}+ days idle`} value={cnt('Gone quiet')} tone="coral" detail={delta(cnt('Gone quiet'), cnt('Gone quiet', prev), true)} />
        <StatCard testId="stat-watch" label="Watch time this week" value={`${thisWeek.toFixed(1)} h`} focus
          detail={change === null ? 'no watching last week' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs last week`} />
      </div>
      <div className="grid g-main">
        <div className="pn">
          <div className="pn-h">
            <div><h3>Learner health, last 8 weeks</h3><div className="hint">Every learner&apos;s state at the end of each week, rebuilt from their viewing history. Hover a column.</div></div>
            <div className="ctl">
              {HEALTH.map(h => <span key={h} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: HEALTH_COL[h] }} />{h}</span>)}
            </div>
          </div>
          <StackedColumns columns={health} colors={HEALTH.map(h => HEALTH_COL[h])} />
        </div>
        <div className="pn">
          <h3>Needs attention</h3>
          <div className="hint">Generated from this course&apos;s data</div>
          {attention.map(({ L, s }) => (
            <div key={L.lid} className="qrow" data-testid="attention-row" onClick={() => openLesson(L.lid)}>
              <span style={{ minWidth: 86 }}><Chip tone={STATUS_TONE[s.status]}>{s.status}</Chip></span>
              <span className="t"><b>{L.n}. {L.title}</b><br />
                <span className="c-sub" style={{ fontSize: 11.5 }}>{s.status === 'Fix stream' ? `${s.bufferExitPct}% of exits while buffering` : `${s.earlyPct}% leave early · ${s.finishedPct}% finish`}</span>
              </span>
              <span className="ar">→</span>
            </div>
          ))}
          {!attention.length && <div className="c-sub" style={{ fontSize: 12, margin: '6px 0 12px' }}>Every lesson looks healthy.</div>}
          <div className="qrow" onClick={() => { setLearnerFilters({ ...NO_FILTERS, action: ['tutor_call'] }); router.push('/learners'); }}>
            <span className="n c-coral">{tutor}</span><span className="t">{tutor === 1 ? 'learner needs' : 'learners need'} a tutor call this week</span><span className="ar">→</span>
          </div>
        </div>
      </div>
      <div className="grid g-2" style={{ marginTop: 16 }}>
        <div className="pn">
          <h3>How far learners get</h3>
          <div className="hint">Learners who started each lesson, coloured by the lesson&apos;s status. Click a bar to open the lesson.</div>
          <svg viewBox={`0 0 ${RW} ${course.lessons.length * RH + 4}`}>
            {stats.map(({ L, s }, i) => {
              const y = i * RH, w = ((RW - LW - 40) * s.started) / Math.max(1, ls.length);
              const t = L.title.length > 26 ? L.title.slice(0, 25) + '…' : L.title;
              return (
                <g key={L.lid} style={{ cursor: 'pointer' }} data-testid="reach-bar" onClick={() => openLesson(L.lid)}>
                  <rect x="0" y={y} width={RW} height={RH} fill="transparent" data-tip={`<b>${L.n}. ${esc(L.title)}</b><br>${s.started} started · ${s.finishedPct}% finished<br>${s.status}`} />
                  <text x={LW - 8} y={y + 16} textAnchor="end" style={{ fontSize: 11.5, fill: '#6B6575', pointerEvents: 'none' }}>{L.n}. {t}</text>
                  <rect x={LW} y={y + 5} width={w} height="14" rx="4" fill={STATUS_COL[s.status]} fillOpacity=".8" pointerEvents="none" />
                  <text className="ax" x={LW + w + 6} y={y + 16} pointerEvents="none">{s.started}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="pn">
          <h3>Actual watch time per week</h3>
          <div className="hint">Hours of video really played across the course. Hover a week.</div>
          <Line points={weeks.map((w, i) => ({ label: w ? dateOf(w * 7) : 'Now', value: watch[i], tip: `<b>${w ? `Week ending ${dateOf(w * 7)}` : 'This week'}</b><br>${watch[i].toFixed(1)} hours watched` }))} />
        </div>
      </div>
    </>
  );
}
