const config = require('../config');

function apiKeyAuth(request, reply, done) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || apiKey !== config.apiKey) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized - invalid or missing x-api-key header',
    });
  }

  done();
}

module.exports = { apiKeyAuth };
