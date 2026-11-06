import { readFileSync } from 'node:fs';
import { configs, owner, projectPages, releaseUrl, snapshot, versionOf } from './project-card.mjs';
import { normalizePublicRepositories, renderRepositoriesPage, updateRepositoryLink } from './public-repositories.mjs';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const data = JSON.parse(read('data/projects.json'));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(data.schema_version === 2, 'data/projects.json schema_version must be 2');
check(data.owner === owner, `data/projects.json owner must be ${owner}`);
check(Array.isArray(data.projects), 'data/projects.json projects must be an array');
const projectRecords = Array.isArray(data.projects) ? data.projects : [];
const settings = new Map(configs.map(config => [config.repo, config]));
const seen = new Set();

for (const project of projectRecords) {
  const repo = project?.repo;
  const config = settings.get(repo);
  check(Boolean(config), `unexpected project: ${repo}`);
  check(!seen.has(repo), `duplicate project: ${repo}`);
  seen.add(repo);
  if (!config) continue;
  check(project.showcase === Boolean(config.demo), `${repo}: wrong showcase setting`);
  check(project.display_name === config.displayName, `${repo}: wrong display name`);
  const { development, latest_release: formal, latest_prerelease: preview } = project;
  for (const key of ['development', 'latest_release', 'latest_prerelease']) {
    check(project[key] !== undefined, `${repo}: missing ${key} evidence field`);
  }
  if (development) {
    check(Boolean(config.readme || config.readmeFallback || (config.demo && development.status === '开发候选')),
      `${repo}: undeclared README policy`);
    check(versionOf(development.version) === development.version, `${repo}: invalid source version`);
    check(['源码版本', '开发候选'].includes(development.status), `${repo}: invalid source status`);
    check(development.url === `https://github.com/${owner}/${repo}/blob/main/README.md`, `${repo}: invalid README URL`);
  }
  if (config.readme) check(Boolean(development), `${repo}: declared README evidence missing`);
  for (const [record, expectedPreview] of [[formal, false], [preview, true]]) {
    if (!record) continue;
    check(record.draft === false && record.prerelease === expectedPreview, `${repo}: wrong release classification`);
    check(versionOf(record.tag) !== null && versionOf(record.tag) === record.version, `${repo}: invalid release version`);
    check(record.url === releaseUrl(repo, record.tag), `${repo}: invalid release URL`);
    check(Number.isFinite(Date.parse(record.published_at)), `${repo}: invalid publication date`);
    const allowed = expectedPreview ? ['预发布'] : ['正式发布', '正式发布（带已知限制）'];
    check(allowed.includes(record.status), `${repo}: invalid release status`);
  }
  if (formal && preview) check(Date.parse(preview.published_at) > Date.parse(formal.published_at), `${repo}: stale preview shown beside formal release`);
  if (!development && !formal && !preview) {
    check(false, `${repo}: no verifiable project version`);
    continue;
  }
  const expected = snapshot(config, development, formal, preview);
  for (const key of ['current_version', 'current_source', 'current_status', 'current_source_url']) {
    check(project[key] === expected[key], `${repo}: ${key} disagrees with evidence`);
  }
}

for (const config of configs.filter(item => item.demo)) {
  check(seen.has(config.repo), `missing showcase project: ${config.repo}`);
}
try {
  const { owner: directoryOwner, repositories } = JSON.parse(read('data/repositories.json'));
  check(directoryOwner === owner, `data/repositories.json owner must be ${owner}`);
  const canonical = normalizePublicRepositories(owner, repositories.map(name => ({ name, owner: { login: owner }, private: false })));
  check(JSON.stringify(repositories) === JSON.stringify(canonical), 'data/repositories.json names must be valid, unique and sorted');
  const index = read('index.html');
  check(updateRepositoryLink(index, canonical) === index, 'Homepage repository count differs from the public directory');
  check(renderRepositoriesPage(owner, canonical) === read('repositories.html').replaceAll('\r\n', '\n'),
    'Generated public repository directory differs from its inventory');
} catch (error) {
  failures.push(`Public repository directory: ${error.message}`);
}
if (failures.length === 0) {
  try {
    for (const [path, expected] of projectPages(projectRecords, read)) {
      check(expected === read(path), `${path}: generated project versions or release links differ from data/projects.json`);
    }
  } catch (error) {
    failures.push(error.message);
  }
}

if (failures.length) {
  console.error(`Portfolio sync validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Portfolio sync validation passed: ${projectRecords.length} tracked, ${projectRecords.filter(project => project.showcase).length} showcased.`);
