# AureliusWu.github.io

## 直接用新内容替换原页面（最快）

如果你已经有新的 `index.html` 内容，直接执行：

```bash
cat > index.html <<'HTML'
<!-- 把你的完整新页面内容粘贴到这里 -->
HTML
```

然后提交并推送：

```bash
git add index.html
git commit -m "Replace index.html with new content"
git push
```

> 如果你是用 GitHub Pages（默认分支部署），推送后等几十秒到几分钟，访问站点就是新内容。

## 本地先预览再替换（推荐）

```bash
python3 -m http.server 4173
```

浏览器打开：`http://127.0.0.1:4173/index.html`

确认没问题再执行 `git add/commit/push`。
