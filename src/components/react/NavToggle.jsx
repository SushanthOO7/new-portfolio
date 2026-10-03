import { useEffect, useState } from 'react';
import styles from './nav-toggle.module.css';

export function NavToggle({ controls = 'site-navigation' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const navigation = document.getElementById(controls);
    document.documentElement.dataset.js = 'true';
    if (navigation) navigation.dataset.open = 'false';

    function handleEscape(event) {
      if (event.key !== 'Escape') return;
      setOpen(current => {
        if (current) requestAnimationFrame(() => document.getElementById('nav-toggle')?.focus());
        return false;
      });
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [controls]);

  useEffect(() => {
    const navigation = document.getElementById(controls);
    if (navigation) navigation.dataset.open = String(open);
  }, [controls, open]);

  return (
    <button
      id="nav-toggle"
      className={styles.toggle}
      type="button"
      aria-controls={controls}
      aria-expanded={open}
      aria-label={open ? 'Close navigation' : 'Open navigation'}
      onClick={() => setOpen(current => !current)}
    >
      <span aria-hidden="true" className={styles.icon}>{open ? '×' : '☰'}</span>
    </button>
  );
}
