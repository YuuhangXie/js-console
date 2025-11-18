#!/bin/bash

# CentOS 7 Docker 部署脚本

echo "=== CentOS 7 Docker 部署 ==="

# 1. 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    sudo yum install -y yum-utils
    sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo yum install -y docker-ce docker-ce-cli containerd.io
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✓ Docker 安装完成"
else
    echo "✓ Docker 已安装"
fi

# 2. 构建镜像
echo ""
echo "构建 Docker 镜像..."
sudo docker build -t js-console .

if [ $? -ne 0 ]; then
    echo "✗ 构建失败"
    exit 1
fi

echo "✓ 镜像构建成功"

# 3. 停止并删除旧容器
echo ""
echo "清理旧容器..."
sudo docker stop js-console 2>/dev/null || true
sudo docker rm js-console 2>/dev/null || true

# 4. 运行新容器
echo ""
echo "启动容器..."
sudo docker run -d \
  --name js-console \
  -p 3000:3000 \
  --restart unless-stopped \
  js-console

if [ $? -ne 0 ]; then
    echo "✗ 启动失败"
    exit 1
fi

# 5. 配置防火墙
echo ""
echo "配置防火墙..."
sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true

# 6. 显示状态
echo ""
echo "✅ 部署完成！"
echo ""
echo "容器状态:"
sudo docker ps | grep js-console

echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "常用命令:"
echo "  查看日志: sudo docker logs js-console"
echo "  重启容器: sudo docker restart js-console"
echo "  停止容器: sudo docker stop js-console"
echo "  查看状态: sudo docker ps"

