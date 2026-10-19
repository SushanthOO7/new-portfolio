import * as React from 'react';
import { flushSync } from 'react-dom';
import { THEME_STORAGE_KEY } from '../../lib/theme.js';
import '../../styles/circular-theme-reveal.css';

type Theme = 'light' | 'dark';
export interface CircularThemeRevealProps {
  duration?: number;
  className?: string;
  onThemeChange?: (theme: Theme) => void;
}

/** The document owns theme state; this island only supplies the control. */
export function CircularThemeReveal({ duration = 780, className = '', onThemeChange }: CircularThemeRevealProps) {
  const [theme, setTheme] = React.useState<Theme>('dark');
  const [ready, setReady] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const locked = React.useRef(false);
  React.useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    sync();
    setReady(true);
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  async function toggle() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      root.dataset.theme = next;
      root.style.colorScheme = next;
      flushSync(() => setTheme(next));
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Optional storage. */ }
      onThemeChange?.(next);
    };
    const ms = Number.isFinite(duration) ? Math.max(0, duration) : 780;
    try {
      if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches || ms === 0) {
        commit();
        return;
      }
      // View-transition snapshots cover the viewport, including when scrolled.
      const radius = Math.hypot(window.innerWidth / 2, window.innerHeight / 2);
      const zero = 'circle(0px at 50% 50%)';
      const full = `circle(${radius}px at 50% 50%)`;
      root.dataset.themeReveal = next;
      const transition = document.startViewTransition(commit);
      void transition.finished.catch(() => {});
      let wave: Animation | undefined;
      let expire!: () => void;
      const timeout = new Promise<void>(resolve => { expire = resolve; });
      const watchdog = window.setTimeout(() => {
        transition.skipTransition();
        expire();
      }, ms + 1500);
      try {
        await Promise.race([transition.ready, timeout]);
        if (!committed) commit();
        wave = root.animate(
          { clipPath: next === 'light' ? [zero, full] : [full, zero] },
          { duration: ms, easing: 'cubic-bezier(0.4,0,0.2,1)',
            pseudoElement: `::view-transition-${next === 'light' ? 'new' : 'old'}(root)` },
        );
        await Promise.race([wave.finished, timeout]);
      } finally {
        transition.skipTransition();
        wave?.cancel();
        window.clearTimeout(watchdog);
      }
    } catch {
      commit();
    } finally {
      delete root.dataset.themeReveal;
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <button className={`ctr-toggle ${className}`} type="button" role="switch"
      data-theme-toggle aria-label="Dark mode" aria-checked={theme === 'dark'}
      disabled={!ready || busy} onClick={toggle}>
      <span className={`ctr-icon ${theme === 'light' ? 'active' : ''}`} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
      </span>
      <span className={`ctr-icon ${theme === 'dark' ? 'active' : ''}`} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>
      </span>
    </button>
  );
}
export default CircularThemeReveal;
