import { CONFIG } from '@/lib/config';
import { actionFor } from '@/lib/model/rules';
import { daysUntil, scoreLearner } from '@/lib/model/score';
import type { Course, Device, Health, Learner, View } from '@/lib/types';

/** One learner per student per course. `views` must be chronological. */
export function buildLearners(courses: Course[], views: View[], today: number): Learner[] {
  const W = CONFIG.score.windowDays;
  const out: Learner[] = [];
  for (const c of courses) {
    const daysLeft = c.targetDate ? daysUntil(today, c.targetDate) : undefined;
    const by = new Map<string, View[]>();
    for (const v of views) if (v.courseId === c.id) {
      if (!by.has(v.studentId)) by.set(v.studentId, []);
      by.get(v.studentId)!.push(v);
    }
    for (const [studentId, vs] of by) {
      const maxPos: (number | null)[] = c.lessons.map(() => null);
      for (const v of vs) maxPos[v.lesson] = Math.max(maxPos[v.lesson] ?? 0, v.end);
      let completed = 0;
      while (completed < maxPos.length && (maxPos[completed] ?? 0) >= CONFIG.finishedAt) completed++;
      const days = vs.map(v => v.daysAgo);
      const idle = Math.min(...days);
      const devs = new Map<Device, number>();
      for (const v of vs) devs.set(v.device, (devs.get(v.device) ?? 0) + 1);
      let device = vs[0].device, best = 0;
      for (const [d, n] of devs) if (n > best) { device = d; best = n; }
      const sum = (f: (d: number) => boolean) => vs.reduce((s, v) => s + (f(v.daysAgo) ? v.watchSec : 0), 0);
      const { coolingFromDays, goneQuietAfterDays } = CONFIG.health;
      const health: Health = completed === maxPos.length ? 'Finished'
        : idle < coolingFromDays ? 'Active' : idle <= goneQuietAfterDays ? 'Cooling' : 'Gone quiet';
      const base = {
        studentId, courseId: c.id, views: vs, location: vs[vs.length - 1].location,
        enrolled: Math.max(...days) + 1, maxPos, completed, idle, device,
        activeDays14: new Set(days.filter(d => d < W)).size,
        watch14: sum(d => d < W),
        watchPrev14: sum(d => d >= W && d < 2 * W),
        health,
        ...(daysLeft !== undefined && { daysLeft }),
      };
      const score = scoreLearner(base, daysLeft);
      out.push({ ...base, score, action: actionFor({ ...base, score }) });
    }
  }
  return out;
}
