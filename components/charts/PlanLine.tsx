'use client';
// "Watch time against the plan" from reference/prototype-v3.html (S14). Shown only when the course has a target date.
import { CONFIG } from '@/lib/config';

/**
 * cum[d] = minutes watched by the end of day d since enrolment (d = 0 .. enrolled-1).
 * The plan is a straight line from 0 at enrolment to `total` minutes on the target date (day `days`).
 */
export function gapDay(cum: number[], total: number, days: number): number | null {
  const plan = (d: number) => (total * d) / days;
  for (let d = 1; d < cum.length; d++) if (cum.slice(d).every((v, k) => v < CONFIG.actions.tutorPaceBelow * plan(d + k))) return d;
  return null;
}

export default function PlanLine({ cum, total, days, label, targetLabel }: { cum: number[]; total: number; days: number; label: (d: number) => string; targetLabel: string }) {
  const W = 760, H = 230, PL = 42, PW = W - PL - 10, PH = 186;
  const X = (d: number) => PL + (PW * d) / days;
  const Y = (m: number) => 10 + PH * (1 - m / total);
  const now = cum.length;
  const last = cum[now - 1] ?? 0;
  const behind = Math.round((1 - last / ((total * now) / days)) * 100);
  const gap = gapDay(cum, total, days);
  const pts = cum.map((v, d) => `${X(d)},${Y(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6D22CD" stopOpacity=".35" /><stop offset="1" stopColor="#6D22CD" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(t => (
        <g key={t}>
          <line x1={PL} x2={W - 10} y1={Y(total * t)} y2={Y(total * t)} stroke="#EEEAF3" />
          <text className="ax" x={PL - 8} y={Y(total * t) + 4} textAnchor="end">{((total * t) / 60).toFixed(1)}h</text>
        </g>
      ))}
      <rect x={X(now)} y="10" width={Math.max(0, X(days) - X(now))} height={PH} fill="#F8F6FB" />
      <line x1={X(now)} x2={X(now)} y1="10" y2={10 + PH} stroke="#A49DAF" strokeDasharray="2 3" />
      <text className="ax" x={X(now) + 6} y="24">today</text>
      <line x1={X(0)} y1={Y(0)} x2={X(days)} y2={Y(total)} stroke="#A49DAF" strokeWidth="1.5" strokeDasharray="5 5" />
      <line x1={X(days)} x2={X(days)} y1="10" y2={10 + PH} stroke="#E0245E" strokeOpacity=".6" />
      <text x={X(days) - 6} y={10 + PH - 8} textAnchor="end" style={{ fontSize: 11, fill: '#E0245E', fontWeight: 600 }}>{targetLabel}</text>
      <path d={`M${X(0)},${Y(0)} L${cum.map((v, d) => `${X(d)},${Y(v)}`).join(' L')} L${X(now - 1)},${Y(0)} Z`} fill="url(#pg)" />
      <polyline points={pts} fill="none" stroke="#6D22CD" strokeWidth="2.5" />
      <circle cx={X(now - 1)} cy={Y(last)} r="5" fill="#6D22CD" stroke="#FFFFFF" strokeWidth="2" />
      {behind > 0 && <text x={X(now - 1) - 8} y={Y(last) - 10} textAnchor="end" style={{ fontSize: 12, fontWeight: 700, fill: '#E0245E' }}>{behind}% behind plan</text>}
      {gap !== null && <circle cx={X(gap)} cy={Y(cum[gap])} r="5" fill="none" stroke="#E0245E" strokeWidth="2" />}
      {cum.map((v, d) => d % 2 ? null : (
        <rect key={d} x={X(d) - 3} y="10" width="6" height={PH} fill="transparent"
          data-tip={`<b>${label(d)}</b> · day ${d + 1}<br>${Math.round(v)} min watched · plan ${Math.round((total * d) / days)} min`} />
      ))}
      <text className="ax" x={X(0)} y={H - 2}>enrolled {label(0)}</text>
      <text className="ax" x={X(days)} y={H - 2} textAnchor="end">day {days}</text>
    </svg>
  );
}
