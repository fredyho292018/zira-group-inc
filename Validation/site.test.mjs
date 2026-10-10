import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../web/' + path, import.meta.url), 'utf8');
test('contact submissions remain gated until policy and integration are configured', () => {
  const page = read('src/components/ContactEstimateForm.astro');
  assert.ok(page.includes('PUBLIC_CONTACT_ENABLED'));
  assert.ok(page.includes('disabled={!enabled}'));
  assert.ok(page.includes('<fieldset>'));
  assert.ok(page.includes("type={enabled ? 'submit' : 'button'}"));
  assert.ok(page.includes('Privacy Policy pending publication'));
  assert.ok(!/tel:|mailto:/i.test(page));
});
test('all navigation targets exist in the page or service component', () => {
  const page = ['pages/index', 'components/Hero', 'components/Header', 'components/Services', 'components/About', 'components/Projects', 'components/ServiceAreas', 'components/ContactEstimateForm'].map(path => read(`src/${path}.astro`)).join('\n');
  const links = [...page.matchAll(/href="#([^"]+)"/g)];
  for (const [, target] of links) assert.ok(page.includes(`id="${target}"`), target);
});
test('inspiration gallery cannot be confused with a verified project portfolio', () => {
  const gallery = read('src/components/Projects.astro');
  assert.ok(gallery.includes('Illustrative concepts, not completed Zira projects.'));
  assert.ok(gallery.includes('Illustrative example'));
});
test('crawler and health resources use the canonical domain and application identity', () => {
  assert.ok(read('public/robots.txt').includes('https://ziragroupinc.com/sitemap-index.xml'));
  assert.equal(read('public/health.txt').trim(), 'zira-ok');
});
