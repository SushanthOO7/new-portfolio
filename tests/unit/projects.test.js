import { describe, expect, it } from 'vitest';
import { projects } from '../../src/data/projects.js';

describe('project data', () => {
  it('uses unique slugs for every known bespoke project route', () => {
    const slugs = projects.map(project => project.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(['slice', 'smart-sparrow', 'volkihar-knight']);
  });

  it('provides every field required by static project cards', () => {
    for (const project of projects) {
      expect(project).toEqual({
        slug: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        image: expect.stringMatching(/^\/images\/projects\/.+\.(jpg|png|webp)$/),
        featured: expect.any(Boolean),
      });
    }
  });
});
