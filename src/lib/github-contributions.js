const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** @typedef {{ date: string, count: number }} ContributionDay */
/** @typedef {{ username: string, fetchedAt: string, range: { from: string, to: string }, days: ContributionDay[] }} ContributionSnapshot */
/** @typedef {ContributionSnapshot & { source: 'live' | 'snapshot' }} LoadedContributions */

const assertDateKey = (value, label) => {
  const parsed = typeof value === 'string' && DATE_KEY.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${label} must be a valid YYYY-MM-DD date`);
  }
  return value;
};

const normalizeDays = (days, label) => {
  if (!Array.isArray(days) || days.length === 0) throw new TypeError(`${label} must contain contribution days`);
  const counts = new Map();
  for (const [index, day] of days.entries()) {
    const date = assertDateKey(day?.date, `${label}[${index}].date`);
    const count = Number(day?.count);
    if (!Number.isSafeInteger(count) || count < 0) throw new TypeError(`${label}[${index}].count must be a non-negative integer`);
    counts.set(date, (counts.get(date) ?? 0) + count);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
};

export function normalizeContributionCalendar(payload) {
  const weeks = payload?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!Array.isArray(weeks)) throw new TypeError('GitHub response is missing contribution weeks');
  const days = [];
  for (const week of weeks) {
    if (!Array.isArray(week?.contributionDays)) throw new TypeError('GitHub response contains an invalid contribution week');
    for (const day of week.contributionDays) days.push({ date: day?.date, count: day?.contributionCount });
  }
  return normalizeDays(days, 'GitHub contribution days');
}

export function validateContributionSnapshot(candidate, expectedUsername) {
  if (!candidate || typeof candidate !== 'object') throw new TypeError('Contribution snapshot must be an object');
  if (typeof candidate.username !== 'string' || !candidate.username.trim()) throw new TypeError('Contribution snapshot requires a username');
  if (expectedUsername && candidate.username !== expectedUsername) throw new TypeError('Contribution snapshot username does not match the requested account');
  const fetchedAt = new Date(candidate.fetchedAt);
  if (Number.isNaN(fetchedAt.getTime()) || fetchedAt.toISOString() !== candidate.fetchedAt) throw new TypeError('Contribution snapshot requires an ISO fetchedAt timestamp');
  const days = normalizeDays(candidate.days, 'Contribution snapshot days');
  if (days.length < 365 || days.length > 371) throw new TypeError('Contribution snapshot must contain one annual calendar');
  for (let index = 1; index < days.length; index++) {
    if (Date.parse(`${days[index].date}T00:00:00Z`) - Date.parse(`${days[index - 1].date}T00:00:00Z`) !== 86400000) {
      throw new TypeError('Contribution snapshot days must be contiguous');
    }
  }
  const range = {
    from: assertDateKey(candidate.range?.from, 'Contribution snapshot range.from'),
    to: assertDateKey(candidate.range?.to, 'Contribution snapshot range.to'),
  };
  if (range.from !== days[0].date || range.to !== days[days.length - 1].date) {
    throw new TypeError('Contribution snapshot range must match its days');
  }
  return { username: candidate.username, fetchedAt: candidate.fetchedAt, range, days };
}

const query = `query ContributionCalendar($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

/**
 * @param {{ username: string, token?: string, snapshot: unknown, fetchImpl?: typeof fetch, now?: Date, timeoutMs?: number }} options
 * @returns {Promise<LoadedContributions>}
 */
export async function loadGitHubContributions({
  username,
  token,
  snapshot,
  fetchImpl = globalThis.fetch,
  now = new Date(),
  timeoutMs = 8000,
}) {
  let fallback;
  try {
    fallback = validateContributionSnapshot(snapshot, username);
  } catch (error) {
    fallback = null;
    if (!token) throw new Error(`GitHub contribution snapshot is invalid: ${error.message}`);
  }

  if (token) {
    let timeout;
    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SushanthOO7-portfolio-build',
        },
        body: JSON.stringify({ query, variables: { login: username } }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length) throw new Error('GitHub returned GraphQL errors');
      const days = normalizeContributionCalendar(payload);
      return {
        username,
        fetchedAt: now.toISOString(),
        range: { from: days[0].date, to: days[days.length - 1].date },
        days,
        source: 'live',
      };
    } catch (error) {
      if (!fallback) throw new Error(`GitHub contribution fetch failed and snapshot is invalid: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!fallback) throw new Error('GitHub contribution snapshot is invalid');
  return { ...fallback, source: 'snapshot' };
}
