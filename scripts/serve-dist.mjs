import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.env.STATIC_ROOT || 'dist/client');
const port = Number(process.env.PORT || 7778);
const types = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function candidates(pathname) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const target = resolve(root, cleanPath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) return [];
  if (extname(target)) return [target];
  return [resolve(target, 'index.html'), `${target}.html`];
}

async function findFile(pathname) {
  for (const candidate of candidates(pathname)) {
    try {
      return { contents: await readFile(candidate), path: candidate };
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
    }
  }
  return null;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const file = await findFile(url.pathname);
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': types[extname(file.path)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(file.contents);
  } catch {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static Astro output ready on http://127.0.0.1:${port}\n`);
});
