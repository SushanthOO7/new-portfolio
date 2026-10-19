import { gsap } from 'gsap';
import { getLavaRoutes, getMoltenShape } from '../lib/lava.js';

/** Company artwork is independent of decorative section backgrounds. */
export function setupExperienceLogos() {
  const logos = [...document.querySelectorAll<HTMLImageElement>('[data-company-logo]')];
  const fallback = (logo: HTMLImageElement) => {
    logo.hidden = true;
    logo.previousElementSibling?.classList.remove('sr-only');
  };
  const handlers = logos.map(logo => {
    const error = () => fallback(logo);
    const load = () => {
      logo.hidden = false;
      logo.previousElementSibling?.classList.add('sr-only');
    };
    logo.addEventListener('error', error);
    logo.addEventListener('load', load);
    if (logo.complete && !logo.naturalWidth) error();
    return () => { logo.removeEventListener('error', error); logo.removeEventListener('load', load); };
  });
  const sync = () => {
    const light = document.documentElement.dataset.theme === 'light';
    for (const logo of logos) {
      const src = light ? logo.dataset.lightSrc : logo.dataset.darkSrc;
      if (src && logo.getAttribute('src') !== src) logo.src = src;
    }
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
  return () => { observer.disconnect(); handlers.forEach(cleanup => cleanup()); };
}

/** Independent continuous beams and a gently breathing, permanently attached molten corner. */
export function setupExperienceEffects() {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-experience-card]')];
  const cleanups: Array<() => void> = [];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  for (const [index, card] of cards.entries()) {
    const svg = card.querySelector<SVGSVGElement>('[data-lava-border]');
    const track = card.querySelector<SVGPathElement>('[data-lava-path]');
    const horizontal = card.querySelector<SVGPathElement>('[data-lava-horizontal]');
    const vertical = card.querySelector<SVGPathElement>('[data-lava-vertical]');
    const beam = card.querySelector<SVGGElement>('[data-lava-beam]');
    const beamPaths = [...card.querySelectorAll<SVGPathElement>('[data-lava-beam] path')];
    const neck = card.querySelector<SVGPathElement>('[data-lava-neck]');
    const inner = card.querySelector<SVGPathElement>('[data-lava-inner]');
    const embers = card.querySelector<SVGGElement>('[data-lava-embers]');
    if (!svg || !beam || !neck || !inner || !embers || !track || !horizontal || !vertical) continue;

    let resizeFrame = 0;
    let measuredWidth = 0;
    let measuredHeight = 0;
    let measuredSide = '';
    const measure = () => {
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      const side = innerWidth < 768 ? 'right' : card.dataset.lavaSide || 'right';
      if (width === measuredWidth && height === measuredHeight && side === measuredSide) return;
      measuredWidth = width;
      measuredHeight = height;
      measuredSide = side;
      const radius = 14;
      const route = `M${radius} 1H${width - radius}Q${width - 1} 1 ${width - 1} ${radius}V${height - radius}Q${width - 1} ${height - 1} ${width - radius} ${height - 1}H${radius}Q1 ${height - 1} 1 ${height - radius}V${radius}Q1 1 ${radius} 1Z`;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      track.setAttribute('d', route);
      const routes = getLavaRoutes(width, height, side);
      horizontal.setAttribute('d', routes.horizontal);
      vertical.setAttribute('d', routes.vertical);
    };
    measure();

    const resting = getMoltenShape(.55, 5);
    const restingInner = getMoltenShape(.55, 5, 1);
    const beamLoop = gsap.fromTo(beamPaths, { strokeDashoffset: 110, opacity: 1 }, {
      strokeDashoffset: -1000, duration: 4.8 + (index % 3) * .2,
      repeat: -1, repeatDelay: 0, ease: 'none', paused: true,
    });
    const lavaLoop = gsap.timeline({ paused: true, repeat: -1, yoyo: true });
    lavaLoop
      .fromTo(neck, { attr: { d: resting }, strokeWidth: .9 }, {
        attr: { d: getMoltenShape(.72, 11) }, duration: 1.8, ease: 'sine.inOut',
      }, 0)
      .fromTo(inner, { attr: { d: restingInner }, opacity: .82 }, {
        attr: { d: getMoltenShape(.72, 11, 1) }, duration: 1.8, ease: 'sine.inOut',
      }, 0);
    const emberLoops = [...embers.querySelectorAll('circle')].map((dot, dotIndex) => {
      const loop = gsap.fromTo(dot, { opacity: .08, x: 0, y: 0 }, {
        opacity: .28 + (dotIndex % 3) * .05, x: dotIndex % 2 ? 1 : -1, y: -2,
        duration: 1.1 + dotIndex * .13, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: true,
      });
      loop.totalTime(dotIndex * .31 + index * .2);
      return loop;
    });
    beamLoop.totalTime(index * 1.3);
    lavaLoop.totalTime(index * .7);
    const loops = [beamLoop, lavaLoop, ...emberLoops];
    const settled = () => {
      gsap.set(neck, { attr: { d: resting }, strokeWidth: .9 });
      gsap.set(inner, { attr: { d: restingInner }, opacity: .82 });
    };
    let visible = false;
    const syncMotion = () => {
      const running = visible && !motion.matches && !document.hidden;
      gsap.set(beam, { opacity: motion.matches ? 0 : 1 });
      loops.forEach(loop => loop.paused(!running));
      if (motion.matches) settled();
    };
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      syncMotion();
    });
    visibility.observe(card);
    motion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
    syncMotion();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    });
    observer.observe(card);
    cleanups.push(() => {
      visibility.disconnect();
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      motion.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncMotion);
      loops.forEach(loop => loop.kill());
    });
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
