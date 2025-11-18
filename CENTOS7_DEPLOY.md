# CentOS 7 部署指南

## 问题说明

CentOS 7.6 的 glibc 版本是 2.17，而 Node.js 18 需要 glibc 2.28（CentOS 8+ 才有）。

## ✅ 解决方案一：安装 Node.js 16（推荐）

Node.js 16 是最后一个完全支持 CentOS 7 的 LTS 版本，完全满足项目需求。

### 1. 清除之前的安装尝试

```bash
# 移除之前添加的 Node.js 18 源
sudo yum remove -y nodejs
sudo rm -f /etc/yum.repos.d/nodesource*.repo
sudo yum clean all
```

### 2. 安装 Node.js 16

```bash
# 添加 Node.js 16 LTS 源
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -

# 安装 Node.js 16
sudo yum install -y nodejs

# 验证安装
node -v   # 应该显示 v16.x.x
npm -v    # 应该显示 8.x.x
```

### 3. 部署项目

```bash
# 上传项目到服务器
cd /var/www
# 如果使用 Git
git clone <你的仓库地址> console
cd console

# 或者从本地上传（在你的电脑上执行）
scp -r /Users/didi/personal/console user@server-ip:/var/www/

# 安装依赖
cd /var/www/console
npm install

# 构建前端
npm run build

# 安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start ecosystem.config.cjs

# 设置开机自启动
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami))
pm2 save
```

### 4. 配置防火墙

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 或者如果使用 iptables
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo service iptables save
```

### 5. 访问应用

```
http://your-server-ip:3000
```

## ✅ 解决方案二：使用 NVM（更灵活）

NVM 可以让你管理多个 Node.js 版本。

### 1. 安装 NVM

```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 加载 NVM
source ~/.bashrc

# 验证安装
nvm --version
```

### 2. 安装 Node.js 16

```bash
# 安装 Node.js 16
nvm install 16

# 设为默认版本
nvm use 16
nvm alias default 16

# 验证
node -v
```

### 3. 部署项目（同上）

```bash
cd /var/www/console
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

## ✅ 解决方案三：使用 Docker（最干净）

如果服务器支持 Docker，这是最干净的方案。

### 1. 安装 Docker

```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证
sudo docker --version
```

### 2. 构建镜像

```bash
# 上传项目到服务器
cd /var/www/console

# 构建 Docker 镜像
sudo docker build -t js-console .
```

### 3. 运行容器

```bash
# 运行容器
sudo docker run -d \
  --name js-console \
  -p 3000:3000 \
  --restart unless-stopped \
  js-console

# 查看日志
sudo docker logs js-console

# 查看状态
sudo docker ps
```

### 4. Docker 常用命令

```bash
# 停止
sudo docker stop js-console

# 启动
sudo docker start js-console

# 重启
sudo docker restart js-console

# 删除容器
sudo docker rm -f js-console

# 重新构建和运行
sudo docker build -t js-console .
sudo docker run -d --name js-console -p 3000:3000 --restart unless-stopped js-console
```

## 🔧 项目兼容性说明

本项目完全兼容 Node.js 16，所有功能都能正常工作：

- ✅ isolated-vm（安全沙箱）
- ✅ Express（Web 服务器）
- ✅ React + Vite（前端）
- ✅ Fetch API
- ✅ 所有 Console API

## 📝 完整部署脚本（CentOS 7 专用）

创建一个部署脚本 `deploy-centos7.sh`：

```bash
#!/bin/bash

echo "=== CentOS 7 部署脚本 ==="

# 1. 清理旧的 Node.js
echo "1. 清理环境..."
sudo yum remove -y nodejs
sudo rm -f /etc/yum.repos.d/nodesource*.repo
sudo yum clean all

# 2. 安装 Node.js 16
echo "2. 安装 Node.js 16..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 验证
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 3. 安装项目依赖
echo "3. 安装项目依赖..."
npm install

# 4. 构建前端
echo "4. 构建前端..."
npm run build

# 5. 安装 PM2
echo "5. 安装 PM2..."
sudo npm install -g pm2

# 6. 停止旧的进程（如果存在）
pm2 stop js-console 2>/dev/null || true
pm2 delete js-console 2>/dev/null || true

# 7. 启动应用
echo "6. 启动应用..."
pm2 start ecosystem.config.cjs

# 8. 设置开机自启动
echo "7. 设置开机自启动..."
pm2 startup systemd
pm2 save

# 9. 配置防火墙
echo "8. 配置防火墙..."
sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
sudo firewall-cmd --reload 2>/dev/null || true

echo ""
echo "✅ 部署完成！"
echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "常用命令："
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs js-console"
echo "  重启应用: pm2 restart js-console"
```

使用脚本：

```bash
# 给脚本执行权限
chmod +x deploy-centos7.sh

# 运行脚本
./deploy-centos7.sh
```

## 🔒 安全配置

### 1. SELinux 配置（如果启用）

```bash
# 检查 SELinux 状态
getenforce

# 如果是 Enforcing，需要配置规则
sudo semanage port -a -t http_port_t -p tcp 3000
```

### 2. 防火墙配置

```bash
# FirewallD（CentOS 7 默认）
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 查看规则
sudo firewall-cmd --list-all
```

### 3. 生产环境安全设置

编辑 `server/config.js`：

```javascript
export const config = {
  port: 3000,
  
  fetch: {
    allowAllDomains: false,  // ⚠️ 生产环境必须 false
    allowedDomains: [
      'api.github.com',
      'jsonplaceholder.typicode.com',
    ],
  },
};
```

## 🆘 常见问题

### 问题 1: npm install 失败

```bash
# 清理 npm 缓存
npm cache clean --force

# 使用淘宝镜像（如果网络慢）
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### 问题 2: 端口被占用

```bash
# 查找占用端口的进程
sudo netstat -tulpn | grep 3000

# 或
sudo lsof -i :3000

# 终止进程
sudo kill -9 <PID>
```

### 问题 3: PM2 启动失败

```bash
# 查看详细错误
pm2 logs js-console --err

# 删除并重新启动
pm2 delete js-console
pm2 start ecosystem.config.cjs
```

### 问题 4: isolated-vm 安装失败

如果 `isolated-vm` 编译失败：

```bash
# 安装编译工具
sudo yum groupinstall -y "Development Tools"
sudo yum install -y gcc-c++ make python3

# 重新安装
npm rebuild isolated-vm
```

## 📊 性能监控

### 使用 PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show js-console

# 查看资源使用
pm2 list
```

### 系统监控

```bash
# CPU 和内存
top

# 磁盘使用
df -h

# 内存使用
free -h
```

## 🔄 更新部署

```bash
cd /var/www/console

# 拉取最新代码
git pull

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart js-console

# 查看状态
pm2 status
```

## 📞 获取帮助

如果遇到问题：

1. **查看日志**: `pm2 logs js-console`
2. **检查状态**: `pm2 status`
3. **测试端口**: `curl localhost:3000/api/health`
4. **查看防火墙**: `sudo firewall-cmd --list-all`
5. **检查 SELinux**: `sudo ausearch -m avc -ts recent`

---

**推荐方案**: 使用 **Node.js 16 + PM2**，这是最稳定可靠的方案！

祝部署顺利！🚀

