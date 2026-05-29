const extractRoute = require('./extract');
const proxyRoute = require('./proxy');
const healthRoute = require('./health');
const playerRoute = require('./player');
const embedRoute = require('./embed');

function registerRoutes(fastify) {
  fastify.get('/api/extract', extractRoute);
  fastify.get('/proxy', proxyRoute);
  fastify.get('/health', healthRoute);
  fastify.get('/player', playerRoute);
  fastify.get('/embed', embedRoute);

  fastify.options('/proxy', (request, reply) => {
    reply
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .header('Access-Control-Allow-Headers', '*')
      .status(204)
      .send();
  });

  fastify.options('/embed', (request, reply) => {
    reply
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .header('Access-Control-Allow-Headers', '*')
      .status(204)
      .send();
  });
}

module.exports = { registerRoutes };
