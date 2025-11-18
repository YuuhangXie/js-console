# Fetch API 使用指南

## 🌐 概述

JavaScript 控制台现在支持 `fetch` API，允许你进行网络请求。出于安全考虑，默认情况下只允许访问白名单中的域名。

## 🔒 安全机制

### 域名白名单

默认允许访问的域名：
- `api.github.com` - GitHub API
- `jsonplaceholder.typicode.com` - 测试 API
- `httpbin.org` - HTTP 测试服务
- `dummyjson.com` - 假数据 API
- `reqres.in` - 测试 API
- `api.openai.com` - OpenAI API

### 限制说明

- ✅ **超时限制**: 每个请求最长 10 秒
- ✅ **域名限制**: 仅允许白名单域名
- ✅ **HTTPS 推荐**: 建议使用 HTTPS 协议
- ⚠️ **异步执行**: 请使用 async/await 或 Promise

## 📝 基础用法

### 示例 1: 简单的 GET 请求

```javascript
async function getData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

getData();
```

### 示例 2: 检查响应状态

```javascript
async function checkStatus() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  
  console.log('状态码:', response.status);
  console.log('状态文本:', response.statusText);
  console.log('请求成功:', response.ok);
  
  if (response.ok) {
    const data = await response.json();
    console.table(data);
  } else {
    console.error('请求失败:', response.status);
  }
}

checkStatus();
```

### 示例 3: POST 请求

```javascript
async function postData() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
      }),
    });
    
    const data = await response.json();
    console.log('创建成功:');
    console.table(data);
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

postData();
```

### 示例 4: GitHub API

```javascript
async function getGitHubUser(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const user = await response.json();
    
    console.log('用户信息:');
    console.table({
      用户名: user.login,
      姓名: user.name,
      公开仓库: user.public_repos,
      关注者: user.followers,
      位置: user.location,
    });
  } catch (error) {
    console.error('获取失败:', error.message);
  }
}

getGitHubUser('torvalds'); // Linux 创始人
```

### 示例 5: 多个并发请求

```javascript
async function fetchMultiple() {
  try {
    console.time('并发请求');
    
    const urls = [
      'https://jsonplaceholder.typicode.com/todos/1',
      'https://jsonplaceholder.typicode.com/todos/2',
      'https://jsonplaceholder.typicode.com/todos/3',
    ];
    
    const promises = urls.map(url => fetch(url).then(r => r.json()));
    const results = await Promise.all(promises);
    
    console.timeEnd('并发请求');
    console.log('获取到', results.length, '个结果');
    results.forEach((result, index) => {
      console.log(`结果 ${index + 1}:`, result.title);
    });
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

fetchMultiple();
```

## ⚙️ 配置白名单

### 添加新域名

编辑 `server/config.js` 文件：

```javascript
export const config = {
  fetch: {
    allowedDomains: [
      'api.github.com',
      'jsonplaceholder.typicode.com',
      // 添加你的域名
      'api.example.com',
      'myapi.com',
    ],
  },
};
```

### 允许所有域名（不推荐）

⚠️ **警告**: 这会降低安全性，仅在受信任的环境中使用。

```javascript
export const config = {
  fetch: {
    allowAllDomains: true, // 允许所有域名
  },
};
```

### 禁用 Fetch API

如果你想完全禁用 fetch：

```javascript
export const config = {
  fetch: {
    enabled: false, // 禁用 fetch
  },
};
```

## 🚨 错误处理

### 常见错误

#### 1. 域名不在白名单

```
错误: 域名 api.example.com 不在白名单中
```

**解决方案**: 在 `server/config.js` 中添加该域名到白名单。

#### 2. 请求超时

```
错误: Fetch 错误: The operation was aborted due to timeout
```

**解决方案**: 请求超过 10 秒被自动终止，尝试优化 API 或增加超时时间。

#### 3. CORS 错误

某些 API 可能不支持跨域请求。这是 API 服务器的限制，不是本应用的问题。

## 📚 推荐的测试 API

### 1. JSONPlaceholder
免费的假数据 REST API

```javascript
// 获取用户列表
fetch('https://jsonplaceholder.typicode.com/users')
  .then(r => r.json())
  .then(console.table);

// 获取帖子
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(r => r.json())
  .then(console.log);
```

### 2. DummyJSON
提供各种假数据

```javascript
// 获取产品列表（需要添加到白名单）
fetch('https://dummyjson.com/products/1')
  .then(r => r.json())
  .then(console.log);
```

### 3. GitHub API
获取 GitHub 数据

```javascript
// 获取仓库信息
fetch('https://api.github.com/repos/facebook/react')
  .then(r => r.json())
  .then(data => {
    console.table({
      name: data.name,
      stars: data.stargazers_count,
      forks: data.forks_count,
    });
  });
```

### 4. HTTPBin
HTTP 测试工具

```javascript
// 测试 POST 请求
fetch('https://httpbin.org/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: 'data' })
})
  .then(r => r.json())
  .then(console.log);
```

## 🎯 最佳实践

### 1. 始终使用 try-catch

```javascript
async function safeFetch() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error.message);
    return null;
  }
}
```

### 2. 检查响应状态

```javascript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

### 3. 设置合适的请求头

```javascript
await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});
```

### 4. 使用 async/await

```javascript
// 推荐
async function getData() {
  const response = await fetch(url);
  return await response.json();
}

// 也可以使用 Promise
fetch(url)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 🔐 安全建议

1. **仅添加信任的域名到白名单**
2. **不要在公开环境中暴露 API 密钥**
3. **定期审查白名单中的域名**
4. **在生产环境中保持 `allowAllDomains: false`**
5. **使用 HTTPS 而不是 HTTP**
6. **实施速率限制（如果需要）**

## 💡 技术细节

### Response 对象

fetch 返回的 Response 对象支持：

- `response.ok` - 布尔值，表示请求是否成功
- `response.status` - HTTP 状态码
- `response.statusText` - 状态文本
- `response.headers` - 响应头对象
- `response.text()` - 获取文本内容
- `response.json()` - 解析 JSON 响应

### 限制说明

由于沙箱环境的限制：
- ❌ 不支持 `response.blob()`
- ❌ 不支持 `response.arrayBuffer()`
- ❌ 不支持流式读取
- ✅ 支持 `response.text()` 和 `response.json()`

## 📞 获取帮助

遇到问题？
1. 检查域名是否在白名单中
2. 确认 API 是否支持 CORS
3. 查看控制台错误信息
4. 阅读本文档的错误处理部分

---

祝你使用愉快！🚀

