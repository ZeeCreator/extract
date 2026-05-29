const { detectProvider } = require('./detector');
const { fetch } = require('../utils/request');
const logger = require('../utils/logger');

const extractors = {
  streamwish: require('./streamwish'),
  jwplayer: require('./jwplayer'),
};

async function extract(url, options = {}) {
  const provider = options.provider || detectProvider(url);
  logger.info({ provider, url }, 'Starting extraction');

  const extractor = extractors[provider];
  if (!extractor) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const result = await extractor.extract(url);
  logger.info({ provider, success: true }, 'Extraction completed');
  return result;
}

async function extractWithRetry(url, options = {}, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await extract(url, options);
    } catch (error) {
      logger.warn({ attempt, error: error.message }, 'Extraction attempt failed');
      if (attempt === maxRetries) throw error;
    }
  }
}

module.exports = { extract, extractWithRetry };
