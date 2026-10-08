'use client';
// Dropdown filter (S12, option B): a button that opens a checkbox menu. Several values can be picked.
import { useEffect, useRef } from 'react';

export type FilterOption<T extends string> = { value: T; label: string; count: number; dot?: string };

export default function FilterMenu<T extends string>({ id, label, options, picked, onChange, open, onOpenChange }: {
  id: string;
  label: string;
  options: FilterOption<T>[];
  picked: T[];
  onChange: (picked: T[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const focusFirst = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (focusFirst.current) { wrap.current?.querySelector<HTMLInputElement>('input')?.focus(); focusFirst.current = false; }
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) onOpenChange(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open, onOpenChange]);

  const boxes = () => [...(wrap.current?.querySelectorAll<HTMLInputElement>('input') ?? [])];
  const close = () => { onOpenChange(false); btn.current?.focus(); };
  const onBtnKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); focusFirst.current = true; if (open) boxes()[0]?.focus(); else onOpenChange(true); }
    if (e.key === 'Escape' && open) { e.preventDefault(); close(); }
  };
  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = boxes(), i = list.indexOf(document.activeElement as HTMLInputElement);
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[Math.min(list.length - 1, i + 1)]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) btn.current?.focus(); else list[i - 1].focus(); }
  };
  const toggle = (v: T) => onChange(picked.includes(v) ? picked.filter(x => x !== v) : [...picked, v]);

  return (
    <div className="fwrap" ref={wrap}>
      <button
        ref={btn} type="button" data-testid={`filter-${id}`} className={`fbtn${picked.length ? ' on' : ''}${open ? ' open' : ''}`}
        aria-haspopup="true" aria-expanded={open} aria-controls={`filter-menu-${id}`}
        onClick={() => onOpenChange(!open)} onKeyDown={onBtnKey}
      >
        {label}{picked.length > 0 && ` · ${picked.length}`}
        <svg viewBox="0 0 16 16" aria-hidden><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="fmenu" id={`filter-menu-${id}`} role="group" aria-label={`${label} filter`} data-testid="filter-menu" onKeyDown={onMenuKey}>
          {options.map(o => (
            <label key={o.value} className="fopt" data-testid="filter-option">
              <input type="checkbox" checked={picked.includes(o.value)} onChange={() => toggle(o.value)} aria-label={o.label} />
              {o.dot && <span className="dot" style={{ background: o.dot }} aria-hidden />}
              <span>{o.label}</span>
              <span className="n">{o.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
