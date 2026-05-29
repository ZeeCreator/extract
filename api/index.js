const serverless = require('serverless-http');
const { buildServer } = require('../src/server');

let server;

async function handler(req, res) {
  if (!server) {
    const fastify = await buildServer();
    await fastify.ready();
    server = serverless(fastify);
  }
  return server(req, res);
}

module.exports = handler;
