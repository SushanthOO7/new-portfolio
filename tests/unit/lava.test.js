import { describe, expect, it } from 'vitest';
import { getLavaRoutes, getMoltenShape } from '../../src/lib/lava.js';

describe('lava feed geometry', () => {
  it('sends horizontal and vertical beams from the same top corner to the same bottom corner', () => {
    const right = getLavaRoutes(400, 220, 'right');
    expect(right.horizontal).toMatch(/^M14 1H386/);
    expect(right.vertical).toMatch(/^M14 1Q1 1 1 14/);
    expect(right.horizontal).toMatch(/386 219$/);
    expect(right.vertical).toMatch(/219H386$/);
    const left = getLavaRoutes(400, 220, 'left');
    expect(left.horizontal).toMatch(/^M386 1H14/);
    expect(left.vertical).toMatch(/^M386 1Q399 1 399 14/);
    expect(left.horizontal).toMatch(/14 219$/);
    expect(left.vertical).toMatch(/219H14$/);
  });

  it('retains matching layered curve topology between the small attached lava poses', () => {
    const poses = [getMoltenShape(.55, 5), getMoltenShape(.72, 11), getMoltenShape(.55, 5, 1), getMoltenShape(.72, 11, 1)];
    const topology = value => value.replace(/-?\d+(\.\d+)?/g, '#');
    for (const pose of poses) {
      expect(topology(pose)).toBe(topology(poses[0]));
      expect(pose).not.toMatch(/NaN|Infinity/);
    }
    expect(poses[0]).toContain('74 55');
    expect(poses[1]).toContain('74 61');
    expect(poses[2]).not.toBe(poses[0]);
  });
});
