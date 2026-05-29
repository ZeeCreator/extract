const { extract, detectProvider } = require('../providers');
const { parseM3U8 } = require('../utils/hls-parser');
const cache = require('../cache');
const config = require('../config');
const logger = require('../utils/logger');

async function extractRoute(request, reply) {
  const { url, provider } = request.query;

  if (!url) {
    return reply.status(400).send({
      success: false,
      error: 'Missing required query parameter: url',
    });
  }

  const cacheKey = `extract:${url}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.info({ url, cached: true }, 'Returning cached extract result');
    return reply.send(cached);
  }

  try {
    const detectedProvider = detectProvider(url);
    const result = await extract(url, { provider: provider || detectedProvider });

    const response = {
      success: true,
      provider: provider || detectedProvider,
      thumbnail: result.thumbnail || null,
      streams: [{ file: result.file, type: result.type, quality: 'auto' }],
      subtitles: result.subtitles || [],
      headers: result.headers || {},
    };

    cache.set(cacheKey, response, config.cache.ttl.stream);

    if (result.file && result.file.includes('.m3u8')) {
      parseM3U8(result.file).then(parsed => {
        if (parsed.type === 'master') {
          response.streams = parsed.streams.map(s => ({
            file: s.file,
            quality: s.quality,
            type: 'hls',
          }));
          cache.set(cacheKey, response, config.cache.ttl.stream);
        }
      }).catch(() => {});
    }

    return reply.send(response);
  } catch (error) {
    logger.error({ error: error.message, url }, 'Extraction failed');
    return reply.status(500).send({
      success: false,
      error: `Extraction failed: ${error.message}`,
    });
  }
}

module.exports = extractRoute;
