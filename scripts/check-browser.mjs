import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium, webkit, devices } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'browser-report');
const catalog = JSON.parse(readFileSync(resolve(root, 'demos/catalog.json'), 'utf8'));
const mime = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8' };
const report = { layouts: [], interactions: [], htmlBytes: statSync(resolve(root, 'index.html')).size, gzipBytes: gzipSync(readFileSync(resolve(root, 'index.html'))).length };
mkdirSync(output, { recursive: true });

const server = createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = resolve(root, name === '/' ? 'index.html' : `.${name}`);
  if (relative(root, file).startsWith('..') || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  let data = readFileSync(file);
  const headers = { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if (range) {
    const start = Number(range[1]);
    const end = range[2] ? Math.min(data.length - 1, Number(range[2])) : data.length - 1;
    if (start > end) { res.writeHead(416); res.end(); return; }
    headers['Content-Range'] = `bytes ${start}-${end}/${data.length}`;
    data = data.subarray(start, end + 1);
  } else if (extname(file) === '.html' && req.headers['accept-encoding']?.includes('gzip')) {
    data = gzipSync(data); headers['Content-Encoding'] = 'gzip';
  }
  headers['Content-Length'] = data.length;
  res.writeHead(range ? 206 : 200, headers); res.end(data);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browsers = [];

async function layout(page, name) {
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.project-card').count(), 5);
  assert.equal(await page.locator('a a').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: horizontal overflow`);
  for (const button of await page.locator('.demo-link').all()) {
    await button.scrollIntoViewIfNeeded();
    const state = await button.evaluate(link => {
      const b = link.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      const content = link.parentElement.querySelector('.stack').getBoundingClientRect();
      return { width: b.width, height: b.height, hit: hit === link || link.contains(hit), clear: b.top >= content.bottom - 1 };
    });
    assert(state.width >= 44 && state.height >= 44 && state.hit && state.clear, `${name}: obscured or small Demo button: ${JSON.stringify(state)}`);
  }
  await page.evaluate(() => scrollTo(0, 0));
  const metrics = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight, resources: performance.getEntriesByType('resource').filter(r => !r.name.startsWith('data:')).map(r => r.name) }));
  assert.equal(metrics.resources.length, 0, `${name}: homepage should only request its document`);
  await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  report.layouts.push({ name, ...metrics });
  console.log(`${name}: no overflow, five accessible 44px Demo buttons, no extra initial requests`);
}

async function interactions(context, name, playback = false) {
  const page = await context.newPage();
  // Verify the three outgoing URLs without depending on the applications' availability in CI.
  await page.route('https://aureliuswu.github.io/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Project destination</title>' }));
  for (const demo of catalog) {
    for (const child of ['h2', '.preview-image']) {
      await page.goto(base);
      await page.locator(`[data-project="${demo.project}"] ${child}`).click();
      const destination = ['Agent', 'ImageLore'].includes(demo.project) ? `${base}/demos/${demo.slug}.html` : demo.href;
      assert.equal(page.url(), destination, `${name}: ${demo.title} ${child} destination`);
    }
    await page.goto(base);
    const mediaRequests = [];
    const onRequest = req => { if (/\.mp4(?:\?|$)/.test(req.url())) mediaRequests.push(req.url()); };
    page.on('request', onRequest);
    await page.locator(`.demo-link[href="demos/${demo.slug}.html"]`).click();
    await page.waitForLoadState('load');
    assert.equal(page.url(), `${base}/demos/${demo.slug}.html`);
    assert.equal(mediaRequests.length, 0, `${name}: video loaded before play`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const video = page.locator('video');
    assert.equal(await video.getAttribute('preload'), 'none');
    assert.equal(await video.getAttribute('playsinline'), '');
    assert.equal(await video.locator('track[kind="captions"][default]').count(), 1);
    if (playback) {
      await video.focus();
      await video.press('Space');
      await page.waitForFunction(() => document.querySelector('video').currentTime > .2, null, { timeout: 15000 });
      const state = await video.evaluate(v => ({ duration: v.duration, width: v.videoWidth, height: v.videoHeight, error: v.error?.code }));
      assert.deepEqual(state, { duration: 15, width: 1280, height: 720, error: undefined });
      await video.evaluate(v => { v.pause(); v.currentTime = 6; });
      await page.waitForFunction(() => !document.querySelector('video').seeking && document.querySelector('video').readyState >= 2);
    }
    await page.screenshot({ path: resolve(output, `${name}-${demo.slug}.png`), fullPage: true });
    page.off('request', onRequest);
    await page.getByRole('link', { name: '← 返回主页', exact: true }).click();
    assert.equal(page.url(), `${base}/index.html`);
    report.interactions.push({ profile: name, project: demo.project, title: true, preview: true, demo: true, back: true, preload: false, playback });
    console.log(`${name}: ${demo.title} title, preview, Demo and back${playback ? ', playback and seek' : ''} passed`);
  }
  await page.close();
}

try {
  // Hosted Linux has Chrome for H.264 playback; WebKit adds Mobile Safari layout coverage.
  const chrome = await chromium.launch({ channel: 'chrome' }); browsers.push(chrome);
  const desktop = await chrome.newContext();
  const page = await desktop.newPage();
  for (const [width, height] of [[1440,900],[1366,768],[1024,600],[768,1024],[390,844],[360,640],[320,568],[844,390],[683,384]]) {
    await page.setViewportSize({ width, height });
    await layout(page, `chrome-${width}x${height}`);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(base);
  const focused = [];
  for (let i = 0; i < 13; i++) {
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineStyle, demo: document.activeElement.classList.contains('demo-link') }));
    assert.equal(focus.tag, 'A'); assert.equal(focus.outline, 'solid'); focused.push(focus);
  }
  assert.equal(focused.filter(f => f.demo).length, 5);
  await page.goto(base); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash, '#projects');
  await interactions(desktop, 'desktop', true);
  const android = await chrome.newContext({ ...devices['Pixel 5'] });
  const phonePage = await android.newPage();
  await layout(phonePage, 'android-pixel5');
  await interactions(android, 'android', true);
  await android.close(); await desktop.close();

  const safari = await webkit.launch(); browsers.push(safari);
  const ios = await safari.newContext({ ...devices['iPhone 13'] });
  const iosPage = await ios.newPage();
  await layout(iosPage, 'webkit-iphone13');
  await interactions(ios, 'ios', false);
  await ios.close();
  report.passed = true;
} catch (error) {
  report.passed = false; report.error = error.stack;
  console.error(error); process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await Promise.all(browsers.map(browser => browser.close()));
  await new Promise(done => server.close(done));
}
