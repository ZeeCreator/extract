const pino = require('pino');
const config = require('../config');

const transport = config.nodeEnv === 'development'
  ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
  : undefined;

const logger = pino({
  level: config.logLevel,
  transport,
});

module.exports = logger;
