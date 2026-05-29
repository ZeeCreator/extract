const { extract } = require('../providers');
const logger = require('../utils/logger');

class AntiExpiredTokenSystem {
  constructor() {
    this.streams = new Map();
  }

  registerStream(url, options = {}) {
    this.streams.set(url, {
      url,
      options,
      registeredAt: Date.now(),
      lastRefresh: Date.now(),
      refreshCount: 0,
    });
    logger.info({ url }, 'Registered stream for token refresh');
  }

  async handlePlayerError(url) {
    logger.info({ url }, 'Handling player error - attempting re-extraction');

    const stream = this.streams.get(url);
    if (!stream) {
      logger.warn({ url }, 'Stream not registered for token refresh');
      return null;
    }

    try {
      const result = await extract(url, stream.options);
      stream.lastRefresh = Date.now();
      stream.refreshCount++;
      stream.lastResult = result;

      logger.info({ url, refreshCount: stream.refreshCount }, 'Token refreshed successfully');
      return result;
    } catch (error) {
      logger.error({ url, error: error.message }, 'Failed to refresh token');
      throw error;
    }
  }

  unregisterStream(url) {
    this.streams.delete(url);
    logger.info({ url }, 'Unregistered stream');
  }
}

module.exports = new AntiExpiredTokenSystem();
