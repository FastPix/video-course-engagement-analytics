import { CONFIG } from '@/lib/config';
import { rnd } from '@/lib/model/normalize';
import type { Dataset, Device, LessonStats, LessonStatus } from '@/lib/types';

const pct = (a: number, b: number) => (b ? rnd((100 * a) / b) : 0);

/** Stats and status for one lesson, optionally for one device only (S06). */
export function lessonStats(ds: Dataset, courseId: string, lessonIndex: number, device?: Device): LessonStats {
  const fin = CONFIG.finishedAt, L = CONFIG.lessons;
  const lessonId = ds.courses.find(c => c.id === courseId)?.lessons[lessonIndex]?.lid ?? '';
  const vs = ds.views.filter(v => v.courseId === courseId && v.lesson === lessonIndex && (!device || v.device === device));

  const first = new Map<string, (typeof vs)[number]>();
  const maxEnd = new Map<string, number>();
  for (const v of vs) {
    if (!first.has(v.studentId)) first.set(v.studentId, v);
    maxEnd.set(v.studentId, Math.max(maxEnd.get(v.studentId) ?? 0, v.end));
  }
  const fv = [...first.values()];
  const started = first.size;

  const rewatchBins10 = Array<number>(10).fill(0), rewatchBins20 = Array<number>(20).fill(0);
  const exitsBuffer: number[] = [], exitsClean: number[] = [];
  let rewatches = 0;
  for (const v of vs) {
    for (const p of v.rewatches) {
      rewatchBins10[Math.min(9, Math.floor(p * 10))]++;
      rewatchBins20[Math.min(19, Math.floor(p * 20))]++;
      rewatches++;
    }
    if (v.end < fin) (v.bufferExit ? exitsBuffer : exitsClean).push(v.end);
  }

  const finishedPct = pct([...maxEnd.values()].filter(m => m >= fin).length, started);
  const earlyPct = pct(fv.filter(v => v.end < L.earlyAt).length, fv.length);
  const retention = Array.from({ length: 51 }, (_, x) => pct(fv.filter(v => v.end >= Math.min(x / 50, fin) - 1e-9).length, fv.length));
  const exits = exitsBuffer.length + exitsClean.length;
  const bufferExitPct = pct(exitsBuffer.length, exits);
  const rewatchPerStarter = rewatches / Math.max(1, started);
  const peakBin = rewatchBins10.indexOf(Math.max(...rewatchBins10));

  let status: LessonStatus, reason: string;
  if (bufferExitPct >= L.fixStream.bufferExitPct && exits >= L.fixStream.minExits) {
    status = 'Fix stream';
    reason = `${bufferExitPct}% of exits happened while the video was buffering. Check delivery before editing the lesson.`;
  } else if (earlyPct >= L.rewrite.earlyPct || (earlyPct >= L.rewrite.earlyPctWithLowFinish && finishedPct < L.rewrite.lowFinishPct)) {
    status = 'Rewrite';
    reason = `${earlyPct}% leave in the first 30% of the video. The opening loses people.`;
  } else if (peakBin >= L.recut.peakBinFrom && rewatchPerStarter > L.recut.rewatchPerStarter) {
    status = 'Re-cut';
    reason = `Rewatching peaks at ${peakBin * 10} to ${peakBin * 10 + 10}%. The key step lands too late, so move it forward.`;
  } else if (rewatchPerStarter > L.addExample.rewatchPerStarter) {
    status = 'Add example';
    reason = 'Dense rewatching but learners stay. Add a worked example after the peak.';
  } else {
    status = 'Healthy';
    reason = 'Most learners finish and few leave early.';
  }

  return {
    lessonId, started, views: vs.length, finishedPct, earlyPct, retention,
    rewatches, rewatchBins10, rewatchBins20, rewatchPerStarter, peakBin,
    exitsBuffer, exitsClean, bufferExitPct,
    stallPct: pct(vs.filter(v => v.buffer !== null).length, vs.length),
    avgStartupSec: vs.length ? vs.reduce((s, v) => s + v.startupSec, 0) / vs.length : 0,
    status, reason,
  };
}

/** Playback order (S18): Fix stream lessons first, then by share of exits while buffering. */
export const playbackOrder = (stats: LessonStats[]) =>
  [...stats].sort((a, b) => Number(b.status === 'Fix stream') - Number(a.status === 'Fix stream') || b.bufferExitPct - a.bufferExitPct);
