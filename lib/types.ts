/**
 * Data contract for FastPix Learner Signals.
 * Specs S02 to S07 and docs/DATA-CONTRACT.md define how each field is calculated.
 * Do not change this file without a /spec-change.
 */

/** One CSV row with normalised header keys (lowercase, letters and digits only). */
export type RawRow = Record<string, string>;

export type Device = 'Android phone' | 'iPhone' | 'Desktop browser' | 'Smart TV';
export type Health = 'Active' | 'Cooling' | 'Gone quiet' | 'Finished';
export type Band = 'Ready' | 'Building' | 'At-risk';
export type ActionKind = 'tutor_call' | 'plan_reset' | 'nudge' | 'catch_up';
export type LessonStatus = 'Fix stream' | 'Rewrite' | 'Re-cut' | 'Add example' | 'Healthy';
export type ActionState = 'open' | 'in_progress' | 'snoozed' | 'done';

/** Spec S02 */
export interface LoadReport {
  files: number;
  rows: number;
  viewsUsed: number;
  skippedNoIds: number;
  skippedBroken: number;
  duplicates: number;
  missingRequired: string[];   // display names, e.g. "custom_3 (student ID)"
  presentOptional: string[];
  dateFrom: string | null;     // YYYY-MM-DD (UTC)
  dateTo: string | null;
}

/** Spec S12: where a view came from (export columns city, region, country). Display only. */
export interface Location {
  city: string | null;
  region: string | null;
  country: string | null;
  label: string;           // "{city}, {region}", or region, or "-"
}

/** Spec S03 */
export interface PlayerEvent {
  e: string;   // event name
  pt: number;  // playhead in ms
  vt: number;  // viewer time, epoch ms
}

/** Spec S03: one normalised view */
export interface View {
  viewId: string | null;
  courseId: string;        // custom_1
  lessonId: string;        // custom_2
  studentId: string;       // custom_3
  lesson: number;          // lesson index inside the course, 0-based
  t: number;               // view start, epoch ms
  daysAgo: number;         // whole days before dataset "today"
  durationMs: number;
  start: number;           // 0 to 1
  end: number;             // 0 to 1, never below start
  rewatches: number[];     // positions 0 to 1
  buffer: number | null;   // position of first mid-play stall
  bufferExit: boolean;     // view ended while buffering
  watchSec: number;
  device: Device;
  startupSec: number;
  location: Location;      // spec S12
  events: PlayerEvent[];
}

/** Spec S03 */
export interface Lesson {
  index: number;
  n: number;               // index + 1
  lid: string;             // custom_2 value
  title: string;
  durationMin: number;
  size: 'Short' | 'Medium' | 'Long';
}

export interface Course {
  id: string;
  name: string;
  lessons: Lesson[];
  targetDate?: string;     // YYYY-MM-DD, optional, set on the Data page (spec S05)
}

/** Spec S05 */
export interface Score {
  value: number;           // 0 to 100, rounded
  band: Band;
  parts: {
    completion: number;
    consistency: number;
    recency: number;
    momentum: number;
    pace?: number;         // only when the course has a targetDate
  };
}

/** Spec S04 */
export interface Learner {
  studentId: string;
  courseId: string;
  views: View[];           // chronological
  enrolled: number;        // days since first view + 1
  maxPos: (number | null)[];
  completed: number;       // lessons finished in a row from lesson 1
  idle: number;            // days since last view
  device: Device;          // most used
  activeDays14: number;
  watch14: number;         // seconds, last 14 days
  watchPrev14: number;     // seconds, the 14 days before that
  health: Health;
  score: Score;            // spec S05
  action: { kind: ActionKind; reason: string } | null; // spec S05
  daysLeft?: number;       // only when the course has a targetDate
  location: Location;      // spec S12: from the most recent view
}

/** Spec S06 */
export interface LessonStats {
  lessonId: string;
  started: number;
  views: number;
  finishedPct: number;
  earlyPct: number;
  retention: number[];       // 51 points, % still watching at 0, 2, 4 ... 100%
  rewatches: number;
  rewatchBins10: number[];
  rewatchBins20: number[];
  rewatchPerStarter: number;
  peakBin: number;           // index of the largest rewatchBins10 value
  exitsBuffer: number[];     // end positions of views that ended while buffering
  exitsClean: number[];      // end positions of other unfinished views
  bufferExitPct: number;
  stallPct: number;          // % of views with a mid-play stall
  avgStartupSec: number;
  status: LessonStatus;
  reason: string;
}

export interface Dataset {
  today: number;             // epoch ms, end of the UTC day of the latest view
  courses: Course[];         // sorted by number of students, largest first
  views: View[];             // chronological
  learners: Learner[];       // one per student per course
}

export interface LoadOptions {
  targetDates?: Record<string, string>; // courseId -> YYYY-MM-DD
}

export interface LoadResult {
  dataset: Dataset | null;   // null when required columns are missing or no usable rows
  report: LoadReport;
}
