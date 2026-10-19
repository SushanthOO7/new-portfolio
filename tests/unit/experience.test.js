import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { validateExperience } from '../../src/lib/experience.js';
import { getTimelineState } from '../../src/lib/timeline.js';
import experience from '../../src/data/experience.json' with { type: 'json' };

const entry = {
  id: 'research', company: 'ASU', role: 'Researcher',
  startDate: '2024-01', endDate: null, description: 'Research projects.',
  tags: ['AI'], logo: { src: '/images/companies/asu.png', alt: 'ASU', width: 100, height: 50 },
};

describe('experience content', () => {
  it('publishes Informatica directly after Elite Techno Groups and before ASU', () => {
    expect(experience.map(({ company }) => company)).toEqual([
      'The Sparks Foundation',
      'Elite Techno Groups',
      'Informatica',
      'Arizona State University',
    ]);
  });
  it('preserves author order and accepts theme-specific local logos', () => {
    const entries = [entry, { ...entry, id: 'older', logo: { ...entry.logo, darkSrc: '/images/companies/asu-white.png' } }];
    expect(validateExperience(entries, () => true)).toEqual(entries);
  });
  it('rejects invalid dates, duplicate IDs, missing fields, and absent or unsafe logos', () => {
    for (const patch of [{ startDate: '2024-13' }, { endDate: '2020-01' }, { role: '' }, { tags: [] }, { logo: { ...entry.logo, src: '/images/../private.png' } }, { logo: { ...entry.logo, src: 'https://example.com/logo.png' } }]) {
      expect(() => validateExperience([{ ...entry, ...patch }], () => true)).toThrow();
    }
    expect(() => validateExperience([entry, entry], () => true)).toThrow(/duplicate/i);
    expect(() => validateExperience([entry], () => false)).toThrow(/logo/i);
    expect(validateExperience([], existsSync)).toEqual([]);
  });
});

describe('scroll-driven timeline', () => {
  it('travels continuously across uneven anchors, brightening at companies', () => {
    const anchors = [0, 240, 680];
    expect(getTimelineState(anchors, 0).y).toBe(0);
    expect(getTimelineState(anchors, 1).y).toBe(680);
    expect(getTimelineState(anchors, .5).y).toBe(340);
    expect(getTimelineState(anchors, 240 / 680).intensity).toBeCloseTo(1);
    expect(getTimelineState(anchors, 120 / 680).intensity).toBeLessThan(.5);
    expect(getTimelineState(anchors, .75).y).toBeGreaterThan(getTimelineState(anchors, .25).y);
  });
  it('handles zero, one, many entries and clamps overscroll', () => {
    expect(getTimelineState([], .5)).toEqual({ y: 0, intensity: 0 });
    expect(getTimelineState([20], .5)).toEqual({ y: 20, intensity: 1 });
    expect(getTimelineState([20, 70, 300, 900], -1).y).toBe(20);
    expect(getTimelineState([20, 70, 300, 900], 2).y).toBe(900);
  });
});
