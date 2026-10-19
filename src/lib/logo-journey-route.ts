import { createJourney } from './logo-journey.js';

type Point = { x: number; y: number };
type Dock = Point & { width: number };
type Section = { top: number; bottom: number };
type Stop = Point & { size: number; scroll: number; stage: string };
export type JourneyLayout = {
  width: number;
  height: number;
  maxScroll: number;
  start: Dock;
  end: Dock | null;
  hero: Section;
  experience: Section | null;
  rail: Point[];
  projects: Section | null;
  projectsHeading?: Section | null;
  activity?: (Section & { left: number }) | null;
  tech: Section | null;
  orbit: Dock | null;
  contact: Section | null;
  footer: Section | null;
};
type Knot = [number, number];

/** Reference-image route, in fractions of each measured section. Edit these
 * knots to art-direct the trajectory; shared tangents round every join.
 * Upward curls are intentional, including the hero's lower-right return.
 */
export const HERO_ROUTE: Knot[] = [
  [0.12, 0.108],
  [0.26, 0.048],
  [0.38, 0.086],
  [0.46, 0.075],
  [0.505, 0.108],
  [0.532, 0.196],
  [0.6, 0.207],
  [0.65, 0.235],
  [0.685, 0.305],
  [0.73, 0.328],
  [0.8, 0.303],
  [0.855, 0.288],
  [0.918, 0.312],
  [0.953, 0.369],
  [0.95, 0.43],
  [0.93, 0.505],
  [0.949, 0.558],
  [0.972, 0.608],
  [0.978, 0.7],
  [0.964, 0.754],
  [0.922, 0.768],
  [0.86, 0.748],
  [0.81, 0.725],
  [0.795, 0.773],
  [0.76, 0.85],
  [0.7, 0.858],
  [0.65, 0.865],
  [0.628, 0.9],
  [0.59, 0.92],
  [0.54, 0.922],
  [0.506, 0.94],
  [0.506, 0.985],
];

export function createReferenceJourney(layout: JourneyLayout) {
  const { width, height, maxScroll, start } = layout;
  const size = start.width;
  const stops: Stop[] = [{ x: start.x, y: start.y, size, scroll: 0, stage: 'hero' }];
  const anchors = [{ index: 0, scroll: 0 }];
  const arrival = (y: number) => Math.max(0, Math.min(maxScroll, y - height * 0.55));
  const append = (
    points: Point[],
    stage: string,
    scroll: number,
    destinationSize = size
  ) => {
    if (!points.length) return;
    const initialSize = stops.at(-1)!.size;
    points.forEach((point, i) =>
      stops.push({
        ...point,
        stage,
        scroll: 0,
        size: initialSize + ((destinationSize - initialSize) * (i + 1)) / points.length,
      })
    );
    anchors.push({ index: stops.length - 1, scroll });
  };
  const map = (section: Section, knots: Knot[]) =>
    knots.map(([x, y]) => ({
      x: x * width,
      y: section.top + (section.bottom - section.top) * y,
    }));
  const heroEnd = Math.min(
    (layout.hero.bottom - layout.hero.top) * 0.65,
    layout.rail.length ? arrival(layout.rail[0].y) * 0.8 : maxScroll * 0.18
  );
  // Give the high horizontal sweep its own scroll range so it remains visible
  // above the headline, then follow the right edge and the lower upward curl.
  append(map(layout.hero, HERO_ROUTE.slice(0, 5)), 'hero', heroEnd * 0.085);
  append(map(layout.hero, HERO_ROUTE.slice(5, 14)), 'hero', heroEnd * 0.34);
  append(map(layout.hero, HERO_ROUTE.slice(14, 20)), 'hero', heroEnd * 0.64);
  append(map(layout.hero, HERO_ROUTE.slice(20)), 'hero', heroEnd);

  if (layout.experience && layout.rail.length) {
    const first = layout.rail[0];
    const top = layout.experience.top;
    const gap = Math.max(80, first.y - top);
    // Around the right of the heading, back left, and vertically onto the rail.
    append(
      [
        { x: width * 0.505, y: top + gap * 0.12 },
        { x: width * 0.59, y: top + gap * 0.18 },
        { x: width * 0.625, y: top + gap * 0.39 },
        { x: width * 0.68, y: top + gap * 0.53 },
        { x: width * 0.705, y: top + gap * 0.76 },
        { x: width * 0.68, y: top + gap * 0.9 },
        { x: width * 0.615, y: top + gap * 0.9 },
        { x: first.x + width * 0.055, y: first.y - gap * 0.2 },
        { x: first.x, y: first.y - gap * 0.16 },
      ],
      'experience-entry',
      arrival(first.y) - Math.min(40, gap * 0.08)
    );
    append([first], 'experience', arrival(first.y));
    for (const point of layout.rail.slice(1))
      append([point], 'experience', arrival(point.y));
  }
  if (layout.projects) {
    const section = layout.projects;
    const heading = layout.projectsHeading || {
      top: section.top,
      bottom: section.top + Math.min(height * 0.36, (section.bottom - section.top) * 0.3),
    };
    const headingHeight = heading.bottom - heading.top;
    append(
      map(heading, [
        [0.49, -0.13],
        [0.51, 0.03],
        [0.5, 0.2],
        [0.455, 0.24],
        [0.4, 0.12],
        [0.35, 0.09],
        [0.325, 0.25],
        [0.3, 0.42],
        [0.25, 0.46],
        [0.19, 0.46],
        [0.145, 0.55],
      ]),
      'projects',
      arrival(heading.top + headingHeight * 0.55)
    );
    const folder = {
      top: heading.top + headingHeight * 0.55,
      bottom: layout.activity?.top || section.bottom,
    };
    const exitScroll = Math.min(
      arrival(section.bottom),
      layout.orbit ? arrival(layout.orbit.y) - height * 0.35 : maxScroll * 0.65
    );
    append(
      map(folder, [
        [0.132, 0.08],
        [0.16, 0.16],
        [0.195, 0.27],
        [0.2, 0.38],
        [0.185, 0.47],
        [0.15, 0.56],
        [0.13, 0.72],
        [0.115, 0.85],
        [0.12, 0.92],
      ]),
      'projects',
      layout.activity ? arrival(layout.activity.top) - 30 : exitScroll
    );
    if (layout.activity) {
      // Keep the full logo outside the contribution panel, not over its cells.
      const x = Math.max(24, layout.activity.left - size / 2 - 12);
      const top = layout.activity.top,
        span = section.bottom - top;
      append(
        [
          { x, y: top + span * 0.06 },
          { x: Math.max(24, x - 16), y: top + span * 0.26 },
          { x, y: top + span * 0.47 },
          { x: Math.max(24, x - 22), y: top + span * 0.63 },
          { x: Math.max(24, x - 24), y: top + span * 0.86 },
          { x, y: top + span * 0.96 },
        ],
        'projects',
        exitScroll
      );
    }
  }
  if (layout.tech && layout.orbit) {
    const section = layout.tech;
    const orbit = layout.orbit;
    append(
      [
        ...map(section, [
          [0.065, -0.06],
          [0.115, -0.065],
          [0.175, -0.025],
          [0.24, -0.035],
          [0.33, -0.05],
          [0.375, -0.025],
          [0.39, 0.05],
          [0.39, 0.145],
          [0.365, 0.235],
          [0.37, 0.3],
          [0.385, 0.35],
          [0.395, 0.44],
        ]),
        { x: orbit.x - width * 0.24, y: orbit.y - height * 0.07 },
        { x: orbit.x - width * 0.15, y: orbit.y - height * 0.065 },
        { x: orbit.x - width * 0.065, y: orbit.y - height * 0.025 },
        orbit,
      ],
      'tech-stack',
      arrival(orbit.y),
      orbit.width
    );
  }

  const journey = createJourney(stops, width);
  // Pace each authored portion by actual curve distance rather than knot count.
  // All intermediate knots remain reachable, including backward/upward curls.
  for (let i = 1; i < anchors.length; i++) {
    const from = anchors[i - 1],
      to = anchors[i];
    const startScroll = Math.max(0, Math.min(maxScroll, from.scroll));
    const endScroll = Math.max(startScroll, Math.min(maxScroll, to.scroll));
    const segments = journey.segments.slice(from.index, to.index);
    const length = segments.reduce((sum, segment) => sum + segment.length, 0);
    let distance = 0;
    for (const segment of segments) {
      distance += segment.length;
      segment.to.scroll =
        startScroll + (endScroll - startScroll) * (length ? distance / length : 1);
    }
  }
  return journey;
}
