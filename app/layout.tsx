import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import BuiltFrom from '@/components/BuiltFrom';
import DataGate from '@/components/EmptyState';
import Sidebar from '@/components/Sidebar';
import { TipLayer, ToastLayer } from '@/components/ui';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jbmono' });

export const metadata: Metadata = { title: 'FastPix Learner Signals' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <Sidebar />
          <main><DataGate>{children}</DataGate><BuiltFrom /></main>
        </div>
        <TipLayer />
        <ToastLayer />
      </body>
    </html>
  );
}
