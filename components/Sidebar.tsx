'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import CoursePicker from '@/components/CoursePicker';
import { plural, toast } from '@/components/ui';
import { restoreSaved, useStore } from '@/lib/store';

const GROUPS: [string, [string, string][]][] = [
  ['Learners', [['readiness', 'Readiness'], ['learners', 'Learners']]],
  ['Course', [['overview', 'Overview'], ['lessons', 'Lessons'], ['playback', 'Playback']]],
  ['Data', [['data', 'Connector'], ['view', 'Video Data']]],
];

export default function Sidebar() {
  const current = usePathname().split('/')[1];
  const { dataset, source, fileName } = useStore();

  useEffect(() => {
    restoreSaved().catch(() => toast('Could not load your saved data'));
  }, []);

  const students = dataset ? new Set(dataset.learners.map(l => l.studentId)).size : 0;
  const upTo = dataset ? new Date(dataset.today).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';

  return (
    <aside className="bar">
      <div className="bar-in">
        <div className="mark">
          <Image src="/brand/fastpix-mark.png" alt="" width={28} height={25} priority />
          <div>FastPix<span>Learner Signals</span></div>
        </div>
        <CoursePicker />
        <nav className="tabs">
          {GROUPS.map(([g, items]) => (
            <div className="grp" key={g}>
              <span className="gl">{g}</span>
              {items.map(([k, label]) => (
                <Link key={k} href={'/' + k} data-testid={`nav-${k}`} className={current === k ? 'on' : ''} aria-current={current === k ? 'page' : undefined}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sp" />
        <div className="demo" data-testid="source-footer">
          {dataset ? <>{source}: <b>{fileName}</b><br />{plural(students, 'student')} · data up to {upTo}</> : 'No data loaded'}
        </div>
      </div>
    </aside>
  );
}
