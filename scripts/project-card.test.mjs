import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { updateCardVersion } from './project-card.mjs';

test('a matching card is a successful no-op on every sync', () => {
  const card = '<a data-project="FundVal"><span class="type">v16.0.1</span></a>';
  assert.equal(updateCardVersion(card, '16.0.1', 'FundVal'), card);
  assert.equal(updateCardVersion(updateCardVersion(card, '16.0.1', 'FundVal'), '16.0.1', 'FundVal'), card);
});

test('a changed version preserves attributes and the rest of the card', () => {
  const card = '<a data-project="News"><h2>News</h2><span data-test="version" class="type badge">v1.0.0</span></a>';
  assert.equal(updateCardVersion(card, '1.1.0-alpha.1', 'News'), card.replace('v1.0.0', 'v1.1.0-alpha.1'));
});

test('a missing version span still blocks synchronization', () => {
  assert.throws(() => updateCardVersion('<a><span class="other">v1.0.0</span></a>', '1.0.0', 'FundVal'), /type span not found/);
});

test('all currently synchronized homepage cards remain byte-identical', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const data = JSON.parse(readFileSync(new URL('../data/projects.json', import.meta.url), 'utf8'));
  const projects = data.projects.filter(project => project.showcase);
  assert.equal(projects.length, 5);
  for (const project of projects) {
    const at = html.indexOf(`data-project="${project.repo}"`);
    assert.ok(at >= 0);
    const start = html.lastIndexOf('<a', at);
    const end = html.indexOf('</a>', at);
    assert.ok(start >= 0 && end >= at);
    const card = html.slice(start, end + 4);
    assert.equal(updateCardVersion(card, project.current_version, project.repo), card, project.repo);
  }
});
