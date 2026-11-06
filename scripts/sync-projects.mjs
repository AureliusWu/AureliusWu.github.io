import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { configs, owner, latestFormal, latestPrerelease, readmeCandidate, readmeVersion, snapshot, projectPages } from './project-card.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const dryRun = process.argv.includes('--dry-run');
const read = name => readFileSync(resolve(root, name), 'utf8');
const api = 'https://api.github.com';

async function request(path, { allowMissing = false } = {}) {
  const url = api + path;
  const anonymous = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AureliusWu-portfolio-sync/2.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const headers = token ? [{ ...anonymous, Authorization: `Bearer ${token}` }, anonymous] : [anonymous];
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
  const names = new Set();
  for (let page = 1; ; page++) {
    const rows = await request(`/users/${owner}/repos?type=owner&per_page=100&page=${page}`);
    if (!Array.isArray(rows)) throw new Error('Public repository listing is malformed');
    for (const repo of rows) {
      if (repo.private === false && repo.owner?.login === owner) names.add(repo.name);
    }
    if (rows.length < 100) return names;
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

const publicNames = await publicOwnedRepositories();
const projects = [];
for (const config of configs) {
  if (!publicNames.has(config.repo)) {
    if (config.demo) throw new Error(`${config.repo}: showcase repository is not public; no output changed`);
    continue;
  }
  const project = await lookup(config);
  if (project) projects.push(project);
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
const changedFiles = [];
for (const [name, content] of pages) {
  // Preserve the checkout's line endings on unchanged files (especially Windows).
  if (read(name).replaceAll('\r\n', '\n') === content.replaceAll('\r\n', '\n')) continue;
  changedFiles.push(name);
  if (!dryRun) writeFileSync(resolve(root, name), content);
}
console.log(JSON.stringify({
  changed: changedFiles.length > 0,
  dryRun,
  changedFiles,
  projects: projects.map(({ repo, development, latest_release, latest_prerelease }) => ({
    repo, source: development?.version ?? null, formal: latest_release?.version ?? null, preview: latest_prerelease?.version ?? null,
  })),
}, null, 2));
