import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readinessProgress } from '../../src/lib/loading-progress.js';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));

describe('loading progress', () => {
  it('never moves backward and reserves 100 for completed readiness', () => {
    expect(readinessProgress(60, [true, false, false])).toBe(60);
    expect(readinessProgress(0, [true, false, false])).toBe(33);
    expect(readinessProgress(99, [true, false])).toBe(99);
    expect(readinessProgress(99, [true, true])).toBe(100);
    expect(readinessProgress(0, [])).toBe(100);
  });
});
describe('personalized reference assets', () => {
  it('keeps Kamber ball timing and squash, with eight reactive letters and only an orange ball', () => {
    const reference = json('../../public/animations/kamber-reference.json');
    const projects = json('../../public/animations/projects-title.json');
    expect([projects.fr, projects.ip, projects.op]).toEqual([reference.fr, reference.ip, reference.op]);
    const ball = projects.layers.find(layer => layer.nm === 'Dot');
    expect(ball.ks.s).toEqual(reference.layers[0].ks.s);
    expect(ball.ks.p.k.map(key => key.t)).toEqual(reference.layers[0].ks.p.k.map(key => key.t));
    expect(projects.layers.filter(layer => layer.nm.startsWith('Projects letter ')).map(layer => layer.nm.split(' ').at(-1)).reverse().join('')).toBe('Projects');
    const fills = layer => JSON.stringify(layer.shapes).match(/"c":\{"a":0,"k":\[1,0\.30196\d*,0,1\]/g) || [];
    expect(fills(ball).length).toBeGreaterThan(0);
    for (const layer of projects.layers.filter(layer => layer !== ball)) {
      expect(fills(layer)).toHaveLength(0);
      expect(layer.shapes[0].it.some(shape => shape.ty === 'sh' && shape.ks.a === 1)).toBe(true);
    }
  });
  it('starts Sushanth one second earlier and confines solid orange to inner contact edges', () => {
    const reference = json('../../public/animations/thorben-reference.json');
    const name = json('../../public/animations/sushanth-splash.json');
    expect(name.ip).toBe(reference.ip + reference.fr);
    expect(name.op).toBe(reference.op);
    for (const layer of reference.layers.filter(layer => !/ (Fills|Outlines)$/.test(layer.nm))) {
      expect(name.layers.find(candidate => candidate.nm === layer.nm)).toEqual(layer);
    }
    const contacts = name.layers.filter(layer => layer.nm.startsWith('Orange contact'));
    expect(contacts.length).toBeGreaterThan(0);
    for (const layer of contacts) {
      expect(layer.ks.o.k).toBe(100);
      expect(layer.op - layer.ip).toBeLessThanOrEqual(2);
      const original = reference.layers.find(candidate => `Orange contact ${candidate.nm}` === layer.nm);
      const originalShapes = original.shapes.filter(group => group.it.some(item => item.ty === 'sh'));
      expect(layer.masksProperties).toHaveLength(originalShapes.length);
      for (const [index, group] of layer.shapes.entries()) {
        expect(group.it.some(item => item.ty === 'fl')).toBe(false);
        expect(group.it.find(item => item.ty === 'st').c.k).toEqual([1, 77 / 255, 0, 1]);
        const edge = group.it.find(item => item.ty === 'sh').ks.k;
        expect(edge.c).toBe(false);
        expect(edge.v.length).toBeLessThanOrEqual(originalShapes[index].it[0].ks.k.v.length);
        expect(layer.masksProperties[index].pt.k.c).toBe(true);
      }
    }
  });
});
