#!/bin/bash

# CentOS 7 安装 isolated-vm 依赖环境脚本

set -e

echo "==================================="
echo "CentOS 7 - isolated-vm 依赖安装"
echo "==================================="
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  建议使用 sudo 运行此脚本"
    echo ""
fi

# 1. 安装编译工具
echo "📦 1. 安装编译工具..."
sudo yum groupinstall -y "Development Tools"
sudo yum install -y gcc gcc-c++ make

echo "✓ 编译工具安装完成"
echo ""

# 2. 安装 Python 3
echo "🐍 2. 检查 Python 3..."
if command -v python3 &> /dev/null; then
    echo "✓ Python 3 已安装: $(python3 --version)"
else
    echo "安装 Python 3..."
    sudo yum install -y python3 python3-devel
    echo "✓ Python 3 安装完成"
fi
echo ""

# 4. 安装其他必需的库
echo "📚 4. 安装其他依赖库..."
sudo yum install -y \
    libstdc++-devel \
    glibc-devel \
    glib2-devel \
    zlib-devel \
    openssl-devel

echo "✓ 依赖库安装完成"
echo ""

# 5. 验证环境
echo "🔍 5. 验证编译环境..."

# 检查 gcc
if command -v gcc &> /dev/null; then
    echo "✓ gcc: $(gcc --version | head -n1)"
else
    echo "❌ gcc 未安装"
fi

# 检查 g++
if command -v g++ &> /dev/null; then
    echo "✓ g++: $(g++ --version | head -n1)"
else
    echo "❌ g++ 未安装"
fi

# 检查 make
if command -v make &> /dev/null; then
    echo "✓ make: $(make --version | head -n1)"
else
    echo "❌ make 未安装"
fi

# 检查 python3
if command -v python3 &> /dev/null; then
    echo "✓ python3: $(python3 --version)"
else
    echo "❌ python3 未安装"
fi

echo ""

# 6. 检查 glibc 版本
echo "🔍 6. 检查 glibc 版本..."
GLIBC_VERSION=$(ldd --version | head -n1 | awk '{print $NF}')
echo "   当前 glibc 版本: $GLIBC_VERSION"

if [ "$GLIBC_VERSION" == "2.17" ]; then
    echo "⚠️  glibc 版本较旧 (2.17)"
    echo "   isolated-vm 最新版可能需要 glibc >= 2.29"
    echo "   建议使用降级版本: isolated-vm@4.3.6"
fi
echo ""

# 7. 配置 npm
echo "⚙️  7. 配置 npm..."

# 如果网络慢，配置淘宝镜像
read -p "是否配置 npm 淘宝镜像？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm config set registry https://registry.npmmirror.com
    echo "✓ 已配置淘宝镜像"
else
    echo "⊘ 跳过镜像配置"
fi
echo ""

echo "✅ 所有依赖安装完成！"
echo ""
echo "📝 下一步："
echo "   cd /usr/share/nginx/console"
echo "   rm -rf node_modules package-lock.json"
echo "   npm install"
echo ""
echo "💡 提示："
echo "   - 如果 isolated-vm 安装失败，已经降级到 v4.3.6"
echo "   - 如果仍然失败，建议使用 Docker 部署"
echo ""

