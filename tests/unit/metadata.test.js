import { describe, expect, it } from 'vitest';
import { createMetadata } from '../../src/lib/metadata.js';

describe('createMetadata', () => {
  it('normalizes canonical paths without removing the root slash', () => {
    expect(
      createMetadata({ title: 'Projects', description: 'Selected work', pathname: '/projects/' })
        .canonical
    ).toBe('http://localhost:7777/projects');
    expect(
      createMetadata({ title: 'Portfolio', description: 'Home', pathname: '/' }).canonical
    ).toBe('http://localhost:7777/');
  });

  it('provides complete default social metadata', () => {
    const metadata = createMetadata({
      title: 'Projects',
      description: 'Selected work',
      pathname: '/projects',
    });

    expect(metadata).toMatchObject({
      title: 'Sushanth U V | Projects',
      description: 'Selected work',
      canonical: 'http://localhost:7777/projects',
      image: 'http://localhost:7777/social-image.png',
      imageAlt: 'Sushanth U V portfolio preview',
    });
  });

  it('resolves an explicit social image override', () => {
    const metadata = createMetadata({
      title: 'Article',
      description: 'An article',
      pathname: '/articles/example',
      image: '/static/example-og.jpg',
    });

    expect(metadata.image).toBe('http://localhost:7777/static/example-og.jpg');
  });
});
