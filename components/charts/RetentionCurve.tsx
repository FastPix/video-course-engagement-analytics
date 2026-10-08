'use client';
// Audience retention from reference/prototype-v3.html (S17): curve, exit dots, rewatch bars and a hover readout.
import { useRef, useState } from 'react';
import type { LessonStats } from '@/lib/types';

const mmss = (sec: number) => { const s = Math.round(sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export default function RetentionCurve({ s, durationMin }: { s: LessonStats; durationMin: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [f, setF] = useState<number | null>(null);
  const W = 760, H = 300, PL = 40, PW = W - PL - 12, PH = 180, RB = PH + 28;
  const X = (x: number) => PL + PW * x;
  const Y = (v: number) => 12 + PH * (1 - v / 100);
  const mr = Math.max(1, ...s.rewatchBins20);
  const curve = s.retention.map((v, k) => `${X(k / 50)},${Y(v)}`);
  const k = f === null ? 0 : Math.round(f * 50);
  const near = (x: number) => f !== null && Math.abs(x - f) < 0.05;

  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    setF(Math.max(0, Math.min(1, (((e.clientX - r.left) / r.width) * W - PL) / PW)));
  };

  return (
    <>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="hoverchart" data-testid="retention-chart">
        <defs>
          <linearGradient id="rg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#6D22CD" stopOpacity=".4" /><stop offset="1" stopColor="#6D22CD" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={PL} x2={W - 12} y1={Y(v)} y2={Y(v)} stroke="#EEEAF3" />
            <text className="ax" x={PL - 8} y={Y(v) + 4} textAnchor="end">{v}%</text>
          </g>
        ))}
        <path d={`M${X(0)},${Y(0)} L${curve.join(' L')} L${X(1)},${Y(0)} Z`} fill="url(#rg)" />
        <polyline points={curve.join(' ')} fill="none" stroke="#6D22CD" strokeWidth="2.5" />
        {s.exitsClean.map((p, i) => <circle key={`c${i}`} cx={X(p)} cy={Y(0) - 5 - (i % 4) * 4} r="2.5" fill="#A49DAF" />)}
        {s.exitsBuffer.map((p, i) => <circle key={`b${i}`} cx={X(p)} cy={Y(0) - 5 - (i % 4) * 4} r="3" fill="#2F6BDB" />)}
        {s.rewatchBins20.map((v, i) => <rect key={i} x={X(i / 20) + 2} y={RB + 50 - (50 * v) / mr} width={PW / 20 - 4} height={(50 * v) / mr + 1} rx="2" fill="#12A46B" fillOpacity=".8" />)}
        <text className="ax" x={PL - 8} y={RB + 30} textAnchor="end">rewatch</text>
        {[0, 0.25, 0.5, 0.75, 1].map(x => <text key={x} className="ax" x={X(x)} y={H - 2} textAnchor="middle">{mmss(x * durationMin * 60)}</text>)}
        {f !== null && <>
          <line x1={X(k / 50)} x2={X(k / 50)} y1="12" y2={RB + 50} stroke="#1C1A22" strokeOpacity=".5" strokeDasharray="3 3" />
          <circle cx={X(k / 50)} cy={Y(s.retention[k])} r="5" fill="#6D22CD" stroke="#FFFFFF" strokeWidth="2" />
        </>}
        <rect x={PL} y="12" width={PW} height={RB + 38} fill="transparent" onMouseMove={move} onMouseLeave={() => setF(null)} />
      </svg>
      <div className="note2" style={{ marginTop: 10 }}>
        {f === null ? 'Hover the chart to inspect a moment in the video.' : <>
          At <b>{mmss(f * durationMin * 60)}</b> ({Math.round(f * 100)}% through) <b>{s.retention[k]}%</b> of learners are still watching.{' '}
          {s.rewatchBins20[Math.min(19, Math.floor(f * 20))]} rewatch events here. Exits nearby:{' '}
          <b className="c-sky">{s.exitsBuffer.filter(near).length} while buffering</b>, <b>{s.exitsClean.filter(near).length} on a clean stream</b>.
        </>}
      </div>
    </>
  );
}
