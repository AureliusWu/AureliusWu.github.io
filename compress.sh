#!/bin/bash
# 自动压缩文件脚本

echo "开始压缩文件..."

# 压缩 HTML
gzip -9 -c index.html > index.html.gz
echo "✓ index.html 已压缩"

# 压缩 JSON
gzip -9 -c data.json > data.json.gz
echo "✓ data.json 已压缩"

# 显示大小对比
echo ""
echo "=== 文件大小对比 ==="
echo "index.html:   $(du -h index.html | cut -f1) → $(du -h index.html.gz | cut -f1)"
echo "data.json:    $(du -h data.json | cut -f1) → $(du -h data.json.gz | cut -f1)"
echo ""
echo "压缩完成！"