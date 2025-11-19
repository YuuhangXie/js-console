# JavaScript Console

一个类似 Chrome 控制台的在线 JavaScript 执行环境，使用 Node.js 原生 `vm` 模块实现。

## ✨ 特性

- ✅ **无需编译依赖** - 使用原生 vm 模块，不需要 GCC/Python
- ✅ **部署简单** - 只需 Node.js 和 npm
- ✅ **完整功能** - 支持 console、fetch、Promise、async/await
- ✅ **现代界面** - 基于 React + Monaco Editor
- ✅ **多种部署** - 支持直接运行、PM2、Docker

## 🚀 快速开始

### 开发模式

```bash
npm install
npm run dev
```

访问：http://localhost:5173

### 生产模式

```bash
npm install
npm run build
npm start
```

访问：http://localhost:3000

### 一键部署

```bash
chmod +x deploy-vm.sh
./deploy-vm.sh
```

## 📋 功能支持

| 功能 | 支持 |
|------|------|
| console.log/error/warn/info | ✅ |
| console.table | ✅ |
| console.time/timeEnd | ✅ |
| Promise/async/await | ✅ |
| Fetch API | ✅ |
| setTimeout/setInterval | ✅ |
| ES6+ 语法 | ✅ |

## 📝 npm 命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 开发模式（前端+后端） |
| `npm run server:vm` | 仅启动后端 |
| `npm run build` | 构建前端 |
| `npm start` | 启动生产服务器 |

## 🐳 Docker 部署

```bash
npm run build
docker build -f Dockerfile.vm -t js-console .
docker run -d -p 3000:3000 --name js-console js-console
```

## 📦 PM2 部署

```bash
npm install -g pm2
npm run build
pm2 start ecosystem.vm.config.cjs
pm2 save
```

## 🔧 配置

编辑 `server/config.js`：

```javascript
export const config = {
  port: 3000,
  execution: {
    timeout: 10000,
    maxCodeLength: 50000,
  },
  fetch: {
    enabled: true,
    timeout: 10000,
    allowAllDomains: true,
  },
};
```

## 🎯 API 端点

- `POST /api/execute` - 执行 JavaScript 代码
- `GET /api/examples` - 获取示例代码
- `GET /api/health` - 健康检查

## ⚠️ 安全提醒

本项目使用 Node.js 原生 `vm` 模块，适合：
- ✅ 个人学习和开发
- ✅ 内部团队工具
- ✅ 受信任的代码执行

**不适合执行不受信任的代码或作为公开服务。**

## 📚 详细文档

更多信息请查看 [部署指南](./VM_DEPLOY.md)

## 📄 许可证

MIT

## 🙏 致谢

- [Express](https://expressjs.com/)
- [React](https://react.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [node-fetch](https://github.com/node-fetch/node-fetch)
