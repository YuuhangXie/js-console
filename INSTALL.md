# 安装指南

## 📋 前置要求

### 必需
- **Node.js** >= 16.0.0 (推荐 18.x LTS)
- **npm** >= 8.0.0 (随 Node.js 自动安装)

### 可选
- **Docker** (如果使用Docker部署)
- **PM2** (如果使用PM2管理)
- **Python** 和 **C++ 编译工具** (isolated-vm需要)

## 🔍 检查环境

```bash
# 检查 Node.js 版本
node -v
# 应该显示: v16.x.x 或更高

# 检查 npm 版本
npm -v
# 应该显示: 8.x.x 或更高
```

## 📥 安装步骤

### 方法一：标准安装（推荐）

```bash
# 1. 克隆或下载项目
cd /Users/didi/personal/console

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:5173
```

### 方法二：分步安装

```bash
# 1. 安装后端依赖
npm install express cors isolated-vm

# 2. 安装前端依赖
npm install react react-dom @monaco-editor/react

# 3. 安装开发依赖
npm install -D vite @vitejs/plugin-react concurrently

# 4. 启动
npm run dev
```

### 方法三：使用 Docker

```bash
# 1. 构建镜像
docker build -t js-console .

# 2. 运行容器
docker run -p 3000:3000 js-console

# 3. 访问
# http://localhost:3000
```

## ⚠️ 常见问题

### 问题 1: isolated-vm 安装失败

**错误信息**:
```
gyp ERR! stack Error: not found: python
```

**解决方案 (macOS)**:
```bash
# 安装 Xcode Command Line Tools
xcode-select --install
```

**解决方案 (Ubuntu/Debian)**:
```bash
sudo apt-get install python3 build-essential
```

**解决方案 (Windows)**:
```bash
# 以管理员身份运行
npm install --global windows-build-tools
```

### 问题 2: 端口被占用

**错误信息**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**:
```bash
# 查找占用端口的进程 (macOS/Linux)
lsof -ti:3000

# 终止进程
kill -9 <PID>

# 或者修改端口
# 编辑 server/index.js，修改 PORT = 3000 为其他端口
# 编辑 vite.config.js，修改 port: 5173 为其他端口
```

### 问题 3: 模块未找到

**错误信息**:
```
Error: Cannot find module 'xxx'
```

**解决方案**:
```bash
# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 4: Monaco Editor 加载失败

**错误信息**:
```
Failed to load Monaco Editor
```

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 重新安装 Monaco Editor
npm install @monaco-editor/react
```

## ✅ 验证安装

### 1. 检查文件结构

```bash
ls -la
# 应该看到:
# - node_modules/
# - src/
# - server/
# - package.json
# - vite.config.js
```

### 2. 测试后端

```bash
# 启动后端
npm run server

# 在另一个终端测试
curl http://localhost:3000/api/health
# 应该返回: {"status":"ok","timestamp":...}
```

### 3. 测试前端

```bash
# 启动前端
npm run client

# 访问 http://localhost:5173
# 应该看到编辑器界面
```

### 4. 测试代码执行

在编辑器中输入:
```javascript
console.log("Hello World!");
```

点击运行，应该在右侧看到输出。

## 🔧 开发工具配置

### VS Code 推荐扩展

项目已包含 `.vscode/extensions.json`，打开项目时会提示安装：

- ESLint
- Prettier
- Tailwind CSS (可选)

### 启用 ESM 支持

`package.json` 中已包含:
```json
{
  "type": "module"
}
```

这允许使用 `import/export` 语法。

## 📝 环境变量（可选）

创建 `.env` 文件:

```bash
# 后端端口
PORT=3000

# Node 环境
NODE_ENV=development

# 代码执行限制
MAX_CODE_LENGTH=50000
EXECUTION_TIMEOUT=5000
MEMORY_LIMIT=128
```

## 🚀 生产环境安装

```bash
# 1. 安装生产依赖
npm ci --only=production

# 2. 构建前端
npm run build

# 3. 使用 PM2 启动
npm install -g pm2
pm2 start ecosystem.config.cjs

# 4. 查看状态
pm2 status

# 5. 查看日志
pm2 logs js-console
```

## 🐳 Docker 详细配置

### 使用 Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  js-console:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

启动:
```bash
docker-compose up -d
```

## 🎓 下一步

安装完成后：

1. 阅读 [QUICKSTART.md](./QUICKSTART.md) 快速上手
2. 查看 [README.md](./README.md) 了解完整功能
3. 查看 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 了解架构

## 💬 获取帮助

遇到问题？

1. 查看本文档的常见问题部分
2. 查看 [GitHub Issues](如果有仓库地址)
3. 检查 Node.js 和 npm 版本是否符合要求

---

祝安装顺利！🎉

