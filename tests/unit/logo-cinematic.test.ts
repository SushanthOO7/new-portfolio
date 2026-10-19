import { describe, expect, it } from 'vitest';
import { createJourney } from '../../src/lib/logo-journey.js';
import {
  createCinematicJourney,
  sampleCinematicJourney,
  inputForCamera,
} from '../../src/lib/logo-cinematic';

const make = () =>
  createCinematicJourney(
    createJourney(
      [
        { x: 50, y: 80, size: 36, scroll: 0, stage: 'hero' },
        { x: 450, y: 80, size: 36, scroll: 50, stage: 'hero' },
        { x: 450, y: 1000, size: 36, scroll: 500, stage: 'projects' },
        { x: 60, y: 1050, size: 36, scroll: 800, stage: 'tech-stack' },
      ],
      600
    ),
    500,
    900,
    600
  );

describe('cinematic scroll clock', () => {
  it('accelerates only the final Tech Stack approach so the orbit docks earlier', () => {
    const journey = createJourney(
      [
        { x: 50, y: 80, size: 36, scroll: 0, stage: 'hero' },
        { x: 450, y: 80, size: 36, scroll: 50, stage: 'hero' },
        { x: 450, y: 1000, size: 36, scroll: 500, stage: 'projects' },
        { x: 300, y: 1030, size: 48, scroll: 650, stage: 'tech-stack' },
        { x: 60, y: 1050, size: 70, scroll: 800, stage: 'tech-stack' },
      ],
      600
    );
    const beforeTech = journey.segments
      .filter(segment => segment.to.stage !== 'tech-stack')
      .reduce((sum, segment) => sum + segment.length, 0);
    const techApproach = journey.segments
      .filter(segment => segment.to.stage === 'tech-stack')
      .reduce((sum, segment) => sum + segment.length, 0);

    const model = createCinematicJourney(journey, 500, 900, 600);
    const firstTechSegment = model.journey.segments.find(
      segment => segment.to.stage === 'tech-stack'
    )!;

    expect(firstTechSegment.from.scroll).toBeCloseTo(beforeTech);
    expect(model.distance).toBeCloseTo(beforeTech + techApproach * 0.65);
    expect(model.distance).toBeLessThan(beforeTech + techApproach);
  });

  it('holds the page during the upper horizontal sweep and budgets input by travel distance', () => {
    const model = make();
    const start = sampleCinematicJourney(model, 0)!;
    const point = sampleCinematicJourney(model, 116)!;
    expect(point.camera).toBe(0);
    expect(Math.hypot(point.x - start.x, point.y - start.y)).toBeLessThanOrEqual(101);
    expect(point.x).toBeGreaterThan(start.x + 80);
    expect(model.maxInput).toBeGreaterThan(1800);
  });
  it('advances the page on descent, never reverses the page during an upward curl, then scrolls the remaining page after docking', () => {
    const model = make();
    let camera = 0;
    for (let input = 0; input <= model.maxInput; input += 5) {
      const sample = sampleCinematicJourney(model, input)!;
      expect(sample.camera).toBeGreaterThanOrEqual(camera - 0.001);
      camera = sample.camera;
    }
    expect(camera).toBeGreaterThan(500);
    const end = sampleCinematicJourney(model, model.maxInput)!;
    expect(end).toMatchObject({ x: 60, y: 1050, camera: 900 });
    expect(end.rotation % 360).toBeCloseTo(0);
    const dock = sampleCinematicJourney(model, model.routeInput)!;
    const after = sampleCinematicJourney(model, model.routeInput + 100)!;
    expect(after).toMatchObject({ x: dock.x, y: dock.y, rotation: dock.rotation });
    expect(after.camera - dock.camera).toBeCloseTo(100);
    expect(inputForCamera(model, after.camera)).toBeCloseTo(model.routeInput + 100);
  });
  it('rotates gradually and retraces exactly when input reverses', () => {
    const model = make();
    expect(sampleCinematicJourney(model, 300)!.rotation).toBeGreaterThan(0);
    const inputs = [1, 50, 300, 700, 1000];
    const forward = inputs.map(input => sampleCinematicJourney(model, input));
    for (const input of [...inputs].reverse()) {
      expect(sampleCinematicJourney(model, input)).toEqual(
        forward[inputs.indexOf(input)]
      );
      const a = sampleCinematicJourney(model, input)!;
      const b = sampleCinematicJourney(model, input + 1)!;
      expect(Math.abs(b.rotation - a.rotation)).toBeLessThan(1);
    }
  });
  it('maps anchor navigation into the extended clock without scrolling through the horizontal holds', () => {
    const model = make();
    expect(inputForCamera(model, 0)).toBe(0);
    expect(inputForCamera(model, 900)).toBe(model.maxInput);
    expect(sampleCinematicJourney(model, inputForCamera(model, 350))!.camera).toBeCloseTo(
      350,
      1
    );
  });
});
