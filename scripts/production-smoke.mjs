import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, expect } from '@playwright/test';

// Set PRODUCTION_BASE_URL to check a hosted build instead of starting locally.
const remoteBase = process.env.PRODUCTION_BASE_URL;
let base = remoteBase ? new URL(remoteBase).origin : '';
let server;
let serverOutput = '';
if (!remoteBase) {
  assert.ok(existsSync(resolve('.next/BUILD_ID')), 'Build the game before running the production smoke test.');
  const reservation = createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  server.stdout.on('data', chunk => { serverOutput += chunk; });
  server.stderr.on('data', chunk => { serverOutput += chunk; });
}
let browser;
try {
  const deadline = Date.now() + 60000;
  while (server) {
    assert.equal(server.exitCode, null, `Next.js exited before startup: ${serverOutput}`);
    try { if ((await fetch(base)).ok) break; } catch {}
    assert.ok(Date.now() < deadline, `Next.js startup timed out: ${serverOutput}`);
    await delay(100);
  }
  browser = await chromium.launch({
    executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    headless:true,
    args:['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({ viewport:{width:1024, height:768} });
  // Vercel's share URL sets the normal protection cookie in this test browser.
  const accessUrl = process.env.PRODUCTION_ACCESS_URL;
  if (accessUrl) {
    assert.equal(new URL(accessUrl).origin, base, 'Protection URL must belong to the deployment under test.');
    await page.goto(accessUrl, { waitUntil:'domcontentloaded' });
  }
  const errors = [], failures = [], responses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { responses.push(response.url()); if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(base + '/?test=1&models=1', { waitUntil:'domcontentloaded' });
  await expect(page.locator('#start')).toBeVisible({timeout:120000});
  assert.equal(await page.evaluate(() => '__GAME__' in window), false, 'Production must not expose development hooks.');
  assert.ok(responses.some(url => url.endsWith('/models/cup.glb')), 'The actual application must load its model.');
  assert.ok(responses.some(url => url.endsWith('/models/Textures/colormap.png')), 'The actual application must load its palette.');

  await page.getByRole('button', {name:'Settings & saved progress'}).click();
  await page.locator('[data-choice-for="quality"] label').filter({has:page.locator('input[value="low"]')}).click();
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
  await page.locator('#book-next').click();
  await expect(page.locator('#book-position')).toContainText('Sheet 2');
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyU');
  await expect(page.locator('[data-buy="stationery"]')).toBeVisible();

  // Restore a normal persisted position in front of the computer. This uses
  // the same save-loading path as returning players, without development hooks.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const computerSave = await page.evaluate(() => {
    const key = 'archive-office-save-v3';
    const save = JSON.parse(localStorage.getItem(key));
    save.wing = 3;
    save.position = [-13.7, 1.7, -46.5];
    save.rotation = [-.15, 0];
    return save;
  });
  await page.addInitScript(save => localStorage.setItem('archive-office-save-v3', JSON.stringify(save)), computerSave);
  await page.reload();
  await page.locator('#start').click();
  await expect(page.locator('#hud .hud-top')).toBeVisible();
  await expect(page.locator('#interaction')).toContainText('Records Desktop', { timeout:15000 });
  await page.keyboard.press('KeyE');
  await expect(page.locator('.pc-terminal')).toBeVisible();
  await page.locator('[data-pc-command="files"]').click();
  await expect(page.locator('.pc-titlebar')).toContainText('Files');
  await page.locator('.pc-window-close').click();
  await page.locator('[data-pc-command="snake"]').click();
  await expect(page.locator('#snake-host canvas')).toBeVisible();
  assert.ok(responses.some(url => url.includes('/_next/static/') && url.includes('.js')), 'Next.js must serve the bundled game.');
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
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await once(server, 'exit');
  }
}
