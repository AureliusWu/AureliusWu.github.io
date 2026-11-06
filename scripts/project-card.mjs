/** Shared, deterministic portfolio projection. No network or filesystem writes. */
export const owner = 'AureliusWu';
export const configs = [
  { repo: 'FundVal', displayName: '蜉蝣基金 / FundVal', demo: 'fundval.html' },
  { repo: 'fund-compass', displayName: '司南基金 / fund-compass', demo: 'fund-compass.html', readme: true },
  { repo: 'News', displayName: '全球新闻 / News', demo: 'news.html' },
  { repo: 'Agent', displayName: '司忆 / Agent', demo: 'agent.html', readme: true, desktop: true },
  { repo: 'ImageLore', displayName: 'ImageLore', demo: 'imagelore.html', desktop: true },
  { repo: 'Rain', displayName: '雨停之前 / Before the Rain Stops' },
  { repo: 'Healing', displayName: '湿性愈合' },
  { repo: 'NetLove', displayName: '“网”恋 / NetLove' },
  { repo: 'Circuit', displayName: '回路 / Circuit' },
  { repo: 'Remotion', displayName: 'Remotion', readmeFallback: true },
  { repo: 'VN-Engine-v2', displayName: 'VN Engine v2', readmeFallback: true },
  { repo: 'RESET', displayName: '回留 / RESET' },
];

const versionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
export function versionOf(tag) {
  const value = typeof tag === 'string' ? tag.replace(/^v/, '') : '';
  return versionPattern.test(value) ? value : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function releaseUrl(repo, tag) {
  return `https://github.com/${owner}/${repo}/releases/tag/${encodeURIComponent(tag)}`;
}

export function readmeVersion(text, repo, { optional = false } = {}) {
  const declarations = [...text.matchAll(/^当前版本[：:][^\r\n]*/gm)];
  if (optional && declarations.length === 0) return null;
  const match = declarations.length === 1 && declarations[0][0].match(
    /^当前版本[：:][ \t]*(?:`(v?[0-9][0-9A-Za-z.+-]*)`|(v?[0-9][0-9A-Za-z.+-]*)(?=$|[\s，。；（(、·]))([^\r\n]*)$/,
  );
  const version = match ? versionOf(match[1] ?? match[2]) : null;
  if (!version) throw new Error(`${repo}: README must declare one semantic 当前版本`);
  // Candidate status needs an explicit statement about this version. For example,
  // "当前版本：8.0.0。v9 仍是候选开发线" does not describe 8.0.0 as a candidate.
  const description = match[3].replace(/^[。.；;·，,（(\s]+/, '');
  const candidate = /^(?:(?:这是|本版为|状态[：:])\s*(?!不|非|并非|尚非)[^。；;，,\d]{0,48})?(?:开发|补丁|发行|发布)候选(?=$|[。；;，,）)\s])/.test(description);
  return {
    version,
    status: candidate ? '开发候选' : '源码版本',
    url: `https://github.com/${owner}/${repo}/blob/main/README.md`,
  };
}

export function readmeCandidate(text, repo) {
  const declaration = readmeVersion(text, repo, { optional: true });
  return declaration?.status === '开发候选' ? declaration : null;
}

function releaseRecord(raw, repo, prerelease) {
  const version = versionOf(raw?.tag_name);
  if (raw?.draft !== false || raw.prerelease !== prerelease || !version || !Number.isFinite(Date.parse(raw.published_at))) {
    throw new Error(`${repo}: invalid ${prerelease ? 'prerelease' : 'formal release'} metadata`);
  }
  const notes = `${raw.name ?? ''}\n${raw.body ?? ''}`;
  const hasWarnings = /RELEASED[_ -]?WITH[_ -]?WARNINGS|带警告|已知限制|风险接受|本版发布例外/i.test(notes);
  return {
    version,
    tag: raw.tag_name,
    url: releaseUrl(repo, raw.tag_name),
    published_at: raw.published_at,
    status: prerelease ? '预发布' : hasWarnings ? '正式发布（带已知限制）' : '正式发布',
    draft: false,
    prerelease,
  };
}

export function latestFormal(raw, repo) {
  return raw === null ? null : releaseRecord(raw, repo, false);
}

export function latestPrerelease(rows, formal, repo) {
  if (!Array.isArray(rows)) throw new Error(`${repo}: releases response must be an array`);
  const cutoff = formal ? Date.parse(formal.published_at) : -Infinity;
  const eligible = rows.filter(raw =>
    raw?.draft === false && raw.prerelease === true && versionOf(raw.tag_name) &&
    Number.isFinite(Date.parse(raw.published_at)) && Date.parse(raw.published_at) > cutoff);
  eligible.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at) || (b.id ?? 0) - (a.id ?? 0));
  return eligible.length ? releaseRecord(eligible[0], repo, true) : null;
}

export function snapshot(config, development, formal, preview) {
  const current = config.readme ? development ?? formal ?? preview : formal ?? preview ?? development;
  if (!current) {
    if (config.demo) throw new Error(`${config.repo}: no verifiable project version`);
    return null;
  }
  return {
    repo: config.repo,
    display_name: config.displayName,
    showcase: Boolean(config.demo),
    current_version: current.version,
    current_source: current === development ? 'readme' : current === formal ? 'release' : 'prerelease',
    current_status: current.status,
    current_source_url: current.url,
    development,
    latest_release: formal,
    latest_prerelease: preview,
  };
}

function cardStatus(project) {
  const { development, latest_release: formal, latest_prerelease: preview } = project;
  return [
    development && `${development.status === '开发候选' ? '候选' : '源码'} v${development.version}`,
    preview && `预发 v${preview.version}`,
    formal && `正式 v${formal.version}`,
  ].filter(Boolean).join(' · ');
}

function replaceOne(text, regex, replacement, label) {
  const matches = [...text.matchAll(regex)];
  if (matches.length !== 1) throw new Error(`${label}: expected one marker, found ${matches.length}`);
  return text.replace(regex, replacement);
}

export function updateCard(card, project) {
  return replaceOne(card, /(<span\b[^>]*\bclass="type"[^>]*>)[\s\S]*?<\/span>/gi,
    (_full, start) => `${start}${htmlEscape(cardStatus(project))}</span>`, `${project.repo} type span`);
}

function updateIndex(text, project) {
  const repo = escapeRegex(project.repo);
  return replaceOne(text, new RegExp(`<a\\b[^>]*\\bdata-project="${repo}"[^>]*>[\\s\\S]*?<\\/a>`, 'gi'),
    card => updateCard(card, project), `${project.repo} index card`);
}

function versionEntries(project) {
  return [project.development, project.latest_prerelease, project.latest_release].filter(Boolean);
}

function updateReadme(text, project) {
  const label = escapeRegex(project.display_name);
  const pattern = new RegExp(`^\\| ${label} \\|[^|]*\\|([^|]*)\\|`, 'gm');
  const status = versionEntries(project).map(item => `${item.status} \`v${item.version}\``).join('；');
  const value = project.latest_release ? status : `${status}；暂无正式发布`;
  return replaceOne(text, pattern, (prefix, old) => prefix.slice(0, -(old.length + 1)) + ` ${value} |`,
    `${project.repo} README row`);
}

function demoStatus(project) {
  const entries = versionEntries(project).map(item =>
    `<strong>${htmlEscape(item.status)}</strong> <a href="${htmlEscape(item.url)}">v${htmlEscape(item.version)}</a>`);
  if (!project.latest_release) entries.push('暂无正式发布');
  return `<p class="access project-status">${entries.join(' · ')}</p>`;
}

function updateDemo(text, project, config) {
  const updated = replaceOne(text, /<p\b[^>]*class="access project-status"[^>]*>[\s\S]*?<\/p>/gi,
    () => demoStatus(project), `${project.repo} case version paragraph`);
  if (!config.desktop) return updated;
  const href = project.latest_release?.url ?? `https://github.com/${owner}/${project.repo}/releases`;
  const label = project.latest_release ? '查看 Windows 发布 ↗' : '查看发布记录 ↗';
  return replaceOne(updated, /<a\b(?=[^>]*\sdata-release-link(?:\s|=|>))[^>]*>[\s\S]*?<\/a>/gi,
    anchor => replaceOne(anchor.replace(/>[\s\S]*?<\/a>$/i, `>${label}</a>`), /\bhref="[^"]*"/gi,
      () => `href="${htmlEscape(href)}"`, `${project.repo} Windows release href`), `${project.repo} Windows release link`);
}

/** Build every generated surface before the caller is allowed to write any of them. */
export function projectPages(projects, read) {
  const byRepo = new Map(projects.map(project => [project.repo, project]));
  const pages = new Map();
  let index = read('index.html');
  let readme = read('README.md');
  for (const config of configs.filter(item => item.demo)) {
    const project = byRepo.get(config.repo);
    if (!project) throw new Error(`${config.repo}: showcase metadata missing`);
    index = updateIndex(index, project);
    readme = updateReadme(readme, project);
    const path = `demos/${config.demo}`;
    pages.set(path, updateDemo(read(path), project, config));
  }
  return pages.set('index.html', index).set('README.md', readme);
}
