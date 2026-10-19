import type { AnimationItem } from 'lottie-web';
import { loadAnimationData } from './page-assets';

/** Let theme foreground inherit naturally; authored orange remains untouched. */
export function inheritAnimationInk(container: HTMLElement) {
  for (const element of container.querySelectorAll<SVGElement>('[fill], [stroke]')) {
    for (const attribute of ['fill', 'stroke']) {
      const value = element.getAttribute(attribute)?.replace(/\s/g, '');
      if (value === 'rgb(255,255,255)' || value === '#ffffff' || value === '#fff') {
        element.setAttribute(attribute, 'currentColor');
      }
    }
  }
}

export function initializeTitleAnimations() {
  const disposers = [...document.querySelectorAll<HTMLElement>('[data-title-animation]')].map(root => {
    const container = root.querySelector<HTMLElement>('[data-title-player]');
    if (!container) return () => {};
    const controller = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let animation: AnimationItem | undefined;
    let loading = false, visible = false, ready = false, failed = false, loops = 0;
    const loopInterval = Number(root.dataset.loopInterval || 0);
    let delayRemaining = Number(root.dataset.firstStrikeDelay || 0) * 1000;
    let delayStartedAt: number | undefined;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let strikeSegment: [number, number] | undefined;
    let strikeStarted = false;
    const pauseDelay = () => {
      if (delayStartedAt !== undefined) {
        delayRemaining = Math.max(0, delayRemaining - (performance.now() - delayStartedAt));
      }
      clearTimeout(delayTimer);
      delayTimer = undefined;
      delayStartedAt = undefined;
    };
    root.dataset.loopCount = '0';
    const update = () => {
      if (controller.signal.aborted || failed) return;
      const paused = motion.matches || !visible || document.hidden;
      if (paused) {
        animation?.pause();
        pauseDelay();
        if (ready) root.dataset.playback = 'paused';
        return;
      }
      // Count the initial hold from visibility, including asset loading time.
      // Offscreen/hidden time does not consume the visitor's two-second hold.
      if (loopInterval > 0 && !strikeStarted && delayRemaining > 0) {
        if (delayTimer === undefined) {
          delayStartedAt = performance.now();
          delayTimer = setTimeout(() => {
            delayRemaining = 0;
            delayTimer = undefined;
            delayStartedAt = undefined;
            update();
          }, delayRemaining);
        }
        animation?.pause();
        if (ready) root.dataset.playback = 'waiting';
        return;
      }
      if (!animation || !ready) return;
      if (strikeSegment && !strikeStarted) {
        strikeStarted = true;
        animation.playSegments(strikeSegment, true);
      } else animation.play();
      root.dataset.playback = 'playing';
    };
    const fallback = () => {
      failed = true;
      pauseDelay();
      ready = false;
      root.dataset.ready = 'false';
      root.dataset.playback = 'fallback';
      animation?.destroy();
      animation = undefined;
    };
    const load = async () => {
      if (loading || motion.matches || controller.signal.aborted) return;
      loading = true;
      try {
        const [player, animationData] = await Promise.all([
          import('lottie-web/build/player/lottie_light'),
          loadAnimationData(root.dataset.animationSrc!, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (loopInterval > 0) {
          const effectFrames = animationData.layers
            .filter((layer: { nm: string }) => layer.nm.startsWith('Shape Layer '))
            .map((layer: { ip: number }) => layer.ip);
          const firstStrike = Math.min(...effectFrames);
          strikeSegment = [firstStrike, Math.min(firstStrike + loopInterval * animationData.fr, animationData.op)];
        }
        const lottie = player.default ?? (window as Window & { lottie?: typeof player.default }).lottie;
        if (!lottie) throw new Error('Lottie player unavailable');
        animation = lottie.loadAnimation({
          container, renderer: 'svg', loop: true, autoplay: false, animationData,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false },
        });
        animation.addEventListener('DOMLoaded', () => {
          if (controller.signal.aborted || failed) return;
          inheritAnimationInk(container);
          ready = true;
          root.dataset.ready = 'true';
          update();
        });
        animation.addEventListener('loopComplete', () => {
          root.dataset.loopCount = String(++loops);
        });
        animation.addEventListener('data_failed', fallback);
        animation.addEventListener('error', fallback);
      } catch {
        if (!controller.signal.aborted) fallback();
      }
    };
    const preload = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void load();
    }, { rootMargin: '400px' });
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) void load();
      update();
    });
    preload.observe(root);
    visibility.observe(root);
    document.addEventListener('visibilitychange', update, { signal: controller.signal });
    motion.addEventListener('change', () => {
      if (!motion.matches && visible) void load();
      update();
    }, { signal: controller.signal });
    return () => {
      controller.abort();
      pauseDelay();
      preload.disconnect();
      visibility.disconnect();
      animation?.destroy();
      root.dataset.ready = 'false';
    };
  });
  return () => disposers.forEach(dispose => dispose());
}
