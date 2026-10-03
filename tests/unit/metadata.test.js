import { describe, expect, it } from 'vitest';
import { createMetadata } from '../../src/lib/metadata.js';

describe('createMetadata', () => {
  const origin = 'https://portfolio.example';

  it('normalizes canonical paths without removing the root slash', () => {
    expect(
      createMetadata({ origin, title: 'Projects', description: 'Selected work', pathname: '/projects/' })
        .canonical
    ).toBe('https://portfolio.example/projects');
    expect(
      createMetadata({ origin, title: 'Portfolio', description: 'Home', pathname: '/' }).canonical
    ).toBe('https://portfolio.example/');
  });

  it('provides complete default social metadata', () => {
    const metadata = createMetadata({
      title: 'Projects',
      description: 'Selected work',
      pathname: '/projects',
      origin,
    });

    expect(metadata).toMatchObject({
      title: 'Sushanth U V | Projects',
      description: 'Selected work',
      canonical: 'https://portfolio.example/projects',
      image: 'https://portfolio.example/social-image.png',
      imageAlt: 'Sushanth U V portfolio preview',
    });
  });

  it('resolves an explicit social image override', () => {
    const metadata = createMetadata({
      title: 'Article',
      description: 'An article',
      pathname: '/articles/example',
      image: '/static/example-og.jpg',
      origin,
    });

    expect(metadata.image).toBe('https://portfolio.example/static/example-og.jpg');
  });

  it('requires an explicit origin so production metadata cannot silently use localhost', () => {
    expect(() => createMetadata({ title: 'Home', description: 'Home', pathname: '/' }))
      .toThrow(/origin/i);
  });
});
