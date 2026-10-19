import { readFileSync, writeFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const reference = read('../public/animations/kamber-reference.json');
const { glyphs } = read('../src/assets/brand/kamber-projects-glyphs.json');
const clone = value => structuredClone(value);
const bounds = paths => {
  const points = paths.flatMap(path => path.v);
  return { left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])), top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1])) };
};
const pathsOf = layer => layer.shapes[0].it.filter(shape => shape.ty === 'sh');
const baseOf = path => path.ks.a ? path.ks.k[0].s[0] : path.ks.k;
const templates = reference.layers.slice(1).reverse();
// Original contacts: K's two arms, m's two humps, b, e, r, then the floor.
// Reassign those same eight beats to the eight letters; retain the ball's
// original squash/stretch and all original contact times and Bezier easing.
const contacts = [78, 109, 122, 145, 170, 188, 207, 227];
const assignments = [[0,78], [0,109], [2,122], [2,145], [3,170], [4,188], [5,207], [5,207]];
const word = 'Projects';
const width = [...word].reduce((sum, letter) => sum + glyphs[letter].advance, 0);
const fit = 484 / width;
const baseline = 42.384;
let cursor = -242;
const letters = [];
const targetContacts = [];
for (let index = 0; index < word.length; index++) {
  const letter = word[index], glyph = glyphs[letter];
  const [templateIndex, originalContact] = assignments[index];
  const template = templates[templateIndex];
  const sourcePaths = pathsOf(template), sourceBase = sourcePaths.map(baseOf);
  const sourceBox = bounds(sourceBase), targetBox = bounds(glyph.contours);
  const sourceWidth = sourceBox.right - sourceBox.left, sourceHeight = sourceBox.bottom - sourceBox.top;
  const targetWidth = targetBox.right - targetBox.left, targetHeight = targetBox.bottom - targetBox.top;
  const layer = clone(template);
  layer.ind = 100 + index;
  layer.nm = `Projects letter ${index + 1} ${letter}`;
  layer.cl = 'word-ink';
  const delta = contacts[index] - originalContact;
  const frames = sourcePaths.find(path => path.ks.a).ks.k.filter(key => key.t >= originalContact - 1.3 && key.t <= originalContact + 10);
  // Transfer the authored outline displacement field to the new glyph. Both
  // vertices and Bezier handles are warped, retaining smooth counters/curves.
  const warp = (shape, keyIndex) => {
    const key = frames[keyIndex];
    const samples = sourcePaths.flatMap((path, pathIndex) => {
      const base = sourceBase[pathIndex];
      const animated = path.ks.a ? (path.ks.k.find(frame => Math.abs(frame.t - key.t) < .01)?.s?.[0] ?? base) : base;
      return base.v.map((p, i) => ({ p: [(p[0]-sourceBox.left)/sourceWidth, (p[1]-sourceBox.top)/sourceHeight], d: [(animated.v[i][0]-p[0])/sourceWidth, (animated.v[i][1]-p[1])/sourceHeight] }));
    });
    const project = point => {
      const normalized = [(point[0]-targetBox.left)/targetWidth, (point[1]-targetBox.top)/targetHeight];
      let total=0, dx=0, dy=0;
      for (const sample of samples) {
        const weight = 1 / (Math.pow(Math.hypot(normalized[0]-sample.p[0], normalized[1]-sample.p[1]), 4) + .0001);
        total += weight; dx += sample.d[0]*weight; dy += sample.d[1]*weight;
      }
      return [point[0]+dx/total*targetWidth, point[1]+dy/total*targetHeight].map((v,axis) => Number((v*fit + (axis ? baseline : cursor)).toFixed(5)));
    };
    const v=shape.v.map(project);
    return { c: shape.c, v, i: shape.i.map((handle,i)=>project(handle.map((n,a)=>n+shape.v[i][a])).map((n,a)=>n-v[i][a])), o: shape.o.map((handle,i)=>project(handle.map((n,a)=>n+shape.v[i][a])).map((n,a)=>n-v[i][a])) };
  };
  layer.shapes[0].it = [
    ...glyph.contours.map((contour,i) => ({ty:'sh',nm:`${letter} contour ${i+1}`,ks:{a:1,k:frames.map((key,j)=>({...clone(key),t:key.t+delta,s:[warp(contour,j)]}))}})),
    ...clone(template.shapes[0].it.filter(shape => shape.ty !== 'sh')),
  ];
  const oldX = reference.layers[0].ks.p.k.find(key => Math.abs(key.t-originalContact)<.01).s[0];
  const contactFraction = Math.max(.18, Math.min(.82, ((oldX-600)/1.6-sourceBox.left)/sourceWidth));
  const x=600+1.6*(cursor+(targetBox.left+targetWidth*contactFraction)*fit);
  const impactIndex = frames.findIndex(key => Math.abs(key.t-originalContact)<.01);
  const impactContours = glyph.contours.map(contour => warp(contour,impactIndex));
  const contactX = (x-600)/1.6;
  const intersections = [];
  for (const contour of impactContours) {
    for (let i=0;i<contour.v.length;i++) {
      const next=(i+1)%contour.v.length;
      const p0=contour.v[i], p1=p0.map((n,a)=>n+contour.o[i][a]);
      const p3=contour.v[next], p2=p3.map((n,a)=>n+contour.i[next][a]);
      let previous=p0;
      for(let step=1;step<=40;step++) {
        const t=step/40,u=1-t;
        const point=p0.map((_,a)=>u*u*u*p0[a]+3*u*u*t*p1[a]+3*u*t*t*p2[a]+t*t*t*p3[a]);
        if ((previous[0]<=contactX&&point[0]>=contactX)||(point[0]<=contactX&&previous[0]>=contactX)) {
          const f=(contactX-previous[0])/(point[0]-previous[0]||1);
          intersections.push(previous[1]+(point[1]-previous[1])*f);
        }
        previous=point;
      }
    }
  }
  const top=intersections.length ? Math.min(...intersections) : baseline+targetBox.top*fit;
  const squashKey=reference.layers[0].ks.s.k.reduce((best,key)=>Math.abs(key.t-contacts[index])<Math.abs(best.t-contacts[index])?key:best);
  const radius=24.774*squashKey.s[1]/100;
  targetContacts.push([x,300+1.6*top-radius+2]);
  letters.push(layer);
  cursor += glyph.advance*fit;
}
const ball = clone(reference.layers[0]);
ball.cl = 'word-accent';
ball.shapes[0].it.find(shape=>shape.ty==='fl').c.k = [1,77/255,0,1];
const originalKeys = reference.layers[0].ks.p.k;
// Piecewise coordinate retargeting preserves the source's arcs, tangents, and
// timing while landing on the differently spaced Projects glyphs.
const oldContacts = contacts.map(t=>originalKeys.find(key=>Math.abs(key.t-t)<.01).s);
const anchors = [[originalKeys[0].s, [targetContacts[0][0], originalKeys[0].s[1]]], ...oldContacts.map((p,i)=>[p,targetContacts[i]]), [originalKeys.at(-1).s,[targetContacts.at(-1)[0]+170,originalKeys.at(-1).s[1]]]];
ball.ks.p.k.forEach((key,i)=>{
  const previous=clone(key.s);
  const exact=anchors.find(([p])=>p[0]===previous[0]&&p[1]===previous[1]);
  const next = exact?.[1] ?? targetContacts[0];
  key.s=[...next,0];
  // Incoming and outgoing handles scale with the adjacent contact spacing.
  for (const [field, direction] of [['ti',-1],['to',1]]) {
    if (!key[field]) continue;
    const adjacent=Math.max(0,Math.min(originalKeys.length-1,i+direction));
    const oldSpan=Math.abs(originalKeys[adjacent].s[0]-previous[0]);
    const near=anchors.reduce((best,a)=>Math.abs(a[0][0]-originalKeys[adjacent].s[0])<Math.abs(best[0][0]-originalKeys[adjacent].s[0])?a:best,anchors[0]);
    const ratio=oldSpan>1?Math.abs(near[1][0]-next[0])/oldSpan:1;
    key[field]=[key[field][0]*ratio,key[field][1],0];
  }
});
const result=clone(reference);
result.nm='Projects — Kamber reference motion, orange ball';
result.layers=[ball,...letters.reverse()];
writeFileSync(new URL('../public/animations/projects-title.json',import.meta.url),JSON.stringify(result));
console.log(`Generated ${word}: ${result.layers.length} layers; ${(result.op-result.ip)/result.fr}s original timing`);
