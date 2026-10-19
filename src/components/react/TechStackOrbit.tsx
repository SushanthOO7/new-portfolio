import { BRAND_PATH } from '../../lib/brand.js';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { CATEGORY_LABELS, TECH_CATEGORIES, filterTechnologies } from '../../lib/tech-stack.js';

type Technology = { id: string; title: string; categories: string[]; logo: string; logoLight?: string };
type Position = { orbit: number; radius: number; angle: number };
// Leave enough room between guides for the smaller tiles, including diagonals.
const ORBITS = [11, 22.5, 34, 45.5].map((radius, index) => ({
  radius, start: [70, 140, 250, 20][index], sweep: [50, 80, 80, 80][index],
  duration: [60_000, 65_000, 55_000, 70_000][index], direction: [1, -1, -1, 1][index],
}));
const ORBIT_ORIGIN = { x: 50, y: 50 };
const ORBIT_CAPACITIES = [3, 6, 8, 10];
function polarPoint(radius: number, angle: number) {
  const radians = angle * Math.PI / 180;
  return { x: ORBIT_ORIGIN.x + radius * Math.cos(radians), y: ORBIT_ORIGIN.y + radius * Math.sin(radians) };
}
function technologyPosition(index: number, total: number): Position {
  let offset = 0;
  for (let orbit = 0; orbit < ORBITS.length; orbit++) {
    const capacity = orbit === ORBITS.length - 1 ? Math.max(ORBIT_CAPACITIES[orbit], total - offset) : ORBIT_CAPACITIES[orbit];
    if (index < offset + capacity) {
      const count = Math.min(capacity, total - offset);
      return { orbit, radius: ORBITS[orbit].radius, angle: -90 + orbit * 15 + (index - offset) * 360 / count };
    }
    offset += capacity;
  }
  throw new Error('Technology has no orbit slot.');
}
type Active = { item: Technology; element: HTMLButtonElement };
const SPRING = { type: 'spring' as const, stiffness: 115, damping: 21 };

function TechnologyLogo({ item }: { item: Technology }) {
  return <span className="tech-logo" aria-hidden="true">
    <img className={item.logoLight ? 'tech-logo__dark' : undefined} src={item.logo} alt="" width="48" height="48" draggable="false" />
    {item.logoLight ? <img className="tech-logo__light" src={item.logoLight} alt="" width="48" height="48" draggable="false" /> : null}
  </span>;
}

function OrbitItem({ item, position, active, setActive, setFocused, scheduleClose, entered, reduced, index }: {
  item: Technology; position: Position;
  active: Active | null; setActive: (value: Active | null) => void; entered: boolean; reduced: boolean; index: number;
  setFocused: (value: string | null) => void; scheduleClose: () => void;
}) {
  const pointerType = useRef('mouse');
  const point = polarPoint(position.radius, position.angle);
  const emphasized = active?.item.id === item.id;
  return <motion.div className="tech-orbit__position" style={{ left: `${point.x}%`, top: `${point.y}%`, zIndex: emphasized ? 5 : 2 }} data-orbit={position.orbit} data-radius={position.radius} data-angle={position.angle}
    initial={{ opacity: 0 }} animate={{ opacity: entered ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}>
    <div className="tech-orbit__anchor">
      <motion.div className="tech-orbit__entrance" initial={false}
        animate={{ scale: entered ? 1 : .6 }} transition={reduced ? { duration: 0 } : { ...SPRING, delay: entered ? 1.4 + index * .065 : 0 }}>
        <motion.button type="button" className={`tech-tile${emphasized ? ' is-active' : ''}`} data-tech-id={item.id}
          disabled={!entered} aria-label={`${item.title} — ${item.categories.map(c => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]).join(', ')}`}
          aria-describedby={emphasized ? 'technology-tooltip' : undefined}
          animate={{ scale: emphasized && !reduced ? 1.15 : 1, opacity: active && !emphasized ? .45 : 1 }} transition={reduced ? { duration: 0 } : SPRING}
          onHoverStart={event => { if (event.target instanceof Element) { const button = event.target.closest('button'); if (button) setActive({ item, element: button }); } }}
          onHoverEnd={scheduleClose}
          onPointerDown={event => { pointerType.current = event.pointerType; }}
          onFocus={event => { setFocused(item.id); if (event.currentTarget.matches(':focus-visible')) setActive({ item, element: event.currentTarget }); }}
          onBlur={() => { setFocused(null); setActive(null); }}
          onClick={event => { setActive(pointerType.current !== 'mouse' && event.detail !== 0 && emphasized ? null : { item, element: event.currentTarget }); }}>
          <TechnologyLogo item={item} />
        </motion.button>
      </motion.div>
    </div>
  </motion.div>;
}

function Tooltip({ active, reduced, dismiss, cancelClose, scheduleClose }: { active: Active; reduced: boolean; dismiss: () => void; cancelClose: () => void; scheduleClose: () => void }) {
  const tooltip = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ left: 0, top: 0, ready: false });
  const pointer = useSpring(0, { stiffness: 180, damping: 22 });
  useLayoutEffect(() => {
    const place = () => {
      const rect = active.element.getBoundingClientRect();
      const width = tooltip.current?.offsetWidth ?? 160;
      const height = tooltip.current?.offsetHeight ?? 60;
      const obstacles = [...document.querySelectorAll<HTMLElement>('.tech-tile, .tech-stack__filters')]
        .filter(element => element !== active.element).map(element => element.getBoundingClientRect());
      const middleX = rect.left + (rect.width - width) / 2;
      const middleY = rect.top + (rect.height - height) / 2;
      const candidates = [
        { left: rect.right + 14, top: middleY }, { left: rect.left - width - 14, top: middleY },
        { left: middleX, top: rect.top - height - 14 }, { left: middleX, top: rect.bottom + 14 },
        { left: rect.right + 14, top: rect.top - height - 14 }, { left: rect.left - width - 14, top: rect.top - height - 14 },
        { left: rect.right + 14, top: rect.bottom + 14 }, { left: rect.left - width - 14, top: rect.bottom + 14 },
      ].map(candidate => ({ left: Math.max(12, Math.min(candidate.left, innerWidth - width - 12)), top: Math.max(12, Math.min(candidate.top, innerHeight - height - 12)) }));
      const overlap = (candidate: { left: number; top: number }, obstacle: DOMRect) =>
        Math.max(0, Math.min(candidate.left + width + 5, obstacle.right) - Math.max(candidate.left - 5, obstacle.left)) *
        Math.max(0, Math.min(candidate.top + height + 5, obstacle.bottom) - Math.max(candidate.top - 5, obstacle.top));
      const score = (candidate: { left: number; top: number }) => obstacles.reduce((sum, obstacle) => sum + overlap(candidate, obstacle), 0) + overlap(candidate, rect);
      const chosen = candidates.reduce((best, candidate) => score(candidate) < score(best) ? candidate : best);
      setBox({ ...chosen, ready: true });
    };
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    document.addEventListener('journey-camera:move', place);
    const move = (event: PointerEvent) => {
      if (!reduced && event.pointerType === 'mouse') {
        const rect = active.element.getBoundingClientRect();
        pointer.set(Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) * .12)));
      }
    };
    active.element.addEventListener('pointermove', move);
    return () => { window.removeEventListener('scroll', place); window.removeEventListener('resize', place); document.removeEventListener('journey-camera:move', place); active.element.removeEventListener('pointermove', move); pointer.set(0); };
  }, [active, reduced, pointer]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !active.element.contains(event.target) && !tooltip.current?.contains(event.target)) dismiss(); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [active, dismiss]);
  return createPortal(<motion.div ref={tooltip} id="technology-tooltip" role="tooltip" className="tech-tooltip"
    onPointerEnter={cancelClose} onPointerLeave={scheduleClose}
    style={{ left: box.left, top: box.top, y: pointer, visibility: box.ready ? 'visible' : 'hidden' }}
    initial={{ opacity: 0, x: reduced ? 0 : -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .15 }}>
    <strong><i aria-hidden="true" />{active.item.title}</strong>
    <span><i aria-hidden="true" />{active.item.categories.map(c => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]).join(' / ')}</span>
  </motion.div>, document.body);
}


function OrbitLayer({ index, phase, entered, reduced, diameter }: { index: number; phase: MotionValue<number>; entered: boolean; reduced: boolean; diameter: number }) {
  const orbit = ORBITS[index];
  const rotation = useTransform(phase, value => `rotate(${value}deg)`);
  const start = polarPoint(orbit.radius, orbit.start);
  const end = polarPoint(orbit.radius, orbit.start + orbit.sweep);
  const node = polarPoint(orbit.radius, orbit.direction > 0 ? orbit.start + orbit.sweep : orbit.start);
  return <motion.g style={{ transform: rotation, transformOrigin: '50% 50%', transformBox: 'view-box' }} data-orbit-layer={index}>
    <motion.path className="tech-orbit__arc"
      d={`M ${start.x * 6} ${start.y * 6} A ${orbit.radius * 6} ${orbit.radius * 6} 0 0 1 ${end.x * 6} ${end.y * 6}`} initial={false}
      animate={{ opacity: entered ? .65 : 0 }}
      transition={{ duration: reduced ? 0 : .9, delay: reduced ? 0 : .55 }} />
    <motion.circle className="tech-orbit__node" cx={node.x * 6} cy={node.y * 6} r={(index === 3 ? 5.5 : 3) * 600 / diameter}
      data-orbit-node={index} initial={false} animate={{ opacity: entered ? 1 : 0 }} transition={{ duration: reduced ? 0 : .25, delay: reduced ? 0 : 1.3 }} />
  </motion.g>;
}

/** Four shared polar guides; only their accent/node layers rotate. */
export default function TechStackOrbit({ items }: { items: Technology[] }) {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: .15 });
  const seen = useInView(root, { once: true, amount: .15 });
  const reduced = !!useReducedMotion();
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState('all');
  const [active, setActive] = useState<Active | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = useCallback(() => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const activate = useCallback((value: Active | null) => { cancelClose(); setActive(value); }, [cancelClose]);
  const dismiss = useCallback(() => activate(null), [activate]);
  const scheduleClose = useCallback(() => {
    cancelClose();
    // Motion can dispatch hover-end after the tooltip's pointer-enter. Check the
    // actual hover region when the delay expires, rather than relying on event order.
    closeTimer.current = setTimeout(() => setActive(current => {
      const tooltipHovered = document.getElementById('technology-tooltip')?.matches(':hover');
      return current && (document.activeElement === current.element || current.element.matches(':hover') || tooltipHovered) ? current : null;
    }), 180);
  }, [cancelClose]);
  useEffect(() => cancelClose, [cancelClose]);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const phase0 = useMotionValue(0);
  const phase1 = useMotionValue(0);
  const phase2 = useMotionValue(0);
  const phase3 = useMotionValue(0);
  const phases = [phase0, phase1, phase2, phase3];
  const orbitElement = useRef<HTMLDivElement>(null);
  const [diameter, setDiameter] = useState(600);
  useEffect(() => {
    const element = orbitElement.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setDiameter(Math.min(entry.contentRect.width, entry.contentRect.height)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const filtered = filterTechnologies(items, category) as Technology[];
  const positions = new Map(items.map((item, index) => [item.id, technologyPosition(index, items.length)]));
  const entered = !ready || seen || reduced;
  const running = ready && seen && inView && !paused && !active && !focused && !reduced && pageVisible;
  useEffect(() => {
    setReady(true);
    document.dispatchEvent(new Event('logo-journey:layout'));
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useAnimationFrame((_time, delta) => {
    if (!running) return;
    const step = Math.min(delta, 50);
    phases.forEach((phase, index) => phase.set((phase.get() + step * 360 / ORBITS[index].duration * ORBITS[index].direction) % 360));
  });
  const reveal = (delay: number) => reduced || !ready ? {} : { y: entered ? [100, 0] : 100, opacity: entered ? [0, 1] : 0, transition: { duration: .75, delay, ease: [.22, 1, .36, 1] as const } };
  return <div ref={root} className={`tech-stack__inner${ready ? ' is-enhanced' : ''}`} data-orbit-running={running}>
    <header className="tech-stack__eyebrow"><span>// 04</span><i aria-hidden="true" /></header>
    <div className="tech-stack__layout">
      <div className="tech-stack__copy">
        <h2 id="tech-stack-title" className="tech-stack__title"><span><motion.span initial={false} animate={reveal(0)}>TECH</motion.span></span><span><motion.span className="tech-stack__orange" initial={false} animate={reveal(.14)}>STACK</motion.span></span></h2>
        <span className="tech-stack__dash" aria-hidden="true" />
        <div className="tech-stack__filters" role="group" aria-label="Filter technologies">
          {TECH_CATEGORIES.map(c => <button key={c} type="button" disabled={!ready} aria-pressed={category === c} onClick={() => { activate(null); setCategory(c); }}>
            {c === 'all' ? 'ALL' : c.toUpperCase()}
          </button>)}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'technology' : 'technologies'} shown{category !== 'all' ? ` in ${category}` : ''}.</p>
      </div>
      <div ref={orbitElement} className="tech-orbit" aria-label="Technology ecosystem">
        <svg className="tech-orbit__paths" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true">
          {ORBITS.map((orbit, index) => <motion.circle key={index} className={`tech-orbit__guide${index === 1 ? ' tech-orbit__guide--dashed' : ''}`} data-orbit-guide={index} cx="300" cy="300" r={orbit.radius * 6}
            initial={false} animate={{ opacity: entered ? 1 : 0 }} transition={{ duration: reduced ? 0 : .4, delay: reduced ? 0 : .2 }} />)}
          {ORBITS.map((_, index) => <OrbitLayer key={index} index={index} phase={phases[index]} entered={entered} reduced={reduced} diameter={diameter} />)}
        </svg>
        <div className="tech-orbit__brand" aria-hidden="true" data-logo-anchor="tech-stack"><motion.svg viewBox="0 0 35 35" initial={false}
          animate={{ scale: entered ? 1 : .85 }} transition={{ duration: reduced ? 0 : .4 }}><path d={BRAND_PATH} /></motion.svg></div>
        <AnimatePresence initial={false}>
          {filtered.map((item, index) => <OrbitItem key={item.id} item={item} position={positions.get(item.id)!}
            active={active} setActive={activate} setFocused={setFocused} scheduleClose={scheduleClose} entered={entered} reduced={reduced} index={index} />)}
        </AnimatePresence>
        {filtered.length === 0 ? <p className="tech-orbit__empty">No technologies added yet.</p> : null}
        <button type="button" className="tech-orbit__pause" disabled={!ready || reduced} aria-label={paused ? 'Resume orbital animation' : 'Pause orbital animation'} aria-pressed={paused}
          onClick={() => setPaused(value => !value)}><span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span><span>{paused ? 'RESUME' : 'PAUSE'}</span></button>
      </div>
    </div>
    {active ? <Tooltip active={active} reduced={reduced} dismiss={dismiss} cancelClose={cancelClose} scheduleClose={scheduleClose} /> : null}
  </div>;
}
