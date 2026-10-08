'use client';
// "Built from" strip from reference/prototype-v3.html (S19). Mounted once in the layout, hidden on Data.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { esc } from '@/components/ui';
import { COLUMN_HELP, PAGE_COLUMNS, pageKeyOf } from '@/lib/sources';
import { useStore } from '@/lib/store';

export default function BuiltFrom() {
  const router = useRouter();
  const key = pageKeyOf(usePathname());
  const { dataset, courseId } = useStore();
  if (!key || !dataset) return null;

  const P = PAGE_COLUMNS[key];
  const hasTarget = !!dataset.courses.find(c => c.id === courseId)?.targetDate;
  const lms = hasTarget ? P.lms : [];
  const chip = (x: string, cls = '') => (
    <code key={x} className={cls} data-testid="built-from-chip" role="link" tabIndex={0}
      data-tip={`<b>${esc(x)}</b><br>${esc(COLUMN_HELP[x] ?? '')}<br><span style='color:#C9A9FF'>Click to see the CSV</span>`}
      onClick={() => router.push('/view')} onKeyDown={e => e.key === 'Enter' && router.push('/view')}>{x}</code>
  );

  return (
    <div className="src" data-testid="built-from">
      <span>Built from</span>
      <span className="grpl">FastPix</span>{P.fastpix.map(x => chip(x))}
      <span className="grpl">Custom</span>{P.custom.map(x => chip(x, 'cx'))}
      {lms.length > 0 && <><span className="grpl">LMS</span>{lms.map(x => chip(x, 'lms'))}</>}
      <Link className="srcmore" href="/view" style={{ textDecoration: 'none' }}>All columns · Video Data →</Link>
    </div>
  );
}
