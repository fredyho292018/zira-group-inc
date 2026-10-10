import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../web/' + path, import.meta.url), 'utf8');
test('contact section makes its unavailable status clear and has no pretend form', () => {
  const page = read('src/pages/index.astro');
  assert.ok(page.includes('Contact details will be published here when available.'));
  assert.ok(!/<form\b|tel:|mailto:/i.test(page));
});
test('all navigation targets exist in the page or service component', () => {
  const page = read('src/pages/index.astro') + read('src/components/Services.astro');
  const links = [...read('src/components/Header.astro').matchAll(/href="#([^"]+)"/g)];
  for (const [, target] of links) assert.ok(page.includes(`id="${target}"`), target);
});
test('crawler and health resources use the canonical domain and application identity', () => {
  assert.ok(read('public/robots.txt').includes('https://ziragroupinc.com/sitemap-index.xml'));
  assert.equal(read('public/health.txt').trim(), 'zira-ok');
});
