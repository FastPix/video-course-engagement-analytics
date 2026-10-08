import type { PlayerEvent } from '@/lib/types';

const num = (v: unknown) => Number(v) || 0;

/** Player events in either export shape. Bad JSON or unnamed items are dropped. */
export function parseEvents(json: string | undefined): PlayerEvent[] {
  let raw: unknown;
  try { raw = JSON.parse(json ?? ''); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  const out: PlayerEvent[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    if ('e' in x) out.push({ e: String(x.e ?? ''), pt: num(x.pt), vt: num(x.vt) });
    else if ('event_name' in x) out.push({ e: String(x.event_name ?? ''), pt: num(x.player_playhead_time), vt: num(x.viewer_time || x.event_time) });
  }
  return out.filter(x => x.e);
}
