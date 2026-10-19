const heroImages = new WeakMap<Element, Promise<void>>();

/** Resolve when the hero artwork is drawable, including its CSS textures. */
export function prepareHeroImages() {
  const hero = document.querySelector('[data-cinematic-hero]');
  if (!hero) return Promise.resolve();
  const existing = heroImages.get(hero);
  if (existing) return existing;
  const images = [...document.querySelectorAll<HTMLImageElement>('[data-cinematic-hero] img:not([loading="lazy"])')];
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[data-loading-image]')) {
    const image = new Image();
    image.decoding = 'async';
    image.src = link.href;
    images.push(image);
  }
  // Broken artwork must not prevent the remaining page from opening.
  const ready = Promise.allSettled(images.map(image => image.decode())).then(() => {});
  heroImages.set(hero, ready);
  return ready;
}

const animationData = new Map<string, Promise<unknown>>();
/** Cache the source, then clone it: Lottie mutates the data of each player. */
export async function loadAnimationData(src: string, signal: AbortSignal): Promise<any> {
  let pending = animationData.get(src);
  if (!pending) {
    pending = fetch(src, { signal }).then(response => {
      if (!response.ok) throw new Error('Animation unavailable');
      return response.json();
    });
    animationData.set(src, pending);
    void pending.catch(() => { if (animationData.get(src) === pending) animationData.delete(src); });
  }
  return structuredClone(await pending);
}

/** Prepare later sections one task at a time, after the first screen is ready. */
export async function warmPageAssets(signal: AbortSignal) {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (signal.aborted || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
  await Promise.allSettled([document.fonts.ready, prepareHeroImages()]);
  if (signal.aborted) return;
  const tasks: Array<() => Promise<unknown>> = [
    ...[...document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')].map(image => async () => {
      image.fetchPriority = 'low';
      image.loading = 'eager';
      await image.decode();
    }),
    ...[...new Set([...document.querySelectorAll('astro-island[client="visible"]')]
      .map(island => island.getAttribute('component-url')).filter((src): src is string => Boolean(src)))]
      .map(src => async () => {
        // Compile/cache future island modules without hydrating offscreen UI.
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = src;
        link.fetchPriority = 'low';
        document.head.append(link);
      }),
    ...(!matchMedia('(prefers-reduced-motion: reduce)').matches
      ? [...new Set([...document.querySelectorAll<HTMLElement>('[data-animation-src]')].map(root => root.dataset.animationSrc!))]
        .map(src => () => loadAnimationData(src, signal))
      : []),
  ];
  let idle = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
    clearTimeout(timer);
    tasks.length = 0;
  };
  signal.addEventListener('abort', cancel, { once: true });
  const next = () => {
    if (signal.aborted || !tasks.length) {
      signal.removeEventListener('abort', cancel);
      return;
    }
    const run = async () => {
      if (signal.aborted) return;
      if (!document.hidden) {
        const task = tasks.shift();
        if (task) {
          // A stalled optional image must not hold up all subsequent warmups.
          let timeout: ReturnType<typeof setTimeout> | undefined;
          await Promise.race([task().catch(() => {}), new Promise(resolve => { timeout = setTimeout(resolve, 2000); })]);
          clearTimeout(timeout);
        }
      }
      next();
    };
    if ('requestIdleCallback' in window && !document.hidden) idle = window.requestIdleCallback(() => { void run(); }, { timeout: 1000 });
    else timer = setTimeout(() => { void run(); }, document.hidden ? 1000 : 32);
  };
  next();
}
