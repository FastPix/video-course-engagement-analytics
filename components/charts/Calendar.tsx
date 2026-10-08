'use client';
// Study rhythm calendar from reference/prototype-v3.html (S14). One square per day, columns are weeks.

/** `minutesByAgo[d]` = minutes watched d days before today. */
export default function Calendar({ minutesByAgo, days, idle, label }: { minutesByAgo: Map<number, number>; days: number; idle: number; label: (ago: number) => string }) {
  const weeks = Math.ceil(days / 7) + 1;
  const max = Math.max(1, ...minutesByAgo.values());
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const ago = weeks * 7 - 1 - i;
    if (ago >= days) { cells.push(<span key={i} />); continue; }
    const m = minutesByAgo.get(ago) ?? 0;
    const streak = ago < idle;
    const bg = streak ? 'rgba(224,36,94,.35)' : m ? `rgba(109,34,205,${0.25 + (0.75 * m) / max})` : '#EFEBF4';
    const tip = `<b>${label(ago)}</b><br>${m ? `${Math.round(m)} min watched` : streak ? 'idle streak' : 'no watching'}`;
    cells.push(<span key={i} style={{ background: bg }} data-tip={tip} />);
  }
  return <div className="cal">{cells}</div>;
}
