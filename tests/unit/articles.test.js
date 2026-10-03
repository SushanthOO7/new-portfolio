import { describe, expect, it } from 'vitest';
import { getArticleReadingTime, getSortedArticles } from '../../src/lib/content.js';

const articles = [
  { id: 'hello-world', data: { title: 'Hello world: how I built this site', abstract: 'History', date: new Date('2022-04-21'), banner: '/static/hello-world-banner.jpg', featured: false }, body: 'hello' },
  { id: 'modern-styling-in-react', data: { title: "You (probably) don't need CSS-in-JS", abstract: 'CSS', date: new Date('2022-05-01'), banner: '/static/modern-styling-in-react-banner.jpg', featured: true }, body: 'modern' },
];

describe('article content helpers', () => {
  it('sorts known slugs newest-first without mutating collection order', () => {
    const sorted = getSortedArticles(articles);

    expect(sorted.map(article => article.id)).toEqual(['modern-styling-in-react', 'hello-world']);
    expect(articles.map(article => article.id)).toEqual(['hello-world', 'modern-styling-in-react']);
  });

  it('keeps featured selection stable after sorting', () => {
    const featured = getSortedArticles(articles).find(article => article.data.featured);

    expect(featured?.id).toBe('modern-styling-in-react');
  });

  it('formats reading duration exactly like the legacy timecode', () => {
    expect(getArticleReadingTime('word '.repeat(225))).toBe('00:01:00:00');
    expect(getArticleReadingTime('word '.repeat(450))).toBe('00:02:00:00');
  });
});
