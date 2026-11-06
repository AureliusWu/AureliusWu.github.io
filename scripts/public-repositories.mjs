const validOwner = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const validRepo = /^[A-Za-z0-9._-]{1,100}$/;

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const isRepoName = name => typeof name === 'string' && validRepo.test(name) && name !== '.' && name !== '..';

function assertOwner(owner) {
  if (typeof owner !== 'string' || !validOwner.test(owner)) throw new Error('Invalid GitHub repository owner');
}

function canonicalNames(names) {
  if (!Array.isArray(names) || !names.every(isRepoName)) throw new Error('Invalid public repository names');
  const byLowercase = new Map();
  for (const name of names) {
    const key = name.toLowerCase();
    const previous = byLowercase.get(key);
    if (!previous || compare(name, previous) < 0) byLowercase.set(key, name);
  }
  return [...byLowercase].sort(([a], [b]) => compare(a, b)).map(([, name]) => name);
}

/** Only public repositories owned by this account; the output carries names, never API metadata. */
export function normalizePublicRepositories(owner, rows) {
  assertOwner(owner);
  if (!Array.isArray(rows)) throw new Error('Public repository listing must be an array');
  const ownerKey = owner.toLowerCase();
  return canonicalNames(rows.filter(row =>
    row?.private === false &&
    (row.visibility === undefined || row.visibility === 'public') &&
    typeof row.owner?.login === 'string' && row.owner.login.toLowerCase() === ownerKey &&
    isRepoName(row.name)).map(row => row.name));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

/** Standalone static directory. Build URLs from verified names rather than using API URLs. */
export function renderRepositoriesPage(owner, repositories) {
  assertOwner(owner);
  const names = canonicalNames(repositories);
  const profile = `https://github.com/${encodeURIComponent(owner)}`;
  const list = names.length
    ? `    <ul class="repositories">\n${names.map(name =>
      `      <li><a href="${escapeHtml(`${profile}/${encodeURIComponent(name)}`)}"><span>${escapeHtml(name)}</span><span aria-hidden="true">↗</span></a></li>`).join('\n')}\n    </ul>`
    : '    <p class="summary">暂无公开仓库。</p>';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#f3f5f8">
  <title>公开仓库 · ${escapeHtml(owner)}</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
  <style>
    :root{color-scheme:light;--page:#f3f5f8;--ink:#17191f;--muted:#566171;--line:#dde2eb;--accent:#4648b7;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
    *{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink)}.page{max-width:68rem;margin:auto;padding:clamp(1rem,4vw,2.5rem)}
    a{color:var(--accent)}a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}nav{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem}nav a{display:inline-flex;align-items:center;min-height:44px;text-decoration:none}nav a:hover{text-decoration:underline}
    h1{margin:1rem 0 .35rem;font-size:clamp(1.85rem,4vw,2.65rem);line-height:1.2}.summary{margin:0 0 1.25rem;color:var(--muted);line-height:1.6}
    .repositories{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));gap:.65rem}.repositories li{min-width:0}.repositories a{min-height:44px;height:100%;padding:.65rem .9rem;display:flex;align-items:center;justify-content:space-between;gap:.65rem;border:1px solid var(--line);border-radius:.6rem;background:white;color:var(--ink);text-decoration:none;font-weight:600;overflow-wrap:anywhere}.repositories a:hover{border-color:var(--accent);color:var(--accent)}.repositories a span:last-child{color:var(--muted);flex:none}
  </style>
</head>
<body>
  <div class="page">
    <nav aria-label="页面导航"><a href="index.html">← 返回首页</a><a href="${escapeHtml(profile)}">GitHub 主页 ↗</a></nav>
    <main>
      <h1>公开仓库</h1>
      <p class="summary">${escapeHtml(owner)} 在 GitHub 上的 ${names.length} 个公开仓库。</p>
${list}
    </main>
  </div>
</body>
</html>
`;
}

function attributes(openingTag) {
  return [...openingTag.slice(2, -1).matchAll(/([^\s=/'"<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
    .map(([, name, doubleQuoted, singleQuoted, bare]) => [name.toLowerCase(), doubleQuoted ?? singleQuoted ?? bare ?? '']);
}

/** Replace only the marked link's label and preserve all other homepage links. */
export function updateRepositoryLink(index, repositories) {
  const names = canonicalNames(repositories);
  const anchors = [...index.matchAll(/(<a\b(?:[^>"']|"[^"]*"|'[^']*')*>)[\s\S]*?(<\/a\s*>)/gi)];
  const markers = anchors.filter(([, open]) => attributes(open).some(([name]) => name === 'data-public-repositories'));
  if (markers.length !== 1) throw new Error(`Expected one data-public-repositories link, found ${markers.length}`);
  const { 0: anchor, 1: open, 2: close, index: offset } = markers[0];
  const attrs = attributes(open);
  const destinations = attrs.filter(([name]) => name === 'href').map(([, value]) => value);
  if (attrs.filter(([name]) => name === 'data-public-repositories').length !== 1 ||
      destinations.length !== 1 || !['repositories.html', './repositories.html'].includes(destinations[0])) {
    throw new Error('data-public-repositories link must uniquely target repositories.html');
  }
  return `${index.slice(0, offset)}${open}公开仓库（${names.length}）${close}${index.slice(offset + anchor.length)}`;
}
