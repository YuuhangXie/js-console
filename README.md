# JavaScript 在线控制台

一个现代化的在线JavaScript执行环境，提供类似Chrome DevTools控制台的体验。

## ✨ 功能特性

- 🎨 **现代化UI设计** - 支持暗色/亮色主题切换，界面美观流畅
- ✨ **Monaco Editor** - 集成VS Code同款编辑器，提供智能代码提示
- 🚀 **实时执行** - 即时执行JavaScript代码并显示结果
- 📝 **完整Console API支持**
  - `console.log()` - 标准日志输出
  - `console.error()` - 错误信息输出
  - `console.warn()` - 警告信息输出
  - `console.info()` - 信息输出
  - `console.table()` - 表格化数据显示
  - `console.time()` / `console.timeEnd()` - 性能计时
- 🌐 **Fetch API支持**
  - 安全的网络请求功能
  - 域名白名单保护
  - 可配置的超时和限制
- 🔒 **安全沙箱** - 使用 isolated-vm 提供安全的代码执行环境
- ⏱️ **超时控制** - 5秒执行超时，防止无限循环
- 💾 **代码保存** - 支持保存和加载代码到浏览器本地存储
- 📚 **示例代码库** - 内置多个学习示例，快速上手
- 📜 **执行历史** - 记录所有执行过的代码
- ⌨️ **快捷键支持** - Cmd/Ctrl + Enter 快速执行代码
- 📱 **响应式设计** - 完美支持桌面和移动设备

## 🛠️ 技术栈

- **前端**: 
  - React 18 - UI框架
  - Vite - 构建工具
  - Monaco Editor - 代码编辑器
  - CSS Variables - 主题系统
  
- **后端**: 
  - Node.js - 运行环境
  - Express - Web框架
  - isolated-vm - 安全沙箱（替代已弃用的vm2）
  
## 📦 安装和运行

### 开发环境

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd console

# 2. 安装依赖
npm install

# 3. 开发模式（同时启动前后端）
npm run dev

# 4. 访问应用
# 前端: http://localhost:5173
# 后端API: http://localhost:3000
```

### 单独启动

```bash
# 只启动前端
npm run client

# 只启动后端
npm run server
```

## 🚀 生产部署

### 方式一：使用构建后的静态文件

```bash
# 1. 构建前端
npm run build

# 2. 将 dist 目录部署到你的静态文件服务器

# 3. 启动后端API服务器
npm run server
```

### 方式二：使用 Express 同时托管

```bash
# 1. 构建前端
npm run build

# 2. 修改 server/index.js，添加静态文件服务
# 在文件中添加：
# app.use(express.static('dist'));

# 3. 启动服务器
NODE_ENV=production node server/index.js
```

### Docker 部署（可选）

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "server/index.js"]
```

构建和运行：

```bash
docker build -t js-console .
docker run -p 3000:3000 js-console
```

## 🔒 安全说明

应用使用 `isolated-vm` 创建严格的沙箱环境，提供以下安全保护：

- ✅ **内存限制** - 每次执行限制128MB内存
- ✅ **时间限制** - 5秒执行超时，防止死循环
- ✅ **隔离环境** - 完全隔离的JavaScript执行环境
- ✅ **无文件系统访问** - 无法访问服务器文件系统
- ✅ **无网络请求** - 阻止任何网络调用
- ✅ **禁用危险API** - setTimeout、setInterval等被禁用
- ✅ **代码长度限制** - 最大50KB代码

**注意**: 尽管提供了多层安全保护，但在生产环境中，建议：
1. 使用 HTTPS
2. 添加用户认证
3. 实施速率限制
4. 监控服务器资源使用
5. 定期更新依赖包

## 📖 API文档

### POST /api/execute

执行JavaScript代码

**请求体**:
```json
{
  "code": "console.log('Hello World');"
}
```

**响应**:
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

### GET /api/examples

获取示例代码列表

### GET /api/health

健康检查

## 🎯 使用示例

### 基础输出
```javascript
console.log("Hello, World!");
const sum = 1 + 2 + 3;
console.log("Sum:", sum);
```

### 数组操作
```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log("Doubled:", doubled);
```

### 对象和表格
```javascript
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 }
];
console.table(users);
```

### 性能测试
```javascript
console.time("Loop");
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}
console.timeEnd("Loop");
```

### Fetch API 请求

```javascript
async function fetchData() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await response.json();
  console.table(data);
}

fetchData();
```

**注意**: 默认只允许访问白名单中的域名，详见 [FETCH_API.md](./FETCH_API.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 许可证

MIT License

## 🔗 相关资源

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [isolated-vm](https://github.com/laverdet/isolated-vm)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)

---

如有问题或建议，请创建 Issue 或联系作者。

