const { Queue } = require('bullmq');
const config = require('../config');
const logger = require('../utils/logger');

let extractQueue = null;

function getQueue() {
  if (!extractQueue) {
    extractQueue = new Queue('extraction', {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    logger.info('BullMQ extraction queue initialized');
  }
  return extractQueue;
}

async function addExtractionJob(url, options = {}) {
  const queue = getQueue();
  const job = await queue.add('extract', { url, ...options });
  logger.info({ jobId: job.id, url }, 'Added extraction job');
  return job;
}

module.exports = { getQueue, addExtractionJob };
