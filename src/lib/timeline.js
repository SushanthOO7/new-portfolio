/** Pure geometry shared by scroll rendering and content-count regression tests. */
export function getTimelineState(anchors, progress) {
  if (!anchors.length) return { y: 0, intensity: 0 };
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  const y = first + (last - first) * Math.max(0, Math.min(1, progress));
  let distance = Infinity;
  for (let i = 0; i < anchors.length; i++) {
    const span = Math.max(1, Math.min(anchors[i] - (anchors[i - 1] ?? anchors[i] - 300), (anchors[i + 1] ?? anchors[i] + 300) - anchors[i]));
    distance = Math.min(distance, Math.abs(y - anchors[i]) / span);
  }
  return { y, intensity: .25 + .75 * Math.pow(Math.max(0, 1 - distance * 2), 2) };
}
