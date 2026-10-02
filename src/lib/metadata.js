const DEFAULT_ORIGIN = process.env.PUBLIC_SITE_URL || 'http://localhost:7777';
const DEFAULT_IMAGE = '/social-image.png';

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export function createMetadata({ title, description, pathname, image = DEFAULT_IMAGE }) {
  const origin = DEFAULT_ORIGIN.replace(/\/+$/, '');
  const normalizedPath = normalizePath(pathname);

  return {
    title: `Sushanth U V | ${title}`,
    description,
    canonical: new URL(normalizedPath, `${origin}/`).href,
    image: new URL(image, `${origin}/`).href,
    imageAlt: 'Sushanth U V portfolio preview',
  };
}
