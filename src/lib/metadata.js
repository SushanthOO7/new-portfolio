const DEFAULT_IMAGE = '/social-image.png';

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export function createMetadata({ origin, title, description, pathname, image = DEFAULT_IMAGE }) {
  if (!origin) throw new TypeError('A site origin is required for canonical metadata.');
  const normalizedOrigin = new URL(origin).origin;
  const normalizedPath = normalizePath(pathname);

  return {
    title: `Sushanth U V | ${title}`,
    description,
    canonical: new URL(normalizedPath, `${normalizedOrigin}/`).href,
    image: new URL(image, `${normalizedOrigin}/`).href,
    imageAlt: 'Sushanth U V portfolio preview',
  };
}
