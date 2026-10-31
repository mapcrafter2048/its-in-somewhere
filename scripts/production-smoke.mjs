import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { chromium, expect } from '@playwright/test';

const root = resolve('dist');
assert.ok(existsSync(resolve(root, 'index.html')), 'Build the game before running the production smoke test.');
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.ogg':'audio/ogg', '.glb':'model/gltf-binary', '.txt':'text/plain' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
let browser;
try {
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless:true,
    args:['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport:{width:1024, height:768} });
  const errors = [], failures = [], responses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { responses.push(response.url()); if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil:'domcontentloaded' });
  await expect(page.locator('#start')).toBeVisible({timeout:120000});
  assert.equal(await page.evaluate(() => '__GAME__' in window), false, 'Production must not expose development hooks.');
  assert.ok(responses.some(url => url.endsWith('/models/cup.glb')), 'The actual application must load its model.');
  assert.ok(responses.some(url => url.endsWith('/models/Textures/colormap.png')), 'The actual application must load its palette.');

  await page.getByRole('button', {name:'Settings & saved progress'}).click();
  await page.locator('#quality').selectOption('low');
  await page.locator('#reducedMotion').check();
  await page.locator('#pause-resume').click();
  await page.locator('#start').click();
  await expect(page.locator('#accept-letter')).toBeVisible();
  await page.locator('#accept-letter').click();
  await page.getByRole('button', {name:'Enter the archive'}).click();
  await expect(page.locator('#hud .hud-top')).toBeVisible();
  await page.keyboard.press('KeyN');
  await expect(page.locator('#note-text')).toBeVisible();
  await page.locator('#note-text').fill('Production smoke check.');
  await page.locator('#next-note').click();
  await expect(page.locator('#book-position')).toContainText('Sheet 2');
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyU');
  await expect(page.locator('[data-buy="stationery"]')).toBeVisible();

  // These normal lazy modules must import successfully from the built asset URLs.
  const assets = await readdir(resolve(root, 'assets'));
  const chunks = ['desktop-apps', 'snake'].map(name => {
    const file = assets.find(file => file.startsWith(name + '-') && file.endsWith('.js'));
    assert.ok(file, `Missing ${name} production chunk`);
    return `/assets/${file}`;
  });
  await page.evaluate(async chunks => { for (const path of chunks) await import(path); }, chunks);
  const pack = await page.request.get(base + '/content/babbage.json');
  assert.equal(pack.status(), 200);
  assert.match(pack.headers()['content-type'], /application\/json/);
  const content = await pack.json();
  assert.equal(content.id, 'babbage');
  assert.ok(content.excerpts.length > 0);
  const sound = await page.request.get(base + '/audio/footsteps/footstep_concrete_000.ogg');
  assert.equal(sound.status(), 200);
  assert.equal((await sound.body()).subarray(0, 4).toString(), 'OggS');
  const missing = await page.request.get(base + '/models/not-a-real-model.glb');
  assert.equal(missing.status(), 404, 'Missing assets must not silently return index.html.');
  assert.deepEqual(errors, [], 'Unexpected application exceptions');
  assert.deepEqual(failures, [], 'Unexpected application request failures');
  console.log('Production smoke passed: clock-in, WebGL scene, notebook, supplies, model/palette, reference pack, audio and lazy computer chunks.');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
