import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

const JAVASCRIPT_EXTENSION = /\.(?:js|mjs)$/i;

async function listJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return listJavaScriptFiles(path);
      return entry.isFile() && JAVASCRIPT_EXTENSION.test(entry.name) ? [path] : [];
    })
  );
  return files.flat();
}

export async function reportClientBundles(directory) {
  const root = resolve(directory);
  const paths = await listJavaScriptFiles(root);
  const files = await Promise.all(
    paths.map(async path => {
      const contents = await readFile(path);
      return {
        path: relative(root, path).split(sep).join('/'),
        bytes: contents.byteLength,
        gzipBytes: gzipSync(contents).byteLength,
      };
    })
  );
  files.sort((left, right) => left.path.localeCompare(right.path));

  return {
    files,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await reportClientBundles(process.argv[2]);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
