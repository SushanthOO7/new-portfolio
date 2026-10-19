export const TECH_CATEGORIES = ['all', 'languages', 'frontend', 'backend', 'database', 'ai', 'testing', 'devops', 'tools'];
export const CATEGORY_LABELS = {
  all: 'All',
  languages: 'Languages',
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  ai: 'AI / LLM',
  testing: 'Testing',
  devops: 'DevOps',
  tools: 'Tools'
};

/** Validate author content in Node at build time; keep this module browser-safe. */
export function validateTechStack(entries, assetExists = () => true) {
  const fail = message => { throw new Error(`tech-stack.json: ${message}`); };
  if (!Array.isArray(entries)) fail('expected an array of technologies.');
  const ids = new Set();
  for (const [index, item] of entries.entries()) {
    const label = `entry ${index + 1}`;
    if (!item || typeof item !== 'object') fail(`${label} must be an object.`);
    if (typeof item.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) fail(`${label} needs a lowercase, hyphenated id.`);
    if (ids.has(item.id)) fail(`duplicate id "${item.id}".`);
    ids.add(item.id);
    if (typeof item.title !== 'string' || !item.title.trim()) fail(`${item.id} needs a title.`);
    if (!Array.isArray(item.categories) || !item.categories.length || item.categories.some(c => !TECH_CATEGORIES.slice(1).includes(c))) fail(`${item.id} categories must use a supported technology category.`);
    for (const key of ['logo', ...(item.logoLight === undefined ? [] : ['logoLight'])]) {
      const path = item[key];
      if (typeof path !== 'string' || !/^\/images\/[a-zA-Z0-9_/-]+\.(svg|png|webp|avif)$/.test(path) || path.includes('..')) fail(`${item.id}.${key} must be a local /images/ path to SVG, PNG, WebP, or AVIF artwork.`);
      if (!assetExists(path)) fail(`${item.id}.${key}: missing public${path}. Add the file or update the path.`);
    }
  }
  return entries;
}

export function filterTechnologies(entries, category) {
  return category === 'all' ? entries : entries.filter(item => item.categories.includes(category));
}

export function nearestOrbitAngle(current, target) {
  return current + (((target - current + 180) % 360 + 360) % 360 - 180);
}

/** Percent-based geometry keeps the logo positions and SVG paths aligned at every size. */
export function getOrbitPositions(count) {
  const outerCount = count <= 5 ? 0 : Math.min(11, Math.ceil(count * .92));
  const innerCount = count - outerCount;
  return Array.from({ length: count }, (_, index) => {
    const outer = index < outerCount;
    const slot = outer ? index : index - outerCount;
    const slots = outer ? outerCount : innerCount;
    return { ring: outer ? 'outer' : 'inner', radius: outer ? 40 : count > 5 ? 18 : 29, angle: (outer ? -94 : count > 5 ? -160 : -90) + slot * 360 / slots };
  });
}
