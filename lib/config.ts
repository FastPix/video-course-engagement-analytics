/**
 * Every threshold and weight used by lib/model.
 * Values come from specs S04 to S06. Change them only through /spec-change,
 * then regenerate tests/fixtures/expected.json.
 */
export const CONFIG = {
  finishedAt: 0.97,          // a lesson counts as finished at 97%
  startFloor: 0.01,          // starts below 1% count as 0
  rewatchMinJumpMs: 1000,    // a seek back must be at least 1 s to count

  health: { coolingFromDays: 10, goneQuietAfterDays: 20 },

  score: {
    weights: { completion: 0.4, consistency: 0.2, recency: 0.2, momentum: 0.2 },
    paceWeight: 0.25,        // added when a course has a target date, others rescaled
    consistencyFullAtDays: 6,
    recencyZeroAtDays: 30,
    windowDays: 14,
    bands: { ready: 70, building: 50 },
  },

  actions: { tutorPaceBelow: 0.85, tutorDaysLeft: 14 },

  lessons: {
    earlyAt: 0.3,
    highlightPct: 15,        // Lessons table: Not finished and Left early values at or above this show in coral
    fixStream: { bufferExitPct: 35, minExits: 12 },
    rewrite: { earlyPct: 35, earlyPctWithLowFinish: 30, lowFinishPct: 60 },
    recut: { peakBinFrom: 6, rewatchPerStarter: 0.5 },
    addExample: { rewatchPerStarter: 0.5 },
  },

  sizes: { longFromMin: 20, mediumFromMin: 12 },
} as const;

export type Config = typeof CONFIG;
