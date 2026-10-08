'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useStore } from '@/lib/store';

export function EmptyState() {
  return (
    <div className="pn" data-testid="empty-state" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: '40px 32px' }}>
      <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, margin: '0 auto 12px' }} aria-hidden>
        <path d="M12 16V4m0 0l-5 5m5-5l5 5" fill="none" stroke="#6D22CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" fill="none" stroke="#6D22CD" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 style={{ fontSize: 18 }}>No data yet</h3>
      <div className="hint" style={{ fontSize: 13, margin: '8px 0 18px' }}>Upload a FastPix views export to see your learners and lessons.</div>
      <Link href="/data" className="btn pri" style={{ textDecoration: 'none', display: 'inline-block' }}>Upload your CSV</Link>
    </div>
  );
}

/** Shows the page only when data is loaded. The Data page (and the home redirect) always show. */
export default function DataGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { dataset, restored, loading } = useStore();
  // "/" only redirects to /readiness, so it must render.
  if (path === '/' || path === '/data' || dataset) return <>{children}</>;
  if (!restored || loading) return <div className="c-sub" style={{ padding: 40 }}>Loading your data…</div>;
  return <EmptyState />;
}
