# 项目概览

## 📂 项目结构

```
console/
├── src/                      # 前端源代码
│   ├── App.jsx              # 主应用组件
│   ├── App.css              # 应用样式
│   ├── main.jsx             # 入口文件
│   └── index.css            # 全局样式
├── server/                   # 后端服务器
│   └── index.js             # Express服务器 + API
├── public/                   # 静态资源（如果需要）
├── dist/                     # 构建输出目录
├── .vscode/                  # VS Code配置
│   └── extensions.json      # 推荐的扩展
├── index.html               # HTML模板
├── vite.config.js           # Vite配置
├── package.json             # 项目配置和依赖
├── Dockerfile               # Docker镜像配置
├── .dockerignore            # Docker忽略文件
├── ecosystem.config.cjs     # PM2配置
├── deploy.sh                # 部署脚本
├── .gitignore               # Git忽略文件
├── README.md                # 完整文档
├── QUICKSTART.md            # 快速开始指南
└── PROJECT_OVERVIEW.md      # 本文件

```

## 🔧 技术架构

### 前端架构
```
React (UI框架)
  ├── Monaco Editor (代码编辑器)
  ├── CSS Variables (主题系统)
  └── Fetch API (API调用)
```

### 后端架构
```
Express (Web框架)
  ├── isolated-vm (代码沙箱)
  ├── CORS (跨域支持)
  └── JSON Parser (请求解析)
```

## 🚀 核心功能实现

### 1. 代码编辑器 (Monaco Editor)
- **文件**: `src/App.jsx`
- **功能**: VS Code同款编辑器，支持智能提示、语法高亮
- **配置**: 禁用 minimap，启用行号和代码折叠

### 2. 代码执行 (isolated-vm)
- **文件**: `server/index.js`
- **功能**: 安全的代码沙箱执行环境
- **限制**: 
  - 内存限制: 128MB
  - 超时时间: 5秒
  - 代码长度: 50KB

### 3. Console API实现
- **支持的方法**:
  - `console.log()` - 标准输出
  - `console.error()` - 错误输出
  - `console.warn()` - 警告输出
  - `console.info()` - 信息输出
  - `console.table()` - 表格显示
  - `console.time()` / `console.timeEnd()` - 计时

### 4. 主题系统
- **实现**: CSS Variables
- **主题**: 暗色 (vs-dark) 和亮色 (light)
- **切换**: 动态修改 CSS 变量

### 5. 本地存储
- **功能**: 保存/加载代码
- **实现**: localStorage API
- **键名**: `savedCode`

## 🔐 安全机制

### 沙箱隔离
```javascript
// 使用 isolated-vm 创建完全隔离的执行环境
const isolate = new ivm.Isolate({ memoryLimit: 128 });
const context = await isolate.createContext();
```

### 禁用的API
- `setTimeout` / `setInterval`
- `setImmediate`
- 网络请求 (fetch, XMLHttpRequest)
- 文件系统访问

### 资源限制
- 内存: 128MB
- 超时: 5秒
- 代码长度: 50KB
- 请求体大小: 1MB

## 📡 API接口

### POST /api/execute
执行JavaScript代码

**请求**:
```json
{
  "code": "console.log('Hello');"
}
```

**响应**:
```json
{
  "success": true,
  "result": "undefined",
  "logs": [...],
  "errors": [...]
}
```

### GET /api/examples
获取示例代码列表

**响应**:
```json
[
  {
    "id": 1,
    "title": "基础示例",
    "description": "...",
    "code": "..."
  },
  ...
]
```

### GET /api/health
健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

## 🎨 UI组件

### 主要组件
1. **Header** - 顶部工具栏
   - Logo
   - 主题切换
   - 操作按钮（示例、保存、加载、清空、运行）

2. **Editor Panel** - 左侧编辑器面板
   - Monaco Editor
   - 面板标题和提示

3. **Output Panel** - 右侧输出面板
   - 控制台输出
   - 输出类型标识（log, error, warn, info, table）
   - 空状态提示

4. **Examples Modal** - 示例代码弹窗
   - 示例列表
   - 点击加载

5. **Footer** - 底部信息栏
   - 使用提示
   - 历史统计

## 🔄 数据流

```
用户输入代码
    ↓
前端 (React)
    ↓
POST /api/execute
    ↓
后端 (Express)
    ↓
isolated-vm 沙箱
    ↓
执行代码 + 捕获输出
    ↓
返回结果
    ↓
前端显示输出
```

## 🧪 测试建议

### 功能测试
1. ✅ 基础代码执行
2. ✅ Console API 各种方法
3. ✅ 错误处理
4. ✅ 超时处理
5. ✅ 主题切换
6. ✅ 代码保存/加载
7. ✅ 示例代码加载

### 安全测试
1. ✅ 无限循环（超时保护）
2. ✅ 大量内存分配（内存限制）
3. ✅ 文件系统访问（应被阻止）
4. ✅ 网络请求（应被阻止）

### 性能测试
1. ⚠️ 大型数组处理
2. ⚠️ 复杂计算
3. ⚠️ 多次快速执行

## 🚀 部署选项

### 1. 开发模式
```bash
npm run dev
```

### 2. 生产模式（分离）
```bash
npm run build  # 构建前端
npm run server # 启动后端
```

### 3. Docker
```bash
docker build -t js-console .
docker run -p 3000:3000 js-console
```

### 4. PM2
```bash
pm2 start ecosystem.config.cjs
```

### 5. Vercel/Netlify (仅前端)
- 需要另外部署后端API
- 修改API地址

## 🔨 开发建议

### 添加新功能
1. 在 `src/App.jsx` 添加前端逻辑
2. 在 `server/index.js` 添加API端点
3. 在 `src/App.css` 添加样式
4. 更新文档

### 添加新的Console方法
1. 在后端创建方法引用
2. 注入到沙箱context
3. 在包装代码中添加方法

### 自定义主题
1. 修改 `src/App.css` 中的 CSS 变量
2. 为 `.app--dark` 和 `.app--light` 设置不同的值

## 📦 依赖说明

### 生产依赖
- `express` - Web框架
- `cors` - 跨域支持
- `isolated-vm` - 代码沙箱

### 开发依赖
- `react` - UI框架
- `react-dom` - React DOM渲染
- `vite` - 构建工具
- `@vitejs/plugin-react` - React插件
- `@monaco-editor/react` - Monaco编辑器
- `concurrently` - 并行运行命令

## 🐛 已知问题

1. **异步代码限制**
   - Promise 可以创建但执行可能不完整
   - 建议主要用于同步代码

2. **移动端体验**
   - 小屏幕上按钮可能拥挤
   - 已实现响应式隐藏非关键按钮

3. **isolated-vm 编译**
   - 需要 Python 和 C++ 编译环境
   - Windows 可能需要额外配置

## 📚 扩展方向

1. **用户系统**
   - 注册/登录
   - 代码片段保存到数据库
   - 分享代码

2. **更多Console API**
   - `console.dir()`
   - `console.group()`
   - `console.assert()`

3. **代码片段管理**
   - 标签分类
   - 搜索功能
   - 导入/导出

4. **协作功能**
   - 实时协作编辑
   - 代码评论
   - WebSocket 支持

5. **多语言支持**
   - Python
   - TypeScript
   - 其他语言

---

**维护者**: 如有疑问，请查看代码注释或提交Issue

