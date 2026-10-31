import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateCardVersion } from './project-card.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const owner = 'AureliusWu';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';

const projects = [
  { repo: 'FundVal', displayName: '蜉蝣基金 / FundVal', showcase: true, source: 'release', cardType: '网页应用', demo: 'fundval.html' },
  { repo: 'fund-compass', displayName: '司南基金 / fund-compass', showcase: true, source: 'readme', fixedStatus: '开发候选', cardType: '网页应用', demo: 'fund-compass.html' },
  { repo: 'News', displayName: '全球新闻 / News', showcase: true, source: 'release', cardType: '网页应用', demo: 'news.html' },
  { repo: 'Agent', displayName: '司忆 / Agent', showcase: true, source: 'readme', fixedStatus: '开发 / 用户测试基线', cardType: '桌面应用', demo: 'agent.html' },
  { repo: 'ImageLore', displayName: 'ImageLore', showcase: true, source: 'release', cardType: '桌面应用', demo: 'imagelore.html' },
  { repo: 'Rain', displayName: '雨停之前 / Before the Rain Stops', showcase: false, source: 'release' },
  { repo: 'Healing', displayName: '湿性愈合', showcase: false, source: 'release' },
  { repo: 'NetLove', displayName: '“网”恋 / NetLove', showcase: false, source: 'release' },
  { repo: 'Circuit', displayName: '回路 / Circuit', showcase: false, source: 'release' },
  { repo: 'Remotion', displayName: 'Remotion', showcase: false, source: 'release-or-readme' },
  { repo: 'VN-Engine-v2', displayName: 'VN Engine v2', showcase: false, source: 'release-or-readme' },
  { repo: 'RESET', displayName: '回留 / RESET', showcase: false, source: 'release' },
];

function read(name) {
  return readFileSync(resolve(root, name), 'utf8');
}

function writeIfChanged(name, content) {
  const path = resolve(root, name);
  let old = null;
  try { old = readFileSync(path, 'utf8'); } catch {}
  if (old === content) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return true;
}

async function request(url, asJson = true) {
  const baseHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AureliusWu-portfolio-sync/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const attempts = token ? [{ ...baseHeaders, Authorization: `Bearer ${token}` }, baseHeaders] : [baseHeaders];
  let last;
  for (const headers of attempts) {
    const response = await fetch(url, { headers });
    last = response;
    if (response.ok) return asJson ? response.json() : response.text();
    if (![403, 404].includes(response.status) || attempts.length === 1) break;
  }
  const error = new Error(`GET ${url} failed: ${last?.status ?? 'unknown'}`);
  error.status = last?.status;
  throw error;
}

function normalizeVersion(value) {
  const match = String(value ?? '').trim().match(/^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return match?.[1] ?? null;
}

function releaseStatus(release) {
  if (!release) return '未发布';
  if (release.prerelease) return '预发布';
  const text = `${release.name ?? ''}\n${release.body ?? ''}`;
  if (/RELEASED[_ -]?WITH[_ -]?WARNINGS|带警告|已知限制|风险接受/i.test(text)) {
    return '正式版（带已知限制）';
  }
  return '正式版';
}

async function latestRelease(repo) {
  try {
    const release = await request(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    const version = normalizeVersion(release.tag_name);
    if (!version) throw new Error(`${repo}: latest release tag is not semantic: ${release.tag_name}`);
    return {
      version,
      tag: release.tag_name,
      url: release.html_url,
      published_at: release.published_at,
      status: releaseStatus(release),
      prerelease: Boolean(release.prerelease),
    };
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function currentVersionFromReadme(repo) {
  const text = await request(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`, false);
  const patterns = [
    /当前版本[：:]\s*`?v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)`?/i,
    /^#\s+[^\n]*?v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/im,
    /\bv(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function htmlEscape(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownStatus(project) {
  let text = `\`${project.current_version}\` ${project.current_status}`;
  if (project.current_source === 'readme' && project.latest_release && project.latest_release.version !== project.current_version) {
    text += `；最新正式 Release \`${project.latest_release.version}\``;
  }
  return text;
}

function demoStatus(project) {
  const sourceUrl = project.current_source === 'release'
    ? project.latest_release?.url
    : `https://github.com/${owner}/${project.repo}/blob/main/README.md`;
  const releaseTail = project.current_source === 'readme' && project.latest_release && project.latest_release.version !== project.current_version
    ? `；最新正式 Release 为 <a href="${project.latest_release.url}">v${project.latest_release.version}</a>`
    : '';
  return `<p class="access project-status"><strong>当前版本 v${htmlEscape(project.current_version)}</strong> · ${htmlEscape(project.current_status)}${releaseTail} · <a href="${sourceUrl}">版本来源 ↗</a></p>`;
}

function updateReadme(showcase) {
  let text = read('README.md');
  for (const project of showcase) {
    const escaped = project.display_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^\\| ${escaped} \\|.*$`, 'm');
    const match = text.match(pattern);
    if (!match) throw new Error(`README row not found: ${project.display_name}`);
    const cells = match[0].split('|');
    if (cells.length < 7) throw new Error(`README row malformed: ${project.display_name}`);
    cells[3] = ` ${markdownStatus(project)} `;
    text = text.replace(pattern, cells.join('|'));
  }
  text = text.replace(/截至 \d{4}-\d{2}-\d{2}，五个源码仓库均为公开：/g, '五个源码仓库均为公开：');
  return writeIfChanged('README.md', text);
}

function updateIndex(showcase) {
  let text = read('index.html');
  for (const project of showcase) {
    const marker = `data-project="${project.repo}"`;
    const markerAt = text.indexOf(marker);
    if (markerAt < 0) throw new Error(`index card not found: ${project.repo}`);
    const start = text.lastIndexOf('<a', markerAt);
    const endAt = text.indexOf('</a>', markerAt);
    if (start < 0 || endAt < 0) throw new Error(`index card bounds not found: ${project.repo}`);
    const end = endAt + 4;
    const card = updateCardVersion(text.slice(start, end), project.current_version, project.repo);
    text = text.slice(0, start) + card + text.slice(end);
  }
  return writeIfChanged('index.html', text);
}

function updateDemos(showcase, configs) {
  let changed = false;
  for (const project of showcase) {
    const config = configs.get(project.repo);
    const path = `demos/${config.demo}`;
    let text = read(path);
    const pattern = /<p\b[^>]*class="access project-status"[^>]*>[\s\S]*?<\/p>/i;
    if (!pattern.test(text)) throw new Error(`${path}: project-status paragraph not found`);
    text = text.replace(pattern, demoStatus(project));
    changed = writeIfChanged(path, text) || changed;
  }
  return changed;
}

const configs = new Map(projects.map((project) => [project.repo, project]));
const output = [];
for (const config of projects) {
  const release = await latestRelease(config.repo);
  let currentVersion = null;
  let currentSource = config.source;
  let currentStatus = null;

  if (config.source === 'release') {
    if (!release) throw new Error(`${config.repo}: expected a formal release but none was found`);
    currentVersion = release.version;
    currentSource = 'release';
    currentStatus = release.status;
  } else if (config.source === 'readme') {
    currentVersion = await currentVersionFromReadme(config.repo);
    if (!currentVersion) throw new Error(`${config.repo}: current version not found in README`);
    currentSource = 'readme';
    currentStatus = config.fixedStatus;
  } else {
    if (release) {
      currentVersion = release.version;
      currentSource = 'release';
      currentStatus = release.status;
    } else {
      currentVersion = await currentVersionFromReadme(config.repo);
      if (!currentVersion) continue;
      currentSource = 'readme';
      currentStatus = '开发中';
    }
  }

  output.push({
    repo: config.repo,
    display_name: config.displayName,
    showcase: config.showcase,
    current_version: currentVersion,
    current_source: currentSource,
    current_status: currentStatus,
    current_source_url: currentSource === 'release' ? release?.url : `https://github.com/${owner}/${config.repo}/blob/main/README.md`,
    latest_release: release,
  });
}

const data = {
  schema_version: 1,
  owner,
  policy: {
    release_first: ['FundVal', 'News', 'ImageLore'],
    readme_current_version: ['Agent', 'fund-compass'],
    private_repositories: 'Not queried from the public portfolio workflow.',
  },
  projects: output,
};

const jsonChanged = writeIfChanged('data/projects.json', `${JSON.stringify(data, null, 2)}\n`);
const showcase = output.filter((project) => project.showcase);
if (showcase.length !== 5) throw new Error(`Expected 5 showcase projects, got ${showcase.length}`);
const readmeChanged = updateReadme(showcase);
const indexChanged = updateIndex(showcase);
const demosChanged = updateDemos(showcase, configs);

console.log(JSON.stringify({
  changed: jsonChanged || readmeChanged || indexChanged || demosChanged,
  projects: output.map(({ repo, current_version, current_status }) => ({ repo, current_version, current_status })),
}, null, 2));
