/** @typedef {{x:number,y:number,size:number,scroll:number,stage:string}} Stop */
/** @typedef {{from:Stop,to:Stop,c1:{x:number,y:number},c2:{x:number,y:number},rail:boolean,hold:boolean,length:number,lengths:number[]}} Segment */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const STEPS = 80;

/** @param {Segment} segment @param {number} t */
function position({ from, to, c1, c2 }, t) {
  const u = 1 - t;
  return {
    x: u ** 3 * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * to.x,
    y: u ** 3 * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * to.y,
  };
}

/** Cache smooth, shared tangents and arc lengths on layout changes, never per frame.
 * @param {Stop[]} stops @param {number} width
 */
export function createJourney(stops, width) {
  const gutter = Math.min(24, width / 4);
  const points = stops.map(stop => ({
    ...stop,
    x: clamp(stop.x, gutter, width - gutter),
  }));
  const tangents = points.map((point, i) => {
    const previous = points[i - 1] || point;
    const next = points[i + 1] || point;
    const before = Math.hypot(point.x - previous.x, point.y - previous.y);
    const after = Math.hypot(next.x - point.x, next.y - point.y);
    const reach = Math.min(before || after, after || before) * 0.34;
    // Join the measured company rail vertically, including the entry and exit.
    if (
      point.stage === 'experience' &&
      (previous.stage === 'experience' || next.stage === 'experience')
    ) {
      return { x: 0, y: reach };
    }
    // Angle bisector: each side of a join shares precisely the same tangent.
    const dx =
      (before ? (point.x - previous.x) / before : 0) +
      (after ? (next.x - point.x) / after : 0);
    const dy =
      (before ? (point.y - previous.y) / before : 0) +
      (after ? (next.y - point.y) / after : 0);
    if (point.x === gutter || point.x === width - gutter)
      return { x: 0, y: Math.sign(dy) * reach };
    const length = Math.hypot(dx, dy) || 1;
    return { x: (dx / length) * reach, y: (dy / length) * reach };
  });
  /** @type {Segment[]} */
  const segments = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1],
      to = points[i];
    const rail =
      from.stage === 'experience' && to.stage === 'experience' && from.x === to.x;
    const hold = from.x === to.x && from.y === to.y;
    const segment = {
      from,
      to,
      rail,
      hold,
      c1: {
        x: clamp(from.x + tangents[i - 1].x, gutter, width - gutter),
        y: from.y + tangents[i - 1].y,
      },
      c2: {
        x: clamp(to.x - tangents[i].x, gutter, width - gutter),
        y: to.y - tangents[i].y,
      },
      length: 0,
      lengths: [0],
    };
    let previous = { x: from.x, y: from.y };
    for (let step = 1; step <= STEPS; step++) {
      const point =
        rail || hold
          ? { x: from.x, y: from.y + ((to.y - from.y) * step) / STEPS }
          : position(segment, step / STEPS);
      segment.length += Math.hypot(point.x - previous.x, point.y - previous.y);
      segment.lengths.push(segment.length);
      previous = point;
    }
    segments.push(segment);
  }
  return { points, segments };
}

/** Pure reversible sampling. Invert the cached length table so small scrolls
 * advance by small distances, without slowing to a halt at every curve join.
 * @param {ReturnType<typeof createJourney>} journey @param {number} scroll
 */
export function sampleJourney(journey, scroll) {
  const { points, segments } = journey;
  if (!points.length) return null;
  const last = points[points.length - 1];
  if (scroll >= last.scroll) return { ...last, rotation: 0, onRail: false };
  if (scroll <= points[0].scroll) return { ...points[0], rotation: 0, onRail: false };
  const segment = segments.find(segment => segment.to.scroll > scroll);
  if (!segment) return { ...last, rotation: 0, onRail: false };
  const { from, to, rail, hold, lengths, length } = segment;
  const progress = clamp(
    (scroll - from.scroll) / Math.max(0.001, to.scroll - from.scroll),
    0,
    1
  );
  let t = progress;
  if (!rail && !hold && length > 0) {
    const distance = progress * length;
    let low = 0,
      high = STEPS;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (lengths[middle] < distance) low = middle;
      else high = middle;
    }
    t =
      (low +
        (distance - lengths[low]) / Math.max(0.00001, lengths[high] - lengths[low])) /
      STEPS;
  }
  const point =
    rail || hold
      ? { x: from.x, y: from.y + (to.y - from.y) * progress }
      : position(segment, t);
  return {
    ...point,
    size: from.size + (to.size - from.size) * progress,
    rotation: 0,
    stage: progress === 0 ? from.stage : to.stage,
    scroll,
    onRail: rail,
  };
}
