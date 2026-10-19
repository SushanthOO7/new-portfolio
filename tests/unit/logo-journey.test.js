import { describe, expect, it } from 'vitest';
import { createJourney, sampleJourney } from '../../src/lib/logo-journey.js';

const stops = [
  { x: 600, y: 700, size: 36, stage: 'hero', scroll: 0 },
  { x: 500, y: 1100, size: 36, stage: 'experience', scroll: 600 },
  { x: 500, y: 1800, size: 36, stage: 'experience', scroll: 1300 },
  { x: 100, y: 2200, size: 36, stage: 'projects', scroll: 1700 },
  { x: 100, y: 2200, size: 36, stage: 'projects', scroll: 1900 },
  { x: 700, y: 3000, size: 60, stage: 'tech-stack', scroll: 2500 },
];
describe('logo journey geometry', () => {
  it('lands exactly at measured stops and clamps scroll beyond endpoints', () => {
    const journey = createJourney(stops, 1000);
    for (const stop of stops) {
      const result = sampleJourney(journey, stop.scroll);
      expect(result.x).toBeCloseTo(stop.x);
      expect(result.y).toBeCloseTo(stop.y);
      expect(result.size).toBeCloseTo(stop.size);
      expect(result.rotation).toBeCloseTo(0);
    }
    expect(sampleJourney(journey, -100).x).toBe(600);
    expect(sampleJourney(journey, 5000).size).toBe(60);
  });
  it('tracks the rail linearly and holds the project dock without drifting', () => {
    const journey = createJourney(stops, 1000);
    expect(sampleJourney(journey, 950)).toMatchObject({
      x: 500,
      y: 1450,
      stage: 'experience',
    });
    expect(sampleJourney(journey, 1800)).toMatchObject({ x: 100, y: 2200, rotation: 0 });
  });
  it('retraces deterministically, stays in gutters, and limits rotation', () => {
    const journey = createJourney(stops, 1000);
    const forward = Array.from({ length: 101 }, (_, i) => sampleJourney(journey, i * 25));
    for (let i = 100; i >= 0; i--) {
      expect(sampleJourney(journey, i * 25)).toEqual(forward[i]);
      expect(forward[i].x).toBeGreaterThanOrEqual(24);
      expect(forward[i].x).toBeLessThanOrEqual(976);
      expect(Math.abs(forward[i].rotation)).toBeLessThanOrEqual(12);
    }
  });
  it('handles absent sections and coincident scroll positions without NaN', () => {
    expect(sampleJourney(createJourney([], 390), 0)).toBeNull();
    expect(sampleJourney(createJourney([stops[0]], 1000), 100)).toMatchObject({ x: 600 });
    const journey = createJourney([stops[0], { ...stops[5], scroll: 0 }], 1000);
    expect(sampleJourney(journey, 0)).toMatchObject({ x: 700, y: 3000 });
  });
});

describe('experience rail ownership', () => {
  it('identifies only the vertical experience segment as the live rail', () => {
    const journey = createJourney(
      [
        { x: 20, y: 100, size: 36, scroll: 0, stage: 'hero' },
        { x: 500, y: 600, size: 36, scroll: 500, stage: 'experience' },
        { x: 500, y: 1000, size: 36, scroll: 900, stage: 'experience' },
        { x: 800, y: 1400, size: 36, scroll: 1300, stage: 'projects' },
      ],
      1200
    );

    expect(sampleJourney(journey, 250).onRail).toBe(false);
    expect(sampleJourney(journey, 700).onRail).toBe(true);
    expect(sampleJourney(journey, 1100).onRail).toBe(false);
  });
});

describe('smooth scroll pacing', () => {
  it('moves equal distances for equal small scroll steps along a curved segment', () => {
    const journey = createJourney(
      [
        { x: 100, y: 100, size: 36, scroll: 0, stage: 'hero' },
        { x: 900, y: 900, size: 36, scroll: 1000, stage: 'projects' },
      ],
      1200
    );
    const positions = Array.from({ length: 101 }, (_, i) =>
      sampleJourney(journey, i * 10)
    );
    const distances = positions
      .slice(1)
      .map((point, i) => Math.hypot(point.x - positions[i].x, point.y - positions[i].y));
    expect(Math.max(...distances) / Math.min(...distances)).toBeLessThan(1.05);
  });
});
