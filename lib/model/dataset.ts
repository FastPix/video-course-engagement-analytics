import { CONFIG } from '@/lib/config';
import { parseCsv } from '@/lib/csv/parse';
import { parseEvents } from '@/lib/model/events';
import { buildLearners } from '@/lib/model/learners';
import { normalizeView, rnd } from '@/lib/model/normalize';
import type { Course, Dataset, Lesson, LoadOptions, LoadReport, LoadResult, PlayerEvent, RawRow, View } from '@/lib/types';

const REQUIRED: [string, string][] = [
  ['custom1', 'custom_1 (course ID)'],
  ['custom2', 'custom_2 (lesson ID)'],
  ['custom3', 'custom_3 (student ID)'],
  ['viewstart', 'view_start'],
  ['videoduration', 'video_duration'],
  ['viewmaxplayheadposition', 'view_max_playhead_position'],
  ['events', 'events'],
];
const OPTIONAL: [string, string][] = [
  ['viewid', 'view_id'],
  ['viewtotalcontentplaybacktime', 'view_total_content_playback_time'],
  ['videotitle', 'video_title'],
  ['videoseries', 'video_series'],
  ['devicetype', 'device_type'],
  ['osname', 'os_name'],
  ['videostartuptime', 'video_startup_time'],
];

const NO_ID = new Set(['', 'null', 'n/a', 'nan', 'none', 'anonymous']);
export function isNoId(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  return NO_ID.has(s) || s.endsWith('::anonymous');
}

/** UTC epoch ms from view_start, or the smallest event vt above 1e12. */
export function parseTime(viewStart: string | undefined, events: PlayerEvent[]): number | null {
  const s = (viewStart ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    let t = s.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1');
    if (!/([zZ]|[+-]\d\d:?\d\d)$/.test(t)) t += 'Z';
    const ms = Date.parse(t);
    if (!Number.isNaN(ms)) return ms;
  }
  const vts = events.map(x => x.vt).filter(v => v > 1e12);
  return vts.length ? Math.min(...vts) : null;
}

const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function buildDataset(csvTexts: string[], opts: LoadOptions = {}): LoadResult {
  const report: LoadReport = {
    files: csvTexts.length, rows: 0, viewsUsed: 0, skippedNoIds: 0, skippedBroken: 0, duplicates: 0,
    missingRequired: [], presentOptional: [], dateFrom: null, dateTo: null,
  };
  const parsed = csvTexts.map(parseCsv);
  const first = new Set(parsed[0]?.headers ?? []);
  report.missingRequired = REQUIRED.filter(([k]) => !first.has(k)).map(([, name]) => name);
  if (report.missingRequired.length) return { dataset: null, report };
  const all = new Set(parsed.flatMap(p => p.headers));
  report.presentOptional = OPTIONAL.filter(([k]) => all.has(k)).map(([, name]) => name);

  const used: { row: RawRow; t: number; durationMs: number; events: PlayerEvent[] }[] = [];
  const seen = new Set<string>();
  for (const { rows } of parsed) for (const row of rows) {
    report.rows++;
    if (row.viewid) {
      if (seen.has(row.viewid)) { report.duplicates++; continue; }
      seen.add(row.viewid);
    }
    if (isNoId(row.custom1) || isNoId(row.custom2) || isNoId(row.custom3)) { report.skippedNoIds++; continue; }
    const events = parseEvents(row.events);
    const t = parseTime(row.viewstart, events);
    const durationMs = Number(row.videoduration);
    if (!t || !durationMs) { report.skippedBroken++; continue; }
    used.push({ row, t, durationMs, events });
  }
  report.viewsUsed = used.length;
  if (!used.length) return { dataset: null, report };

  const ts = used.map(u => u.t);
  const tMin = Math.min(...ts), tMax = Math.max(...ts);
  report.dateFrom = utcDate(tMin);
  report.dateTo = utcDate(tMax);
  const d = new Date(tMax);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59);

  used.sort((a, b) => a.t - b.t);
  const courses = buildCourses(used);
  for (const c of courses) if (opts.targetDates?.[c.id]) c.targetDate = opts.targetDates[c.id];
  const lessonIx = new Map(courses.flatMap(c => c.lessons.map(l => [c.id + '\u0000' + l.lid, l.index] as const)));
  const views: View[] = used.map(({ row, t, durationMs, events }) => ({
    viewId: row.viewid || null,
    courseId: row.custom1, lessonId: row.custom2, studentId: row.custom3,
    lesson: lessonIx.get(row.custom1 + '\u0000' + row.custom2)!,
    t, daysAgo: Math.floor((today - t) / DAY), durationMs,
    ...normalizeView(row, durationMs, events),
    events,
  }));

  const dataset: Dataset = { today, courses, views, learners: buildLearners(courses, views, today) };
  return { dataset, report };
}

const DAY = 86_400_000;

const lessonNo = (lid: string) => {
  const m = lid.match(/L(\d+)\s*$/i) ?? lid.match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};

/** Courses sorted by distinct students; lessons by trailing number, then first view. Input is chronological. */
function buildCourses(used: { row: RawRow; t: number; durationMs: number }[]): Course[] {
  type L = { lid: string; no: number | null; title: string; dur: number; first: number };
  const C = new Map<string, { students: Set<string>; series: Map<string, number>; les: Map<string, L> }>();
  for (const { row, t, durationMs } of used) {
    let c = C.get(row.custom1);
    if (!c) C.set(row.custom1, c = { students: new Set(), series: new Map(), les: new Map() });
    c.students.add(row.custom3);
    if (!isNoId(row.videoseries)) c.series.set(row.videoseries, (c.series.get(row.videoseries) ?? 0) + 1);
    if (!c.les.has(row.custom2)) c.les.set(row.custom2, { lid: row.custom2, no: lessonNo(row.custom2), title: row.videotitle ?? '', dur: durationMs, first: t });
  }
  const out = [...C].map(([id, c]) => {
    const ls = [...c.les.values()].sort((a, b) => (a.no ?? 1e9) - (b.no ?? 1e9) || a.first - b.first);
    const lessons: Lesson[] = ls.map((l, index) => {
      const m = l.dur / 60000;
      const title = (isNoId(l.title) ? l.lid : l.title).replace(/^Lesson\s*\d+\s*[:.\-]\s*/i, '');
      return { index, n: index + 1, lid: l.lid, title, durationMin: rnd(m), size: m >= CONFIG.sizes.longFromMin ? 'Long' : m >= CONFIG.sizes.mediumFromMin ? 'Medium' : 'Short' };
    });
    let name = id, best = 0;
    for (const [s, n] of c.series) if (n > best) { name = s; best = n; }
    return { course: { id, name, lessons } as Course, students: c.students.size };
  });
  return out.sort((a, b) => b.students - a.students).map(x => x.course);
}
