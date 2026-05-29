const { Worker } = require('bullmq');
const { extract } = require('../providers');
const cache = require('../cache');
const config = require('../config');
const logger = require('../utils/logger');

function startWorker() {
  const worker = new Worker('extraction', async (job) => {
    const { url, provider } = job.data;
    logger.info({ jobId: job.id, url }, 'Worker processing extraction');

    const result = await extract(url, { provider });
    const cacheKey = `extract:${url}`;
    await cache.set(cacheKey, result, config.cache.ttl.stream);

    return result;
  }, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    },
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Worker completed extraction job');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Worker failed extraction job');
  });

  logger.info('Extractor worker started');
  return worker;
}

module.exports = { startWorker };
