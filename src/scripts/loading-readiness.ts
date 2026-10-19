import { readinessProgress } from '../lib/loading-progress.js';
import { prepareHeroImages } from './page-assets';

/** Track resources and initialization needed for a usable first screen. */
export function trackLoadingReadiness(report: (progress: number) => void, signal: AbortSignal) {
  const states = { dom: false, scroll: false, fonts: false, images: false, components: false, critical: false };
  let progress = 0;
  const mark = (key: keyof typeof states) => {
    if (signal.aborted) return;
    states[key] = true;
    progress = readinessProgress(progress, Object.values(states));
    report(progress);
  };
  report(0);
  if (document.readyState !== 'loading') mark('dom');
  else document.addEventListener('DOMContentLoaded', () => mark('dom'), { once: true, signal });
  if (document.documentElement.dataset.scrollReady === 'true') mark('scroll');
  else document.addEventListener('portfolio:scroll-ready', () => mark('scroll'), { once: true, signal });
  void document.fonts.ready.then(() => mark('fonts'), () => mark('fonts'));

  void prepareHeroImages().then(() => mark('images'));
  const islands = [...document.querySelectorAll('astro-island[client="load"][ssr]')];
  let remainingIslands = islands.length;
  if (!remainingIslands) mark('components');
  for (const island of islands) island.addEventListener('astro:hydrate', () => {
    if (!--remainingIslands) mark('components');
  }, { once: true, signal });

  const styles = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')];
  let remainingStyles = styles.length;
  if (!remainingStyles) mark('critical');
  for (const style of styles) {
    let settled = false;
    const finish = () => { if (settled) return; settled = true; if (!--remainingStyles) mark('critical'); };
    if (style.sheet) finish();
    else {
      style.addEventListener('load', finish, { once: true, signal });
      style.addEventListener('error', finish, { once: true, signal });
    }
  }
}
