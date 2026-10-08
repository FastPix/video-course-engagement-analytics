'use client';
import { create } from 'zustand';
import { buildDataset } from '@/lib/model/dataset';
import type { ActionKind, Band, Dataset, Health, LoadOptions, LoadReport, LoadResult } from '@/lib/types';

export type Source = 'Your file' | 'FastPix API';
export type CsvFile = { name: string; text: string };
export const ACTION_LABEL = { tutor_call: 'Tutor call', plan_reset: 'Plan reset', catch_up: 'Catch-up', nudge: 'Nudge' } as const;

/** Learners page filters (S12): search, plus OR-lists per group. */
export type LearnerFilters = { q: string; band: Band[]; health: Health[]; action: ActionKind[] };
export const NO_FILTERS: LearnerFilters = { q: '', band: [], health: [], action: [] };

type Store = {
  dataset: Dataset | null;
  report: LoadReport | null;
  source: Source;
  fileName: string;
  files: CsvFile[];          // the loaded CSV files as uploaded (for /view and rebuilds)
  courseId: string | null;
  targetDates: Record<string, string>;
  filters: Record<string, unknown>;
  learnerFilters: LearnerFilters;
  loading: boolean;
  restored: boolean;         // true once the saved upload (if any) has been checked
  setCourse: (id: string) => void;
  setFilters: (f: Record<string, unknown>) => void;
  setLearnerFilters: (f: Partial<LearnerFilters>) => void;
};

export const useStore = create<Store>()(set => ({
  dataset: null, report: null, source: 'Your file', fileName: '', files: [], courseId: null,
  targetDates: {}, filters: {}, learnerFilters: NO_FILTERS, loading: false, restored: false,
  setCourse: courseId => set({ courseId }),
  setFilters: f => set(s => ({ filters: { ...s.filters, ...f } })),
  setLearnerFilters: f => set(s => ({ learnerFilters: { ...s.learnerFilters, ...f } })),
}));

// ---- Saved upload (IndexedDB). Uploads can be several MB, too big for localStorage. Nothing leaves the browser.
type Saved = { files: CsvFile[]; source: Source; targetDates?: Record<string, string> };
const DB = 'learner-signals', TABLE = 'upload', KEY = 'last';

function idb<T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(TABLE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(TABLE, mode);
      const r = op(tx.objectStore(TABLE));
      r.onsuccess = () => resolve(r.result as T);
      r.onerror = () => reject(r.error);
      tx.oncomplete = () => open.result.close();
    };
  });
}
// ponytail: storage failures (private mode, quota) only mean the upload is not kept across reloads.
const saveUpload = (s: Saved) => idb('readwrite', t => t.put(s, KEY)).catch(() => undefined);
const readUpload = () => idb<Saved | undefined>('readonly', t => t.get(KEY)).catch(() => undefined);
const dropUpload = () => idb('readwrite', t => t.delete(KEY)).catch(() => undefined);

/** Parse in a Web Worker. If the worker cannot start or load, parse on the main thread instead. */
function runWorker(texts: string[], opts: LoadOptions): Promise<LoadResult> {
  return new Promise(resolve => {
    const fallback = () => resolve(buildDataset(texts, opts));
    let w: Worker;
    try { w = new Worker(new URL('./csv/parse.worker.ts', import.meta.url)); } catch { fallback(); return; }
    w.onmessage = e => { resolve(e.data); w.terminate(); };
    w.onerror = e => { e.preventDefault(); w.terminate(); fallback(); };
    w.postMessage({ texts, opts });
  });
}

/**
 * Parse CSV files and, if usable, make them the current data and save them. Returns the load report.
 * New data selects the largest course, as in the prototype. `keepCourse` is for rebuilds of the same data.
 */
export async function loadFiles(files: CsvFile[], source: Source, { keepCourse = false, save = true } = {}): Promise<LoadReport> {
  useStore.setState({ loading: true });
  const { targetDates, courseId } = useStore.getState();
  try {
    const { dataset, report } = await runWorker(files.map(f => f.text), { targetDates });
    if (dataset) {
      const keep = keepCourse && dataset.courses.some(c => c.id === courseId);
      useStore.setState({ dataset, report, source, files, fileName: files.map(f => f.name).join(', '), courseId: keep ? courseId : dataset.courses[0]?.id ?? null });
      if (save) await saveUpload({ files, source, targetDates: useStore.getState().targetDates });
    }
    return report;
  } finally {
    useStore.setState({ loading: false });
  }
}

/** On app start: load the last saved upload, if there is one. */
export async function restoreSaved() {
  if (useStore.getState().restored) return;
  try { localStorage.removeItem('learner-signals'); } catch { /* old action status from earlier versions; nothing to keep */ }
  try {
    const saved = await readUpload();
    if (saved?.files?.length && !useStore.getState().dataset) {
      // Target dates are saved with the upload, so Pace survives a reload.
      if (saved.targetDates) useStore.setState({ targetDates: saved.targetDates });
      await loadFiles(saved.files, saved.source, { save: false });
    }
  } finally {
    useStore.setState({ restored: true });
  }
}

/** Remove the loaded data and the saved upload. Action states stay. */
export async function clearData() {
  await dropUpload();
  useStore.setState({ dataset: null, report: null, files: [], fileName: '', courseId: null, targetDates: {} });
}

/** Set or clear (empty string) a course target date, then rebuild scores. */
export async function setTargetDate(courseId: string, date: string) {
  const { [courseId]: _old, ...rest } = useStore.getState().targetDates;
  void _old;
  useStore.setState({ targetDates: date ? { ...rest, [courseId]: date } : rest });
  const { files, source, targetDates } = useStore.getState();
  if (!files.length) return;
  await loadFiles(files, source, { keepCourse: true, save: false });
  await saveUpload({ files, source, targetDates });
}
