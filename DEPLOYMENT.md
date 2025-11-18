# 部署到生产服务器指南

## 📋 服务器要求

- **Node.js**: >= 16.0.0（推荐 18.x LTS）
- **内存**: 至少 512MB
- **系统**: Linux / macOS / Windows Server
- **端口**: 需要开放一个端口（默认 3000）

## 🚀 方法一：简单部署（推荐新手）

### 1. 准备服务器

```bash
# SSH 登录到你的服务器
ssh user@your-server-ip

# 安装 Node.js（如果还没有）
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. 上传代码

```bash
# 方法 A: 使用 Git（推荐）
cd /var/www  # 或其他目录
git clone <你的仓库地址>
cd console

# 方法 B: 使用 SCP 上传
# 在本地执行：
scp -r /Users/didi/personal/console user@your-server-ip:/var/www/
```

### 3. 安装依赖

```bash
cd /var/www/console
npm install
```

### 4. 构建前端

```bash
npm run build
```

### 5. 配置服务器

编辑 `server/config.js`：

```javascript
export const config = {
  port: 3000, // 或你想要的端口
  // ... 其他配置
};
```

### 6. 启动应用

```bash
# 测试运行
npm run server

# 如果成功，按 Ctrl+C 停止，然后用下面的方法持久运行
```

## 🔥 方法二：使用 PM2（推荐生产环境）

PM2 是专业的 Node.js 进程管理器，支持自动重启、日志管理等。

### 1. 安装 PM2

```bash
npm install -g pm2
```

### 2. 构建并启动

```bash
# 在项目目录
npm run build
pm2 start ecosystem.config.cjs
```

### 3. PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs js-console

# 重启
pm2 restart js-console

# 停止
pm2 stop js-console

# 开机自启动
pm2 startup
pm2 save
```

### 4. 监控和管理

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show js-console
```

## 🐳 方法三：使用 Docker

### 1. 构建镜像

```bash
# 在项目目录
docker build -t js-console .
```

### 2. 运行容器

```bash
docker run -d \
  --name js-console \
  -p 3000:3000 \
  --restart unless-stopped \
  js-console
```

### 3. Docker 常用命令

```bash
# 查看日志
docker logs js-console

# 停止
docker stop js-console

# 启动
docker start js-console

# 重启
docker restart js-console
```

## 🌐 方法四：Nginx 反向代理

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/js-console`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 前端静态文件
    location / {
        root /var/www/console/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到 Node.js
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/js-console /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📦 方法五：一键部署脚本

项目包含了 `deploy.sh` 脚本，可以简化部署：

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署
./deploy.sh
```

## ⚙️ 生产环境配置

### 1. 环境变量

创建 `.env` 文件（可选）：

```bash
NODE_ENV=production
PORT=3000
```

### 2. 修改 server/config.js

```javascript
export const config = {
  port: process.env.PORT || 3000,
  
  execution: {
    memoryLimit: 128,
    timeout: 10000,
    maxCodeLength: 50000,
    asyncWaitTime: 15000,
  },
  
  fetch: {
    enabled: true,
    timeout: 10000,
    allowedDomains: [
      'api.github.com',
      'jsonplaceholder.typicode.com',
      // 添加你信任的域名
    ],
    allowAllDomains: false, // 生产环境建议 false
  },
};
```

### 3. 安全建议

**重要**：生产环境安全配置

```javascript
// server/config.js
fetch: {
  allowAllDomains: false, // ⚠️ 必须设为 false
  allowedDomains: [
    // 只添加你信任的域名
    'api.github.com',
    'jsonplaceholder.typicode.com',
  ],
}
```

## 🔒 防火墙配置

### Ubuntu/Debian (UFW)

```bash
# 开放端口
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### CentOS/RHEL (firewalld)

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重载配置
sudo firewall-cmd --reload
```

## 📊 监控和日志

### PM2 日志

```bash
# 查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs js-console

# 只看错误日志
pm2 logs js-console --err

# 清空日志
pm2 flush
```

### 系统服务日志

如果使用 systemd：

```bash
# 查看服务状态
sudo systemctl status js-console

# 查看日志
sudo journalctl -u js-console -f
```

## 🔄 更新部署

### 方法 1: Git Pull

```bash
cd /var/www/console
git pull
npm install
npm run build
pm2 restart js-console
```

### 方法 2: 上传新文件

```bash
# 在本地
npm run build

# 上传 dist 目录
scp -r dist user@your-server:/var/www/console/

# 上传 server 目录（如果有更新）
scp -r server user@your-server:/var/www/console/

# 在服务器上重启
pm2 restart js-console
```

## 🆘 故障排除

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 或
netstat -tulpn | grep 3000

# 终止进程
kill -9 <PID>
```

### Node.js 版本问题

```bash
# 检查版本
node -v

# 应该 >= 16.0.0
```

### 权限问题

```bash
# 如果遇到权限错误
sudo chown -R $USER:$USER /var/www/console
```

### 内存不足

```bash
# 查看内存使用
free -h

# 如果内存不足，考虑：
# 1. 减少 config.js 中的 memoryLimit
# 2. 升级服务器配置
# 3. 使用 swap 空间
```

## 📈 性能优化

### 1. 启用 Gzip 压缩（Nginx）

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_min_length 1000;
```

### 2. 缓存静态资源（Nginx）

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. PM2 集群模式

编辑 `ecosystem.config.cjs`：

```javascript
module.exports = {
  apps: [{
    name: 'js-console',
    script: './server/index.js',
    instances: 2,  // 或 'max' 使用所有 CPU 核心
    exec_mode: 'cluster',
  }]
};
```

## 🎯 完整部署流程示例

### 完整的部署命令

```bash
# 1. 连接服务器
ssh user@your-server-ip

# 2. 安装 Node.js 和 PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 3. 克隆代码
cd /var/www
git clone <your-repo-url> console
cd console

# 4. 安装依赖和构建
npm install
npm run build

# 5. 启动应用
pm2 start ecosystem.config.cjs

# 6. 设置开机自启动
pm2 startup
pm2 save

# 7. 配置防火墙
sudo ufw allow 3000/tcp
sudo ufw enable

# 完成！访问 http://your-server-ip:3000
```

## 🌍 域名配置

如果你有域名：

### 1. DNS 设置

在域名提供商添加 A 记录：
```
Type: A
Name: @ 或 console
Value: 你的服务器IP
TTL: 3600
```

### 2. Nginx 配置

```nginx
server {
    listen 80;
    server_name console.yourdomain.com;
    
    location / {
        root /var/www/console/dist;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 启用 HTTPS

```bash
sudo certbot --nginx -d console.yourdomain.com
```

## 📞 获取帮助

如果遇到问题：

1. 查看服务器日志：`pm2 logs`
2. 检查防火墙：`sudo ufw status`
3. 测试端口：`curl localhost:3000/api/health`
4. 查看进程：`pm2 status`

---

**祝部署顺利！** 🎉

如有问题随时问我。

