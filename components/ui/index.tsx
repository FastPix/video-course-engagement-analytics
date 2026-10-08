'use client';
// Base components from reference/prototype-v3.html (S08). Class names are the prototype's, styled in app/globals.css.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LessonStatus } from '@/lib/types';

export type Tone = 'mint' | 'amber' | 'coral' | 'sky' | 'accent' | 'neutral';
const CHIP: Record<Tone, string> = { mint: 'k-mint', amber: 'k-amber', coral: 'k-coral', sky: 'k-sky', accent: 'k-acc', neutral: 'k-n' };
const TEXT: Record<Tone, string> = { mint: 'c-mint', amber: 'c-amber', coral: 'c-coral', sky: 'c-sky', accent: 'c-acc', neutral: 'c-sub' };

/** Lesson status colours (S15 to S18). */
export const STATUS_TONE: Record<LessonStatus, Tone> = { 'Fix stream': 'sky', Rewrite: 'coral', 'Re-cut': 'amber', 'Add example': 'accent', Healthy: 'mint' };
export const STATUS_COL: Record<LessonStatus, string> = { 'Fix stream': '#2F6BDB', Rewrite: '#E0245E', 'Re-cut': '#D99A00', 'Add example': '#6D22CD', Healthy: '#12A46B' };

/** "1 learner", "2 learners". */
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

/** Escape text for use inside a `data-tip` HTML string. */
export const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function PageHead({ eyebrow, title, insight, right }: { eyebrow: ReactNode; title: ReactNode; insight: ReactNode; right?: ReactNode }) {
  return (
    <div className="ph">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <div className="insight">{insight}</div>
      </div>
      {right}
    </div>
  );
}

export function StatCard({ label, value, detail, tone, focus, testId }: { label: ReactNode; value: ReactNode; detail?: ReactNode; tone?: Tone; focus?: boolean; testId?: string }) {
  return (
    <div className={`st${focus ? ' focus' : ''}`} data-testid={testId}>
      <div className="l">{label}</div>
      <div className={`v ${tone ? TEXT[tone] : ''}`}>{value}</div>
      <div className="d">{detail}</div>
    </div>
  );
}

export function Panel({ title, hint, right, children, className = '' }: { title?: ReactNode; hint?: ReactNode; right?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`pn ${className}`}>
      {(title || right) && (
        <div className="pn-h">
          <div>{title && <h3>{title}</h3>}{hint && <div className="hint">{hint}</div>}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export const Chip = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => <span className={`chip ${CHIP[tone]}`}>{children}</span>;

export function Segmented<T extends string>({ options, value, onChange, testId }: { options: [T, ReactNode][]; value: T; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="seg" role="group">
      {options.map(([k, label]) => (
        <button key={k} type="button" data-testid={testId && `${testId}-${k}`} className={k === value ? 'on' : ''} aria-pressed={k === value} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}

export function Slider({ label, min, max, value, onChange, format = String, testId }: { label: ReactNode; min: number; max: number; value: number; onChange: (v: number) => void; format?: (v: number) => ReactNode; testId?: string }) {
  return (
    <label className="zs">
      <span>{label}</span>
      <input type="range" min={min} max={max} value={value} data-testid={testId} onChange={e => onChange(Number(e.target.value))} />
      <b>{format(value)}</b>
    </label>
  );
}

export const Table = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <table className={`t ${className}`}><tbody>{children}</tbody></table>
);

/**
 * Dropdown in the app's own style (no system menu). Click, ↑ ↓, Enter, Esc and outside click.
 * Refs mirror state so fast key presses see the latest values; hover follows real mouse movement only.
 */
export function Select<T extends string | number>({ value, options, onChange, id, label, testId }: {
  value: T;
  options: [T, ReactNode][];
  onChange: (v: T) => void;
  id?: string;
  label: string;
  testId?: string;
}) {
  const [open, setOpenState] = useState(false);
  const [hi, setHiState] = useState(0);
  const openRef = useRef(false), hiRef = useRef(0), box = useRef<HTMLDivElement>(null);
  const setOpen = (v: boolean) => { openRef.current = v; setOpenState(v); };
  const setHi = (v: number) => { hiRef.current = v; setHiState(v); };
  const current = options.findIndex(([v]) => v === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const show = () => { setHi(Math.max(0, current)); setOpen(true); };
  const pick = (i: number) => { onChange(options[i][0]); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (!openRef.current) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHi(Math.min(options.length - 1, hiRef.current + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(Math.max(0, hiRef.current - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(hiRef.current); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={`sel${open ? ' open' : ''}`} ref={box}>
      <button type="button" id={id} className="sel-btn" data-testid={testId} data-value={String(value)}
        aria-haspopup="listbox" aria-expanded={open} aria-label={label}
        onClick={() => (openRef.current ? setOpen(false) : show())} onKeyDown={onKey}>
        <span className="sel-v">{options[current]?.[1] ?? '-'}</span>
        <svg viewBox="0 0 16 16" aria-hidden><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <ul className="sel-list" role="listbox" aria-label={label}>
          {options.map(([v, l], i) => (
            <li key={String(v)} role="option" aria-selected={v === value} className={`${v === value ? 'on' : ''}${i === hi ? ' hi' : ''}`}
              onMouseMove={() => hiRef.current !== i && setHi(i)} onClick={() => pick(i)}>
              <span>{l}</span>{v === value && <span className="ck" aria-hidden>✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The "i" bubble. `tip` is HTML; escape data with `esc`. */
export const InfoIcon = ({ tip }: { tip: string }) => <span className="info" data-tip={tip} aria-label="More info">i</span>;

/** Dark tooltip that follows the cursor over any element with `data-tip` (HTML), or sits under it on keyboard focus. Mounted once in the layout. */
export function TipLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const tip = ref.current!;
      const t = (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!t) { tip.style.display = 'none'; return; }
      tip.innerHTML = t.dataset.tip ?? '';
      tip.style.display = 'block';
      tip.style.left = Math.min(e.clientX + 16, innerWidth - tip.offsetWidth - 12) + 'px';
      tip.style.top = e.clientY + 16 + 'px';
    };
    // Keyboard: show the tip under a focused element that has data-tip, hide it on blur.
    const focus = (e: FocusEvent) => {
      const tip = ref.current!;
      const t = (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!t) return;
      const r = t.getBoundingClientRect();
      tip.innerHTML = t.dataset.tip ?? '';
      tip.style.display = 'block';
      tip.style.left = Math.max(12, Math.min(r.left, innerWidth - tip.offsetWidth - 12)) + 'px';
      tip.style.top = r.bottom + 8 + 'px';
    };
    const blur = () => { ref.current!.style.display = 'none'; };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseover', move);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', move);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', blur);
    };
  }, []);
  return <div id="tip" ref={ref} role="tooltip" />;
}

/** Show a short message at the bottom of the screen for 2.3 s. */
export const toast = (message: string) => window.dispatchEvent(new CustomEvent('ls-toast', { detail: message }));

export function ToastLayer() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let h: ReturnType<typeof setTimeout>;
    const on = (e: Event) => { setMsg((e as CustomEvent<string>).detail); clearTimeout(h); h = setTimeout(() => setMsg(null), 2300); };
    window.addEventListener('ls-toast', on);
    return () => { window.removeEventListener('ls-toast', on); clearTimeout(h); };
  }, []);
  return <div id="toast" role="status" style={{ display: msg ? 'block' : 'none' }}>{msg}</div>;
}
