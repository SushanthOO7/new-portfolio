import { describe, expect, it, vi } from 'vitest';
import {
  loadGitHubContributions,
  normalizeContributionCalendar,
  validateContributionSnapshot,
} from '../../src/lib/github-contributions.js';

const snapshotDays = Array.from({ length: 365 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 9, 2 + index)).toISOString().slice(0, 10);
  return { date, count: index % 13 === 0 ? 2 : 0 };
});

const snapshot = {
  username: 'SushanthOO7',
  fetchedAt: '2026-10-01T12:00:00.000Z',
  range: { from: snapshotDays[0].date, to: snapshotDays.at(-1).date },
  days: snapshotDays,
};

const graphQLPayload = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: [
            { contributionDays: [
              { date: '2026-10-01', contributionCount: 3 },
              { date: '2026-10-02', contributionCount: 0 },
            ] },
            { contributionDays: [
              { date: '2026-10-01', contributionCount: 2 },
              { date: '2026-10-03', contributionCount: 7 },
            ] },
          ],
        },
      },
    },
  },
};

describe('normalizeContributionCalendar', () => {
  it('normalizes, sorts, and combines duplicate GitHub days', () => {
    expect(normalizeContributionCalendar(graphQLPayload)).toEqual([
      { date: '2026-10-01', count: 5 },
      { date: '2026-10-02', count: 0 },
      { date: '2026-10-03', count: 7 },
    ]);
  });

  it.each([
    [{ data: { user: null } }],
    [{ data: { user: { contributionsCollection: {} } } }],
    [{ data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: [{ date: 'bad', contributionCount: 1 }] }] } } } } }],
    [{ data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: [{ date: '2026-10-01', contributionCount: -1 }] }] } } } } }],
  ])('rejects malformed GraphQL contribution payloads', payload => {
    expect(() => normalizeContributionCalendar(payload)).toThrow();
  });
});

describe('validateContributionSnapshot', () => {
  it('returns a normalized valid snapshot', () => {
    expect(validateContributionSnapshot(snapshot, 'SushanthOO7')).toEqual(snapshot);
  });

  it.each([
    [{ ...snapshot, username: '' }],
    [{ ...snapshot, fetchedAt: 'yesterday' }],
    [{ ...snapshot, days: [] }],
    [{ ...snapshot, days: [{ date: '2026-10-01', count: Number.NaN }] }],
    [{ ...snapshot, days: snapshot.days.map((day, index) => index === 12 ? { ...day, date: '2026-02-31' } : day) }],
    [{ ...snapshot, days: snapshot.days.map((day, index) => index === 12 ? { ...day, count: 1.5 } : day) }],
    [{ ...snapshot, days: snapshot.days.filter((_, index) => index !== 12) }],
  ])('rejects an invalid snapshot', candidate => {
    expect(() => validateContributionSnapshot(candidate, 'SushanthOO7')).toThrow();
  });

  it('rejects a snapshot belonging to a different account', () => {
    expect(() => validateContributionSnapshot({ ...snapshot, username: 'someone-else' }, 'SushanthOO7')).toThrow(/username/i);
  });
});

describe('loadGitHubContributions', () => {
  it('prefers fresh GitHub data and reports its timestamp', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => graphQLPayload,
    });
    const now = new Date('2026-10-17T08:00:00.000Z');

    const result = await loadGitHubContributions({
      username: 'SushanthOO7', token: 'secret', snapshot, fetchImpl, now,
    });

    expect(result).toEqual({
      username: 'SushanthOO7',
      fetchedAt: now.toISOString(),
      range: { from: '2026-10-01', to: '2026-10-03' },
      days: [
        { date: '2026-10-01', count: 5 },
        { date: '2026-10-02', count: 0 },
        { date: '2026-10-03', count: 7 },
      ],
      source: 'live',
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.github.com/graphql', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
    }));
  });

  it.each([
    ['missing token', { token: undefined }],
    ['network error', { token: 'secret', fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) }],
    ['rate limit response', { token: 'secret', fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }) }],
    ['malformed response', { token: 'secret', fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { user: null } }) }) }],
  ])('falls back to the checked-in snapshot on %s', async (_label, overrides) => {
    await expect(loadGitHubContributions({
      username: 'SushanthOO7', snapshot, fetchImpl: vi.fn(), ...overrides,
    })).resolves.toEqual({ ...snapshot, source: 'snapshot' });
  });

  it('fails when neither live data nor a valid snapshot is available', async () => {
    await expect(loadGitHubContributions({
      username: 'SushanthOO7', snapshot: { ...snapshot, days: [] },
    })).rejects.toThrow(/snapshot/i);
  });

  it('times out a stalled GitHub request and uses the snapshot', async () => {
    const fetchImpl = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    await expect(loadGitHubContributions({
      username: 'SushanthOO7', token: 'secret', snapshot, fetchImpl, timeoutMs: 5,
    })).resolves.toEqual({ ...snapshot, source: 'snapshot' });
  });
});
