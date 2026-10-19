/** Equal readiness milestones, as in the previous portfolio loader. */
export function readinessProgress(previous, states) {
  const completed = states.filter(Boolean).length;
  const target = completed === states.length ? 100 : Math.min(99, Math.round(completed / states.length * 100));
  return Math.max(previous, target);
}
