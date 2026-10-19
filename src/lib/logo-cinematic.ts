import { sampleJourney } from './logo-journey.js';
import type { createJourney } from './logo-journey.js';

type Journey = ReturnType<typeof createJourney>;
type CameraStop = { distance: number; camera: number };

// Reference service timeline: end = horizontal distance * 1.16, scrub = 1.
// A 220ms response constant settles over about one second, without a second RAF.
export const LOGO_MOTION = {
  scrollPerPixel: 1.16,
  responseSeconds: 0.22,
  cameraAnchor: 0.55,
  techStackPace: 0.65,
};

export function createCinematicJourney(
  journey: Journey,
  height: number,
  maxCamera: number,
  width: number
) {
  let distance = 0;
  if (journey.points.length) journey.points[0].scroll = 0;
  for (const segment of journey.segments) {
    const pace = segment.to.stage === 'tech-stack' ? LOGO_MOTION.techStackPace : 1;
    distance += segment.length * pace;
    segment.to.scroll = distance;
  }
  const cameras: CameraStop[] = [{ distance: 0, camera: 0 }];
  let camera = 0;
  for (const segment of journey.segments) {
    const steps = Math.max(1, Math.ceil(segment.length / 8));
    const timingLength = segment.to.scroll - segment.from.scroll;
    for (let step = 1; step <= steps; step++) {
      const at = segment.from.scroll + (timingLength * step) / steps;
      const point = sampleJourney(journey, at)!;
      // Upward curls never pull the page backward. A horizontal sweep holds the
      // camera; a descending mark carries the page once it reaches the anchor.
      camera = Math.max(
        camera,
        Math.min(maxCamera, Math.max(0, point.y - height * LOGO_MOTION.cameraAnchor))
      );
      cameras.push({ distance: at, camera });
    }
  }
  // The journey ends at the orbit. Remaining content scrolls normally while
  // the logo stays attached to that same document position.
  const dockCamera = camera;
  const routeInput = distance * LOGO_MOTION.scrollPerPixel;
  const turns = Math.max(1, Math.round(distance / (Math.max(width, height) * 2)));
  return {
    journey,
    cameras,
    distance,
    maxCamera,
    dockCamera,
    routeInput,
    maxInput: routeInput + Math.max(0, maxCamera - dockCamera),
    rotations: [
      { distance: 0, angle: 0 },
      { distance, angle: turns * 360 },
    ],
  };
}
export type CinematicJourney = ReturnType<typeof createCinematicJourney>;

export function sampleCinematicJourney(model: CinematicJourney, input: number) {
  const distance = Math.max(
    0,
    Math.min(model.distance, input / LOGO_MOTION.scrollPerPixel)
  );
  const point = sampleJourney(model.journey, distance);
  if (!point) return null;
  let low = 0,
    high = model.cameras.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (model.cameras[middle].distance < distance) low = middle;
    else high = middle;
  }
  const a = model.cameras[low],
    b = model.cameras[high];
  const t = (distance - a.distance) / Math.max(0.00001, b.distance - a.distance);
  const camera = Math.min(
    model.maxCamera,
    a.camera + (b.camera - a.camera) * t + Math.max(0, input - model.routeInput)
  );
  const next = model.rotations.findIndex(
    (stop, index) => index > 0 && stop.distance >= distance
  );
  const r1 = model.rotations[Math.max(1, next)],
    r0 = model.rotations[Math.max(0, next - 1)];
  const progress = Math.max(
    0,
    Math.min(1, (distance - r0.distance) / Math.max(1, r1.distance - r0.distance))
  );
  const eased = progress * progress * (3 - 2 * progress);
  return {
    ...point,
    camera,
    distance,
    rotation: r0.angle + (r1.angle - r0.angle) * eased,
  };
}

export function inputForCamera(model: CinematicJourney, camera: number) {
  if (camera <= 0) return 0;
  if (camera >= model.maxCamera) return model.maxInput;
  if (camera >= model.dockCamera) return model.routeInput + camera - model.dockCamera;
  let low = 0,
    high = model.cameras.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (model.cameras[middle].camera < camera) low = middle;
    else high = middle;
  }
  const a = model.cameras[low],
    b = model.cameras[high];
  const t = (camera - a.camera) / Math.max(0.00001, b.camera - a.camera);
  return (a.distance + (b.distance - a.distance) * t) * LOGO_MOTION.scrollPerPixel;
}
