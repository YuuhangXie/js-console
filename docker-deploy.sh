#!/bin/bash

# Docker 快速部署脚本

set -e

echo "🐳 JavaScript 控制台 - Docker 部署"
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    echo ""
    echo "安装 Docker:"
    echo "  sudo yum install -y yum-utils"
    echo "  sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo"
    echo "  sudo yum install -y docker-ce docker-ce-cli containerd.io"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    exit 1
fi

echo "✓ Docker 已安装: $(docker --version)"
echo ""

# 停止并删除旧容器
echo "🧹 清理旧容器..."
docker stop js-console 2>/dev/null || true
docker rm js-console 2>/dev/null || true
echo "✓ 清理完成"
echo ""

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t js-console . || {
    echo ""
    echo "❌ 构建失败！"
    echo ""
    echo "💡 尝试使用多阶段构建:"
    echo "   docker build -f Dockerfile.multistage -t js-console ."
    exit 1
}
echo "✓ 镜像构建成功"
echo ""

# 运行容器
echo "🚀 启动容器..."
docker run -d \
  --name js-console \
  -p 3000:3000 \
  --restart unless-stopped \
  js-console

if [ $? -eq 0 ]; then
    echo "✓ 容器启动成功"
else
    echo "❌ 容器启动失败"
    exit 1
fi
echo ""

# 配置防火墙
echo "🔥 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "✓ 防火墙配置完成"
else
    echo "⚠️  未检测到 firewalld，请手动配置防火墙"
fi
echo ""

# 等待容器启动
echo "⏳ 等待应用启动..."
sleep 3

# 检查容器状态
if docker ps | grep -q js-console; then
    echo "✓ 容器运行中"
    echo ""
    
    # 显示信息
    echo "✅ 部署完成！"
    echo ""
    echo "📍 访问地址:"
    echo "   http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo "📋 常用命令:"
    echo "   查看日志: docker logs js-console"
    echo "   实时日志: docker logs -f js-console"
    echo "   重启:     docker restart js-console"
    echo "   停止:     docker stop js-console"
    echo "   启动:     docker start js-console"
    echo "   状态:     docker ps | grep js-console"
    echo ""
    
    # 显示日志
    echo "📝 最近日志:"
    docker logs --tail 20 js-console
else
    echo "❌ 容器未运行"
    echo ""
    echo "查看错误日志:"
    docker logs js-console
    exit 1
fi

