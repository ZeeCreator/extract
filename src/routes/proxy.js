const { proxyMedia } = require('../proxy');
const logger = require('../utils/logger');

async function proxyRoute(request, reply) {
  const { url, referer, origin } = request.query;

  if (!url) {
    return reply.status(400).send({
      success: false,
      error: 'Missing required query parameter: url',
    });
  }

  try {
    const proxyBase = `${request.protocol}://${request.hostname}${request.port ? `:${request.port}` : ''}`;
    const result = await proxyMedia(url, proxyBase, { referer, origin });

    return reply
      .header('Content-Type', result.contentType)
      .header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .header('Access-Control-Allow-Headers', '*')
      .send(result.data);
  } catch (error) {
    logger.error({ error: error.message, url }, 'Proxy request failed');
    return reply.status(502).send({
      success: false,
      error: `Proxy failed: ${error.message}`,
    });
  }
}

module.exports = proxyRoute;
