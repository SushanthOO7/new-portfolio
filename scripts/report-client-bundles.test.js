import { gzipSync } from 'node:zlib';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { reportClientBundles } from './report-client-bundles.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe('reportClientBundles', () => {
  it('returns deterministically sorted JavaScript files and exact totals', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-bundles-'));
    temporaryDirectories.push(directory);
    await mkdir(join(directory, 'nested'));
    await writeFile(join(directory, 'z.js'), 'console.log("z")');
    await writeFile(join(directory, 'nested', 'a.mjs'), 'export const a = 1');
    await writeFile(join(directory, 'ignored.css'), 'body{}');

    const report = await reportClientBundles(directory);
    const expectedFiles = [
      { path: 'nested/a.mjs', bytes: 18, gzipBytes: gzipSync('export const a = 1').byteLength },
      { path: 'z.js', bytes: 16, gzipBytes: gzipSync('console.log("z")').byteLength },
    ];

    expect(report).toEqual({
      files: expectedFiles,
      totalBytes: expectedFiles.reduce((total, file) => total + file.bytes, 0),
      gzipBytes: expectedFiles.reduce((total, file) => total + file.gzipBytes, 0),
    });
  });
});
