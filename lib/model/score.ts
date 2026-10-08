import { CONFIG } from '@/lib/config';
import { clamp, rnd } from '@/lib/model/normalize';
import type { Band, Learner, Score } from '@/lib/types';

const DAY = 86_400_000;

/** Calendar days from the UTC date of `today` to `target` (YYYY-MM-DD). */
export function daysUntil(today: number, target: string): number {
  const d = new Date(today);
  return Math.round((Date.parse(target) - Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())) / DAY);
}

export const bandOf = (value: number): Band =>
  value >= CONFIG.score.bands.ready ? 'Ready' : value >= CONFIG.score.bands.building ? 'Building' : 'At-risk';

type ScoreInput = Pick<Learner, 'maxPos' | 'activeDays14' | 'idle' | 'watch14' | 'watchPrev14' | 'health' | 'completed' | 'enrolled'>;

export function scoreLearner(l: ScoreInput, daysLeft?: number): Score {
  const s = CONFIG.score;
  const fin = l.health === 'Finished';
  const momentum = l.watch14 === 0 && l.watchPrev14 === 0 ? 0
    : l.watchPrev14 === 0 ? 1 : clamp(0.5 + (l.watch14 / l.watchPrev14 - 1) / 2, 0, 1);
  const parts: Score['parts'] = {
    completion: l.maxPos.reduce<number>((a, m) => a + Math.min(1, m ?? 0), 0) / l.maxPos.length,
    consistency: fin ? 1 : Math.min(1, l.activeDays14 / s.consistencyFullAtDays),
    recency: fin ? 1 : Math.max(0, 1 - l.idle / s.recencyZeroAtDays),
    momentum: fin ? 1 : momentum,
  };
  let total = parts.completion * s.weights.completion + parts.consistency * s.weights.consistency
    + parts.recency * s.weights.recency + parts.momentum * s.weights.momentum;
  if (daysLeft !== undefined) {
    const expected = l.enrolled / (l.enrolled + daysLeft);
    parts.pace = clamp((l.completed / l.maxPos.length) / expected, 0, 1) || 0;
    total = total * (1 - s.paceWeight) + parts.pace * s.paceWeight;
  }
  const value = rnd(100 * total);
  return { value, band: bandOf(value), parts };
}
