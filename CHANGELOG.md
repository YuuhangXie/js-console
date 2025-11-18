# 更新日志

## [1.0.0] - 2024-11-17

### 🎉 初始版本

#### ✨ 新增功能

- **代码编辑器**
  - 集成 Monaco Editor（VS Code 同款）
  - 语法高亮和智能提示
  - 代码折叠和行号显示
  - 支持键盘快捷键 (Cmd/Ctrl + Enter 执行)

- **代码执行**
  - 安全的沙箱环境 (isolated-vm)
  - 5秒执行超时保护
  - 128MB 内存限制
  - 50KB 代码长度限制

- **Console API**
  - `console.log()` - 标准输出
  - `console.error()` - 错误输出
  - `console.warn()` - 警告输出
  - `console.info()` - 信息输出
  - `console.table()` - 表格化显示
  - `console.time()` / `console.timeEnd()` - 性能计时

- **用户界面**
  - 现代化的暗色主题
  - 亮色主题支持
  - 一键主题切换
  - 响应式设计
  - 流畅的动画效果

- **代码管理**
  - 保存代码到浏览器本地存储
  - 加载已保存的代码
  - 清空编辑器
  - 清空输出
  - 执行历史记录

- **示例代码**
  - 6个内置示例
  - 基础示例
  - 数组操作
  - 对象操作
  - 函数和闭包
  - 计时器示例
  - Promise 示例

- **API 端点**
  - `POST /api/execute` - 执行代码
  - `GET /api/examples` - 获取示例列表
  - `GET /api/health` - 健康检查

#### 🔒 安全特性

- 完全隔离的代码执行环境
- 禁用文件系统访问
- 禁用网络请求
- 禁用定时器 API
- 资源使用限制
- 输入验证和清理

#### 📦 部署支持

- Docker 配置
- PM2 配置
- 部署脚本
- Nginx 配置示例（文档中）

#### 📚 文档

- README.md - 完整文档
- QUICKSTART.md - 快速开始指南
- PROJECT_OVERVIEW.md - 项目概览
- INSTALL.md - 安装指南
- CHANGELOG.md - 更新日志（本文件）

#### 🛠️ 开发工具

- Vite 构建配置
- VS Code 扩展推荐
- ESLint 和 Prettier 配置（可选）
- Git 忽略配置

### 🐛 已知问题

- 异步代码（Promise）执行可能不完整
- 移动端小屏幕上按钮可能拥挤

### 📝 技术栈

- **前端**: React 18 + Vite + Monaco Editor
- **后端**: Node.js + Express + isolated-vm
- **样式**: 原生 CSS + CSS Variables

---

## 未来计划

### [1.1.0] - 计划中

- [ ] 添加 TypeScript 支持
- [ ] 用户注册和登录
- [ ] 代码片段云端保存
- [ ] 分享代码功能
- [ ] 更多 Console API
- [ ] 代码格式化按钮
- [ ] 深色主题优化

### [1.2.0] - 计划中

- [ ] 多语言支持（Python, TypeScript）
- [ ] 协作编辑功能
- [ ] 代码评论功能
- [ ] 代码搜索和过滤
- [ ] 导入/导出代码片段

### [2.0.0] - 远期计划

- [ ] WebSocket 支持
- [ ] 实时协作
- [ ] 插件系统
- [ ] 自定义主题编辑器
- [ ] AI 代码建议

---

## 贡献指南

欢迎提交 Pull Request 和 Issue！

格式规范：
```
[类型] 简短描述

详细说明...

相关 Issue: #xxx
```

类型：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建或工具相关

---

*最后更新: 2024-11-17*

