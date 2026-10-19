import { gsap } from 'gsap';

/** Draw only the moving route accents; leave the large SVG/text layers static. */
export function setupHeroRoutes(hero: HTMLElement): () => void {
  const canvas = hero.querySelector<HTMLCanvasElement>('canvas[data-route-motion]');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return () => {};
  // Sample once: each frame draws only a short segment, never the full SVG path.
  const paths = [...hero.querySelectorAll<SVGPathElement>('[data-route-pulse]')]
    .map(path => {
      const length = path.getTotalLength();
      const count = Math.ceil(length / 4);
      const points = Array.from({ length: count + 1 }, (_, index) => {
        const point = path.getPointAtLength(index / count * length);
        return { x: point.x, y: point.y };
      });
      return { length, count, points };
    });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let lastFrame = 0;
  let lastScroll = -Infinity;
  let phase = 0;
  let width = 0;
  let height = 0;
  let disposed = false;
  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / 1920, canvas.height / 1080);
    context.strokeStyle = '#ff9b52';
    context.lineWidth = 2.5;
    context.lineCap = 'round';
    paths.forEach(({ length, count, points }, index) => {
      const segment = 110;
      const head = ((phase / (6.5 + index * 1.4) + index * .4) % 1) * (length + segment);
      const start = Math.max(0, head - segment);
      const end = Math.min(length, head);
      if (end <= start) return;
      const pointAt = (distance: number) => {
        const position = distance / length * count;
        const lower = Math.min(count - 1, Math.floor(position));
        const mix = position - lower;
        return {
          x: points[lower].x + (points[lower + 1].x - points[lower].x) * mix,
          y: points[lower].y + (points[lower + 1].y - points[lower].y) * mix,
        };
      };
      const first = pointAt(start);
      const last = pointAt(end);
      context.beginPath();
      context.moveTo(first.x, first.y);
      for (let i = Math.floor(start / length * count) + 1; i < end / length * count; i++) {
        context.lineTo(points[i].x, points[i].y);
      }
      context.lineTo(last.x, last.y);
      context.stroke();
    });
    context.restore();
  };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === width && bounds.height === height) return;
    width = bounds.width;
    height = bounds.height;
    // Decorative 2px lines do not need a high-DPI full-screen backing store.
    canvas.width = Math.max(1, Math.round(width * .75));
    canvas.height = Math.max(1, Math.round(height * .75));
    draw();
  };
  const tick = () => {
    const now = performance.now();
    if (disposed || !visible || document.hidden || reduced.matches || now - lastScroll < 180) {
      lastFrame = now;
      return;
    }
    if (now - lastFrame < 1000 / 60 - 1) return;
    phase += Math.min(now - lastFrame, 50) / 1000;
    lastFrame = now;
    draw();
  };
  const onScroll = () => { lastScroll = performance.now(); };
  const onPreference = () => { canvas.hidden = reduced.matches; };
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  const observer = new ResizeObserver(resize);
  resize();
  onPreference();
  visibility.observe(hero);
  observer.observe(canvas);
  reduced.addEventListener('change', onPreference);
  addEventListener('scroll', onScroll, { passive: true });
  gsap.ticker.add(tick);
  hero.dataset.routeMotion = 'canvas';
  return () => {
    disposed = true;
    gsap.ticker.remove(tick);
    visibility.disconnect();
    observer.disconnect();
    reduced.removeEventListener('change', onPreference);
    removeEventListener('scroll', onScroll);
    delete hero.dataset.routeMotion;
  };
}
