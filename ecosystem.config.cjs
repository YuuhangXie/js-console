// PM2 配置文件
// 使用方法: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [{
    name: 'js-console',
    script: './server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    merge_logs: true
  }]
};

