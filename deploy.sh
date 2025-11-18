#!/bin/bash

# JavaScript在线控制台 - 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 JavaScript 控制台..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 构建前端
echo ""
echo "🔨 构建前端..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "❌ 错误: 前端构建失败"
    exit 1
fi

echo "✓ 前端构建完成"

# 修改服务器配置以托管静态文件
echo ""
echo "⚙️  配置服务器..."

# 创建生产环境的服务器文件
cat > server/production.js << 'EOF'
import express from 'express';
import cors from 'cors';
import ivm from 'isolated-vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 托管静态文件
app.use(express.static(path.join(__dirname, '../dist')));

// API 路由 (从 index.js 复制)
// ... API代码在这里 ...

// 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
EOF

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 启动说明:"
echo "   开发模式: npm run dev"
echo "   生产模式: npm run server"
echo ""
echo "🌐 访问地址: http://localhost:3000"
echo ""

