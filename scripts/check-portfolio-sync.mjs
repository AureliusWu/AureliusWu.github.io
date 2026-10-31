import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const data = JSON.parse(read('data/projects.json'));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(data?.schema_version === 1, 'data/projects.json schema_version must be 1');
check(data?.owner === 'AureliusWu', 'data/projects.json owner must be AureliusWu');
check(Array.isArray(data?.projects), 'data/projects.json projects must be an array');

const repos = new Set();
for (const project of data.projects ?? []) {
  check(Boolean(project.repo), 'project repo is required');
  check(!repos.has(project.repo), `duplicate project: ${project.repo}`);
  repos.add(project.repo);
  check(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(project.current_version ?? ''),
    `${project.repo}: current_version is not semantic`);
  check(['release', 'readme'].includes(project.current_source), `${project.repo}: invalid current_source`);
  check(Boolean(project.current_status), `${project.repo}: current_status is required`);
  if (project.latest_release) {
    check(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(project.latest_release.version ?? ''),
      `${project.repo}: latest_release.version is not semantic`);
    check(/^https:\/\/github\.com\/AureliusWu\//.test(project.latest_release.url ?? ''),
      `${project.repo}: latest_release.url must point to AureliusWu GitHub`);
  }
}

const showcase = (data.projects ?? []).filter((project) => project.showcase);
check(showcase.length === 5, `expected 5 showcase projects, got ${showcase.length}`);
const expectedShowcase = ['FundVal', 'fund-compass', 'News', 'Agent', 'ImageLore'];
for (const repo of expectedShowcase) check(showcase.some((project) => project.repo === repo), `missing showcase project: ${repo}`);

const readme = read('README.md');
const index = read('index.html');
const demos = {
  FundVal: read('demos/fundval.html'),
  'fund-compass': read('demos/fund-compass.html'),
  News: read('demos/news.html'),
  Agent: read('demos/agent.html'),
  ImageLore: read('demos/imagelore.html'),
};

for (const project of showcase) {
  check(readme.includes(`\`${project.current_version}\``),
    `${project.repo}: README does not expose current version ${project.current_version}`);

  const marker = `data-project="${project.repo}"`;
  const markerAt = index.indexOf(marker);
  check(markerAt >= 0, `${project.repo}: index project card missing`);
  if (markerAt >= 0) {
    const start = index.lastIndexOf('<a', markerAt);
    const end = index.indexOf('</a>', markerAt);
    const card = start >= 0 && end >= 0 ? index.slice(start, end + 4) : '';
    check(card.includes(`v${project.current_version}`),
      `${project.repo}: index card does not expose v${project.current_version}`);
  }

  const demo = demos[project.repo];
  check(Boolean(demo), `${project.repo}: demo page mapping missing`);
  if (demo) {
    check(/class="access project-status"/.test(demo), `${project.repo}: demo project-status missing`);
    check(demo.includes(`v${project.current_version}`),
      `${project.repo}: demo does not expose v${project.current_version}`);
  }
}

if (failures.length) {
  console.error(`Portfolio sync validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Portfolio sync validation passed: ${data.projects.length} tracked, ${showcase.length} showcased.`);
