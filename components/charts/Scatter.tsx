'use client';
// Readiness scatter from reference/prototype-v3.html (S11). x is days (0 to 60), y is score (0 to 100).
import { CONFIG } from '@/lib/config';

export type Dot = { id: string; days: number; score: number; color: string; dim: boolean; tip: string };

const W = 760, H = 380, PL = 40, PB = 34, PW = W - PL - 12, PH = H - PB - 12, MX = 60;

export default function Scatter({ dots, urgentHigh, boxDays, boxScore, boxCount, xLabel, onPick }: {
  dots: Dot[];
  urgentHigh: boolean;   // true: more days is more urgent (idle). false: fewer days is more urgent (days left)
  boxDays: number;
  boxScore: number;
  boxCount: number;
  xLabel: string;
  onPick: (id: string) => void;
}) {
  const frac = (d: number) => Math.min(Math.max(d, 0), MX) / MX;
  const X = (d: number) => PL + PW * (urgentHigh ? frac(d) : 1 - frac(d));
  const Y = (r: number) => 12 + PH * (1 - r / 100);
  const right = PL + PW;
  const bx = X(boxDays);
  const { ready, building } = CONFIG.score.bands;
  const ticks = urgentHigh ? [0, 15, 30, 45, 60] : [60, 45, 30, 15, 0];
  const label = { fontSize: 10, paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: 4 } as const;

  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={PL} x2={W - 12} y1={Y(v)} y2={Y(v)} stroke="#EEEAF3" />
          <text className="ax" x={PL - 8} y={Y(v) + 4} textAnchor="end">{v}</text>
        </g>
      ))}
      {ticks.map(d => (
        <text key={d} className="ax" x={X(d)} y={H - 14} textAnchor="middle">{!urgentHigh && d === 0 ? 'today' : urgentHigh && d === MX ? `${d}d+` : `${d}d`}</text>
      ))}
      <line x1={PL} x2={W - 12} y1={Y(ready)} y2={Y(ready)} stroke="#12A46B" strokeOpacity=".35" strokeDasharray="2 4" />
      <text x={W - 14} y={Y(ready) - 5} textAnchor="end" style={{ ...label, fill: '#12A46B' }}>Ready ≥ {ready}</text>
      <line x1={PL} x2={W - 12} y1={Y(building)} y2={Y(building)} stroke="#E0245E" strokeOpacity=".35" strokeDasharray="2 4" />
      <text x={PL + 6} y={Y(building) + 14} style={{ ...label, fill: '#E0245E' }}>At-risk &lt; {building}</text>
      <rect data-testid="zone-box" x={bx} y={Y(boxScore)} width={right - bx} height={Y(0) - Y(boxScore)} rx="10" fill="rgba(109,34,205,.07)" stroke="#6D22CD" strokeOpacity=".6" />
      <text x={right - 10} y={Y(boxScore) + 18} textAnchor="end" style={{ fontSize: 11.5, fontWeight: 600, fill: '#6D22CD' }}>Focus zone · {boxCount}</text>
      <text className="ax" x={PL + PW / 2} y={H} textAnchor="middle">{xLabel}</text>
      {dots.map(d => {
        // ponytail: fixed jitter from the ID so dots on the same day do not stack exactly
        const j = (((d.id.charCodeAt(3) || d.id.charCodeAt(0)) * 7) % 9 - 4) * 0.6;
        return (
          <circle
            key={d.id} data-testid="scatter-dot" data-id={d.id} data-tip={d.tip}
            cx={X(d.days) + j} cy={Y(d.score)} r="5"
            fill={d.color} fillOpacity={d.dim ? 0.08 : 0.85} stroke={d.color} strokeOpacity={d.dim ? 0.15 : 0.25} strokeWidth="5"
            style={{ cursor: 'pointer' }} onClick={() => onPick(d.id)}
          />
        );
      })}
    </svg>
  );
}
