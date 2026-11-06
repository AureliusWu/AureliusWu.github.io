import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePublicRepositories, renderRepositoriesPage, updateRepositoryLink } from './public-repositories.mjs';

const owner = 'AureliusWu';
const row = (name, fields = {}) => ({ name, owner: { login: owner }, private: false, visibility: 'public', ...fields });
const index = '<a href="https://aureliuswu.github.io/FundVal/">打开应用</a>' +
  '<a class="secondary" data-public-repositories href="repositories.html">公开仓库（1）</a>' +
  '<a href="demos/news.html#demo">Demo</a>';

test('a new public repository is reflected in both directory links and homepage count', () => {
  const before = normalizePublicRepositories(owner, [row('News')]);
  const after = normalizePublicRepositories(owner, [row('News'), row('Agent')]);
  assert.doesNotMatch(renderRepositoriesPage(owner, before), /\/Agent"/);
  const page = renderRepositoriesPage(owner, after);
  assert.match(page, /<h1>公开仓库<\/h1>/);
  assert.match(page, /href="index\.html"[^>]*>← 返回首页/);
  assert.match(page, /https:\/\/github\.com\/AureliusWu\/Agent.*\n.*https:\/\/github\.com\/AureliusWu\/News/);
  assert.equal(updateRepositoryLink(index, after), index.replace('公开仓库（1）', '公开仓库（2）'));
});

test('repositories that turn private and foreign or malformed rows never enter generated outputs', () => {
  const publicBefore = normalizePublicRepositories(owner, [row('ProjectBecomesPrivate'), row('News')]);
  const rows = [
    row('ProjectBecomesPrivate', { private: true, description: 'PRIVATE_DETAILS' }),
    row('ForeignProject', { owner: { login: 'AnotherOwner' }, html_url: 'https://attacker.invalid/' }),
    row('InternalProject', { visibility: 'internal' }),
    row('UnknownProject', { private: undefined }),
    row('BadName<script>'), row('.'), row('..'), null,
    row('News', { description: 'DO_NOT_COPY_DESCRIPTION', html_url: 'https://attacker.invalid/', homepage: 'https://private.invalid/' }),
  ];
  const publicAfter = normalizePublicRepositories(owner, rows);
  assert.deepEqual(publicAfter, ['News']);
  assert.match(renderRepositoriesPage(owner, publicBefore), /\/ProjectBecomesPrivate"/);
  const page = renderRepositoriesPage(owner, publicAfter);
  assert.doesNotMatch(page, /ProjectBecomesPrivate|PRIVATE_DETAILS|ForeignProject|InternalProject|UnknownProject|BadName|DO_NOT_COPY_DESCRIPTION|attacker\.invalid|private\.invalid/);
  assert.match(page, /https:\/\/github\.com\/AureliusWu\/News/);
  assert.match(updateRepositoryLink(updateRepositoryLink(index, publicBefore), publicAfter), /公开仓库（1）/);
});

test('ordering and case-insensitive deduplication are independent of GitHub response order', () => {
  const rows = [row('zeta'), row('alpha'), row('Alpha'), row('Beta', { owner: { login: 'aureliuswu' }, visibility: undefined }), row('.github')];
  const first = normalizePublicRepositories(owner, rows);
  const reversed = normalizePublicRepositories(owner, rows.toReversed());
  assert.deepEqual(first, ['.github', 'Alpha', 'Beta', 'zeta']);
  assert.deepEqual(reversed, first);
  assert.equal(renderRepositoriesPage(owner, reversed), renderRepositoriesPage(owner, first));
});

test('repeated count rendering is a no-op and leaves static application and Demo links untouched', () => {
  const projects = ['News', 'FundVal'];
  const result = updateRepositoryLink(index, projects);
  assert.equal(result, index.replace('公开仓库（1）', '公开仓库（2）'));
  assert.equal(updateRepositoryLink(result, projects), result);
});

test('a missing, duplicate, or misdirected marker fails instead of editing an unrelated link', () => {
  assert.throws(() => updateRepositoryLink('<a href="repositories.html" title=" data-public-repositories ">旧入口</a>', []), /found 0/);
  assert.throws(() => updateRepositoryLink(index + index, []), /found 2/);
  assert.throws(() => updateRepositoryLink(index.replace('href="repositories.html"', 'href="https://example.org/"'), []), /must uniquely target/);
});

test('invalid API top-level shape or an invalid owner does not produce a directory', () => {
  assert.throws(() => normalizePublicRepositories(owner, { message: 'GitHub error' }), /must be an array/);
  assert.throws(() => renderRepositoriesPage('another/account', []), /Invalid GitHub repository owner/);
  assert.throws(() => renderRepositoriesPage(owner, ['<img src=x>']), /Invalid public repository names/);
  assert.match(renderRepositoriesPage(owner, []), /暂无公开仓库/);
});
