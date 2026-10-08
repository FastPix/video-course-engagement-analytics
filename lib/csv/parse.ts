import Papa from 'papaparse';
import type { RawRow } from '@/lib/types';

/** Lowercase and keep only a-z and 0-9, so `view_start` and `viewStart` match. */
export const normHeader = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/** Parse one CSV text. Headers are normalised; the first of any repeated header wins. */
export function parseCsv(text: string): { headers: string[]; rows: RawRow[] } {
  const { data } = Papa.parse<string[]>(text.replace(/^﻿/, ''), { skipEmptyLines: 'greedy' });
  const [head = [], ...body] = data;
  const idx = new Map<string, number>();
  head.forEach((h, i) => { const k = normHeader(h); if (!idx.has(k)) idx.set(k, i); });
  const headers = [...idx.keys()];
  const rows = body.map(r => {
    const o: RawRow = {};
    for (const [k, i] of idx) o[k] = r[i] ?? '';
    return o;
  });
  return { headers, rows };
}
