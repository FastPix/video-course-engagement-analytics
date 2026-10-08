'use client';
// Course picker: a listbox in the app's own style, so the OS menu never shows (S09).
import { useEffect, useRef, useState } from 'react';
import { plural } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function CoursePicker() {
  const { dataset, courseId, setCourse } = useStore();
  const [open, setOpenState] = useState(false);
  const [hi, setHiState] = useState(0);
  // Refs mirror the state so fast key presses (before React re-renders) see the latest values.
  const openRef = useRef(false), hiRef = useRef(0);
  const setOpen = (v: boolean) => { openRef.current = v; setOpenState(v); };
  const setHi = (v: number) => { hiRef.current = v; setHiState(v); };
  const box = useRef<HTMLDivElement>(null);
  const courses = dataset?.courses ?? [];
  const current = courses.find(c => c.id === courseId);
  const learners = (id: string) => dataset?.learners.filter(l => l.courseId === id).length ?? 0;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (id: string) => { setCourse(id); setOpen(false); };
  const show = () => { setHi(Math.max(0, courses.findIndex(c => c.id === courseId))); setOpen(true); };
  const onKey = (e: React.KeyboardEvent) => {
    if (!courses.length) return;
    if (!openRef.current && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show(); return; }
    if (!openRef.current) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHi(Math.min(courses.length - 1, hiRef.current + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(Math.max(0, hiRef.current - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(courses[hiRef.current].id); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={`switch${open ? ' open' : ''}`} ref={box}>
      <small id="course-label">Course</small>
      <button
        type="button" className="pick" data-testid="course-picker" data-value={courseId ?? ''}
        aria-haspopup="listbox" aria-expanded={open} aria-labelledby="course-label course-current" disabled={!courses.length}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKey}
      >
        <span className="pick-name" id="course-current">{current?.name ?? 'No data loaded'}</span>
        {courses.length > 0 && <svg viewBox="0 0 16 16" aria-hidden><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </button>
      {open && (
        <ul className="pick-list" role="listbox" aria-labelledby="course-label" aria-activedescendant={`course-opt-${hi}`}>
          {courses.map((c, i) => (
            <li
              key={c.id} id={`course-opt-${i}`} role="option" aria-selected={c.id === courseId}
              data-testid="course-option" data-value={c.id}
              className={`${c.id === courseId ? 'on' : ''}${i === hi ? ' hi' : ''}`}
              onMouseMove={() => hiRef.current !== i && setHi(i)} onClick={() => choose(c.id)}
            >
              <span className="t">{c.name}</span>
              <span className="s">{plural(learners(c.id), 'learner')} · {plural(c.lessons.length, 'lesson')}</span>
              {c.id === courseId && <svg viewBox="0 0 16 16" aria-hidden><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
