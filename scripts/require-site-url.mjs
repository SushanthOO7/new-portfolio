export function requireProductionSiteUrl(value = process.env.PUBLIC_SITE_URL) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('PUBLIC_SITE_URL must be set to the production https:// origin.');
  }
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'sushanth.tech' ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('PUBLIC_SITE_URL must be exactly https://sushanth.tech.');
  }
  return 'https://sushanth.tech';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    requireProductionSiteUrl();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
