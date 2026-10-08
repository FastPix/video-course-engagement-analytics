'use client';
// Diverging bars from reference/prototype-v3.html (S18). Buffer exits go left, clean exits go right.

export type DivRow = { id: string; label: string; left: number; right: number; pct: number; strong: boolean; tip: string };

export default function DivergingBars({ rows, onPick }: { rows: DivRow[]; onPick: (id: string) => void }) {
  const W = 760, RH = 27, H = rows.length * RH + 26, MID = 410;
  const sc = 210 / Math.max(1, ...rows.map(r => Math.max(r.left, r.right)));
  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      <line x1={MID} x2={MID} y1="18" y2={H} stroke="#CFC6DB" />
      <text className="ax" x={MID - 8} y="11" textAnchor="end">← while buffering</text>
      <text className="ax" x={MID + 8} y="11">clean stream →</text>
      {rows.map((r, k) => {
        const y = 22 + k * RH;
        return (
          <g key={r.id} style={{ cursor: 'pointer' }} data-testid="diverging-row" data-exits={r.left + r.right} onClick={() => onPick(r.id)}>
            <rect x="0" y={y - 3} width={W} height={RH} fill="transparent" data-tip={r.tip} />
            <rect x={MID - r.left * sc} y={y + 2} width={r.left * sc} height="15" rx="7" fill="#2F6BDB" pointerEvents="none" />
            <rect x={MID} y={y + 2} width={r.right * sc} height="15" rx="7" fill="#CFC6DB" pointerEvents="none" />
            <text x={MID - r.left * sc - 8} y={y + 14} textAnchor="end" pointerEvents="none"
              style={{ fontSize: 11.5, fill: r.strong ? '#2F6BDB' : '#6B6575', fontWeight: r.strong ? 600 : 400 }}>{r.label}</text>
            <text className="ax" x={MID + r.right * sc + 7} y={y + 14} pointerEvents="none">{r.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}
