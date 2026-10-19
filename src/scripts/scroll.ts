import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import { setupExperienceEffects, setupExperienceLogos } from './experience';
import { setupLogoJourney } from './logo-journey';
import { warmPageAssets } from './page-assets';

gsap.registerPlugin(ScrollTrigger);

function setupScroll() {
  const controller = new AbortController();
  const cleanupAssets = setupExperienceLogos();
  const cleanupExperienceEffects = setupExperienceEffects();
  const motion = gsap.matchMedia();
  const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const updateProgress = () => {
    const limit = document.documentElement.scrollHeight - innerHeight;
    const value = limit > 0 ? Math.max(0, Math.min(1, scrollY / limit)) : 0;
    if (progress) progress.style.transform = `scaleX(${value})`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  const sizeObserver = new ResizeObserver(updateProgress);
  sizeObserver.observe(document.body);
  updateProgress();

  motion.add({ animated: '(prefers-reduced-motion: no-preference)' }, context => {
    if (!context.conditions?.animated) return;
    // GSAP owns the only clock. Native touch behavior remains untouched.
    const lenis = new Lenis({ autoRaf: false, duration: 1.2, easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)), smoothWheel: true, wheelMultiplier: 1, syncTouch: false, anchors: false });
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const cleanupJourney = setupLogoJourney(
      () => lenis.isScrolling === 'smooth' ? lenis.animatedScroll : scrollY,
      { resize: () => lenis.resize(), target: () => lenis.isScrolling === 'smooth' ? lenis.targetScroll : scrollY, scrollTo: (value, immediate = false) => lenis.scrollTo(value, { immediate }) },
    );
    const timeline = document.querySelector<HTMLElement>('[data-timeline]');
    let disposed = false;
    const refresh = () => ScrollTrigger.refresh();
    const observer = new ResizeObserver(refresh);
    if (timeline) observer.observe(timeline);
    document.fonts.ready.then(() => { if (!disposed) refresh(); });
    document.fonts.addEventListener('loadingdone', refresh);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', refresh);
      cleanupJourney();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  });
  // Module order varies: expose both a persistent state and an event.
  document.documentElement.dataset.scrollReady = 'true';
  document.dispatchEvent(new Event('portfolio:scroll-ready'));
  void warmPageAssets(controller.signal);
  return () => {
    controller.abort();
    delete document.documentElement.dataset.scrollReady;
    motion.revert();
    cleanupExperienceEffects();
    cleanupAssets();
    sizeObserver.disconnect();
    removeEventListener('scroll', updateProgress);
  };
}

let cleanup = setupScroll();
const destroy = () => cleanup();
const init = () => { cleanup(); cleanup = setupScroll(); };
document.addEventListener('astro:before-swap', destroy);
document.addEventListener('astro:after-swap', init);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cleanup();
  document.removeEventListener('astro:before-swap', destroy);
  document.removeEventListener('astro:after-swap', init);
});
