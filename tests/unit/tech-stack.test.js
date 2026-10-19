import { describe, expect, it } from 'vitest';
import { validateTechStack, getOrbitPositions, filterTechnologies, nearestOrbitAngle } from '../../src/lib/tech-stack.js';

const entry = { id: 'react', title: 'React', categories: ['frontend'], logo: '/images/tech/react.svg' };
describe('editable technology data', () => {
  it('allows an empty list and optional theme artwork', () => {
    expect(() => validateTechStack([])).not.toThrow();
    expect(() => validateTechStack([{ ...entry, logoLight: '/images/tech/react-light.svg' }])).not.toThrow();
  });
  it('rejects malformed lists, duplicate ids, empty titles, and unsupported categories', () => {
    for (const data of [null, {}, [entry, entry], [{ ...entry, title: ' ' }], [{ ...entry, categories: [] }], [{ ...entry, categories: ['unknown'] }], [{ ...entry, id: '../react' }]]) {
      expect(() => validateTechStack(data)).toThrow(/tech-stack\.json/);
    }
  });
  it('rejects remote, traversal, and missing logo files', () => {
    for (const logo of ['https://example.com/a.svg', '/images/../secret.svg', '', '/images/%2e%2e/a.svg']) {
      expect(() => validateTechStack([{ ...entry, logo }])).toThrow(/logo/);
    }
    expect(() => validateTechStack([entry], () => false)).toThrow(/react.svg/);
    expect(() => validateTechStack([{ ...entry, logoLight: '/images/tech/missing.svg' }], path => path === entry.logo)).toThrow(/missing.svg/);
  });
  it('filters multiple categories and reflects additions and removals', () => {
    const python = { id: 'python', title: 'Python', logo: '/images/tech/python.svg', categories: ['backend', 'ai'] };
    expect(filterTechnologies([entry, python], 'all')).toHaveLength(2);
    expect(filterTechnologies([entry, python], 'ai')).toEqual([python]);
    expect(filterTechnologies([entry], 'ai')).toEqual([]);
  });
});
describe('automatic orbital layout', () => {
  it('takes the shortest arc even after long-running opposite ring rotations', () => {
    expect(nearestOrbitAngle(529, -90)).toBe(630);
    expect(nearestOrbitAngle(-529, 90)).toBe(-630);
    expect(Math.abs(nearestOrbitAngle(1500, -90) - 1500)).toBeLessThanOrEqual(180);
  });
  it('keeps positions finite for zero, one, and many entries', () => {
    for (const count of [0, 1, 4, 12, 24]) {
      const positions = getOrbitPositions(count);
      expect(positions).toHaveLength(count);
      for (const p of positions) {
        expect(Number.isFinite(p.angle)).toBe(true);
        expect(p.radius).toBeGreaterThan(0);
        expect(p.radius).toBeLessThan(46);
      }
    }
  });
  it('matches the reference arrangement and redistributes filtered entries evenly', () => {
    const all = getOrbitPositions(12);
    expect(all.filter(p => p.ring === 'outer')).toHaveLength(11);
    expect(all[11].ring).toBe('inner');
    const filtered = getOrbitPositions(3);
    expect(filtered[1].angle - filtered[0].angle).toBe(120);
    expect(filtered[2].angle - filtered[1].angle).toBe(120);
  });
});
