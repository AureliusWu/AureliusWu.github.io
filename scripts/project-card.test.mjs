import assert from 'node:assert/strict';
import test from 'node:test';
import { configs, latestFormal, latestPrerelease, readmeCandidate, readmeVersion, snapshot, projectPages } from './project-card.mjs';

const firstDate = '2026-10-20T00:00:00Z';
const secondDate = '2026-10-30T00:00:00Z';
const raw = (tag, fields = {}) => ({ tag_name: tag, draft: false, prerelease: false, published_at: firstDate, ...fields });
const showcase = configs.filter(config => config.demo);
const agent = showcase.find(config => config.repo === 'Agent');
const candidate = readmeVersion('当前版本：`2.0.0`。这是 Windows 桌面补丁候选。\n', agent.repo);

function projectsFor(agentRelease = raw('v1.0.0'), agentPreview = null) {
  return showcase.map(config => {
    if (config === agent) return snapshot(config, candidate, latestFormal(agentRelease, config.repo), agentPreview);
    if (config.readme) return snapshot(config, readmeVersion('当前版本：`8.0.0`。v9 仍是候选开发线。\n', config.repo), null, null);
    return snapshot(config, null, latestFormal(raw('v1.0.0'), config.repo), null);
  });
}

function pagesFixture() {
  return new Map([
    ['index.html', showcase.map(config => `<a data-project="${config.repo}"><h2>${config.displayName}</h2><span data-test="keep" class="type">v0.0.0</span></a>`).join('')],
    ['README.md', showcase.map(config => `| ${config.displayName} | 项目 | 旧版本 | 其它内容 |\r\n`).join('')],
    ...showcase.map(config => [`demos/${config.demo}`,
      `<main><p class="access project-status">旧版本</p>${config.desktop ? '<a class="primary" href="https://example.org/old" data-release-link>旧入口</a>' : ''}<p>案例内容保持</p></main>`]),
  ]);
}

test('formal releases require explicit non-draft and non-prerelease API evidence', () => {
  assert.equal(latestFormal(raw('v1.0.0'), 'Agent').status, '正式发布');
  assert.equal(latestFormal(raw('v1.0.0', { body: '本版发布例外' }), 'Agent').status, '正式发布（带已知限制）');
  assert.equal(latestFormal(null, 'Agent'), null);
  for (const record of [
    raw('v1.0.0', { prerelease: true }),
    raw('v1.0.0', { draft: true }),
    raw('v1.0.0', { prerelease: undefined }),
    raw('v1.0.0', { draft: undefined }),
    raw('v1.0.0-malformed tag'),
  ]) assert.throws(() => latestFormal(record, 'Agent'), /invalid formal release metadata/);
});

test('selects public prereleases separately and ignores drafts, non-version tags and replaced previews', () => {
  const formal = latestFormal(raw('v1.0.0', { published_at: '2026-10-24T00:00:00Z' }), 'News');
  const records = [
    raw('v1.0.0-rc.1', { prerelease: true }),
    raw('v1.1.0-rc.1', { prerelease: true, published_at: secondDate }),
    raw('v3.0.0-rc.1', { prerelease: true, draft: true, published_at: secondDate }),
    raw('rollback-not-semantic', { prerelease: true, published_at: secondDate }),
    raw('v5.0.0', { published_at: secondDate }),
  ];
  assert.equal(latestPrerelease(records, formal, 'News').version, '1.1.0-rc.1');
  assert.equal(latestPrerelease(records, formal, 'News').status, '预发布');
  assert.equal(latestPrerelease(records.slice(0, 1), formal, 'News'), null);
});

test('README version is authoritative only when declared, and does not inherit another version candidate status', () => {
  assert.equal(candidate.status, '开发候选');
  assert.equal(readmeVersion('当前版本：`8.0.0`。v9 仍是候选开发线。', 'fund-compass').status, '源码版本');
  assert.throws(() => readmeVersion('# Project v1.0.0\nOlder v2.0.0', 'Agent'), /must declare/);
  assert.throws(() => readmeVersion('当前版本：1.0.0\n当前版本：2.0.0', 'Agent'), /must declare/);
});

test('changing the formal release updates cards, case notes, Windows release CTA and README in one idempotent projection', () => {
  const original = pagesFixture();
  const previous = projectPages(projectsFor(), name => original.get(name));
  const updatedRecords = projectsFor(raw('v1.1.0', { published_at: secondDate }));
  const updated = projectPages(updatedRecords, name => previous.get(name));
  const card = updated.get('index.html');
  const demo = updated.get('demos/agent.html');
  assert.match(card, /data-project="Agent"[^>]*>.*?<span data-test="keep" class="type">候选 v2\.0\.0 · 正式 v1\.1\.0<\/span>/);
  assert.match(demo, /<strong>开发候选<\/strong>.*v2\.0\.0.*<strong>正式发布<\/strong>.*v1\.1\.0/);
  assert.match(demo, /<a class="primary" href="https:\/\/github\.com\/AureliusWu\/Agent\/releases\/tag\/v1\.1\.0" data-release-link>查看 Windows 发布/);
  assert.doesNotMatch(demo, /v1\.0\.0/);
  assert.match(updated.get('README.md'), /\| 司忆 \/ Agent \| 项目 \| 开发候选 `v2\.0\.0`；正式发布 `v1\.1\.0` \| 其它内容 \|\r\n/);
  assert.match(demo, /<p>案例内容保持<\/p>/);
  assert.equal(updated.get('demos/news.html'), previous.get('demos/news.html'));
  assert.deepEqual(projectPages(updatedRecords, name => updated.get(name)), updated);
});

test('equal source and formal version numbers do not collapse independent release evidence', () => {
  const original = pagesFixture();
  const pages = projectPages(projectsFor(raw('v2.0.0')), name => original.get(name));
  assert.match(pages.get('index.html'), /候选 v2\.0\.0 · 正式 v2\.0\.0/);
  assert.match(pages.get('demos/agent.html'), /blob\/main\/README\.md">v2\.0\.0.*releases\/tag\/v2\.0\.0">v2\.0\.0/);
});

test('release-first projects retain the formal version and show only an explicit README candidate alongside it', () => {
  const config = showcase.find(item => item.repo === 'FundVal');
  const formal = latestFormal(raw('v1.0.0'), config.repo);
  for (const readme of ['# FundVal v3.0.0', '当前版本：`1.0.0`。', '当前版本：`2.0.0`。这是正式版，并非开发候选。']) {
    assert.equal(readmeCandidate(readme, config.repo), null);
  }
  const original = pagesFixture();
  for (const version of ['2.0.0', '1.0.0']) {
    const source = readmeCandidate(`当前版本：${version}（开发候选）`, config.repo);
    const project = snapshot(config, source, formal, null);
    assert.equal(project.current_source, 'release');
    assert.equal(project.current_version, '1.0.0');
    const records = projectsFor().map(item => item.repo === config.repo ? project : item);
    const pages = projectPages(records, name => original.get(name));
    assert.ok(pages.get('index.html').includes(`候选 v${version} · 正式 v1.0.0`));
    assert.match(pages.get('demos/fundval.html'), /开发候选.*blob\/main\/README.md.*正式发布.*releases\/tag\/v1\.0\.0/);
  }
});

test('an active prerelease never becomes a Windows formal CTA or a formal label', () => {
  const original = pagesFixture();
  const preview = latestPrerelease([raw('v2.0.0-rc.1', { prerelease: true, published_at: secondDate })], null, 'Agent');
  const pages = projectPages(projectsFor(null, preview), name => original.get(name));
  assert.match(pages.get('index.html'), /候选 v2\.0\.0 · 预发 v2\.0\.0-rc\.1/);
  const demo = pages.get('demos/agent.html');
  assert.match(demo, /<strong>预发布<\/strong>.*v2\.0\.0-rc\.1.*暂无正式发布/);
  assert.match(demo, /<a class="primary" href="https:\/\/github\.com\/AureliusWu\/Agent\/releases" data-release-link>查看发布记录/);
  assert.doesNotMatch(demo, /查看 Windows 发布/);
});

test('missing or duplicate markers abort generation before any destination is written', () => {
  const records = projectsFor();
  const original = pagesFixture();
  const changed = new Map(original);
  changed.set('index.html', original.get('index.html').replace('class="type"', 'class="other"'));
  assert.throws(() => projectPages(records, name => changed.get(name)), /FundVal type span: expected one marker, found 0/);
  changed.set('index.html', original.get('index.html'));
  changed.set('demos/agent.html', original.get('demos/agent.html').replace('</main>', '<p class="access project-status">重复</p></main>'));
  assert.throws(() => projectPages(records, name => changed.get(name)), /Agent case version paragraph: expected one marker, found 2/);
});
