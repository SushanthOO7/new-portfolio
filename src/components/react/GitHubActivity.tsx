import ContributionSkyline, { type ContributionDay } from '../ui/contribution-skyline';

type GitHubActivityProps = {
  username: string;
  fetchedAt: string;
  source: 'live' | 'snapshot';
  days: ContributionDay[];
};

export default function GitHubActivity({ username, fetchedAt, source, days }: GitHubActivityProps) {
  const updated = new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  }).format(new Date(fetchedAt));

  return (
    <div className="github-activity" data-source={source}>
      <div className="github-activity__eyebrow">
        <span aria-hidden="true">// SIGNAL LOG</span>
        <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
          @{username}<span className="sr-only"> on GitHub (opens in a new tab)</span>
        </a>
      </div>
      <ContributionSkyline
        data={days}
        endDate={days.at(-1)?.date}
        defaultView="3d"
        palette="github"
        title={<><strong>{username}</strong> · GitHub activity</>}
        footer={<>Updated <time dateTime={fetchedAt}>{updated}</time>{source === 'snapshot' ? ' · cached snapshot' : ' · live at build'}</>}
        className="github-activity__skyline"
      />
    </div>
  );
}
