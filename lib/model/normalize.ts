import { CONFIG } from '@/lib/config';
import type { Device, Location, PlayerEvent, RawRow, View } from '@/lib/types';

/** Round half up, like the reference model. */
export const rnd = (x: number) => Math.floor(x + 0.5);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function deviceOf(type: string | undefined, os: string | undefined): Device {
  const t = (type ?? '').toLowerCase(), o = (os ?? '').toLowerCase();
  if (t.includes('tv')) return 'Smart TV';
  if (t.includes('desk')) return 'Desktop browser';
  if (o.includes('ios') || o.includes('iphone') || o.includes('ipad')) return 'iPhone';
  return 'Android phone';
}

const geo = (v: string | undefined) => { const s = (v ?? '').trim(); return !s || ['null', 'n/a', 'nan', 'none'].includes(s.toLowerCase()) ? null : s; };

/** Location from the export's city, region and country (S12). City falls back to region, then "-". */
export function locationOf(row: RawRow): Location {
  const city = geo(row.city), region = geo(row.region), country = geo(row.country);
  const label = city && region ? `${city}, ${region}` : city ?? region ?? '-';
  return { city, region, country, label };
}

/** The event-derived fields of a View (S03 table). */
export function normalizeView(row: RawRow, D: number, E: PlayerEvent[]) {
  const playing = E.findIndex(x => x.e === 'playing');
  let start = playing >= 0 ? clamp(E[playing].pt / D, 0, 1) : 0;
  if (start < CONFIG.startFloor) start = 0;
  const end = Math.max(start, E.some(x => x.e === 'ended') ? 1 : clamp(Number(row.viewmaxplayheadposition) / D || 0, 0, 1));

  const rewatches: number[] = [];
  E.forEach((x, k) => {
    if (x.e !== 'seeking') return;
    const next = E.slice(k + 1).find(y => y.e === 'seeked');
    if (next && next.pt <= x.pt - CONFIG.rewatchMinJumpMs) rewatches.push(clamp(x.pt / D, 0, 1));
  });

  let buffer: number | null = null;
  if (playing >= 0) {
    const k = E.findIndex((x, i) => i > playing && x.e === 'waiting' && E[i - 1].e !== 'seeking');
    if (k >= 0) buffer = clamp(E[k].pt / D, 0, 1);
  }
  const tail = E.filter(x => !['variantChanged', 'requestFailed', 'requestCanceled'].includes(x.e)).slice(-2).map(x => x.e);
  const bufferExit = tail.length === 2 && ['waiting', 'buffering'].includes(tail[0]) && ['viewDropped', 'viewEnd'].includes(tail[1]);
  if (bufferExit && buffer === null) buffer = end;

  const play = Number(row.viewtotalcontentplaybacktime) || 0;
  const watchSec = rnd((play || Math.max(0, end - start) * D) / 1000);
  const su = (row.videostartuptime ?? '').trim();
  const startupSec = su && !Number.isNaN(Number(su)) ? Number(su) / 1000 : 1.2;

  return { start, end, rewatches, buffer, bufferExit, watchSec, device: deviceOf(row.devicetype, row.osname), startupSec, location: locationOf(row) } satisfies Partial<View>;
}
