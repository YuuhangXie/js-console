import express from 'express';
import cors from 'cors';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json({ limit: config.requestLimit }));

// 提供静态文件（前端构建产物）
app.use(express.static(join(__dirname, '../dist')));

// 执行JavaScript代码的API
app.post('/api/execute', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ 
      success: false,
      error: '代码不能为空' 
    });
  }

  // 限制代码长度
  if (code.length > config.execution.maxCodeLength) {
    return res.status(400).json({ 
      success: false,
      error: `代码长度超过限制（最大${config.execution.maxCodeLength / 1000}KB）` 
    });
  }

  try {
    // 存储日志和时间记录
    const logs = [];
    const errors = [];
    const timers = {};
    
    // 全局 fetch（Node.js 18+ 原生支持，较低版本需要 polyfill）
    let globalFetch = global.fetch;
    if (!globalFetch) {
      // 如果没有原生 fetch，尝试导入 node-fetch
      try {
        const nodeFetch = await import('node-fetch');
        globalFetch = nodeFetch.default;
      } catch (e) {
        // node-fetch 未安装，fetch 功能将不可用
        globalFetch = null;
      }
    }

    // 格式化值的辅助函数
    function formatValue(value) {
      if (value === undefined) return 'undefined';
      if (value === null) return 'null';
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return String(value);
      if (typeof value === 'function') return value.toString();
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value, null, 2);
        } catch (e) {
          return String(value);
        }
      }
      return String(value);
    }

    // 表格格式化函数
    function formatTable(data) {
      if (!data) return 'undefined';
      
      if (Array.isArray(data)) {
        if (data.length === 0) return '[]';
        
        if (typeof data[0] === 'object' && data[0] !== null) {
          const keys = Object.keys(data[0]);
          const maxWidths = {};
          
          keys.forEach(key => {
            maxWidths[key] = Math.max(
              key.length,
              ...data.map(item => String(item[key] || '').length)
            );
          });
          
          const headerRow = keys.map(key => key.padEnd(maxWidths[key])).join(' | ');
          const separator = keys.map(key => '-'.repeat(maxWidths[key])).join('-+-');
          const dataRows = data.map(item => 
            keys.map(key => String(item[key] || '').padEnd(maxWidths[key])).join(' | ')
          );
          
          return [headerRow, separator, ...dataRows].join('\n');
        }
        
        return data.map((item, index) => index + ': ' + formatValue(item)).join('\n');
      }
      
      if (typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) return '{}';
        
        const maxKeyWidth = Math.max(...entries.map(([key]) => key.length));
        const maxValueWidth = Math.max(...entries.map(([, value]) => String(value).length));
        
        const headerRow = 'Key'.padEnd(maxKeyWidth) + ' | ' + 'Value'.padEnd(maxValueWidth);
        const separator = '-'.repeat(maxKeyWidth) + '-+-' + '-'.repeat(maxValueWidth);
        const dataRows = entries.map(([key, value]) => 
          key.padEnd(maxKeyWidth) + ' | ' + String(value).padEnd(maxValueWidth)
        );
        
        return [headerRow, separator, ...dataRows].join('\n');
      }
      
      return formatValue(data);
    }

    // 创建沙箱上下文
    const sandbox = {
      console: {
        log: (...args) => {
          logs.push({
            type: 'log',
            content: args.map(arg => formatValue(arg)).join(' '),
            timestamp: Date.now()
          });
        },
        error: (...args) => {
          const entry = {
            type: 'error',
            content: args.map(arg => formatValue(arg)).join(' '),
            timestamp: Date.now()
          };
          errors.push(entry);
          logs.push(entry);
        },
        warn: (...args) => {
          logs.push({
            type: 'warn',
            content: args.map(arg => formatValue(arg)).join(' '),
            timestamp: Date.now()
          });
        },
        info: (...args) => {
          logs.push({
            type: 'info',
            content: args.map(arg => formatValue(arg)).join(' '),
            timestamp: Date.now()
          });
        },
        table: (data) => {
          logs.push({
            type: 'table',
            content: formatTable(data),
            timestamp: Date.now()
          });
        },
        time: (label = 'default') => {
          timers[label] = Date.now();
        },
        timeEnd: (label = 'default') => {
          if (timers[label]) {
            const duration = Date.now() - timers[label];
            logs.push({
              type: 'log',
              content: `${label}: ${duration}ms`,
              timestamp: Date.now()
            });
            delete timers[label];
          }
        }
      },
      // 实现 fetch API
      fetch: async (url, options = {}) => {
        try {
          // 检查 fetch 是否可用
          if (!globalFetch) {
            throw new Error('Fetch API 不可用。请使用 Node.js >= 18.0.0 或安装 node-fetch: npm install node-fetch');
          }
          
          // 检查 fetch 是否启用
          if (!config.fetch.enabled) {
            throw new Error('Fetch API 已被禁用');
          }

          // 解析 URL
          const urlObj = new URL(url);
          
          // 检查域名白名单
          if (!config.fetch.allowAllDomains) {
            const isAllowed = config.fetch.allowedDomains.some(domain => 
              urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );

            if (!isAllowed) {
              throw new Error(`域名 ${urlObj.hostname} 不在白名单中。允许的域名: ${config.fetch.allowedDomains.join(', ')}`);
            }
          }

          // 限制请求大小和超时
          const fetchOptions = {
            ...options,
            signal: AbortSignal.timeout(config.fetch.timeout),
          };

          // 执行实际的 fetch（使用全局 fetch）
          const response = await globalFetch(url, fetchOptions);
          const text = await response.text();

          return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            text: async () => text,
            json: async () => JSON.parse(text)
          };

        } catch (error) {
          throw new Error('Fetch 错误: ' + error.message);
        }
      },
      // 提供一些基本的全局对象
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Promise: Promise,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      Math: Math,
      JSON: JSON,
      RegExp: RegExp,
      Error: Error,
      TypeError: TypeError,
      RangeError: RangeError,
      SyntaxError: SyntaxError,
    };

    // 创建 VM 上下文
    const context = vm.createContext(sandbox);

    // 包装用户代码以处理异步操作
    const wrappedCode = `
      (async function() {
        try {
          ${code}
        } catch (error) {
          console.error(error.message || String(error));
        }
      })();
    `;

    // 使用 Promise 来处理异步代码
    const script = new vm.Script(wrappedCode, {
      filename: 'user-code.js',
      timeout: config.execution.timeout
    });

    // 执行代码
    const result = script.runInContext(context, {
      timeout: config.execution.timeout,
      breakOnSigint: true
    });

    // 等待异步操作完成
    if (result && typeof result.then === 'function') {
      await Promise.race([
        result,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('异步操作超时')), 
          config.execution.asyncWaitTime || 15000)
        )
      ]).catch(err => {
        errors.push({
          type: 'error',
          content: err.message,
          timestamp: Date.now()
        });
      });
    }

    // 返回结果
    res.json({
      success: true,
      result: 'undefined',
      logs,
      errors
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      logs: [],
      errors: [{
        type: 'error',
        content: error.message,
        timestamp: Date.now()
      }]
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 获取示例代码
app.get('/api/examples', (req, res) => {
  const examples = [
    {
      id: 1,
      title: '基础示例',
      description: '简单的变量和输出',
      code: `// 基础示例
const greeting = "Hello, World!";
console.log(greeting);

const numbers = [1, 2, 3, 4, 5];
console.log("数组:", numbers);`
    },
    {
      id: 2,
      title: '数组操作',
      description: '使用数组方法',
      code: `// 数组操作示例
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(x => x * 2);
console.log("原数组:", numbers);
console.log("翻倍后:", doubled);

const sum = numbers.reduce((a, b) => a + b, 0);
console.log("总和:", sum);

const filtered = numbers.filter(x => x > 2);
console.log("过滤后:", filtered);`
    },
    {
      id: 3,
      title: '对象操作',
      description: '对象的创建和操作',
      code: `// 对象操作示例
const person = {
  name: "张三",
  age: 25,
  city: "北京"
};

console.log("个人信息:", person);
console.table(person);

const keys = Object.keys(person);
const values = Object.values(person);
console.log("键:", keys);
console.log("值:", values);`
    },
    {
      id: 4,
      title: '函数和闭包',
      description: '函数定义和闭包',
      code: `// 函数示例
function createCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`
    },
    {
      id: 5,
      title: '计时器示例',
      description: '使用console.time测量性能',
      code: `// 计时器示例
console.time("循环计时");

let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}

console.timeEnd("循环计时");
console.log("结果:", sum);`
    },
    {
      id: 6,
      title: 'Promise示例',
      description: 'Promise的使用',
      code: `// Promise示例
const promise = Promise.resolve(42);
promise.then(value => {
  console.log("Promise值:", value);
});

console.log("同步代码执行完毕");`
    },
    {
      id: 7,
      title: 'Fetch API 示例',
      description: '使用 fetch 进行网络请求',
      code: `// Fetch API 示例
console.log("开始测试 fetch...");

try {
  console.log("1. 发起请求...");
  
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  
  console.log("2. 收到响应");
  console.log("   状态码:", response.status);
  console.log("   响应成功:", response.ok);
  
  console.log("3. 解析 JSON...");
  const data = await response.json();
  
  console.log("4. 显示数据:");
  console.table(data);
  
  console.log("✓ 测试完成！");
  
} catch (error) {
  console.error("✗ 请求失败:", error.message);
}`
    },
    {
      id: 8,
      title: 'GitHub API 示例',
      description: '查询 GitHub 仓库信息',
      code: `// GitHub API 示例
console.log("=== GitHub API 测试 ===");

try {
  const url = 'https://api.github.com/repos/facebook/react';
  console.log("1. 正在获取 React 仓库信息...");
  console.log("   URL:", url);
  
  console.log("2. 发起请求...");
  const response = await fetch(url);
  
  console.log("3. 响应状态:", response.status, response.statusText);
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  
  console.log("4. 解析 JSON...");
  const data = await response.json();
  
  console.log("5. 数据获取成功！");
  console.log("");
  console.log("仓库名称:", data.name);
  console.log("描述:", data.description);
  console.log("Stars:", data.stargazers_count);
  console.log("Forks:", data.forks_count);
  console.log("语言:", data.language);
  
  console.log("");
  console.log("完整信息表格:");
  console.table({
    name: data.name,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    license: data.license?.name || 'N/A'
  });
  
  console.log("✓ 测试完成！");
  
} catch (error) {
  console.error("✗ 获取失败:", error.message);
}`
    }
  ];
  
  res.json(examples);
});

// 所有其他请求返回前端页面（SPA 路由支持）
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`\n📝 API端点:`);
  console.log(`   - POST /api/execute - 执行代码`);
  console.log(`   - GET  /api/examples - 获取示例代码`);
  console.log(`   - GET  /api/health - 健康检查`);
  console.log(`\n⚡ 使用原生 vm 模块（无需 isolated-vm）`);
  console.log(`✨ 前端页面：http://localhost:${PORT}\n`);
});

