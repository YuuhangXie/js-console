# JavaScript Console - VM 版本部署指南

## 🎉 特性

使用 Node.js 原生 `vm` 模块替代 `isolated-vm`：

✅ **无需编译依赖** - 不需要安装编译工具  
✅ **部署简单** - 只需 Node.js 即可运行  
✅ **依赖更少** - 只需要 express 和 cors  
✅ **启动更快** - 无需加载 native 模块  

⚠️ **注意：** vm 模块安全性较低，适合个人使用或内部工具

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
# 启动前端 + 后端
npm run dev

# 或单独启动 server
npm run server:vm
```

### 3. 访问应用

打开浏览器访问：http://localhost:5173

## 📦 生产部署

### 方式一：直接部署

```bash
# 1. 构建前端
npm run build

# 2. 启动 server（会同时提供前端静态文件）
npm start

# 访问 http://localhost:3000
```

### 方式二：使用 PM2（推荐）

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 构建前端
npm run build

# 3. 启动服务
pm2 start ecosystem.vm.config.cjs

# 4. 查看状态
pm2 status

# 5. 查看日志
pm2 logs js-console-vm

# 6. 重启/停止
pm2 restart js-console-vm
pm2 stop js-console-vm

# 7. 设置开机自启动
pm2 startup
pm2 save
```

### 方式三：Docker 部署

创建 `Dockerfile.vm`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（无需编译工具）
RUN npm install --production

# 复制代码
COPY server ./server
COPY dist ./dist

# 暴露端口
EXPOSE 3000

# 启动
CMD ["npm", "start"]
```

构建和运行：

```bash
# 构建前端
npm run build

# 构建镜像
docker build -f Dockerfile.vm -t js-console-vm .

# 运行容器
docker run -d -p 3000:3000 --name js-console js-console-vm

# 查看日志
docker logs -f js-console
```

## 🛠️ 配置

### 服务器配置

编辑 `server/config.js`：

```javascript
export const config = {
  port: process.env.PORT || 3000,
  
  execution: {
    timeout: 10000,           // 代码执行超时（毫秒）
    maxCodeLength: 50000,     // 最大代码长度
    asyncWaitTime: 15000,     // 异步等待时间
  },
  
  fetch: {
    enabled: true,            // 是否启用 fetch
    timeout: 10000,           // 请求超时
    allowAllDomains: true,    // 允许所有域名
    allowedDomains: ["*"],    // 域名白名单
  },
  
  requestLimit: '1mb',        // 请求体大小限制
};
```

### 环境变量

```bash
# 设置端口
export PORT=8080

# 设置环境
export NODE_ENV=production
```

## 📊 性能对比

| 特性 | isolated-vm 版本 | vm 版本 |
|------|-----------------|---------|
| 安装依赖 | 需要编译工具 | 无需编译 |
| 依赖大小 | ~50MB | ~5MB |
| 启动时间 | ~2秒 | ~0.5秒 |
| 内存占用 | 较高 | 较低 |
| 安全性 | 高 | 中等 |
| 适用场景 | 公开服务 | 内部工具 |

## 🔒 安全性说明

### vm 模块的局限性

Node.js 的 `vm` 模块**不是**完整的沙箱：

⚠️ 可能的安全风险：
- 可以访问某些内部对象
- 可能绕过某些限制
- 不适合执行完全不受信任的代码

✅ 适用场景：
- 个人学习和开发
- 内部团队工具
- 受信任的代码执行环境
- Demo 和演示项目

🔐 如需高安全性：
- 使用 `isolated-vm`（需要编译）
- 使用 Docker 容器隔离
- 添加额外的安全层

## 📁 项目结构

```
console/
├── server/
│   ├── index.js           # 原版（使用 isolated-vm）
│   ├── index-vm.js        # VM 版本（使用原生 vm）
│   └── config.js          # 配置文件
├── src/                   # 前端代码
├── dist/                  # 前端构建产物
├── ecosystem.config.cjs   # PM2 配置（isolated-vm）
├── ecosystem.vm.config.cjs # PM2 配置（vm）
└── package.json
```

## 🎯 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/execute` | POST | 执行 JavaScript 代码 |
| `/api/examples` | GET | 获取示例代码 |
| `/api/health` | GET | 健康检查 |

### 执行代码示例

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(\"Hello World\")"}'
```

响应：

```json
{
  "success": true,
  "result": "undefined",
  "logs": [
    {
      "type": "log",
      "content": "Hello World",
      "timestamp": 1234567890
    }
  ],
  "errors": []
}
```

## 🔧 故障排除

### 1. 端口已被占用

```bash
# 查看占用端口的进程
lsof -i :3000

# 或更换端口
PORT=8080 npm start
```

### 2. 前端无法连接后端

检查 CORS 配置，确保允许前端域名：

```javascript
// server/index-vm.js
app.use(cors());  // 允许所有域名
```

### 3. Fetch 请求失败

检查配置：

```javascript
// server/config.js
fetch: {
  enabled: true,           // 确保启用
  allowAllDomains: true,   // 允许所有域名
}
```

## 📝 开发提示

### 添加新的全局对象

编辑 `server/index-vm.js`：

```javascript
const sandbox = {
  // 添加更多全局对象
  Buffer: Buffer,
  URL: URL,
  // ... 其他
};
```

### 自定义 console 方法

```javascript
console: {
  // 添加自定义方法
  debug: (...args) => {
    logs.push({
      type: 'debug',
      content: args.map(arg => formatValue(arg)).join(' '),
      timestamp: Date.now()
    });
  }
}
```

## 🚀 升级到 isolated-vm

如果需要更高的安全性，可以切换回 isolated-vm 版本：

```bash
# 1. 安装编译工具（Linux）
sudo yum groupinstall -y "Development Tools"
sudo yum install -y python3

# 2. 安装 isolated-vm
npm install isolated-vm@4.3.6

# 3. 使用原版 server
npm run server  # 使用 server/index.js
```

## 📚 相关资源

- [Node.js vm 文档](https://nodejs.org/api/vm.html)
- [Express 文档](https://expressjs.com/)
- [PM2 文档](https://pm2.keymetrics.io/)

## ✅ 检查清单

部署前检查：

- [ ] 已安装 Node.js >= 16.0.0
- [ ] 已运行 `npm install`
- [ ] 已构建前端 `npm run build`
- [ ] 已测试 API 端点
- [ ] 已配置环境变量
- [ ] 已设置 PM2（生产环境）
- [ ] 已配置防火墙开放端口

## 🎊 完成！

现在您有一个完全不依赖 native 模块的 JavaScript 控制台了！

**启动命令：**
```bash
npm run dev     # 开发模式
npm start       # 生产模式
```

访问：http://localhost:3000

---

**提示：** 这个版本适合个人使用、学习和内部工具。如果要部署公开服务，建议使用 isolated-vm 版本或添加更多安全措施。

