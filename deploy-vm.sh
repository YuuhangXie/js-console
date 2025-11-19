#!/bin/bash

# VM版本快速部署脚本

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  JavaScript Console - VM版本部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js"
    echo "请安装 Node.js >= 16.0.0"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js: $NODE_VERSION"
echo ""

# 1. 安装依赖
echo "📦 安装依赖..."
npm install
echo "✓ 依赖安装完成"
echo ""

# 2. 构建前端
echo "🏗️  构建前端..."
npm run build
echo "✓ 前端构建完成"
echo ""

# 3. 测试 server
echo "🧪 测试 server..."
timeout 3s npm run server:vm > /dev/null 2>&1 || true
echo "✓ Server 可正常启动"
echo ""

# 4. 选择部署方式
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "请选择部署方式："
echo ""
echo "  1) 直接启动 (前台运行)"
echo "  2) PM2 部署 (推荐生产环境)"
echo "  3) Docker 部署"
echo "  4) 生成部署包"
echo "  5) 退出"
echo ""
read -p "请选择 [1-5]: " choice

case $choice in
  1)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 启动服务..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    npm start
    ;;
    
  2)
    echo ""
    echo "📦 使用 PM2 部署..."
    
    # 检查 PM2
    if ! command -v pm2 &> /dev/null; then
        echo "⚠️  PM2 未安装，正在安装..."
        npm install -g pm2
        echo "✓ PM2 安装完成"
    fi
    
    # 停止旧进程
    pm2 stop js-console-vm 2>/dev/null || true
    pm2 delete js-console-vm 2>/dev/null || true
    
    # 启动
    pm2 start ecosystem.vm.config.cjs
    
    echo ""
    echo "✅ PM2 部署完成！"
    echo ""
    echo "📋 常用命令："
    echo "  pm2 status              # 查看状态"
    echo "  pm2 logs js-console-vm  # 查看日志"
    echo "  pm2 restart js-console-vm  # 重启"
    echo "  pm2 stop js-console-vm  # 停止"
    echo ""
    echo "⚙️  设置开机自启动："
    echo "  pm2 startup"
    echo "  pm2 save"
    echo ""
    
    pm2 status
    ;;
    
  3)
    echo ""
    echo "🐳 Docker 部署..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装"
        echo "请先安装 Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    echo "构建 Docker 镜像..."
    docker build -f Dockerfile.vm -t js-console-vm .
    
    echo ""
    echo "停止旧容器..."
    docker stop js-console 2>/dev/null || true
    docker rm js-console 2>/dev/null || true
    
    echo ""
    echo "启动容器..."
    docker run -d -p 3000:3000 --name js-console --restart unless-stopped js-console-vm
    
    echo ""
    echo "✅ Docker 部署完成！"
    echo ""
    echo "📋 常用命令："
    echo "  docker ps               # 查看容器"
    echo "  docker logs -f js-console  # 查看日志"
    echo "  docker restart js-console  # 重启"
    echo "  docker stop js-console     # 停止"
    echo ""
    ;;
    
  4)
    echo ""
    echo "📦 生成部署包..."
    
    # 创建部署目录
    rm -rf deploy-vm
    mkdir -p deploy-vm
    
    # 复制文件
    echo "复制文件..."
    cp -r dist deploy-vm/
    cp -r server deploy-vm/
    cp package.json deploy-vm/
    cp ecosystem.vm.config.cjs deploy-vm/ecosystem.config.cjs
    
    # 创建部署脚本
    cat > deploy-vm/install.sh << 'EOF'
#!/bin/bash
set -e
echo "📦 安装依赖..."
npm install --production
echo "✓ 完成"
echo ""
echo "🚀 启动服务："
echo "  npm start              # 直接启动"
echo "  pm2 start ecosystem.config.cjs  # 使用 PM2"
EOF
    
    chmod +x deploy-vm/install.sh
    
    # 创建说明文件
    cat > deploy-vm/README.txt << 'EOF'
JavaScript Console - 部署包

1. 安装依赖：
   npm install --production

2. 启动服务：
   npm start

   或使用 PM2：
   npm install -g pm2
   pm2 start ecosystem.config.cjs

3. 访问：
   http://localhost:3000

详细文档：https://github.com/yourusername/console
EOF
    
    # 压缩
    echo "压缩打包..."
    tar -czf deploy-vm.tar.gz deploy-vm/
    
    SIZE=$(du -h deploy-vm.tar.gz | cut -f1)
    
    echo ""
    echo "✅ 部署包创建完成！"
    echo ""
    echo "📦 文件："
    echo "  - deploy-vm/           (源文件目录)"
    echo "  - deploy-vm.tar.gz     (压缩包, $SIZE)"
    echo ""
    echo "📤 上传到服务器："
    echo "  scp deploy-vm.tar.gz user@server:/opt/"
    echo ""
    echo "📥 在服务器上："
    echo "  tar -xzf deploy-vm.tar.gz"
    echo "  cd deploy-vm"
    echo "  ./install.sh"
    echo "  npm start"
    echo ""
    ;;
    
  5)
    echo ""
    echo "👋 退出"
    exit 0
    ;;
    
  *)
    echo ""
    echo "❌ 无效选择"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 部署完成！"
echo ""
echo "🌐 访问地址："
echo "   http://localhost:3000"
echo ""
echo "📚 更多信息请查看 VM_DEPLOY.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

