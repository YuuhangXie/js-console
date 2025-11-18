#!/bin/bash

# 完整项目安装脚本（在安装依赖环境后运行）

set -e

PROJECT_DIR="/usr/share/nginx/console"

echo "==================================="
echo "安装项目依赖"
echo "==================================="
echo ""

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR"
    echo "请先上传项目文件"
    exit 1
fi

cd "$PROJECT_DIR"
echo "✓ 项目目录: $(pwd)"
echo ""

# 1. 清理旧依赖
echo "🧹 1. 清理旧依赖..."
rm -rf node_modules package-lock.json
echo "✓ 清理完成"
echo ""

# 2. 清理 npm 缓存
echo "🗑️  2. 清理 npm 缓存..."
npm cache clean --force
echo "✓ 缓存清理完成"
echo ""

# 3. 设置环境变量（帮助 node-gyp）
echo "⚙️  3. 设置编译环境..."
export PYTHON=$(which python3)
export MAKEFLAGS="-j$(nproc)"
echo "✓ 环境变量已设置"
echo ""

# 4. 尝试安装依赖
echo "📦 4. 安装项目依赖..."
echo "   这可能需要 5-10 分钟，请耐心等待..."
echo ""

# 详细输出安装过程
npm install --verbose 2>&1 | tee install.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✅ 依赖安装成功！"
    echo ""
else
    echo ""
    echo "❌ 安装失败"
    echo ""
    echo "查看详细日志: cat install.log"
    echo ""
    
    # 检查是否是 isolated-vm 的问题
    if grep -q "isolated-vm" install.log; then
        echo "💡 检测到 isolated-vm 安装失败"
        echo ""
        echo "解决方案："
        echo "1. 尝试降级版本:"
        echo "   npm install isolated-vm@4.3.6 --build-from-source"
        echo ""
        echo "2. 或者使用 Docker 部署（推荐）:"
        echo "   sudo ./docker-deploy.sh"
        echo ""
    fi
    
    exit 1
fi

# 5. 验证 isolated-vm
echo "🔍 5. 验证 isolated-vm..."
if npm list isolated-vm &> /dev/null; then
    IVM_VERSION=$(npm list isolated-vm --depth=0 | grep isolated-vm | awk '{print $2}')
    echo "✓ isolated-vm 安装成功: $IVM_VERSION"
    
    # 测试加载
    node -e "const ivm = require('isolated-vm'); console.log('✓ isolated-vm 可以正常加载');" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ isolated-vm 运行正常"
    else
        echo "⚠️  isolated-vm 无法加载，可能需要重新编译"
        echo "尝试: npm rebuild isolated-vm"
    fi
else
    echo "⚠️  isolated-vm 未安装或安装不完整"
fi
echo ""

# 6. 构建前端
echo "🔨 6. 构建前端..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ 前端构建成功"
    echo "✓ dist 目录已生成"
else
    echo "❌ 前端构建失败"
    exit 1
fi
echo ""

# 7. 安装 PM2
echo "📦 7. 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✓ PM2 安装成功"
else
    echo "✓ PM2 已安装"
fi
echo ""

# 8. 启动应用
echo "🚀 8. 启动应用..."

# 停止旧进程
pm2 stop js-console 2>/dev/null || true
pm2 delete js-console 2>/dev/null || true

# 启动新进程
pm2 start ecosystem.config.cjs

if [ $? -eq 0 ]; then
    echo "✓ 应用启动成功"
else
    echo "❌ 应用启动失败"
    exit 1
fi
echo ""

# 9. 设置开机自启动
echo "⚙️  9. 设置开机自启动..."
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
pm2 save
echo "✓ 开机自启动已配置"
echo ""

# 10. 配置防火墙
echo "🔥 10. 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo "✓ 防火墙配置完成"
else
    echo "⚠️  未检测到 firewalld，请手动配置防火墙"
fi
echo ""

# 显示状态
echo "✅ 安装完成！"
echo ""
echo "📍 访问地址:"
echo "   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "📋 常用命令:"
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs js-console"
echo "   重启应用: pm2 restart js-console"
echo "   停止应用: pm2 stop js-console"
echo ""

# 显示当前状态
pm2 status

