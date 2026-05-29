const Fastify = require('fastify');
const config = require('./config');
const logger = require('./utils/logger');
const { registerRoutes } = require('./routes');
const { registerMiddleware } = require('./middleware');

async function buildServer() {
  const fastify = Fastify({
    logger: false,
    trustProxy: true,
  });

  registerMiddleware(fastify, config);
  registerRoutes(fastify);

  fastify.setErrorHandler((error, request, reply) => {
    logger.error({ error: error.message, stack: error.stack, url: request.url }, 'Unhandled error');
    reply.status(error.statusCode || 500).send({
      success: false,
      error: config.nodeEnv === 'production' ? 'Internal Server Error' : error.message,
    });
  });

  fastify.addHook('onRequest', (request, reply, done) => {
    const { method, url } = request;
    logger.info({ method, url }, 'Incoming request');
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const { method, url } = request;
    logger.info({ method, url, statusCode: reply.statusCode, responseTime: reply.elapsedTime }, 'Request completed');
    done();
  });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: config.port, host: '0.0.0.0' });
    logger.info({ port: config.port, env: config.nodeEnv }, 'ZeroExtract API server started');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
}

start();

module.exports = { buildServer };
