import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Hero route layers', () => {
  it('keeps the main route geometry aligned across the back, front, and pulse layers', async () => {
    const source = await readFile('src/components/astro/home/Intro.astro', 'utf8');
    const route = 'M -90 305 C 155 555 255 330 480 235 S 845 122 988 138 C 1268 178 1284 235 1400 350 S 1658 374 1709 301 S 1919 199 2020 275';

    expect(source.split(`d="${route}"`)).toHaveLength(4);
  });
});
