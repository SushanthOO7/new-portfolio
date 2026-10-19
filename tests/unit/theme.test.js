import { describe, expect, it } from 'vitest';
import { getThemeBootstrapScript, THEME_STORAGE_KEY } from '../../src/lib/theme.js';

function executeBootstrap(getItem, systemTheme = 'dark') {
  const document = { documentElement: { dataset: {}, style: {} } };
  const localStorage = { getItem };
  const matchMedia = () => ({ matches: systemTheme === 'light' });
  Function('document', 'localStorage', 'matchMedia', getThemeBootstrapScript())(document, localStorage, matchMedia);
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

  it('uses the browser light theme on a first visit', () => {
    const root = executeBootstrap(() => null, 'light');
    expect(root.dataset.theme).toBe('light');
    expect(root.style.colorScheme).toBe('light');
  });

  it('preserves an explicit dark choice in a light browser', () => {
    expect(executeBootstrap(() => 'dark', 'light').dataset.theme).toBe('dark');
  });

  it('uses the browser theme when storage is unavailable', () => {
    expect(executeBootstrap(() => { throw new Error('blocked'); }, 'light').dataset.theme).toBe('light');
  });
});
