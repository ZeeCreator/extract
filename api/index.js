const { buildServer } = require('../src/server');

let fastify;

module.exports = async (req, res) => {
  try {
    if (!fastify) {
      fastify = await buildServer();
      await fastify.ready();
    }
    fastify.server.emit('request', req, res);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
  }
};
