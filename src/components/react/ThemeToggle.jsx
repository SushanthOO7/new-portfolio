import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '../../lib/theme.js';
import styles from './theme-toggle.module.css';

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === 'light' || current === 'dark') setTheme(current);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The visible preference still applies when storage is unavailable.
    }
    setTheme(nextTheme);
  }

  return (
    <button className={styles.toggle} type="button" onClick={toggleTheme} aria-label="Toggle theme">
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}
