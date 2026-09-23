import { chromium } from 'playwright';

const url = process.argv[2] || 'https://tezzaaaaaa.github.io/StrettoCharts/dashboard.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
let observerCreations = 0;
const isExpectedArtworkError = message => message.includes('api.deezer.com') || message.includes('net::ERR_FAILED');

page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', message => {
  if (message.type() === 'error' && !isExpectedArtworkError(message.text())) errors.push(`console: ${message.text()}`);
});

await page.addInitScript(() => {
  const NativeMutationObserver = window.MutationObserver;
  window.__strettoMutationObserverCreations = 0;
  window.MutationObserver = class extends NativeMutationObserver {
    constructor(...args) {
      window.__strettoMutationObserverCreations += 1;
      super(...args);
    }
  };
});

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  await page.locator('#search').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#results').waitFor({ state: 'visible', timeout: 5000 });

  const heartbeat = await page.evaluate(() => {
    let ticks = 0;
    const started = performance.now();
    return new Promise(resolve => {
      const timer = setInterval(() => { ticks += 1; }, 100);
      setTimeout(() => {
        clearInterval(timer);
        resolve({ ticks, elapsed: performance.now() - started });
      }, 1000);
    });
  });
  if (heartbeat.ticks < 5) throw new Error(`main-thread heartbeat stalled: only ${heartbeat.ticks} ticks`);

  await page.locator('#search').fill('Taylor Swift');
  await page.locator('.candidate').first().waitFor({ state: 'visible', timeout: 5000 });
  const candidateCount = await page.locator('.candidate').count();
  if (candidateCount < 1) throw new Error('search produced no candidate result');

  await page.locator('.candidate').first().click({ timeout: 5000 });
  await page.locator('#results .profile').waitFor({ state: 'visible', timeout: 5000 });

  await page.locator('#backSearch').click({ timeout: 5000 });
  await page.locator('.candidate').first().waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#search').fill('Lady Gaga');
  await page.locator('.candidate').first().waitFor({ state: 'visible', timeout: 5000 });
  const gagaCandidates = await page.locator('.candidate').count();
  if (gagaCandidates < 1) throw new Error('Lady Gaga search produced no candidate result');
  await page.locator('.candidate').filter({ hasText: 'Lady Gaga' }).first().click({ timeout: 5000 });
  await page.locator('#results .profile').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('#spotifyArtistPanel').waitFor({ state: 'visible', timeout: 5000 });
  const spotifyPanel = await page.locator('#spotifyArtistPanel').innerText();
  if (!spotifyPanel.includes('Spotify chart history')) throw new Error('Lady Gaga Spotify chart history is missing');
  if (!spotifyPanel.includes('Full Spotify song catalogue')) throw new Error('Lady Gaga full Spotify song catalogue is missing');
  if (!spotifyPanel.includes('Full Spotify album / release catalogue')) throw new Error('Lady Gaga full Spotify album catalogue is missing');



  observerCreations = await page.evaluate(() => window.__strettoMutationObserverCreations);
  if (observerCreations !== 0) throw new Error(`unexpected MutationObserver construction count: ${observerCreations}`);

  if (errors.length) throw new Error(errors.join(' | '));
  console.log(JSON.stringify({ url, candidateCount, gagaCandidates, spotifyPanelLength: spotifyPanel.length, observerCreations, heartbeat }));
} finally {
  await browser.close();
}
