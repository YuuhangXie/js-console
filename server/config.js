// 服务器配置文件

export const config = {
  // 服务器端口
  port: process.env.PORT || 3000,

  // 代码执行限制
  execution: {
    memoryLimit: 128, // MB
    timeout: 10000, // 代码执行超时（毫秒）
    maxCodeLength: 50000, // 字符
    asyncWaitTime: 15000, // 异步操作最大等待时间（毫秒）
  },

  // Fetch API 配置
  fetch: {
    enabled: true, // 是否启用 fetch API
    timeout: 10000, // 单个请求超时（毫秒）
    
    // 允许访问的域名白名单
    // 设置为 ['*'] 表示允许所有域名（不推荐用于生产环境）
    allowedDomains: ["*"],

    // 是否允许所有域名（⚠️ 不推荐在生产环境中启用）
    allowAllDomains: true,
  },

  // 请求大小限制
  requestLimit: '1mb',
};

export default config;

