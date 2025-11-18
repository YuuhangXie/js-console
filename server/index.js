import express from 'express';
import cors from 'cors';
import ivm from 'isolated-vm';
import config from './config.js';

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json({ limit: config.requestLimit }));

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
    // 创建隔离的沙箱环境
    const isolate = new ivm.Isolate({ memoryLimit: config.execution.memoryLimit });
    const context = await isolate.createContext();

    // 存储日志和时间记录
    const logs = [];
    const errors = [];
    const timers = {};
    let executionComplete = false;

    // 创建一个函数来接收序列化的日志
    const logHandler = new ivm.Reference(function(type, content) {
      const entry = {
        type,
        content,
        timestamp: Date.now()
      };
      
      if (type === 'error') {
        errors.push(entry);
      } else {
        logs.push(entry);
      }
    });

    // 完成标志处理器
    const completeHandler = new ivm.Reference(function() {
      executionComplete = true;
    });

    // 时间记录处理
    const timeHandler = new ivm.Reference(function(action, label) {
      if (action === 'start') {
        timers[label] = Date.now();
      } else if (action === 'end') {
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
    });

    // Fetch 处理器（受限的网络请求）
    const fetchHandler = new ivm.Reference(async function(url, optionsJson) {
      try {
        // 检查 fetch 是否启用
        if (!config.fetch.enabled) {
          return JSON.stringify({
            ok: false,
            status: 403,
            error: 'Fetch API 已被禁用'
          });
        }

        // 解析 URL
        const urlObj = new URL(url);
        
        // 检查域名白名单
        if (!config.fetch.allowAllDomains) {
          const isAllowed = config.fetch.allowedDomains.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
          );

          if (!isAllowed) {
            return JSON.stringify({
              ok: false,
              status: 403,
              error: `域名 ${urlObj.hostname} 不在白名单中。允许的域名: ${config.fetch.allowedDomains.join(', ')}`
            });
          }
        }

        // 解析选项
        const options = optionsJson ? JSON.parse(optionsJson) : {};
        
        // 限制请求大小和超时
        const fetchOptions = {
          ...options,
          signal: AbortSignal.timeout(config.fetch.timeout),
        };

        // 执行实际的 fetch
        const response = await fetch(url, fetchOptions);
        const text = await response.text();

        return JSON.stringify({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text
        });

      } catch (error) {
        return JSON.stringify({
          ok: false,
          status: 0,
          error: error.message
        });
      }
    });

    // 注入处理函数到沙箱
    await context.global.set('_logHandler', logHandler);
    await context.global.set('_timeHandler', timeHandler);
    await context.global.set('_fetchHandler', fetchHandler);
    await context.global.set('_completeHandler', completeHandler);

    // 创建console对象的包装代码（在沙箱内部序列化数据）
    const wrapperCode = `
      // 格式化值的辅助函数（在沙箱内部）
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
            
            return [headerRow, separator, ...dataRows].join('\\n');
          }
          
          return data.map((item, index) => index + ': ' + formatValue(item)).join('\\n');
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
          
          return [headerRow, separator, ...dataRows].join('\\n');
        }
        
        return formatValue(data);
      }

      globalThis.console = {
        log: (...args) => {
          const content = args.map(arg => formatValue(arg)).join(' ');
          _logHandler.applySync(undefined, ['log', content]);
        },
        error: (...args) => {
          const content = args.map(arg => formatValue(arg)).join(' ');
          _logHandler.applySync(undefined, ['error', content]);
        },
        warn: (...args) => {
          const content = args.map(arg => formatValue(arg)).join(' ');
          _logHandler.applySync(undefined, ['warn', content]);
        },
        info: (...args) => {
          const content = args.map(arg => formatValue(arg)).join(' ');
          _logHandler.applySync(undefined, ['info', content]);
        },
        table: (data) => {
          const content = formatTable(data);
          _logHandler.applySync(undefined, ['table', content]);
        },
        time: (label = 'default') => {
          _timeHandler.applySync(undefined, ['start', label]);
        },
        timeEnd: (label = 'default') => {
          _timeHandler.applySync(undefined, ['end', label]);
        }
      };

      // 实现 fetch API
      globalThis.fetch = async function(url, options = {}) {
        try {
          console.log('[Fetch] 开始请求:', url);
          
          // 序列化选项
          const optionsJson = JSON.stringify(options);
          
          // 调用外部的 fetch 处理器
          console.log('[Fetch] 调用外部处理器...');
          const resultJson = await _fetchHandler.apply(
            undefined, 
            [url, optionsJson],
            { result: { promise: true, copy: true } }
          );
          
          console.log('[Fetch] 收到响应');
          
          // 解析响应
          const result = JSON.parse(resultJson);
          
          if (result.error) {
            console.log('[Fetch] 请求失败:', result.error);
            throw new Error(result.error);
          }
          
          console.log('[Fetch] 请求成功, 状态:', result.status);
          
          // 返回一个类似 Response 的对象
          return {
            ok: result.ok,
            status: result.status,
            statusText: result.statusText,
            headers: result.headers,
            text: async () => result.body,
            json: async () => {
              try {
                const data = JSON.parse(result.body);
                console.log('[Fetch] JSON 解析成功');
                return data;
              } catch (e) {
                console.error('[Fetch] JSON 解析失败:', e.message);
                throw new Error('响应不是有效的 JSON');
              }
            }
          };
        } catch (error) {
          console.error('[Fetch] 错误:', error.message);
          throw new Error('Fetch 错误: ' + error.message);
        }
      };
    `;

    await context.eval(wrapperCode);

    // 包装用户代码以处理异步操作
    const wrappedCode = `
      (async function() {
        try {
          ${code}
        } catch (error) {
          console.error(error.message || String(error));
        } finally {
          // 标记执行完成
          _completeHandler.applySync(undefined, []);
        }
      })();
    `;

    // 编译并执行用户代码
    const script = await isolate.compileScript(wrappedCode);
    
    // 执行代码（不等待返回值）
    script.run(context, { 
      timeout: config.execution.timeout,
      promise: true  // 允许返回 Promise
    }).catch(err => {
      // 执行出错
      errors.push({
        type: 'error',
        content: err.message,
        timestamp: Date.now()
      });
      executionComplete = true;
    });

    // 轮询等待执行完成
    const startTime = Date.now();
    const maxWaitTime = config.execution.asyncWaitTime || (config.execution.timeout + 5000);
    
    while (!executionComplete && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 每100ms检查一次
    }
    
    // 如果超时了，记录一下
    if (!executionComplete) {
      logs.push({
        type: 'warn',
        content: `代码执行可能未完成（超过 ${maxWaitTime / 1000} 秒）`,
        timestamp: Date.now()
      });
    }

    // 释放资源
    isolate.dispose();

    // 返回结果
    res.json({
      success: true,
      result: 'undefined', // 异步代码的返回值不显示
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

// 格式化值用于显示
function formatValue(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'function') {
    return value.toString();
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
}

// 格式化表格数据
function formatTable(data) {
  if (!data) {
    return 'undefined';
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return '[]';
    }
    
    // 如果是对象数组，创建表格
    if (typeof data[0] === 'object' && data[0] !== null) {
      const keys = Object.keys(data[0]);
      const maxWidths = {};
      
      // 计算每列的最大宽度
      keys.forEach(key => {
        maxWidths[key] = Math.max(
          key.length,
          ...data.map(item => String(item[key] || '').length)
        );
      });
      
      // 创建表格
      const headerRow = keys.map(key => key.padEnd(maxWidths[key])).join(' | ');
      const separator = keys.map(key => '-'.repeat(maxWidths[key])).join('-+-');
      const dataRows = data.map(item => 
        keys.map(key => String(item[key] || '').padEnd(maxWidths[key])).join(' | ')
      );
      
      return [headerRow, separator, ...dataRows].join('\n');
    }
    
    // 简单数组
    return data.map((item, index) => `${index}: ${formatValue(item)}`).join('\n');
  }
  
  if (typeof data === 'object') {
    // 对象转表格
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return '{}';
    }
    
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

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 API端点:`);
  console.log(`   - POST /api/execute - 执行代码`);
  console.log(`   - GET  /api/examples - 获取示例代码`);
  console.log(`   - GET  /api/health - 健康检查`);
});

