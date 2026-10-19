import { describe, expect, it } from 'vitest';
import { createReferenceJourney } from '../../src/lib/logo-journey-route';
import { sampleJourney } from '../../src/lib/logo-journey.js';

const layout = {
  width: 1440,
  height: 900,
  maxScroll: 4900,
  start: { x: 90, y: 45, width: 38 },
  hero: { top: 0, bottom: 900 },
  experience: { top: 900, bottom: 2300 },
  rail: [
    { x: 720, y: 1230 },
    { x: 720, y: 1500 },
    { x: 720, y: 2050 },
  ],
  projects: { top: 2300, bottom: 3500 },
  projectsHeading: { top: 2324, bottom: 2648 },
  activity: { top: 3100, bottom: 3450, left: 120 },
  tech: { top: 3500, bottom: 4500 },
  orbit: { x: 1050, y: 4000, width: 70 },
  contact: { top: 4500, bottom: 5400 },
  footer: { top: 5400, bottom: 5800 },
  end: { x: 90, y: 5660, width: 38 },
};

describe('reference logo route', () => {
  it('starts at the navbar, passes the measured rail and finishes inside the Tech Stack orbit', () => {
    const journey = createReferenceJourney(layout);
    expect(sampleJourney(journey, 0)).toMatchObject({ x: 90, y: 45, size: 38 });
    for (const target of layout.rail) {
      expect(sampleJourney(journey, target.y - 495)).toMatchObject({
        x: target.x,
        y: target.y,
      });
    }
    expect(sampleJourney(journey, 3505)).toMatchObject({ x: 1050, y: 4000, size: 70 });
    expect(sampleJourney(journey, 4900)).toMatchObject({ x: 1050, y: 4000, size: 70 });
    expect(
      journey.points.some(point =>
        ['tech-stack-exit', 'contact', 'footer'].includes(point.stage)
      )
    ).toBe(false);
  });

  it('preserves the drawn hero right-edge descent, leftward return and upward curl', () => {
    const { points } = createReferenceJourney(layout);
    const hero = points.filter(point => point.stage === 'hero');
    expect(Math.max(...hero.map(p => p.x))).toBeGreaterThan(1380);
    expect(hero.some((p, i) => i > 0 && p.x < hero[i - 1].x && p.y < hero[i - 1].y)).toBe(
      true
    );
    expect(hero.at(-1)!.x).toBeGreaterThan(690);
    expect(hero.at(-1)!.x).toBeLessThan(760);
  });

  it('keeps joins tangent-continuous and every interval reachable without duplicate scroll times', () => {
    const journey = createReferenceJourney(layout);
    for (let i = 1; i < journey.points.length; i++) {
      expect(journey.points[i].scroll).toBeGreaterThan(journey.points[i - 1].scroll);
    }
    for (let i = 1; i < journey.segments.length; i++) {
      const a = journey.segments[i - 1],
        b = journey.segments[i];
      const ax = a.to.x - a.c2.x,
        ay = a.to.y - a.c2.y;
      const bx = b.c1.x - b.from.x,
        by = b.c1.y - b.from.y;
      expect(Math.abs(ax * by - ay * bx)).toBeLessThan(0.00001);
      expect(ax * bx + ay * by).toBeGreaterThan(0);
    }
  });

  it('routes above the Projects lettering and outside the contribution panel', () => {
    const { points } = createReferenceJourney(layout);
    const titleCrossings = points.filter(
      point =>
        point.stage === 'projects' &&
        point.x > 490 &&
        point.x < 950 &&
        point.y > 2454 &&
        point.y < 2648
    );
    expect(titleCrossings).toHaveLength(0);
    const besideActivity = points.filter(
      point => point.stage === 'projects' && point.y >= 3100
    );
    expect(besideActivity.length).toBeGreaterThan(2);
    expect(besideActivity.every(point => point.x < 100)).toBe(true);
  });

  it('stays finite and inside the viewport on mobile and with omitted sections', () => {
    const journey = createReferenceJourney({
      ...layout,
      width: 393,
      height: 851,
      start: { x: 36, y: 36, width: 38 },
      rail: [],
      experience: null,
      orbit: { x: 196, y: 4000, width: 55 },
      end: { x: 45, y: 5660, width: 32 },
    });
    for (let scroll = 0; scroll <= 4900; scroll += 7) {
      const point = sampleJourney(journey, scroll)!;
      expect(Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(23.999);
      expect(point.x).toBeLessThanOrEqual(369.001);
    }
  });
});
