import { useEffect, useRef } from 'react';
import '../../styles/data-rain.css';

export interface DataRainPalette {
  calm: string;
  mid: string;
  hot: string;
}

export interface DataRainProps {
  className?: string;
  count?: number;
  flowSpeed?: number;
  obstacleRadius?: number;
  autopilot?: boolean;
  fullscreen?: boolean;
  palette?: DataRainPalette;
}

interface EngineApi { refresh: () => void }
type RGB = readonly [number, number, number];

const MAX = 7000;
const HISTORY = 19;
const STEP = 1 / 60;
const PUFFS = 32;
const TAU = Math.PI * 2;
const AGE_BUCKETS = 6;
const SEGS_PER_BUCKET = 3;
const DEFAULT_CALM: RGB = [84, 84, 82];
const DEFAULT_MID: RGB = [119, 119, 116];
const DEFAULT_HOT: RGB = [255, 77, 0];
const DEFAULT_CORE: RGB = [242, 242, 238];
const K_RELAX = 1 - Math.exp(-STEP / 0.12);
const K_CURSOR = 1 - Math.exp(-STEP * 18);
const K_VEL = 1 - Math.exp(-STEP * 10);
const K_IN = 1 - Math.exp(-STEP / 0.06);
const K_OUT = 1 - Math.exp(-STEP / 0.2);
const K_HEAT = 1 - Math.exp(-STEP * 10);
const PUFF_DECAY = Math.exp(-STEP / 1.1);

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function parseHex(input: string | undefined, fallback: RGB): RGB {
  if (!input) return fallback;
  let value = input.trim().replace(/^#/, '');
  if (value.length === 3) value = value.split('').map(char => char + char).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) return fallback;
  const number = Number.parseInt(value, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

interface Wave { kx: number; ky: number; omega: number; phase: number; x: number; y: number }
function makeWave(lambda: number, angle: number, omega: number, phase: number, amplitude: number): Wave {
  const k = TAU / lambda;
  return {
    kx: k * Math.cos(angle), ky: k * Math.sin(angle), omega, phase,
    x: amplitude * Math.sin(angle), y: -amplitude * Math.cos(angle),
  };
}

const WAVES = [
  makeWave(380, 0.35, 0.18, 0.7, 16),
  makeWave(620, 1.9, 0.27, 2.1, 13),
  makeWave(900, 3.4, 0.35, 4.2, 10),
];

export default function DataRain(props: DataRainProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLCanvasElement>(null);
  const bloomRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const apiRef = useRef<EngineApi | null>(null);
  propsRef.current = props;

  useEffect(() => {
    const root = rootRef.current;
    const main = mainRef.current;
    const bloom = bloomRef.current;
    const ctx = main?.getContext('2d');
    const bloomCtx = bloom?.getContext('2d');
    if (!root || !main || !bloom || !ctx || !bloomCtx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const random = mulberry32(7);
    const px = new Float32Array(MAX);
    const py = new Float32Array(MAX);
    const vx = new Float32Array(MAX);
    const vy = new Float32Array(MAX);
    const depth = new Float32Array(MAX);
    const baseVelocity = new Float32Array(MAX);
    const heat = new Float32Array(MAX);
    const lengths = new Uint8Array(MAX);
    const hx = new Float32Array(MAX * HISTORY);
    const hy = new Float32Array(MAX * HISTORY);
    const groups = Array.from({ length: 4 }, () => new Int32Array(MAX));
    const groupCounts = new Int32Array(4);
    const strokeStyles = new Array<string>(4 * AGE_BUCKETS).fill('');
    const strokeWidths = new Float32Array(4 * AGE_BUCKETS);
    const headStyles = ['', ''];
    const puffX = new Float32Array(PUFFS);
    const puffY = new Float32Array(PUFFS);
    const puffGamma = new Float32Array(PUFFS);
    const puffAge = new Float32Array(PUFFS);
    const puffAlive = new Uint8Array(PUFFS);
    const activePuffs = new Int32Array(PUFFS);

    let disposed = false;
    let initialized = false;
    let sectionVisible = false;
    let pageVisible = !document.hidden;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let bloomWidth = 1;
    let bloomHeight = 1;
    let active = 0;
    let quality = 1;
    let historyHead = 0;
    let simulationTime = 0;
    let liveTime = 0;
    let idleSince = 0;
    let pointerActive = false;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let previousCursorX = 0;
    let previousCursorY = 0;
    let cursorVelocityX = 0;
    let cursorVelocityY = 0;
    let influence = 0;
    let cursorRadius = 64;
    let puffIndex = 0;
    let puffSign = 1;
    let puffDistance = 0;
    let raf = 0;
    let lastFrame = 0;
    let accumulator = 0;
    let frameAverage = 16.7;
    let workAverage = 4;
    let slowFrames = 0;
    let fastFrames = 0;
    let bloomFrame = 0;
    let halo: CanvasGradient | null = null;

    const buildStyles = () => {
      const styles = getComputedStyle(root);
      const palette = propsRef.current.palette;
      const calm = parseHex(palette?.calm ?? styles.getPropertyValue('--dr-calm'), DEFAULT_CALM);
      const mid = parseHex(palette?.mid ?? styles.getPropertyValue('--dr-mid'), DEFAULT_MID);
      const hot = parseHex(palette?.hot ?? styles.getPropertyValue('--dr-hot'), DEFAULT_HOT);
      const core = parseHex(styles.getPropertyValue('--dr-core'), DEFAULT_CORE);
      const colors = [calm, hot];
      for (let group = 0; group < 4; group++) {
        const isNear = group % 2;
        const color = colors[isNear];
        const far = group < 2;
        for (let age = 0; age < AGE_BUCKETS; age++) {
          const falloff = Math.pow(1 - (age + 0.5) / AGE_BUCKETS, 1.5);
          const baseAlpha = isNear ? 0.56 : 0.3;
          const alpha = baseAlpha * (far ? 0.58 : 1) * falloff;
          strokeStyles[group * AGE_BUCKETS + age] = `rgba(${color[0]},${color[1]},${color[2]},${alpha.toFixed(3)})`;
          strokeWidths[group * AGE_BUCKETS + age] = (isNear ? 1.2 : 0.8) * (far ? 0.78 : 1);
        }
      }
      headStyles[0] = `rgba(${core[0]},${core[1]},${core[2]},0.52)`;
      headStyles[1] = `rgba(${core[0]},${core[1]},${core[2]},0.9)`;
      halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      halo.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},0.72)`);
      halo.addColorStop(0.46, `rgba(${mid[0]},${mid[1]},${mid[2]},0.16)`);
      halo.addColorStop(1, `rgba(${hot[0]},${hot[1]},${hot[2]},0)`);
    };

    const seedParticle = (index: number, uniform: boolean) => {
      const x = uniform ? random() * width : -40 + random() * (width + 80);
      const y = uniform ? random() * height : -40 - random() * 80;
      const z = 0.35 + 0.65 * random();
      const speed = 70 + 90 * z * z;
      px[index] = x; py[index] = y; depth[index] = z; baseVelocity[index] = speed;
      vx[index] = 0; vy[index] = speed * clamp(propsRef.current.flowSpeed ?? 1, 0.05, 5);
      heat[index] = 0; lengths[index] = 9 + Math.floor(random() * 11);
      for (let point = 0; point < HISTORY; point++) {
        hx[index * HISTORY + point] = x;
        hy[index * HISTORY + point] = y;
      }
    };

    const applyCount = (uniform: boolean) => {
      const automatic = clamp(Math.round((width * height) / 1100), 500, 2200);
      const requested = propsRef.current.count ?? automatic;
      const next = clamp(Math.round(requested * quality), 1, MAX);
      for (let index = active; index < next; index++) seedParticle(index, uniform);
      active = next;
    };

    const spawnPuff = (radius: number, speed: number) => {
      const dx = cursorVelocityX / speed;
      const dy = cursorVelocityY / speed;
      const index = puffIndex;
      puffIndex = (puffIndex + 1) % PUFFS;
      puffSign *= -1;
      puffX[index] = cursorX - dx * radius * 0.6 - dy * puffSign * radius * 0.7;
      puffY[index] = cursorY - dy * radius * 0.6 + dx * puffSign * radius * 0.7;
      puffGamma[index] = clamp(puffSign * Math.min(speed, 1200) * radius * 1.5, -105000, 105000);
      puffAge[index] = 0;
      puffAlive[index] = 1;
    };

    const simulate = () => {
      const flow = clamp(propsRef.current.flowSpeed ?? 1, 0.05, 5);
      const obstacle = propsRef.current.obstacleRadius ?? 64;
      historyHead = (historyHead + 1) % HISTORY;
      simulationTime += STEP;
      liveTime += STEP;
      const ghostActive =
        !pointerActive &&
        (propsRef.current.autopilot ?? true) &&
        liveTime - idleSince >= 1.2;
      if (pointerActive) {
        targetX = pointerX;
        targetY = pointerY;
      } else if (ghostActive) {
        targetX = width * (0.5 + 0.32 * Math.sin(0.37 * liveTime));
        targetY = height * (0.5 + 0.28 * Math.sin(0.53 * liveTime + 1.2));
      }
      previousCursorX = cursorX; previousCursorY = cursorY;
      cursorX += (targetX - cursorX) * K_CURSOR;
      cursorY += (targetY - cursorY) * K_CURSOR;
      cursorVelocityX += ((cursorX - previousCursorX) / STEP - cursorVelocityX) * K_VEL;
      cursorVelocityY += ((cursorY - previousCursorY) / STEP - cursorVelocityY) * K_VEL;
      const hasSource = pointerActive || ghostActive;
      influence += ((hasSource ? 1 : 0) - influence) * (hasSource ? K_IN : K_OUT);
      const cursorSpeed = Math.hypot(cursorVelocityX, cursorVelocityY);
      cursorRadius = obstacle + Math.min(cursorSpeed * 0.025, 36);
      if (influence > 0.3 && cursorSpeed > 60) {
        puffDistance += Math.hypot(cursorX - previousCursorX, cursorY - previousCursorY);
        let guard = 0;
        while (puffDistance >= 28 && guard++ < 4) { puffDistance -= 28; spawnPuff(cursorRadius, cursorSpeed); }
      } else puffDistance = 0;

      let activePuffCount = 0;
      for (let puff = 0; puff < PUFFS; puff++) {
        if (!puffAlive[puff]) continue;
        puffAge[puff] += STEP;
        if (puffAge[puff] > 2.4) { puffAlive[puff] = 0; continue; }
        puffGamma[puff] *= PUFF_DECAY;
        puffY[puff] += 57.5 * flow * STEP;
        activePuffs[activePuffCount++] = puff;
      }

      for (let index = 0; index < active; index++) {
        const z = depth[index];
        const nominal = baseVelocity[index] * flow;
        let targetVelocityX = 0;
        let targetVelocityY = nominal;
        for (const wave of WAVES) {
          const cosine = Math.cos(wave.kx * px[index] + wave.ky * py[index] + wave.omega * simulationTime + wave.phase);
          targetVelocityX += wave.x * cosine * z;
          targetVelocityY += wave.y * cosine * z;
        }
        const dx = px[index] - cursorX;
        const dy = py[index] - cursorY;
        const distanceSquared = dx * dx + dy * dy;
        const effectiveRadius = cursorRadius * (0.55 + 0.45 * z);
        if (influence > 0.002 && distanceSquared < effectiveRadius * effectiveRadius * 81) {
          const distance = Math.max(Math.sqrt(distanceSquared), effectiveRadius * 0.8);
          const force = influence * Math.max(0, 1 - distance / (effectiveRadius * 9));
          targetVelocityX += (dx / distance) * force * 210;
          targetVelocityY += (dy / distance) * force * 210;
        }
        for (let position = 0; position < activePuffCount; position++) {
          const puff = activePuffs[position];
          const pdx = px[index] - puffX[puff];
          const pdy = py[index] - puffY[puff];
          const distance = pdx * pdx + pdy * pdy + 1;
          const spread = 676 + 90 * puffAge[puff];
          if (distance < 36 * spread) {
            const force = (puffGamma[puff] / TAU) * (1 - Math.exp(-distance / spread)) / distance;
            targetVelocityX -= pdy * force * z;
            targetVelocityY += pdx * force * z;
          }
        }
        vx[index] += (targetVelocityX - vx[index]) * K_RELAX;
        vy[index] += (targetVelocityY - vy[index]) * K_RELAX;
        px[index] += vx[index] * STEP;
        py[index] += vy[index] * STEP;
        if (py[index] > height + 40 || px[index] < -120 || px[index] > width + 120 || py[index] < -600) {
          seedParticle(index, false);
          continue;
        }
        const proximity = hasSource && distanceSquared < Math.pow(effectiveRadius * 3.2, 2) ? 1 : 0;
        heat[index] += (proximity - heat[index]) * K_HEAT;
        hx[index * HISTORY + historyHead] = px[index];
        hy[index * HISTORY + historyHead] = py[index];
      }
    };

    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (influence > 0.02 && halo) {
        const radius = cursorRadius * 1.6;
        ctx.globalAlpha = 0.09 * influence;
        ctx.setTransform(dpr * radius, 0, 0, dpr * radius, dpr * cursorX, dpr * cursorY);
        ctx.fillStyle = halo;
        ctx.fillRect(-1, -1, 2, 2);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      groupCounts.fill(0);
      for (let index = 0; index < active; index++) {
        const group = (depth[index] < 0.62 ? 0 : 2) + (heat[index] > 0.18 ? 1 : 0);
        groups[group][groupCounts[group]++] = index;
      }
      for (let group = 0; group < 4; group++) {
        for (let age = 0; age < AGE_BUCKETS; age++) {
          ctx.strokeStyle = strokeStyles[group * AGE_BUCKETS + age];
          ctx.lineWidth = strokeWidths[group * AGE_BUCKETS + age];
          ctx.beginPath();
          const start = age * SEGS_PER_BUCKET;
          const end = start + SEGS_PER_BUCKET;
          for (let position = 0; position < groupCounts[group]; position++) {
            const index = groups[group][position];
            const segments = lengths[index] - 1;
            if (start >= segments) continue;
            const base = index * HISTORY;
            let slot = (historyHead - start + HISTORY) % HISTORY;
            ctx.moveTo(hx[base + slot], hy[base + slot]);
            for (let segment = start; segment < Math.min(end, segments); segment++) {
              slot = slot === 0 ? HISTORY - 1 : slot - 1;
              ctx.lineTo(hx[base + slot], hy[base + slot]);
            }
          }
          ctx.stroke();
        }
      }
      const previous = historyHead === 0 ? HISTORY - 1 : historyHead - 1;
      ctx.lineWidth = 1.4;
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = headStyles[layer];
        ctx.beginPath();
        for (let index = 0; index < active; index++) {
          if ((depth[index] < 0.62 ? 0 : 1) !== layer) continue;
          const base = index * HISTORY;
          ctx.moveTo(hx[base + historyHead], hy[base + historyHead]);
          ctx.lineTo(hx[base + previous], hy[base + previous]);
        }
        ctx.stroke();
      }
      bloomFrame++;
      if (bloomFrame % 2 === 0 || reduced) {
        bloomCtx.clearRect(0, 0, bloomWidth, bloomHeight);
        bloomCtx.drawImage(main, 0, 0, bloomWidth, bloomHeight);
      }
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const nextWidth = Math.max(1, rect.width);
      const nextHeight = Math.max(1, rect.height);
      let nextDpr = Math.min(devicePixelRatio || 1, 2);
      if (nextWidth * nextHeight * nextDpr * nextDpr > 4.5e6) nextDpr = Math.sqrt(4.5e6 / (nextWidth * nextHeight));
      if (nextWidth === width && nextHeight === height && nextDpr === dpr) return;
      width = nextWidth; height = nextHeight; dpr = nextDpr;
      main.width = Math.round(width * dpr); main.height = Math.round(height * dpr);
      bloomWidth = Math.ceil(width / 4); bloomHeight = Math.ceil(height / 4);
      bloom.width = bloomWidth; bloom.height = bloomHeight;
      bloomCtx.imageSmoothingEnabled = true;
      if (initialized) { applyCount(true); render(); }
    };

    const presimulate = (seconds: number) => {
      for (let frame = 0; frame < Math.round(seconds / STEP); frame++) simulate();
    };

    const rebuildStatic = () => {
      active = 0;
      applyCount(true);
      pointerActive = false;
      idleSince = Number.POSITIVE_INFINITY;
      influence = 0;
      heat.fill(0);
      puffAlive.fill(0);
      presimulate(2.5);
      render();
    };

    const shouldRun = () => !reduced && sectionVisible && pageVisible && !disposed;
    const start = () => {
      if (!shouldRun() || raf) return;
      lastFrame = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const frame = (now: number) => {
      if (!shouldRun()) { raf = 0; return; }
      const delta = Math.max(0, now - lastFrame);
      lastFrame = now;
      accumulator += Math.min(0.05, delta / 1000);
      const started = performance.now();
      let steps = 0;
      while (accumulator >= STEP && steps < 2) { simulate(); accumulator -= STEP; steps++; }
      if (steps === 2) accumulator = 0;
      if (steps) render();
      const work = performance.now() - started;
      if (delta > 0 && delta < 100) { frameAverage += (delta - frameAverage) * 0.05; workAverage += (work - workAverage) * 0.05; }
      if (frameAverage > 20) { slowFrames++; fastFrames = 0; }
      else if (frameAverage < 18.5 && workAverage < 12) { fastFrames++; slowFrames = 0; }
      else { slowFrames = 0; fastFrames = 0; }
      if (slowFrames >= 24 && quality > 0.35) { quality = Math.max(0.35, quality - 0.15); slowFrames = 0; applyCount(false); }
      else if (fastFrames >= 180 && quality < 1) { quality = Math.min(1, quality + 0.05); fastFrames = 0; applyCount(false); }
      raf = requestAnimationFrame(frame);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) {
        if (pointerActive) idleSince = liveTime;
        pointerActive = false;
        return;
      }
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      if (!pointerActive) { cursorX = previousCursorX = targetX = pointerX; cursorY = previousCursorY = targetY = pointerY; }
      pointerActive = true;
    };
    const releasePointer = (event?: PointerEvent) => {
      if (!event || event.pointerType !== 'mouse') {
        pointerActive = false;
        idleSince = liveTime;
      }
    };
    const invalidatePointer = () => {
      if (pointerActive) idleSince = liveTime;
      pointerActive = false;
    };
    const onPageVisibility = () => { pageVisible = !document.hidden; pageVisible ? start() : stop(); };
    const onWindowBlur = () => releasePointer();

    resize();
    buildStyles();
    applyCount(true);
    cursorX = previousCursorX = targetX = width / 2;
    cursorY = previousCursorY = targetY = height / 2;
    initialized = true;
    reduced ? rebuildStatic() : render();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver(entries => {
      sectionVisible = entries[0]?.isIntersecting ?? false;
      sectionVisible ? start() : stop();
    }, { threshold: 0.01 });
    intersectionObserver.observe(root);
    const themeObserver = new MutationObserver(() => { buildStyles(); reduced ? rebuildStatic() : render(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', updatePointer, { passive: true });
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });
    window.addEventListener('scroll', invalidatePointer, { passive: true });
    window.addEventListener('resize', invalidatePointer, { passive: true });
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onPageVisibility);
    apiRef.current = { refresh: () => { buildStyles(); applyCount(false); render(); } };

    return () => {
      disposed = true;
      stop();
      resizeObserver.disconnect(); intersectionObserver.disconnect(); themeObserver.disconnect();
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerdown', updatePointer);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
      window.removeEventListener('scroll', invalidatePointer);
      window.removeEventListener('resize', invalidatePointer);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onPageVisibility);
      apiRef.current = null;
    };
  }, []);

  const palette = props.palette;
  useEffect(() => apiRef.current?.refresh(), [props.count, palette?.calm, palette?.mid, palette?.hot]);
  const fullscreen = props.fullscreen ?? true;
  const className = `dr-root${fullscreen ? '' : ' dr-root--contained'}${props.className ? ` ${props.className}` : ''}`;
  return (
    <div ref={rootRef} className={className} aria-hidden="true" data-data-rain>
      <canvas ref={bloomRef} className="dr-bloom" />
      <canvas ref={mainRef} className="dr-main" data-data-rain-canvas />
    </div>
  );
}

