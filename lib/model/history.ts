import { buildLearners } from '@/lib/model/learners';
import type { Dataset } from '@/lib/types';

const DAY = 86_400_000;
const memo = new WeakMap<Dataset, Map<number, Dataset>>();

/** The dataset as it looked `daysBack` days ago, rebuilt from the same views (S07). */
export function asOf(ds: Dataset, daysBack: number): Dataset {
  let m = memo.get(ds);
  if (!m) memo.set(ds, m = new Map());
  const hit = m.get(daysBack);
  if (hit) return hit;
  const today = ds.today - daysBack * DAY;
  const views = ds.views.filter(v => v.daysAgo >= daysBack).map(v => ({ ...v, daysAgo: v.daysAgo - daysBack }));
  const out: Dataset = { today, courses: ds.courses, views, learners: buildLearners(ds.courses, views, today) };
  m.set(daysBack, out);
  return out;
}
