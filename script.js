/* Aurelius 网站导航 - 主逻辑模块（已集成搜索增强） */

// ============ 全局变量 ============
let siteGroups = [];
let cacheExpireTime = 0;
let advancedSearch = null;
const CACHE_DURATION = 3600000; // 1小时缓存
const API_URL = 'https://api.github.com/repos/AureliusWu/AureliusWu.github.io/commits?per_page=1';

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
    summary.setAttribute('role', 'button');
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
  let totalResults = 0;

  // 添加到搜索历史
  if (query) {
    advancedSearch.addToHistory(query);
  }

  // 解析查询
  const parsed = advancedSearch.parseQuery(query);

  details.forEach(section => {
    let sectionHasResults = false;
    const links = section.querySelectorAll('.link-container');

    links.forEach(linkContainer => {
      const link = linkContainer.querySelector('a');
      
      // 检查匹配
      const titleMatch = advancedSearch.matches(link.dataset.title, parsed);
      const urlMatch = advancedSearch.matches(link.dataset.url, parsed);
      const tagsMatch = advancedSearch.matches(link.dataset.tags, parsed);
      const categoryMatch = advancedSearch.matches(section.dataset.category, parsed);
      
      const match = titleMatch || urlMatch || tagsMatch || categoryMatch;
      
      linkContainer.classList.toggle('hidden', !match);
      
      if (match) {
        sectionHasResults = true;
        totalResults++;
      }
    });

    section.classList.toggle('hidden', !sectionHasResults);
  });

  updateSearchResultsCount();
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
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedDarkMode || prefersDark) {
    elements.document.body.classList.add('dark-mode');
    if (elements.darkModeToggle) {
      elements.darkModeToggle.textContent = '☀️';
      elements.darkModeToggle.setAttribute('aria-label', '切换到浅色模式');
    }
  }
}

/**
 * 获取最后更新时间（带缓存）
 */
function updateTime() {
  const now = Date.now();
  
  if (now < cacheExpireTime) {
    const cached = localStorage.getItem('lastUpdateTime');
    if (cached) {
      elements.updateTime.textContent = `本页面最后更新时间：${cached}`;
      return;
    }
  }

  fetch(API_URL, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data || data.length === 0) throw new Error('No commits found');
      
      const lastCommitDate = new Date(data[0].commit.author.date);
      const formattedDate = lastCommitDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      elements.updateTime.textContent = `本页面最后更新时间：${formattedDate}`;
      localStorage.setItem('lastUpdateTime', formattedDate);
      cacheExpireTime = now + CACHE_DURATION;
      localStorage.setItem('lastUpdateTimeExpire', cacheExpireTime.toString());
    })
    .catch(error => {
      console.error('获取更新时间失败:', error);
      elements.updateTime.textContent = '本页面最后更新时间：获取失败';
    });
}

/**
 * 初始化应用
 */
async function init() {
  // 初始化高级搜索
  advancedSearch = new window.AdvancedSearch();

  try {
    const res = await fetch('data.json');
    const loaded = validateSiteGroups(await res.json());
    siteGroups = loaded || [];
  } catch (e) {
    console.error('无法加载 data.json:', e);
    siteGroups = [];
  }

  // 恢复缓存过期时间
  const savedExpireTime = localStorage.getItem('lastUpdateTimeExpire');
  if (savedExpireTime) {
    cacheExpireTime = parseInt(savedExpireTime);
  }

  render();
  initDarkMode();
  updateTime();

  // 事件监听
  elements.searchInput.addEventListener('input', filter);
  elements.searchInput.addEventListener('keydown', (e) => {
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

  elements.searchInput.focus();

  // 每小时更新一次时间显示
  setInterval(updateTime, CACHE_DURATION);
}

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', init);
