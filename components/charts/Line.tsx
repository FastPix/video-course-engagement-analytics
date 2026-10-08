'use client';
// Area line from reference/prototype-v3.html (S15). Equal spacing, hover tip per point.

export type Point = { label: string; tip: string; value: number };

export default function Line({ points }: { points: Point[] }) {
  const W = 560, H = 210;
  const mw = Math.max(0.1, ...points.map(p => p.value)) * 1.2;
  const last = Math.max(1, points.length - 1);
  const X = (i: number) => 30 + ((W - 40) * i) / last;
  const Y = (v: number) => 12 + 160 * (1 - v / mw);
  const line = points.map((p, i) => `${X(i)},${Y(p.value)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6D22CD" stopOpacity=".35" /><stop offset="1" stopColor="#6D22CD" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${X(0)},${Y(0)} L${line.join(' L')} L${X(last)},${Y(0)} Z`} fill="url(#wg)" />
      <polyline points={line.join(' ')} fill="none" stroke="#6D22CD" strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Y(p.value)} r="4" fill="#6D22CD" stroke="#FFFFFF" strokeWidth="2" />
          <rect x={X(i) - 25} y="0" width="50" height="180" fill="transparent" data-tip={p.tip} />
          <text className="ax" x={X(i)} y={H - 6} textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
