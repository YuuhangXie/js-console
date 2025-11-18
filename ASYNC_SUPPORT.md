# 异步代码支持说明

## ✅ 已修复

**问题**: `#<Promise> could not be cloned` 错误

**原因**: 当代码包含异步操作（如 `fetch`、`async/await`、`Promise`）时，会返回一个 Promise 对象，而 `isolated-vm` 无法直接克隆 Promise 对象。

**解决方案**: 
- ✅ 所有用户代码现在自动包装在异步函数中
- ✅ 使用完成标志来跟踪异步操作
- ✅ 自动等待异步操作完成后再返回结果
- ✅ 错误会被正确捕获和显示

## 🚀 现在可以正常使用

### 1. Fetch API

```javascript
async function fetchData() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const data = await response.json();
  console.table(data);
}

fetchData();
```

### 2. Promise 链式调用

```javascript
fetch('https://api.github.com/users/octocat')
  .then(response => response.json())
  .then(user => {
    console.log('用户名:', user.login);
    console.log('仓库数:', user.public_repos);
  })
  .catch(error => {
    console.error('错误:', error.message);
  });
```

### 3. Async/Await

```javascript
async function getData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const post = await response.json();
    
    console.log('标题:', post.title);
    console.log('内容:', post.body);
    
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

getData();
```

### 4. Promise.all（并发请求）

```javascript
async function fetchMultiple() {
  const urls = [
    'https://jsonplaceholder.typicode.com/todos/1',
    'https://jsonplaceholder.typicode.com/todos/2',
    'https://jsonplaceholder.typicode.com/todos/3'
  ];

  const promises = urls.map(url => 
    fetch(url).then(r => r.json())
  );

  const results = await Promise.all(promises);
  
  console.log('获取了', results.length, '个结果');
  results.forEach((item, index) => {
    console.log(`Todo ${index + 1}:`, item.title);
  });
}

fetchMultiple();
```

### 5. 简单的 Promise

```javascript
const promise = new Promise((resolve, reject) => {
  // 模拟异步操作
  resolve('操作成功！');
});

promise.then(result => {
  console.log(result);
});

console.log('这行会先执行');
```

## 📝 技术细节

### 代码包装机制

你的代码会被自动包装成：

```javascript
(async function() {
  try {
    // 你的代码在这里
    ${你的代码}
  } catch (error) {
    console.error(error.message);
  } finally {
    // 标记执行完成
    _completeHandler.applySync(undefined, []);
  }
})();
```

### 执行流程

1. **代码包装**: 用户代码被包装在 async 函数中
2. **异步执行**: 代码在沙箱中异步执行
3. **轮询检查**: 服务器每 50ms 检查一次是否完成
4. **超时保护**: 最多等待 6 秒（5秒执行 + 1秒缓冲）
5. **返回结果**: 所有 console 输出被收集并返回

### 限制说明

- ⏱️ **最大执行时间**: 5秒（可在 `config.js` 中配置）
- 🔄 **轮询间隔**: 50ms
- ⏳ **最大等待时间**: 执行超时 + 1秒
- 📊 **内存限制**: 128MB
- 📏 **代码长度**: 50KB

## ⚠️ 注意事项

### 1. 返回值不显示

由于异步执行的特性，代码的返回值不会显示。请使用 `console.log()` 来输出结果：

```javascript
// ❌ 这个返回值不会显示
async function getData() {
  const response = await fetch(url);
  return await response.json(); // 不会显示
}

// ✅ 使用 console.log
async function getData() {
  const response = await fetch(url);
  const data = await response.json();
  console.log(data); // 会显示
}
```

### 2. 顶层 await

你可以直接使用 await，不需要包装在函数中：

```javascript
// ✅ 直接使用 await
const response = await fetch('https://api.github.com/users/octocat');
const data = await response.json();
console.log(data);
```

### 3. 错误处理

异步代码中的错误会被自动捕获并显示在控制台：

```javascript
// 错误会被捕获
const response = await fetch('https://invalid-url-that-does-not-exist.com');
// 错误信息会显示在控制台
```

但建议还是添加显式的错误处理：

```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error('请求失败:', error.message);
}
```

## 🎯 最佳实践

### 1. 总是使用 try-catch

```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('错误:', error.message);
    return null;
  }
}
```

### 2. 使用 console 输出结果

```javascript
async function getData() {
  const data = await fetchData();
  console.log('数据:', data); // 显式输出
}
```

### 3. 处理多个异步操作

```javascript
// 并行执行（更快）
const [user, posts] = await Promise.all([
  fetch(userUrl).then(r => r.json()),
  fetch(postsUrl).then(r => r.json())
]);

// 串行执行（按顺序）
const user = await fetch(userUrl).then(r => r.json());
const posts = await fetch(postsUrl).then(r => r.json());
```

## 🔧 配置

如需调整超时时间，编辑 `server/config.js`:

```javascript
execution: {
  timeout: 5000, // 5秒（毫秒）
}
```

## 📚 相关文档

- [FETCH_API.md](./FETCH_API.md) - Fetch API 详细使用指南
- [README.md](./README.md) - 完整功能文档
- [QUICKSTART.md](./QUICKSTART.md) - 快速入门

---

**更新时间**: 2024-11-17

现在你可以自由使用异步代码了！🎉

