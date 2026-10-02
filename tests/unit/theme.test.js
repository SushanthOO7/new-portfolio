import { describe, expect, it } from 'vitest';
import { getThemeBootstrapScript, THEME_STORAGE_KEY } from '../../src/lib/theme.js';

function executeBootstrap(getItem) {
  const document = { documentElement: { dataset: {}, style: {} } };
  const localStorage = { getItem };
  Function('document', 'localStorage', getThemeBootstrapScript())(document, localStorage);
  return document.documentElement;
}

describe('theme bootstrap', () => {
  it.each(['light', 'dark'])('applies a stored %s theme', theme => {
    const root = executeBootstrap(key => {
      expect(key).toBe(THEME_STORAGE_KEY);
      return theme;
    });

    expect(root.dataset.theme).toBe(theme);
    expect(root.style.colorScheme).toBe(theme);
  });

  it.each([null, 'sepia', '{broken'])('falls back to dark for invalid storage: %s', stored => {
    expect(executeBootstrap(() => stored).dataset.theme).toBe('dark');
  });

  it('still applies dark when storage access throws', () => {
    const root = executeBootstrap(() => {
      throw new Error('storage unavailable');
    });

    expect(root.dataset.theme).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });
});
