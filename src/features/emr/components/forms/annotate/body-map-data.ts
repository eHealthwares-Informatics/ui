/* Ported from OrganUI's BodyMap (MIT, Copyright (c) 2026 OrganUI contributors).
 * SVG region geometry and selection logic are OrganUI's; styling is Mantine-native.
 * Source: https://github.com/organui/organui (registry item @organui/body-map).
 */
export type BodyMapView = 'front' | 'back';
export type BodyMapRegion = {
  id: string;
  label: string;
  view: BodyMapView;
  /** SVG path data in the 200 x 440 body coordinate space. */
  d: string;
  /** Reflects the path across the body's midline. */
  mirrored?: boolean;
};

const width = 200;
const height = 440;

// Paired shapes are drawn on the viewer's left. Facing the viewer that is the
// person's right side; seen from behind it is their left.
const shapes = {
  head: 'M100 6C114 6 122 18 122 31C122 45 112 55 100 55C88 55 78 45 78 31C78 18 86 6 100 6Z',
  neck: 'M91 52C96 56 104 56 109 52L113 72L87 72Z',
  shoulder: 'M87 72C74 73 62 76 56 84C52 90 50 98 50 106L68 106L72 86Z',
  chest: 'M100 72L87 72L72 86L73 132L100 132Z',
  upperAbdomen: 'M100 132L73 132C73 145 74 157 75 168L100 168Z',
  lowerAbdomen: 'M100 168L75 168C74 182 72 196 71 210L100 210Z',
  groin: 'M71 210L129 210L127 222L100 238L73 222Z',
  thigh: 'M71 210L73 222L100 238L98 318L77 318C73 292 70 262 69 236C69 226 70 218 71 210Z',
  lowerBack: 'M100 132L73 132C73 152 74 172 74 192L100 192Z',
  buttock: 'M74 192L100 192L100 240C88 246 76 243 70 236C70 220 72 206 74 192Z',
  thighBack: 'M70 236C76 243 88 246 100 240L98 318L77 318C73 292 70 262 70 236Z',
  knee: 'M77 318L98 318L97 344L78 344Z',
  shin: 'M78 344L97 344L95 405L83 405C80 386 77 366 78 344Z',
  foot: 'M83 405L95 405L97 428C91 433 80 433 74 430C74 423 78 414 83 405Z',
  upperArm: 'M50 106L68 106C67 126 66 146 64 166L46 164C46 144 48 124 50 106Z',
  forearm: 'M46 164L64 166C62 186 60 206 58 226L42 224C42 204 44 184 46 164Z',
  hand: 'M42 224L58 226C60 236 59 248 55 258C49 263 41 260 38 251C36 241 38 231 42 224Z',
};

function region(view: BodyMapView, id: string, label: string, d: string): BodyMapRegion {
  return { id, label, view, d };
}

// "{side}" in an ID or label becomes "right" or "left".
function pair(view: BodyMapView, id: string, label: string, d: string): BodyMapRegion[] {
  return (['right', 'left'] as const).map((side) => {
    const text = label.replace('{side}', side);
    return {
      id: id.replace('{side}', side),
      label: text.charAt(0).toUpperCase() + text.slice(1),
      view,
      d,
      mirrored: (view === 'front') === (side === 'left'),
    };
  });
}

export const bodyMapRegions: readonly BodyMapRegion[] = [
  region('front', 'head', 'Head and face', shapes.head),
  region('front', 'neck', 'Neck', shapes.neck),
  ...pair('front', '{side}-shoulder', '{side} shoulder', shapes.shoulder),
  ...pair('front', '{side}-chest', '{side} chest', shapes.chest),
  ...pair('front', '{side}-upper-abdomen', '{side} upper abdomen', shapes.upperAbdomen),
  ...pair('front', '{side}-lower-abdomen', '{side} lower abdomen', shapes.lowerAbdomen),
  region('front', 'groin', 'Groin', shapes.groin),
  ...pair('front', '{side}-upper-arm', '{side} upper arm', shapes.upperArm),
  ...pair('front', '{side}-forearm', '{side} forearm', shapes.forearm),
  ...pair('front', '{side}-palm', '{side} palm', shapes.hand),
  ...pair('front', '{side}-thigh', 'front of {side} thigh', shapes.thigh),
  ...pair('front', '{side}-knee', '{side} knee', shapes.knee),
  ...pair('front', '{side}-shin', '{side} shin', shapes.shin),
  ...pair('front', '{side}-foot', 'top of {side} foot', shapes.foot),
  region('back', 'back-of-head', 'Back of head', shapes.head),
  region('back', 'back-of-neck', 'Back of neck', shapes.neck),
  ...pair('back', '{side}-shoulder-back', 'back of {side} shoulder', shapes.shoulder),
  ...pair('back', '{side}-upper-back', '{side} upper back', shapes.chest),
  ...pair('back', '{side}-lower-back', '{side} lower back', shapes.lowerBack),
  ...pair('back', '{side}-buttock', '{side} buttock', shapes.buttock),
  ...pair('back', '{side}-upper-arm-back', 'back of {side} upper arm', shapes.upperArm),
  ...pair('back', '{side}-forearm-back', 'back of {side} forearm', shapes.forearm),
  ...pair('back', '{side}-hand-back', 'back of {side} hand', shapes.hand),
  ...pair('back', '{side}-thigh-back', 'back of {side} thigh', shapes.thighBack),
  ...pair('back', '{side}-knee-back', 'back of {side} knee', shapes.knee),
  ...pair('back', '{side}-calf', '{side} calf', shapes.shin),
  ...pair('back', '{side}-heel', '{side} heel', shapes.foot),
];

const viewLabels: Record<BodyMapView, string> = {
  front: 'Front',
  back: 'Back',
};

// The middle of a path's bounding box, close enough for arrow key
// navigation. Paths use absolute coordinate pairs only.
export function regionCenter(region: BodyMapRegion): [number, number] {
  const numbers = region.d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [0, 0];
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2;
  const y = (Math.min(...ys) + Math.max(...ys)) / 2;
  return [region.mirrored ? width - x : x, y];
}

const directions: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * The nearest region within 45 degrees of an arrow key's direction, favoring
 * straight lines.
 */
export function nextRegion(
  regions: readonly BodyMapRegion[],
  from: BodyMapRegion,
  key: string
): BodyMapRegion | undefined {
  const direction = directions[key];
  if (!direction) return undefined;
  const [dx, dy] = direction;
  const [fx, fy] = regionCenter(from);
  let best: BodyMapRegion | undefined;
  let bestScore = Infinity;
  for (const candidate of regions) {
    if (candidate === from) continue;
    const [cx, cy] = regionCenter(candidate);
    const along = (cx - fx) * dx + (cy - fy) * dy;
    const across = Math.abs((cx - fx) * dy - (cy - fy) * dx);
    if (along <= 1 || across > along) continue;
    const score = along + across * 2;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/** Toggles an ID, keeping known IDs in selection order. */
export function toggleRegion(
  value: readonly string[],
  id: string,
  regions: readonly BodyMapRegion[] = bodyMapRegions
): string[] {
  const known = new Set(regions.map((region) => region.id));
  const next = value.filter((item) => known.has(item) && item !== id);
  return value.includes(id) ? next : [...next, id];
}
