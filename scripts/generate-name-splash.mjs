import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync(new URL('../public/animations/thorben-reference.json', import.meta.url)));
const { glyphs, capHeight } = JSON.parse(readFileSync(new URL('../src/assets/brand/thorben-name-glyphs.json', import.meta.url)));
const name = 'SUSHANTH';
const original = 'THORBEN';
const referenceWidth = [...original].reduce((sum, letter) => sum + glyphs[letter].advance, 0);
const nameWidth = [...name].reduce((sum, letter) => sum + glyphs[letter].advance, 0);
const fit = referenceWidth / nameWidth;
const originalScale = source.layers.find(layer => layer.nm === 'H Outlines').ks.s.k[0];
const scale = originalScale * fit;
const referenceLetters = [...original].map(letter => ({
  fill: source.layers.find(layer => layer.nm === `${letter} Fills`),
  outline: source.layers.find(layer => layer.nm === `${letter} Outlines`),
}));
const clone = value => structuredClone(value);
const find = (items, type) => {
  for (const item of items) {
    if (item.ty === type) return item;
    const result = item.it && find(item.it, type);
    if (result) return result;
  }
};
const shiftTimes = (value, delta) => {
  if (!value || typeof value !== 'object') return;
  if (value.a === 1 && Array.isArray(value.k)) {
    for (const keyframe of value.k) keyframe.t += delta;
    return;
  }
  for (const child of Object.values(value)) shiftTimes(child, delta);
};
const layers = [];
let cursor = 0;
for (let index = 0; index < name.length; index++) {
  const letter = name[index];
  const glyph = glyphs[letter];
  const sourceIndex = index * (original.length - 1) / (name.length - 1);
  const leftIndex = Math.floor(sourceIndex);
  const rightIndex = Math.ceil(sourceIndex);
  const blend = sourceIndex - leftIndex;
  const startOf = entry => entry.fill.ks.o.k[0].t;
  const start = startOf(referenceLetters[leftIndex]) * (1 - blend) + startOf(referenceLetters[rightIndex]) * blend;
  const template = referenceLetters[Math.round(sourceIndex)];
  const delta = start - startOf(template);
  const paths = glyph.contours.map((contour, contourIndex) => ({
    ty: 'sh', nm: `${letter} contour ${contourIndex + 1}`, ks: { a: 0, k: clone(contour) }, hd: false,
  }));
  // Retain the reference's overall word width and ground-contact baseline.
  const x = 44 + (cursor + glyph.advance / 2 - nameWidth / 2) * scale / 100;
  const y = 6.435 + capHeight / 2 * (originalScale - scale) / 100;
  const position = layer => {
    layer.ks.p.k = [x, y, 0];
    layer.ks.a.k = [glyph.advance / 2, -capHeight / 2, 0];
    if (layer.ks.s.a === 1) {
      for (const keyframe of layer.ks.s.k) {
        for (const field of ['s', 'e']) {
          if (keyframe[field]) {
            keyframe[field][0] *= fit;
            keyframe[field][1] *= fit;
          }
        }
      }
    } else {
      layer.ks.s.k = [scale, scale, 100];
    }
  };
  const fill = clone(template.fill);
  fill.ind = 100 + index * 2;
  fill.nm = `${letter} ${index + 1} Fills`;
  shiftTimes(fill.ks, delta);
  position(fill);
  fill.shapes = [...clone(paths), clone(find(template.fill.shapes, 'fl'))];
  const outline = clone(template.outline);
  outline.ind = fill.ind + 1;
  outline.nm = `${letter} ${index + 1} Outlines`;
  outline.ip += delta;
  shiftTimes(outline.ks, delta);
  position(outline);
  const trim = clone(find(template.outline.shapes, 'tm'));
  shiftTimes(trim, delta);
  outline.shapes = [...clone(paths), clone(find(template.outline.shapes, 'st')), trim];
  layers.push(fill, outline);
  cursor += glyph.advance;
}

// These are the actual approved effect layers, including their original shapes,
// transforms, keyframe timing, and ordering. Only the word's letter layers change.
const reversedLetterPairs = Array.from({ length: name.length }, (_, index) => {
  const offset = (name.length - index - 1) * 2;
  return layers.slice(offset, offset + 2);
}).flat();
source.layers = source.layers.filter(layer => !/ (Fills|Outlines)$/.test(layer.nm)).concat(reversedLetterPairs);
// Follow one side of each lightning contour, plus the lower rounded base.
// Clip each orange stroke inside the original silhouette; the body keeps its
// neutral theme color. The source artwork traces each bolt out and back.
const contacts = source.layers.filter(layer => layer.nm.startsWith('Shape Layer ')).map((layer, index) => {
  const contact = clone(layer);
  contact.ind = 300 + index;
  contact.nm = `Orange contact ${layer.nm}`;
  contact.cl = 'word-accent';
  contact.ks.o = { a: 0, k: 100 };
  contact.hasMask = true;
  contact.masksProperties = [];
  contact.shapes = contact.shapes.filter(group => group.it.some(item => item.ty === 'sh'));
  for (const group of contact.shapes) {
    const silhouette = clone(group.it.find(item => item.ty === 'sh').ks.k);
    const transform = clone(group.it.find(item => item.ty === 'tr'));
    const width = Math.max(...silhouette.v.map(p => p[0])) - Math.min(...silhouette.v.map(p => p[0]));
    const height = Math.max(...silhouette.v.map(p => p[1])) - Math.min(...silhouette.v.map(p => p[1]));
    const isBase = silhouette.v.length === 4 && width > height * 3;
    const indices = isBase ? [1, 2, 3] : [...Array(silhouette.v.length - Math.floor(silhouette.v.length / 2)).keys()].map(i => i + Math.floor(silhouette.v.length / 2)).concat(0);
    const edge = {
      c: false,
      v: indices.map(i => clone(silhouette.v[i])),
      i: indices.map((i, n) => n === 0 ? [0, 0] : clone(silhouette.i[i])),
      o: indices.map((i, n) => n === indices.length - 1 ? [0, 0] : clone(silhouette.o[i])),
    };
    group.it = [
      { ty: 'sh', nm: 'One-sided lightning edge', ks: { a: 0, k: edge } },
      { ty: 'st', nm: 'Solid orange inner band', c: { a: 0, k: [1, 77 / 255, 0, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 24 }, lc: 2, lj: 2 },
      transform,
    ];
    // Masks use layer coordinates, so carry over the group's scale/rotation.
    const radians = transform.r.k * Math.PI / 180;
    const linear = ([x, y]) => {
      x *= transform.s.k[0] / 100;
      y *= transform.s.k[1] / 100;
      return [x * Math.cos(radians) - y * Math.sin(radians), x * Math.sin(radians) + y * Math.cos(radians)];
    };
    const mask = {
      c: silhouette.c,
      v: silhouette.v.map(p => linear(p.map((v, a) => v - transform.a.k[a])).map((v, a) => v + transform.p.k[a])),
      i: silhouette.i.map(linear),
      o: silhouette.o.map(linear),
    };
    contact.masksProperties.push({ inv: false, mode: 'a', nm: 'Inside lightning silhouette', pt: { a: 0, k: mask }, o: { a: 0, k: 100 }, x: { a: 0, k: 0 } });
  }
  return contact;
});
source.layers.splice(1, 0, ...contacts);
// Both the loader and footer use this asset. Skip one second of its opening
// hold, keeping the remaining motion at its original speed on every loop.
source.ip += source.fr;
source.nm = 'Sushanth — Thorben lettering and original effect sequence';
writeFileSync(new URL('../public/animations/sushanth-splash.json', import.meta.url), JSON.stringify(source));
console.log(`Generated ${name}: ${source.layers.length} layers, original ${source.fr} fps and ${(source.op - source.ip) / source.fr}s timing`);
