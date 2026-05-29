module.exports = {
  apps: [{
    name: 'zeroextract-api',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './src/logs/err.log',
    out_file: './src/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
