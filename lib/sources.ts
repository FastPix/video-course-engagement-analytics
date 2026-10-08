/**
 * "Built from" strip (S19): the CSV columns each page is calculated from.
 * Keep in sync with what each page's model functions read (lib/model, docs/DATA-CONTRACT.md).
 */
export type PageKey = 'readiness' | 'learners' | 'learner' | 'overview' | 'lessons' | 'lesson' | 'playback';

const C1 = 'custom_1 course_id', C2 = 'custom_2 lesson_id', C3 = 'custom_3 student_id';
// Score, health and actions (S04, S05): progress from the playhead, idle and study days from view_start, momentum from watch time.
const SCORE = ['view_start', 'view_max_playhead_position', 'video_duration', 'events: ended', 'view_total_content_playback_time', 'video_series'];

export const PAGE_COLUMNS: Record<PageKey, { fastpix: string[]; custom: string[]; lms: string[] }> = {
  readiness: { fastpix: SCORE, custom: [C1, C2, C3], lms: ['target_date'] },
  learners: { fastpix: [...SCORE, 'device_type', 'os_name'], custom: [C1, C2, C3], lms: ['target_date'] },
  learner: {
    fastpix: [...SCORE, 'events: playing', 'events: seeking → seeked', 'events: waiting', 'events: waiting → viewDropped', 'video_title', 'device_type', 'os_name'],
    custom: [C1, C2, C3], lms: ['target_date'],
  },
  overview: {
    fastpix: [...SCORE, 'events: seeking → seeked', 'events: waiting → viewDropped', 'video_title'],
    custom: [C1, C2, C3], lms: ['target_date'],
  },
  lessons: {
    fastpix: ['view_max_playhead_position', 'video_duration', 'events: ended', 'events: seeking → seeked', 'events: waiting → viewDropped', 'video_title', 'video_series'],
    custom: [C1, C2, C3], lms: [],
  },
  lesson: {
    fastpix: ['view_start', 'view_max_playhead_position', 'video_duration', 'events: playing', 'events: ended', 'events: seeking → seeked', 'events: waiting', 'events: waiting → viewDropped', 'video_startup_time', 'device_type', 'os_name', 'video_title', 'video_series'],
    custom: [C1, C2, C3], lms: [],
  },
  playback: {
    fastpix: ['view_max_playhead_position', 'video_duration', 'events: ended', 'events: waiting', 'events: waiting → viewDropped', 'video_startup_time', 'device_type', 'os_name', 'video_title', 'video_series'],
    custom: [C1, C2], lms: [],
  },
};

export const COLUMN_HELP: Record<string, string> = {
  view_start: 'When each view started. Used for last watched, idle days, weekly trends and study rhythm.',
  video_duration: 'Lesson length. Turns playhead positions into % of the lesson.',
  view_max_playhead_position: 'Furthest point reached in the view. Used for progress and finished lessons.',
  view_total_content_playback_time: 'Real time spent playing video. Used for watch time and momentum.',
  'events: playing': 'Where playback started in each view.',
  'events: ended': 'The view reached the end of the lesson.',
  'events: seeking → seeked': 'A jump backwards. Counted as a rewatch at that point of the lesson.',
  'events: waiting': 'The video stalled to buffer.',
  'events: waiting → viewDropped': 'The learner left while the video was buffering.',
  video_title: 'Lesson name.',
  video_series: 'Course name.',
  device_type: 'Desktop, mobile or TV.',
  os_name: 'Splits mobile into Android and iPhone.',
  video_startup_time: 'How long the video took to start.',
  [C1]: 'Groups views into a course.',
  [C2]: 'Which lesson, and its order from the number at the end.',
  [C3]: 'Which learner watched. The plain student ID from your LMS.',
  target_date: 'Not in the export. Set on the Data page. Used for pace and days left.',
};

/** Page key for a route, or null where the strip is not shown (Connector, Video Data, home). */
export function pageKeyOf(pathname: string): PageKey | null {
  const [a, b] = pathname.split('/').filter(Boolean);
  if (a === 'learners') return b ? 'learner' : 'learners';
  if (a === 'lessons') return b ? 'lesson' : 'lessons';
  return (['readiness', 'overview', 'playback'] as const).find(k => k === a) ?? null;
}
