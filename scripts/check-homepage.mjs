import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const html = read('index.html');
const version = read('VERSION').trim();
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function attributes(source) {
  const result = Object.create(null);
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

function textContent(source) {
  return source.replace(/<[^>]*>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,
    (entity) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' })[entity]
  ).replace(/\s+/g, ' ').trim();
}

function tags(name) {
  return [...html.matchAll(new RegExp(`<(?:${name})\\b([^>]*)>`, 'gi'))]
    .map((match) => attributes(match[1]));
}

function checkLocalAsset(reference, label) {
  if (!reference) {
    check(false, `${label} 资源路径不得为空。`);
    return;
  }
  if (reference.startsWith('data:')) return;
  if (reference.startsWith('#')) {
    check(reference.length > 1 && tags('[a-z][a-z\\d:-]*').some((tag) => tag.id === reference.slice(1)),
      `${label} 的内联资源目标不存在：${reference}`);
    return;
  }
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) {
    check(false, `${label} 必须使用可核对的本地资源或内联预览：${reference}`);
    return;
  }
  let localPath;
  try {
    localPath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  } catch {
    check(false, `${label} 路径无法解码：${reference}`);
    return;
  }
  const absolutePath = resolve(root, localPath.replace(/^\/+/, ''));
  const relativePath = relative(root, absolutePath);
  const insideRoot = !relativePath.startsWith('..') && !isAbsolute(relativePath);
  check(insideRoot && existsSync(absolutePath) && statSync(absolutePath).isFile(),
    `${label} 资源不存在或超出仓库：${reference}`);
}

check(/^\d+\.\d+\.\d+$/.test(version), 'VERSION 必须为完整语义化版本号。');
const metadata = tags('meta').filter((tag) => tag.name === 'application-version');
check(metadata.length === 1 && metadata[0].content === version,
  'application-version 元数据必须唯一且与 VERSION 一致。');
const visibleVersions = [...html.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span\s*>/gi)]
  .filter((match) => attributes(match[1]).id === 'site-version');
check(visibleVersions.length === 1 && textContent(visibleVersions[0][2]) === `v${version}`,
  '可见 span#site-version 必须唯一且为 v + VERSION。');
if (visibleVersions.length === 1) {
  const attrs = attributes(visibleVersions[0][1]);
  check(!('hidden' in attrs) && attrs['aria-hidden'] !== 'true', '页面版本标识不得隐藏。');
}
check(read('README.md').includes(`v${version}`), 'README.md 必须记录当前版本。');
check(read('CHANGELOG.md').includes(`## [${version}] - `), 'CHANGELOG.md 必须记录当前版本与日期。');

const expectedProjects = new Map([
  ['FundVal', { title: '蜉蝣基金', href: 'https://aureliuswu.github.io/FundVal/' }],
  ['fund-compass', { title: '司南基金', href: 'https://aureliuswu.github.io/fund-compass/' }],
  ['News', { title: '全球新闻', href: 'https://aureliuswu.github.io/News/' }],
  ['Agent', { title: '司忆', href: 'https://github.com/AureliusWu/Agent' }],
  ['ImageLore', { title: 'ImageLore', href: 'https://github.com/AureliusWu/ImageLore' }],
]);
const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)]
  .map((match) => ({ attrs: attributes(match[1]), body: match[2] }));
const cards = anchors.filter(({ attrs }) => (attrs.class ?? '').split(/\s+/).includes('project-card'));
check(cards.length === expectedProjects.size, '主页必须恰好包含五张可点击的 project-card。');
const seenProjects = new Set();
for (const { attrs, body } of cards) {
  const project = attrs['data-project'];
  const expected = expectedProjects.get(project);
  check(Boolean(expected), `卡片 data-project 无效：${project ?? '(缺失)'}`);
  check(!seenProjects.has(project), `项目卡片重复：${project}`);
  seenProjects.add(project);
  if (expected) {
    check(attrs.href === expected.href, `${project} 跳转地址必须为 ${expected.href}`);
    const headings = [...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2\s*>/gi)];
    check(headings.length === 1 && textContent(headings[0][1]).includes(expected.title),
      `${project} 必须有一个包含“${expected.title}”的 h2 标题。`);
  }
  check(!/<a\b/i.test(body), `${project} 卡片内不得嵌套链接。`);
  const previews = [...body.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg\s*>/gi)]
    .filter((match) => (attributes(match[1]).class ?? '').split(/\s+/).includes('preview-image'));
  check(previews.length === 1, `${project} 必须有一个内联 SVG preview-image。`);
  if (previews.length === 1) {
    const previewAttrs = attributes(previews[0][1]);
    const title = previews[0][2].match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
    check(previewAttrs.role === 'img' && Boolean(title && textContent(title[1])),
      `${project} SVG 预览必须有 role="img" 和可读 title。`);
    check(previewAttrs['aria-hidden'] !== 'true', `${project} SVG 预览不得对辅助技术隐藏。`);
    check(/<(?:path|rect|circle|ellipse|line|polyline|polygon|text|image|use)\b/i.test(previews[0][2]),
      `${project} SVG 预览必须包含可绘制内容。`);
  }
}
for (const project of expectedProjects.keys()) {
  check(seenProjects.has(project), `缺少项目卡片：${project}`);
}

for (const { attrs } of anchors) {
  const href = (attrs.href ?? '').trim();
  check(Boolean(href) && href !== '#', '链接不得缺少 href、留空或只指向 #。');
  check(!/^(?:javascript|data|vbscript|file):/i.test(href), `链接使用不安全协议：${href}`);
  if (href.startsWith('#') && href.length > 1) {
    check(tags('[a-z][a-z\\d:-]*').some((tag) => tag.id === href.slice(1)), `页内链接目标不存在：${href}`);
  }
  if (attrs.target === '_blank') {
    const rel = new Set((attrs.rel ?? '').toLowerCase().split(/\s+/));
    check(rel.has('noopener') && rel.has('noreferrer'), `新窗口链接必须包含 noopener noreferrer：${href}`);
  }
}

check(tags('script').every((tag) => !('src' in tag)), '不得依赖外部 JavaScript 文件。');
check(tags('link').every((tag) => !(tag.rel ?? '').toLowerCase().split(/\s+/).includes('stylesheet')),
  'CSS 必须内联，不得依赖外部样式文件。');
check(!/@import\s/i.test(html), '不得通过 @import 引入外部 CSS。');
for (const tag of tags('img|image|use|source|video|object|embed')) {
  for (const attr of ['src', 'href', 'xlink:href', 'poster', 'data']) {
    if (attr in tag) checkLocalAsset(tag[attr], `预览 ${attr}`);
  }
  if (tag.srcset) {
    for (const item of tag.srcset.split(',')) checkLocalAsset(item.trim().split(/\s+/)[0], '预览 srcset');
  }
}
for (const match of html.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)) {
  checkLocalAsset((match[1] ?? match[2] ?? match[3]).trim(), 'CSS 图像');
}

if (failures.length) {
  console.error(`主页静态门禁失败（${failures.length}/${checks} 项）：`);
  for (const message of failures) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`主页静态门禁通过：v${version}，5 个项目，${checks} 项检查。`);
}
