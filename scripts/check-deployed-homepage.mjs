import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const commit = process.argv[2];
assert.match(commit ?? '', /^[a-f0-9]{40}$/, 'Pass the full expected Git commit SHA');
const root = new URL('../', import.meta.url);
const base = 'https://aureliuswu.github.io/';
const read = (file) => readFileSync(new URL(file, root));
const text = (buffer) => buffer.toString('utf8').replace(/\r\n/g, '\n');
const version = text(read('VERSION')).trim();
const catalog = JSON.parse(text(read('demos/catalog.json')));

async function fetchFile(path) {
  const url = new URL(path, base);
  url.searchParams.set('sha', commit);
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
  assert.equal(response.status, 200, `${path || '/'} HTTP status`);
  return Buffer.from(await response.arrayBuffer());
}

let lastError;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const build = JSON.parse(text(await fetchFile('portfolio-build.json')));
    assert.equal(build.commit, commit, 'Deployed commit');
    assert.equal(build.version, version, 'Deployed homepage version');
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;
    if (attempt < 11) await delay(5000);
  }
}
if (lastError) throw lastError;

const files = ['index.html', 'repositories.html', 'favicon.svg', 'favicon.ico', 'data/projects.json', 'data/repositories.json',
  ...catalog.flatMap(({ slug }) => [`demos/${slug}.html`, `demos/media/${slug}.mp4`])];
await Promise.all(files.map(async (file) => {
  const actual = await fetchFile(file === 'index.html' ? '' : file);
  const expected = read(file);
  if (/\.(html|svg|json)$/.test(file)) {
    assert.ok(text(actual) === text(expected), `${file} must match the verified commit`);
  } else {
    assert.ok(actual.equals(expected), `${file} must match the verified commit`);
  }
}));
console.log(`Production v${version} (${commit}): build marker and ${files.length} files match.`);
