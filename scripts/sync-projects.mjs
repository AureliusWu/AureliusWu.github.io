import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { configs, owner, latestFormal, latestPrerelease, readmeCandidate, readmeVersion, snapshot, projectPages } from './project-card.mjs';
import { normalizePublicRepositories, renderRepositoriesPage, updateRepositoryLink } from './public-repositories.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const dryRun = process.argv.includes('--dry-run');
const read = name => readFileSync(resolve(root, name), 'utf8');
const api = 'https://api.github.com';

async function request(path, { allowMissing = false, anonymousOnly = false } = {}) {
  const url = api + path;
  const anonymous = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AureliusWu-portfolio-sync/2.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const headers = token && !anonymousOnly ? [{ ...anonymous, Authorization: `Bearer ${token}` }, anonymous] : [anonymous];
  for (const [index, auth] of headers.entries()) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetch(url, { headers: auth, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
      } catch (error) {
        if (attempt === 2) throw new Error(`GET ${path} failed: ${error.cause?.code ?? error.name}`);
        await delay((attempt + 1) * 500);
        continue;
      }
      if (response.ok) return response.json();
      if ([401, 403, 404].includes(response.status) && index < headers.length - 1) break;
      if (response.status === 404 && allowMissing) return null;
      if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
        await delay((attempt + 1) * 500);
        continue;
      }
      throw new Error(`GET ${path} failed: HTTP ${response.status}`);
    }
  }
  throw new Error(`GET ${path} failed`);
}

async function publicOwnedRepositories() {
  const rows = [];
  for (let page = 1; ; page++) {
    const batch = await request(`/users/${owner}/repos?type=owner&sort=full_name&direction=asc&per_page=100&page=${page}`,
      { anonymousOnly: true });
    if (!Array.isArray(batch)) throw new Error('Public repository listing is malformed');
    rows.push(...batch);
    if (batch.length < 100) return normalizePublicRepositories(owner, rows);
  }
}

async function lookup(config) {
  const prefix = `/repos/${owner}/${config.repo}`;
  const [release, releases] = await Promise.all([
    request(`${prefix}/releases/latest`, { allowMissing: true }),
    request(`${prefix}/releases?per_page=100`),
  ]);
  const formal = latestFormal(release, config.repo);
  const preview = latestPrerelease(releases, formal, config.repo);
  if (formal === null && releases.some(raw => raw.draft === false && raw.prerelease === false)) {
    throw new Error(`${config.repo}: releases/latest is missing although a formal release exists; retry synchronization`);
  }
  let development = null;
  const requiresReadme = config.readme || (config.readmeFallback && !formal && !preview);
  if (requiresReadme || config.demo) {
    const file = await request(`${prefix}/contents/README.md?ref=main`, { allowMissing: !requiresReadme });
    if (file !== null) {
      if (file.encoding !== 'base64' || typeof file.content !== 'string') {
        throw new Error(`${config.repo}: unexpected README response`);
      }
      const text = Buffer.from(file.content, 'base64').toString('utf8');
      development = requiresReadme ? readmeVersion(text, config.repo) : readmeCandidate(text, config.repo);
    }
  }
  return snapshot(config, development, formal, preview);
}

const repositories = await publicOwnedRepositories();
const publicNames = new Set(repositories.map(name => name.toLowerCase()));
const previous = new Map(JSON.parse(read('data/projects.json')).projects.map(project => [project.repo, project]));
const projects = [];
for (const config of configs) {
  const lastKnown = previous.get(config.repo);
  if (!publicNames.has(config.repo.toLowerCase())) {
    // The repository directory follows current visibility. A curated case and
    // its last public version snapshot remain available without fetching the repo.
    if (config.demo && lastKnown) projects.push(lastKnown);
    continue;
  }
  try {
    const project = await lookup(config);
    if (project) projects.push(project);
  } catch (error) {
    if (!lastKnown && config.demo) throw error;
    console.warn(`Version lookup failed for ${config.repo}; ${lastKnown ? 'keeping the last verified version' : 'no version snapshot added'}. ${error.message}`);
    if (lastKnown) projects.push(lastKnown);
  }
}
const data = {
  schema_version: 2,
  owner,
  policy: {
    release_first: configs.filter(config => config.demo && !config.readme).map(config => config.repo),
    readme_current_version: configs.filter(config => config.readme).map(config => config.repo),
    private_repositories: 'Not queried from the public portfolio workflow.',
  },
  projects,
};

// Validate every destination and its synchronization markers before writing anything.
const pages = projectPages(projects, read).set('data/projects.json', `${JSON.stringify(data, null, 2)}\n`);
pages.set('index.html', updateRepositoryLink(pages.get('index.html'), repositories));
pages.set('repositories.html', renderRepositoriesPage(owner, repositories));
pages.set('data/repositories.json', `${JSON.stringify({ owner, repositories }, null, 2)}\n`);
const changedFiles = [];
for (const [name, content] of pages) {
  // Preserve the checkout's line endings on unchanged files (especially Windows).
  let existing = '';
  try { existing = read(name); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing.replaceAll('\r\n', '\n') === content.replaceAll('\r\n', '\n')) continue;
  changedFiles.push(name);
  if (!dryRun) writeFileSync(resolve(root, name), content);
}
console.log(JSON.stringify({
  changed: changedFiles.length > 0,
  dryRun,
  changedFiles,
  publicRepositories: repositories.length,
  projects: projects.map(({ repo, development, latest_release, latest_prerelease }) => ({
    repo, source: development?.version ?? null, formal: latest_release?.version ?? null, preview: latest_prerelease?.version ?? null,
  })),
}, null, 2));
