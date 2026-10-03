export function requireProductionSiteUrl(value = process.env.PUBLIC_SITE_URL) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('PUBLIC_SITE_URL must be set to the production https:// origin.');
  }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must be a bare production https:// origin.');
  }
  return url.origin;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    requireProductionSiteUrl();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
