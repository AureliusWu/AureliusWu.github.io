/* Aurelius 网站导航 - 主逻辑模块（已集成搜索增强） */

// ============ 全局变量 ============
let siteGroups = [];
let advancedSearch = null;
let searchHistoryTimer = null;
const SEARCH_HISTORY_DELAY = 600;


/**
 * 高级搜索工具
 * 支持以下语法：
 * - 默认单词匹配：`google`
 * - AND 逻辑：`book AND pdf` 或 `book pdf`
 * - OR 逻辑：`book OR movie`
 * - NOT 排除：`anime NOT bt` 或 `anime -bt`
 */
class AdvancedSearch {
  constructor(storageKey = 'aureliusSearchHistory') {
    this.storageKey = storageKey;
    this.maxHistoryItems = 20;
  }

  parseQuery(query) {
    const normalized = (query || '').toLowerCase().trim().replace(/\s+/g, ' ');

    if (!normalized) {
      return { type: 'empty', include: [], exclude: [], operator: 'and' };
    }

    const tokens = normalized.match(/"[^"]+"|\S+/g) || [];
    const include = [];
    const exclude = [];
    let operator = 'and';
    let excludeNext = false;

    tokens.forEach(rawToken => {
      const upperToken = rawToken.toUpperCase();

      if (upperToken === 'OR' || rawToken === '|') {
        operator = 'or';
        return;
      }

      if (upperToken === 'AND' || rawToken === '+') {
        operator = 'and';
        return;
      }

      if (upperToken === 'NOT') {
        excludeNext = true;
        return;
      }

      let token = rawToken.replace(/^"|"$/g, '');
      if (!token) return;

      if (token.startsWith('-')) {
        token = token.slice(1);
        if (token) exclude.push(token);
        return;
      }

      if (excludeNext) {
        exclude.push(token);
        excludeNext = false;
        return;
      }

      include.push(token);
    });

    const hasExclude = exclude.length > 0;
    let type = 'single';

    if (operator === 'or') {
      type = 'or';
    } else if (hasExclude) {
      type = 'not';
    } else if (include.length > 1) {
      type = 'and';
    }

    return { type, include, exclude, operator };
  }

  matches(text, parsedQuery) {
    const haystack = (text || '').toLowerCase();
    const query = parsedQuery || this.parseQuery('');

    if (query.type === 'empty') return true;

    const includesMatch = query.include.length === 0
      ? true
      : query.operator === 'or'
        ? query.include.some(term => haystack.includes(term))
        : query.include.every(term => haystack.includes(term));

    const excludesMatch = query.exclude.every(term => !haystack.includes(term));

    return includesMatch && excludesMatch;
  }

  addToHistory(query) {
    const normalized = (query || '').trim();
    if (!normalized) return;

    try {
      const currentHistory = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const nextHistory = [
        normalized,
        ...currentHistory.filter(item => item !== normalized)
      ].slice(0, this.maxHistoryItems);

      localStorage.setItem(this.storageKey, JSON.stringify(nextHistory));
    } catch (error) {
      console.warn('无法保存搜索历史:', error);
    }
  }
}

// ============ DOM 元素缓存 ============
const elements = {
  document: document,
  searchInput: document.getElementById('search'),
  content: document.getElementById('content'),
  updateTime: document.getElementById('update-time'),
  searchResultsCount: document.getElementById('search-results-count'),
  expandAllBtn: document.querySelector('.btn-expand-all'),
  collapseAllBtn: document.querySelector('.btn-collapse-all'),
  darkModeToggle: document.querySelector('.btn-dark-mode')
};

// ============ 工具函数 ============

/**
 * 创建链接元素
 */
function createLink(link) {
  const container = elements.document.createElement('div');
  container.className = 'link-container';

  const a = elements.document.createElement('a');
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = link.title;
  a.dataset.title = link.title.toLowerCase();
  a.dataset.url = link.url.toLowerCase();
  a.dataset.tags = (link.tags || '').toLowerCase();
  a.dataset.search = [link.title, link.url, link.tags || ''].join(' ').toLowerCase();
  
  if (link.tags && link.tags.trim()) {
    a.title = link.tags;
  }

  const btnCopy = elements.document.createElement('button');
  btnCopy.className = 'btn-copy';
  btnCopy.textContent = '复制';
  btnCopy.setAttribute('aria-label', `复制 ${link.title} 的链接`);
  btnCopy.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(link.url, btnCopy);
  });

  container.appendChild(a);
  container.appendChild(btnCopy);
  return container;
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(text, button) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.textContent;
      button.textContent = '已复制!';
      button.disabled = true;
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      fallbackCopyToClipboard(text, button);
    });
  } else {
    fallbackCopyToClipboard(text, button);
  }
}

/**
 * 备用复制方法
 */
function fallbackCopyToClipboard(text, button) {
  const textarea = elements.document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  elements.document.body.appendChild(textarea);
  textarea.select();
  
  try {
    elements.document.execCommand('copy');
    button.textContent = '已复制!';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = '复制';
      button.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('备用复制失败:', err);
    alert('复制失败，请手动复制');
  }
  
  elements.document.body.removeChild(textarea);
}

/**
 * 渲染网站分类和链接
 */
function render() {
  elements.content.innerHTML = '';
  
  siteGroups.forEach(group => {
    const details = elements.document.createElement('details');
    details.setAttribute('data-category', group.category.toLowerCase());
    
    const summary = elements.document.createElement('summary');
    summary.setAttribute('aria-expanded', 'false');
    
    const titleSpan = elements.document.createElement('span');
    titleSpan.textContent = group.category;
    
    const countSpan = elements.document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = `(${group.links.length})`;
    
    summary.appendChild(titleSpan);
    summary.appendChild(countSpan);
    
    details.appendChild(summary);
    details.addEventListener('toggle', function() {
      summary.setAttribute('aria-expanded', this.open);
    });
    
    group.links.forEach(link => {
      details.appendChild(createLink(link));
    });
    
    elements.content.appendChild(details);
  });
  
  updateSearchResultsCount();
}

/**
 * 数据验证
 */
function validateSiteGroups(data) {
  if (!Array.isArray(data)) return null;

  const cleaned = data
    .filter(group => group && typeof group === 'object')
    .map(group => {
      const category = typeof group.category === 'string' ? group.category.trim() : '';
      const links = Array.isArray(group.links) ? group.links : [];

      const cleanedLinks = links
        .filter(link => link && typeof link === 'object')
        .map(link => ({
          title: typeof link.title === 'string' ? link.title.trim() : '',
          url: typeof link.url === 'string' ? link.url.trim() : '',
          tags: typeof link.tags === 'string' ? link.tags.trim() : ''
        }))
        .filter(link => link.title && link.url);

      return { category, links: cleanedLinks };
    })
    .filter(group => group.category && group.links.length);

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * 搜索和过滤（支持高级搜索）
 */
function filter() {
  const query = elements.searchInput.value.toLowerCase().trim();
  const details = elements.content.querySelectorAll('details');

  // 解析查询
  const parsed = advancedSearch.parseQuery(query);

  details.forEach(section => {
    let sectionHasResults = false;
    const links = section.querySelectorAll('.link-container');

    links.forEach(linkContainer => {
      const link = linkContainer.querySelector('a');
      
      // 检查匹配：把标题、URL、标签和分类合并，支持跨字段 AND/OR/NOT 查询
      const searchableText = `${link.dataset.search} ${section.dataset.category}`;
      const match = advancedSearch.matches(searchableText, parsed);

      linkContainer.classList.toggle('hidden', !match);

      if (match) {
        sectionHasResults = true;
      }
    });

    section.classList.toggle('hidden', !sectionHasResults);
  });

  updateSearchResultsCount();
}


/**
 * 延迟保存搜索历史，避免把每个输入中间态都写入 localStorage
 */
function scheduleSearchHistorySave() {
  const query = elements.searchInput.value.trim();
  window.clearTimeout(searchHistoryTimer);

  if (!query || query.length < 2) {
    return;
  }

  searchHistoryTimer = window.setTimeout(() => {
    advancedSearch.addToHistory(query);
  }, SEARCH_HISTORY_DELAY);
}

/**
 * 立即保存搜索历史，通常用于 Enter 提交搜索时
 */
function saveCurrentSearchToHistory() {
  const query = elements.searchInput.value.trim();
  window.clearTimeout(searchHistoryTimer);

  if (query) {
    advancedSearch.addToHistory(query);
  }
}

/**
 * 更新搜索结果计数
 */
function updateSearchResultsCount() {
  const query = elements.searchInput.value.toLowerCase().trim();
  
  if (!query) {
    if (elements.searchResultsCount) {
      elements.searchResultsCount.classList.add('hidden');
    }
    return;
  }

  const totalLinks = elements.content.querySelectorAll('.link-container:not(.hidden)').length;
  const totalCategories = elements.content.querySelectorAll('details:not(.hidden)').length;

  if (elements.searchResultsCount) {
    let resultText = '';
    
    if (totalLinks === 0) {
      resultText = '未找到匹配结果';
    } else {
      resultText = `找到 ${totalLinks} 个链接，涉及 ${totalCategories} 个分类`;
    }

    // 显示搜索查询类型
    const parsed = advancedSearch.parseQuery(query);
    if (parsed.type !== 'single' && parsed.type !== 'empty') {
      resultText += ` (${parsed.type} 逻辑)`;
    }

    elements.searchResultsCount.textContent = resultText;
    elements.searchResultsCount.classList.remove('hidden');
  }
}

/**
 * 全部展开
 */
function expandAll() {
  elements.content.querySelectorAll('details').forEach(detail => {
    detail.open = true;
  });
}

/**
 * 全部收起
 */
function collapseAll() {
  elements.content.querySelectorAll('details').forEach(detail => {
    detail.open = false;
  });
}

/**
 * 切换深色模式
 */
function toggleDarkMode() {
  const isDarkMode = elements.document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  
  if (elements.darkModeToggle) {
    elements.darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    elements.darkModeToggle.setAttribute('aria-label', isDarkMode ? '切换到浅色模式' : '切换到深色模式');
  }
}

/**
 * 初始化深色模式
 */
function initDarkMode() {
  const savedDarkMode = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDarkMode = savedDarkMode === null
    ? prefersDark
    : savedDarkMode === 'true';

  elements.document.body.classList.toggle('dark-mode', shouldUseDarkMode);

  if (elements.darkModeToggle) {
    elements.darkModeToggle.textContent = shouldUseDarkMode ? '☀️' : '🌙';
    elements.darkModeToggle.setAttribute('aria-label', shouldUseDarkMode ? '切换到浅色模式' : '切换到深色模式');
  }
}

/**
 * 获取最后更新时间
 */
function updateTime() {
  const lastModified = new Date(elements.document.lastModified);

  if (Number.isNaN(lastModified.getTime())) {
    elements.updateTime.textContent = '本页面最后更新时间：暂不可用';
    return;
  }

  const formattedDate = lastModified.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  elements.updateTime.textContent = `本页面最后更新时间：${formattedDate}`;
}

/**
 * 显示数据加载失败提示
 */
function renderLoadError() {
  elements.content.innerHTML = '';

  const message = elements.document.createElement('section');
  message.className = 'error-message';
  message.setAttribute('role', 'alert');

  const title = elements.document.createElement('h2');
  title.textContent = '数据加载失败';

  const description = elements.document.createElement('p');
  description.textContent = '无法加载 data.json。请刷新页面，或确认通过本地 HTTP 服务访问本站。';

  message.appendChild(title);
  message.appendChild(description);
  elements.content.appendChild(message);
}

/**
 * 初始化应用
 */
async function init() {
  // 初始化高级搜索
  advancedSearch = new AdvancedSearch();

  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`data.json HTTP ${res.status}`);
    const loaded = validateSiteGroups(await res.json());
    siteGroups = loaded || [];
  } catch (e) {
    console.error('无法加载 data.json:', e);
    siteGroups = [];
  }

  if (siteGroups.length) {
    render();
  } else {
    renderLoadError();
  }
  initDarkMode();
  updateTime();

  // 事件监听
  elements.searchInput.addEventListener('input', () => {
    filter();
    scheduleSearchHistorySave();
  });
  elements.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveCurrentSearchToHistory();
    }

    if (e.key === 'Escape') {
      elements.searchInput.value = '';
      filter();
    }
  });

  if (elements.expandAllBtn) {
    elements.expandAllBtn.addEventListener('click', expandAll);
  }

  if (elements.collapseAllBtn) {
    elements.collapseAllBtn.addEventListener('click', collapseAll);
  }

  if (elements.darkModeToggle) {
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    elements.searchInput.focus();
  }
}

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', init);
