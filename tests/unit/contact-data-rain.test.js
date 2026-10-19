import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const contact = readFileSync(
  new URL('../../src/components/astro/home/Contact.astro', import.meta.url),
  'utf8'
);
const dataRain = readFileSync(
  new URL('../../src/components/ui/data-rain.tsx', import.meta.url),
  'utf8'
);

describe('contact data rain integration', () => {
  it('replaces the legacy background while preserving the contact content', () => {
    expect(contact).toContain("import DataRain from '../../ui/data-rain'");
    expect(contact).toContain('client:visible');
    expect(contact).toContain('fullscreen={false}');
    expect(contact).toContain('autopilot={false}');
    expect(contact).not.toContain('contact__grid');
    expect(contact).not.toContain('contact__routes');
    expect(contact).toContain('id="contact-title"');
    expect(contact).toContain('href={`mailto:${email}`}');
  });

  it('invalidates cached pointer coordinates when layout moves', () => {
    expect(dataRain).toContain("window.addEventListener('scroll', invalidatePointer, { passive: true })");
    expect(dataRain).toContain("window.addEventListener('resize', invalidatePointer, { passive: true })");
    expect(dataRain).toContain("window.removeEventListener('scroll', invalidatePointer)");
    expect(dataRain).toContain("window.removeEventListener('resize', invalidatePointer)");
  });

  it('suppresses automatic cursor heat while building the reduced-motion frame', () => {
    expect(dataRain).toContain('idleSince = Number.POSITIVE_INFINITY');
    expect(dataRain).toContain('presimulate(2.5)');
  });

  it('avoids blocking startup and bounds per-frame particle work', () => {
    expect(dataRain).toContain('const activePuffs = new Int32Array(PUFFS)');
    expect(dataRain).toContain('for (let position = 0; position < activePuffCount; position++)');
    expect(dataRain).toContain('500, 2200');
    expect(dataRain).toContain("reduced ? rebuildStatic() : render()");
    expect(dataRain).not.toContain("reduced ? rebuildStatic() : (presimulate(2.5), render())");
  });

});
