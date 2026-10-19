import { describe, expect, it } from 'vitest';
import {
  buildGrid,
  computeStats,
  dayMs,
  generateContributions,
  levelOf,
  riseAt,
  toKey,
} from '../../src/components/ui/contribution-skyline';

describe('ContributionSkyline pure model', () => {
  it('builds a deterministic, chronological annual grid', () => {
    const end = dayMs('2026-10-18');
    const generated = generateContributions(end, 7);
    expect(generateContributions(end, 7)).toEqual(generated);
    const grid = buildGrid(generated, end);
    expect(grid.cells.length).toBeGreaterThanOrEqual(365);
    expect(grid.cells.at(-1)?.date).toBe('2026-10-18');
    expect(toKey(dayMs(grid.cells[0].date))).toBe(grid.cells[0].date);
  });

  it('assigns bounded activity levels and rise progress', () => {
    expect([levelOf(0, 8), levelOf(1, 8), levelOf(8, 8)]).toEqual([0, 1, 4]);
    expect(riseAt(0, 0, 53, 0)).toBe(0);
    expect(riseAt(1, 52, 53, 6)).toBe(1);
  });

  it('does not call a historical run the current streak', () => {
    const cells = buildGrid([
      { date: '2020-01-01', count: 1 },
      { date: '2020-01-02', count: 1 },
    ], dayMs('2020-01-03')).cells;
    expect(computeStats(cells).current.days).toBe(0);
  });
});
