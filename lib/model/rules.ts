import { CONFIG } from '@/lib/config';
import { rnd } from '@/lib/model/normalize';
import type { Learner } from '@/lib/types';

/** One suggested action per learner, first match wins (S05). */
export function actionFor(l: Pick<Learner, 'health' | 'idle' | 'completed' | 'activeDays14' | 'score' | 'daysLeft'>): Learner['action'] {
  if (l.health === 'Finished') return null;
  const pace = l.score.parts.pace;
  if (pace !== undefined && l.daysLeft !== undefined && pace < CONFIG.actions.tutorPaceBelow && l.daysLeft <= CONFIG.actions.tutorDaysLeft && l.health !== 'Active')
    return { kind: 'tutor_call', reason: `Target date in ${l.daysLeft} days, ${rnd((1 - pace) * 100)}% behind pace, ${l.idle} days idle` };
  if (l.health === 'Gone quiet') return { kind: 'plan_reset', reason: `No watching for ${l.idle} days, stopped in lesson ${l.completed + 1}` };
  if (l.health === 'Cooling') return { kind: 'nudge', reason: `Cooling, last watched ${l.idle} days ago` };
  if (l.score.band === 'At-risk') return { kind: 'catch_up', reason: `Still watching, but readiness ${l.score.value} with ${l.activeDays14} study days in the last 2 weeks` };
  return null;
}

const RANK: Record<NonNullable<Learner['action']>['kind'], number> = { tutor_call: 300, plan_reset: 200, catch_up: 120, nudge: 100 };

/** Sort key for "most urgent first": action rank plus idle days (S12). */
export const urgency = (l: Pick<Learner, 'action' | 'idle'>) => (l.action ? RANK[l.action.kind] : 0) + l.idle;
