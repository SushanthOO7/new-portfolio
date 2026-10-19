import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createJourney } from '../lib/logo-journey.js';
import { createReferenceJourney } from '../lib/logo-journey-route';
import {
  createCinematicJourney,
  sampleCinematicJourney,
  inputForCamera,
  LOGO_MOTION,
  type CinematicJourney,
} from '../lib/logo-cinematic';

type ScrollControls = {
  resize: () => void;
  target?: () => number;
  scrollTo: (value: number, immediate?: boolean) => void;
};

/** One shared input clock drives the logo and a separately held page camera. */
export function setupLogoJourney(
  readScroll: () => number = () => scrollY,
  controls: ScrollControls = {
    resize: () => {},
    scrollTo: value => window.scrollTo(0, value),
  }
): () => void {
  const traveler = document.querySelector<HTMLElement>('[data-logo-traveler]');
  const hero = document.querySelector<SVGElement>('[data-logo-anchor="hero"]');
  const root = document.querySelector<HTMLElement>('[data-journey-scroll]');
  const content = document.querySelector<HTMLElement>('[data-journey-content]');
  if (!traveler || !hero || !root || !content) return () => {};
  const originalParent = traveler.parentNode!;
  const originalNext = traveler.nextSibling;
  // Fixed overlays must sit outside the transformed content's containing block.
  document.body.append(traveler);
  const html = document.documentElement;
  let journey = createJourney([], innerWidth);
  let cinematic: CinematicJourney | null = null;
  let camera = scrollY;
  let motionInput = readScroll();
  let active = false;
  let anchorLock: HTMLElement | null = null;
  let disposed = false;
  let refreshFrame = 0;
  let lastTransform = '';
  let lastSize = 0;
  let railTop = 0;
  let railHeight = 0;
  let railX = 0;
  let trail: HTMLElement | null = null;
  let orbitPoint: ReturnType<typeof center> | null = null;
  // Development-only visualization of the actual cached curves: /?logoPath=1.
  const showPath =
    import.meta.env.DEV && new URLSearchParams(location.search).has('logoPath');
  let pathOverlay: SVGSVGElement | null = null;

  const center = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + camera + rect.height / 2,
      width: rect.width,
    };
  };
  const section = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { top: rect.top + camera, bottom: rect.bottom + camera };
  };
  const measure = () => {
    const previousModel = cinematic;
    const previous = cinematic ? sampleCinematicJourney(cinematic, motionInput) : null;
    const previousTarget = previousModel
      ? sampleCinematicJourney(previousModel, controls.target?.() ?? readScroll())
      : null;
    const targetIndex =
      previousTarget && previousModel
        ? previousModel.journey.segments.findIndex(
            segment => segment.to.scroll > previousTarget.distance
          )
        : -1;
    const targetSegment =
      targetIndex >= 0 ? previousModel!.journey.segments[targetIndex] : null;
    const targetProgress =
      targetSegment && previousTarget
        ? (previousTarget.distance - targetSegment.from.scroll) /
          Math.max(0.001, targetSegment.length)
        : 1;
    const oldIndex =
      previous && previousModel
        ? previousModel.journey.segments.findIndex(
            segment => segment.to.scroll > previous.distance
          )
        : -1;
    const oldSegment = oldIndex >= 0 ? previousModel!.journey.segments[oldIndex] : null;
    const localProgress =
      oldSegment && previous
        ? (previous.distance - oldSegment.from.scroll) /
          Math.max(0.001, oldSegment.length)
        : 1;
    const logicalHeight = content.getBoundingClientRect().height;
    const maxCamera = Math.max(0, logicalHeight - innerHeight);
    const heroSection = section('[data-cinematic-hero]');
    if (!heroSection) return;
    const rail = document.querySelector<HTMLElement>('[data-timeline]');
    const railStops: { x: number; y: number }[] = [];
    trail = document.querySelector<HTMLElement>('[data-timeline-trail]');
    if (rail) {
      const bounds = rail.getBoundingClientRect();
      railTop = bounds.top + camera + 16;
      railHeight = Math.max(0, bounds.height - 16);
      railX = innerWidth >= 768 ? bounds.left + bounds.width / 2 : bounds.left;
      railStops.push({ x: railX, y: railTop });
      for (const card of rail.querySelectorAll('[data-timeline-anchor]')) {
        railStops.push({ x: railX, y: center(card).y });
      }
    }
    const tech = document.querySelector('[data-logo-anchor="tech-stack"]');
    orbitPoint = tech ? center(tech) : null;
    const activity = document.querySelector('.github-activity')?.getBoundingClientRect();
    journey = createReferenceJourney({
      width: innerWidth,
      height: innerHeight,
      maxScroll: maxCamera,
      start: center(hero),
      end: null,
      hero: heroSection,
      experience: section('#experience'),
      rail: railStops,
      projects: section('#projects'),
      projectsHeading: section('.projects__header'),
      activity: activity
        ? {
            top: activity.top + camera,
            bottom: activity.bottom + camera,
            left: activity.left,
          }
        : null,
      tech: section('#tech-stack'),
      orbit: orbitPoint,
      contact: null,
      footer: null,
    });
    cinematic = createCinematicJourney(journey, innerHeight, maxCamera, innerWidth);
    root.style.height = `${cinematic.maxInput + innerHeight}px`;
    root.style.setProperty('--journey-viewport-height', `${innerHeight}px`);
    root.setAttribute('data-journey-active', '');
    if (
      !active ||
      !previousModel ||
      Math.abs(previousModel.maxInput - cinematic.maxInput) > 0.5
    ) {
      let target = readScroll();
      if (active && previousModel) {
        const segment = oldIndex >= 0 ? cinematic.journey.segments[oldIndex] : null;
        motionInput = segment
          ? (segment.from.scroll + segment.length * localProgress) *
            LOGO_MOTION.scrollPerPixel
          : cinematic.routeInput + Math.max(0, motionInput - previousModel.routeInput);
        const destination =
          targetIndex >= 0 ? cinematic.journey.segments[targetIndex] : null;
        target = destination
          ? (destination.from.scroll + destination.length * targetProgress) *
            LOGO_MOTION.scrollPerPixel
          : cinematic.routeInput +
            Math.max(0, (controls.target?.() ?? readScroll()) - previousModel.routeInput);
      }
      // A layout refresh must preserve the destination of an in-flight gesture,
      // not replace that destination with the lagging visual playhead.
      controls.resize();
      controls.scrollTo(target, true);
    }
    if (active && anchorLock) {
      const top = anchorLock.getBoundingClientRect().top + camera;
      motionInput = inputForCamera(cinematic, top);
      controls.scrollTo(motionInput, true);
    }
    active = true;
    if (showPath) {
      pathOverlay?.remove();
      pathOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      pathOverlay.setAttribute('aria-hidden', 'true');
      pathOverlay.setAttribute('data-logo-path-preview', '');
      pathOverlay.style.cssText = `position:absolute;left:0;top:0;width:${innerWidth}px;height:${logicalHeight}px;pointer-events:none;z-index:84;overflow:clip`;
      const path = document.createElementNS(pathOverlay.namespaceURI, 'path');
      path.setAttribute(
        'd',
        journey.segments
          .map((segment, i) => {
            const { from, to, c1, c2, rail } = segment;
            return `${i ? '' : `M${from.x},${from.y}`} ${rail ? `L${to.x},${to.y}` : `C${c1.x},${c1.y} ${c2.x},${c2.y} ${to.x},${to.y}`}`;
          })
          .join(' ')
      );
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#164dff');
      path.setAttribute('stroke-width', '2');
      pathOverlay.append(path);
      content.append(pathOverlay);
    }
    traveler.hidden = false;
    html.dataset.logoJourney = 'active';
  };
  const render = (_time?: number, deltaMs = 16.667) => {
    if (disposed || !cinematic) return;
    const target = Math.max(0, Math.min(cinematic.maxInput, readScroll()));
    const blend =
      1 - Math.exp(-Math.min(deltaMs, 64) / (LOGO_MOTION.responseSeconds * 1000));
    motionInput =
      Math.abs(target - motionInput) < 0.01
        ? target
        : motionInput + (target - motionInput) * blend;
    const point = sampleCinematicJourney(cinematic, motionInput);
    if (!point) return;
    const previousCamera = camera;
    camera = point.camera;
    content.style.transform = `translate3d(0,${-camera}px,0)`;
    if (Math.abs(camera - previousCamera) > 0.01)
      document.dispatchEvent(new Event('journey-camera:move'));
    const size = point.size;
    // Resize the SVG viewport itself: enlarging a filtered compositor layer
    // rasterized at 36px softens the monogram when it docks at the orbit center.
    if (lastSize !== size) {
      traveler.style.width = `${size}px`;
      traveler.style.height = `${size}px`;
      lastSize = size;
    }
    const transform = `translate3d(${point.x - size / 2}px,${point.y - camera - size / 2}px,0) rotate(${point.rotation}deg)`;
    if (lastTransform !== transform) {
      traveler.style.transform = transform;
      lastTransform = transform;
    }
    if (traveler.dataset.stage !== point.stage) traveler.dataset.stage = point.stage;
    if (trail) {
      const completed = ['projects', 'tech-stack'].includes(point.stage);
      const landedOnRail = point.stage === 'experience' && Math.abs(point.x - railX) < 1;
      const height = completed
        ? railHeight
        : point.onRail || landedOnRail
          ? Math.max(0, Math.min(railHeight, point.y - railTop))
          : 0;
      trail.style.height = `${height}px`;
      trail.style.opacity = height > 0 ? '1' : '0';
    }
    html.toggleAttribute(
      'data-logo-orbit-owned',
      Boolean(
        orbitPoint &&
        Math.hypot(point.x - orbitPoint.x, point.y - orbitPoint.y) <
          orbitPoint.width * 0.8
      )
    );
  };
  measure();
  const seekElement = (element: Element, immediate = false) => {
    if (!cinematic) return;
    const top = element.getBoundingClientRect().top + camera;
    const input = inputForCamera(
      cinematic,
      Math.max(0, Math.min(cinematic.maxCamera, top))
    );
    if (immediate) motionInput = input;
    controls.scrollTo(input, immediate);
    if (immediate) render();
  };
  const navigate = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const hash = link?.getAttribute('href');
    if (!hash || hash === '#') return;
    let target: Element | null = null;
    try {
      target = document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return;
    }
    if (!target || !content.contains(target)) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
    seekElement(target, true);
    if (target instanceof HTMLElement) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      anchorLock = target;
      target.focus({ preventScroll: true });
    }
  };
  const restoreHash = () => {
    anchorLock = null;
    let target: Element | null = null;
    try {
      target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    } catch {
      return;
    }
    if (target && content.contains(target)) {
      anchorLock = target instanceof HTMLElement ? target : null;
      seekElement(target, true);
    }
  };
  const revealFocus = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || !content.contains(target)) return;
    const rect = target.getBoundingClientRect();
    if (rect.top < 0 || rect.top > innerHeight - 40) seekElement(target, true);
  };
  const releaseAnchor = () => {
    anchorLock = null;
  };
  document.addEventListener('wheel', releaseAnchor, { passive: true });
  document.addEventListener('touchstart', releaseAnchor, { passive: true });
  document.addEventListener('pointerdown', releaseAnchor, { passive: true });
  document.addEventListener('keydown', releaseAnchor);
  document.addEventListener('click', navigate);
  document.addEventListener('focusin', revealFocus);
  addEventListener('hashchange', restoreHash);
  // Lenis and the camera share GSAP's ticker; there is no extra RAF loop.
  ScrollTrigger.addEventListener('refresh', measure);
  restoreHash();
  render();
  gsap.ticker.add(render);
  const refresh = () => {
    if (disposed || refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (!disposed) ScrollTrigger.refresh();
    });
  };
  const observer = new ResizeObserver(refresh);
  document
    .querySelectorAll(
      '[data-cinematic-hero], #experience, #projects, #tech-stack, #contact, [data-site-footer]'
    )
    .forEach(element => observer.observe(element));
  const techRoot = document.querySelector('#tech-stack');
  const mutations = new MutationObserver(refresh);
  if (techRoot) mutations.observe(techRoot, { childList: true, subtree: true });
  addEventListener('resize', refresh, { passive: true });
  document.addEventListener('toggle', refresh, true);
  document.addEventListener('logo-journey:layout', refresh);
  document.fonts.addEventListener('loadingdone', refresh);
  void document.fonts.ready.then(refresh);
  return () => {
    disposed = true;
    cancelAnimationFrame(refreshFrame);
    observer.disconnect();
    mutations.disconnect();
    removeEventListener('resize', refresh);
    document.removeEventListener('toggle', refresh, true);
    document.removeEventListener('logo-journey:layout', refresh);
    document.fonts.removeEventListener('loadingdone', refresh);
    ScrollTrigger.removeEventListener('refresh', measure);
    gsap.ticker.remove(render);
    document.removeEventListener('wheel', releaseAnchor);
    document.removeEventListener('touchstart', releaseAnchor);
    document.removeEventListener('pointerdown', releaseAnchor);
    document.removeEventListener('keydown', releaseAnchor);
    document.removeEventListener('click', navigate);
    document.removeEventListener('focusin', revealFocus);
    removeEventListener('hashchange', restoreHash);
    root.removeAttribute('data-journey-active');
    root.style.removeProperty('height');
    root.style.removeProperty('--journey-viewport-height');
    content.style.removeProperty('transform');
    originalParent.insertBefore(traveler, originalNext);
    controls.resize();
    controls.scrollTo(camera, true);
    traveler.hidden = true;
    traveler.style.removeProperty('transform');
    traveler.style.removeProperty('width');
    traveler.style.removeProperty('height');
    delete traveler.dataset.stage;
    if (trail) {
      trail.style.removeProperty('height');
      trail.style.removeProperty('opacity');
    }
    delete html.dataset.logoJourney;
    html.removeAttribute('data-logo-orbit-owned');
    html.removeAttribute('data-logo-footer-owned');
    pathOverlay?.remove();
  };
}
