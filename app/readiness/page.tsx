'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Scatter from '@/components/charts/Scatter';
import { esc, InfoIcon, PageHead, plural, Slider, StatCard } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import { asOf } from '@/lib/model/history';
import { useStore } from '@/lib/store';
import type { Band, Learner } from '@/lib/types';

const BANDS: Band[] = ['Ready', 'Building', 'At-risk'];
const COL: Record<Band, string> = { Ready: '#12A46B', Building: '#D99A00', 'At-risk': '#E0245E' };
const TONE = { Ready: 'mint', Building: 'amber', 'At-risk': 'coral' } as const;
const TEST: Record<Band, string> = { Ready: 'stat-ready', Building: 'stat-building', 'At-risk': 'stat-atrisk' };

const PARTS: [string, keyof typeof CONFIG.score.weights | 'pace', string][] = [
  ['Completion', 'completion', 'How much of the course they have watched'],
  ['Consistency', 'consistency', 'How many days they studied in the last 2 weeks'],
  ['Recency', 'recency', 'How recently they last watched'],
  ['Momentum', 'momentum', 'Whether their watch time is going up or down'],
  ['Pace', 'pace', 'Whether they will finish before their target date'],
];

function delta(now: number, prev: number, badUp: boolean) {
  const d = now - prev;
  if (!d) return <span>no change vs last week</span>;
  return <><span className={(d > 0) === badUp ? 'up' : 'dn'}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}</span> vs last week</>;
}

export default function ReadinessPage() {
  const router = useRouter();
  const { dataset, courseId } = useStore();
  const [days, setDays] = useState(21);
  const [score, setScore] = useState(50);
  const [hl, setHl] = useState<Band | null>(null);

  const course = dataset?.courses.find(c => c.id === courseId);
  if (!dataset || !course) return <PageHead eyebrow="Course" title="Readiness" insight="Loading the sample export…" />;

  const hasTarget = !!course.targetDate;
  const ls = dataset.learners.filter(l => l.courseId === course.id);
  const prev = new Map(asOf(dataset, 7).learners.filter(l => l.courseId === course.id).map(l => [l.studentId, l]));
  const cnt = (b: Band) => ls.filter(l => l.score.band === b).length;
  const prevCnt = (b: Band) => [...prev.values()].filter(l => l.score.band === b).length;

  const x = (l: Learner) => (hasTarget ? l.daysLeft ?? 0 : l.idle);
  const inZone = (l: Learner) => l.health !== 'Finished' && l.score.value < score && (hasTarget ? x(l) <= days : x(l) >= days);
  const box = ls.filter(inZone).sort((a, b) => a.score.value - b.score.value);

  const crossed = ls.filter(l => l.score.band === 'At-risk' && prev.has(l.studentId) && prev.get(l.studentId)!.score.band !== 'At-risk');
  const recov = ls.filter(l => l.score.band !== 'At-risk' && prev.get(l.studentId)?.score.band === 'At-risk');
  const N = course.lessons.length;
  const when = (l: Learner) => (hasTarget ? `target date in ${l.daysLeft}d · idle ${l.idle}d` : `idle ${l.idle}d`);
  const open = (id: string) => router.push(`/learners/${encodeURIComponent(id)}`);

  const w = CONFIG.score.weights, scale = hasTarget ? 1 - CONFIG.score.paceWeight : 1;
  const weight = (k: string) => Math.round(100 * (k === 'pace' ? CONFIG.score.paceWeight : w[k as keyof typeof w] * scale));
  const zoneText = hasTarget ? `within ${days} days · under ${score}` : `idle ${days}+ days · under ${score}`;

  const dots = ls.filter(l => l.health !== 'Finished').map(l => ({
    id: l.studentId,
    days: x(l),
    score: l.score.value,
    color: COL[l.score.band],
    dim: !!hl && hl !== l.score.band,
    tip: `<b>${esc(l.studentId)}</b> · ${l.score.band}<br>Readiness ${l.score.value} · ${hasTarget ? `target date in ${l.daysLeft}d` : `last watched ${l.idle}d ago`}<br>Lesson ${Math.min(l.completed + 1, N)} of ${N}`,
  }));

  return (
    <>
      <PageHead eyebrow={`Course · ${course.name}`} title="Readiness" insight={<><b>{plural(box.length, 'learner')}</b> {box.length === 1 ? 'is' : 'are'} in the focus zone. Start with them.</>} />
      <div className="stats">
        {BANDS.map(b => <StatCard key={b} testId={TEST[b]} label={b} value={cnt(b)} tone={TONE[b]} detail={delta(cnt(b), prevCnt(b), b !== 'Ready')} />)}
        <StatCard testId="stat-focus" label="Focus zone this week" value={box.length} detail={zoneText} focus />
      </div>
      <div className="grid g-main">
        <div className="pn">
          <div className="pn-h"><div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Readiness against time left
              <InfoIcon tip={`<b>What is readiness?</b><br>A score from 0 to 100 that shows how well a learner is keeping up with the course. It is worked out from their viewing data.<br><br><b>${CONFIG.score.bands.ready} and above</b> Ready<br><b>${CONFIG.score.bands.building} to ${CONFIG.score.bands.ready - 1}</b> Building<br><b>Under ${CONFIG.score.bands.building}</b> At-risk`} />
            </h3>
            <div className="hint">Each dot is one learner. Higher up means more ready. Further right means more urgent. Hover a dot for detail, click to open the learner.</div>
          </div></div>
          <div className="zone">
            <div className="zt"><b>Focus zone</b><span className="c-sub">Learners inside the purple box need help first.</span></div>
            <Slider testId="zone-days" label={hasTarget ? 'Target date within' : 'Idle for at least'} min={7} max={45} value={days} onChange={setDays} format={v => `${v} days`} />
            <Slider testId="zone-score" label="Readiness below" min={30} max={70} value={score} onChange={setScore} />
          </div>
          <Scatter dots={dots} urgentHigh={!hasTarget} boxDays={days} boxScore={score} boxCount={box.length} xLabel={hasTarget ? 'Days until target date →' : 'Days since last watched →'} onPick={open} />
          <div className="rexp">
            <span className="c-sub" style={{ fontWeight: 600 }}>Readiness is made of</span>
            {PARTS.filter(([, k]) => k !== 'pace' || hasTarget).map(([n, k, d]) => (
              <span key={k} className="rchip" data-tip={`<b>${n} · ${weight(k)}%</b><br>${d}`}>{n} <b>{weight(k)}%</b></span>
            ))}
          </div>
        </div>

        <div className="pn">
          <h3>Band mix</h3>
          <div className="hint">Click a band to isolate it on the chart</div>
          <div className="mix">
            {BANDS.map(b => <div key={b} onClick={() => setHl(hl === b ? null : b)} style={{ flex: cnt(b), background: COL[b], opacity: hl && hl !== b ? 0.25 : 1 }} />)}
          </div>
          <div className="mixl">
            {BANDS.map(b => (
              <button key={b} type="button" className={hl === b ? 'on' : ''} aria-pressed={hl === b} onClick={() => setHl(hl === b ? null : b)}>
                <b style={{ color: COL[b] }}>{cnt(b)}</b><span>{b}</span>
              </button>
            ))}
          </div>
          <div className="sec">
            <h4>Since last week</h4>
            <div className="mv"><i style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>▲</i><span><b>{plural(crossed.length, 'learner')}</b> slipped into At-risk, {crossed.filter(l => l.idle >= CONFIG.health.coolingFromDays).length} by going idle for {CONFIG.health.coolingFromDays}+ days</span></div>
            <div className="mv"><i style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>▼</i><span><b>{plural(recov.length, 'learner')}</b> climbed out of At-risk</span></div>
          </div>
          <div className="sec">
            <h4>In the focus zone</h4>
            <div style={{ maxHeight: 260, overflow: 'auto' }} data-testid="zone-list">
              {box.map(l => (
                <div key={l.studentId} className="stuck" data-testid="zone-row" onClick={() => open(l.studentId)}>
                  <span><b>{l.studentId}</b><br /><span className="c-sub" style={{ fontSize: 11.5 }}>{when(l)}</span></span>
                  <b className="c-coral">{l.score.value}</b>
                </div>
              ))}
              {!box.length && <div className="c-sub">Nobody in the zone.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
