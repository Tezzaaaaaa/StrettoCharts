import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../search-enhancements.js', import.meta.url), 'utf8');

function element(id='') {
  const listeners = new Map();
  return {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    dataset: {},
    after() {},
    appendChild() {},
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, fn) { listeners.set(type, fn); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

const elements = {
  '#searchForm': element('searchForm'),
  '#search': element('search'),
  '#results': element('results'),
  '#title': element('title'),
  '#sub': element('sub'),
  '#count': element('count'),
  '#updated': element('updated'),
};

const document = {
  head: element('head'),
  createElement: () => element(),
  querySelector(selector) { return elements[selector] || null; },
  querySelectorAll() { return []; }
};

let historyFetches = 0;
let releaseFirst;
const firstPending = new Promise(resolve => { releaseFirst = resolve; });

globalThis.fetch = async url => {
  if (url === 'data/latest.json') {
    return {
      ok: true,
      async json() {
        return { schemaVersion: 3, generatedAt: '2026-09-23T00:00:00.000Z', sources: [] };
      }
    };
  }

  if (url === 'data/history/index.json') {
    historyFetches++;
    return { ok: true, async json() { return ['2026-09-22']; } };
  }
  if (url === 'data/history/2026-09-22.json') {
    historyFetches++;
    return { ok: true, async json() { return { schemaVersion: 3, generatedAt: '2026-09-22T00:00:00.000Z', sources: [{ id: 'test-source', name: 'Test Source', status: 'ok', entries: [] }] }; } };
  }
  if (typeof url === 'string' && !url.startsWith('https://itunes.apple.com/')) throw new Error(`Unexpected fetch URL: ${url}`);
  const query = new URL(url).searchParams.get('term');
  if (query === 'first') await firstPending;

  const name = query === 'first' ? 'First Album' : 'Second Album';
  return {
    ok: true,
    async json() {
      return {
        results: [{ collectionName: name, artistName: 'Test Artist', artworkUrl100: '', collectionId: query }]
      };
    }
  };
};

const context = {
  console,
  fetch: globalThis.fetch,
  document,
  location: { href: 'https://strettocharts.test/' },
  URL,
  setTimeout,
  clearTimeout
};
vm.runInNewContext(source, context);

await new Promise(resolve => setTimeout(resolve, 0));

const form = elements['#searchForm'];
const input = elements['#search'];

input.value = 'first';
form.dispatchEvent({ type: 'submit', preventDefault() {} });

input.value = 'second';
form.dispatchEvent({ type: 'submit', preventDefault() {} });

await new Promise(resolve => setTimeout(resolve, 0));

if (historyFetches < 1) {
  throw new Error('lazy history path was not traversed');
}

if (!elements['#results'].innerHTML.includes('Second Album')) {
  throw new Error('newer search did not render');
}

releaseFirst();
await new Promise(resolve => setTimeout(resolve, 0));

const html = elements['#results'].innerHTML;
if (html.includes('First Album')) {
  throw new Error('stale search overwrote newer results');
}

console.log('Search race test passed: stale async results cannot overwrite the latest search.');
