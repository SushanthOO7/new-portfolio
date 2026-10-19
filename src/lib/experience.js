import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Validate author-managed content during Astro's build, never in the browser. */
export function validateExperience(entries, fileExists = existsSync) {
  if (!Array.isArray(entries)) throw new Error('Experience must be an array');
  const ids = new Set();
  const date = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  for (const entry of entries) {
    if (!entry || ['id', 'company', 'role', 'description'].some(key => typeof entry[key] !== 'string' || !entry[key].trim())) {
      throw new Error('Experience requires id, company, role and description');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) throw new Error(`Invalid experience ID: ${entry.id}`);
    if (ids.has(entry.id)) throw new Error(`Duplicate experience ID: ${entry.id}`);
    ids.add(entry.id);
    if (!date(entry.startDate) || (entry.endDate !== null && (!date(entry.endDate) || entry.endDate < entry.startDate))) {
      throw new Error(`Invalid experience dates: ${entry.id}`);
    }
    if (!Array.isArray(entry.tags) || !entry.tags.length || entry.tags.some(tag => typeof tag !== 'string' || !tag.trim())) {
      throw new Error(`Experience tags required: ${entry.id}`);
    }
    const logo = entry.logo;
    if (!logo || typeof logo.alt !== 'string' || !logo.alt.trim() || !Number.isFinite(logo.width) || logo.width <= 0 || !Number.isFinite(logo.height) || logo.height <= 0) {
      throw new Error(`Invalid logo metadata: ${entry.id}`);
    }
    for (const path of [logo.src, logo.lightSrc, logo.darkSrc].filter((path, index) => index === 0 || path !== undefined)) {
      if (typeof path !== 'string' || !/^\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:svg|png|webp|avif)$/.test(path) || !fileExists(resolve('public', path.slice(1)))) {
        throw new Error(`Missing or invalid local logo: ${entry.id}: ${path}`);
      }
    }
  }
  return entries;
}
