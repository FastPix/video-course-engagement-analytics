'use client';
// Stacked columns from reference/prototype-v3.html (S15). One column per bucket, segments stacked bottom up.

export type Column = { label: string; tip: string; values: number[] };

export default function StackedColumns({ columns, colors }: { columns: Column[]; colors: string[] }) {
  const W = 760, H = 250, PL = 34, PB = 26, PW = W - PL - 6, PH = H - PB - 10;
  const n = columns.length || 1;
  const mx = Math.max(1, ...columns.map(c => c.values.reduce((a, b) => a + b, 0)));
  const bw = (PW / n) * 0.62;
  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      {[0, 0.5, 1].map(t => (
        <g key={t}>
          <line x1={PL} x2={W - 6} y1={10 + PH * (1 - t)} y2={10 + PH * (1 - t)} stroke="#EEEAF3" />
          <text className="ax" x={PL - 8} y={14 + PH * (1 - t)} textAnchor="end">{Math.round(mx * t)}</text>
        </g>
      ))}
      {columns.map((c, i) => {
        const cx = PL + (PW / n) * i + (PW / n) * 0.19;
        let y = 10 + PH;
        return (
          <g key={i}>
            {c.values.map((v, k) => {
              const h = (PH * v) / mx;
              y -= h;
              return h > 0 ? <rect key={k} x={cx} y={y} width={bw} height={Math.max(0, h - 1.5)} rx="3" fill={colors[k]} fillOpacity=".85" /> : null;
            })}
            <rect x={cx - 6} y="10" width={bw + 12} height={PH} fill="transparent" data-tip={c.tip} />
            <text className="ax" x={cx + bw / 2} y={H - 6} textAnchor="middle">{c.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
