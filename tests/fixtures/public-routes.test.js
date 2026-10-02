import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTES } from './public-routes.js';

const expectedRoutes = [
  '/',
  '/projects',
  '/projects/slice',
  '/projects/smart-sparrow',
  '/projects/volkihar-knight',
  '/career',
  '/uses',
  '/contact',
  '/articles',
  '/articles/hello-world',
  '/articles/modern-styling-in-react',
  '/does-not-exist',
];

describe('PUBLIC_ROUTES', () => {
  it('contains every migration route exactly once', () => {
    expect(PUBLIC_ROUTES).toEqual(expectedRoutes);
    expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length);
  });
});
