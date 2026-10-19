import { writeFileSync } from 'node:fs';

// Use the same public Heavy specimen as the Projects outline source.
const response = await fetch('https://fonts.wondermake.xyz/api/posts/_typeface_kamber');
if (!response.ok) throw new Error(`Kamber specimen unavailable: ${response.status}`);
const source = await response.json();
function findHeavy(value) {
  if (!value || typeof value !== 'object') return;
  if (value.key === 'style-10833-1588523894' && value.base64) return value;
  for (const child of Object.values(value)) {
    const found = findHeavy(child);
    if (found) return found;
  }
}
const heavy = findHeavy(source);
if (!heavy) throw new Error('Kamber Heavy specimen was not found');
writeFileSync(new URL('../public/fonts/kamber-heavy.woff2', import.meta.url), Buffer.from(heavy.base64, 'base64'));
