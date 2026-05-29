const { apiKeyAuth } = require('./auth');

function registerMiddleware(fastify, config) {
  if (config.nodeEnv !== 'test') {
    fastify.register(require('@fastify/rate-limit'), {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.windowMs,
    });
  }
}

module.exports = { apiKeyAuth, registerMiddleware };
