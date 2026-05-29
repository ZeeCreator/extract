require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  apiKey: process.env.API_KEY || 'your-secret-api-key',
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  },

  cache: {
    ttl: {
      stream: parseInt(process.env.CACHE_TTL_STREAM, 10) || 300,
      thumbnail: parseInt(process.env.CACHE_TTL_THUMBNAIL, 10) || 86400,
      subtitle: parseInt(process.env.CACHE_TTL_SUBTITLE, 10) || 86400,
    },
  },

  logLevel: process.env.LOG_LEVEL || 'info',

  providers: {
    streamwish: {
      domains: ['nekowish.my.id', 'streamwish.com', 'streamwish.to'],
    },
    vidguard: {
      domains: ['vidguard.to', 'vgfplay.com'],
    },
    doodstream: {
      domains: ['dood.wf', 'doodstream.com', 'dooodster.com'],
    },
    mp4upload: {
      domains: ['mp4upload.com'],
    },
    mixdrop: {
      domains: ['mixdrop.co', 'mixdrop.to', 'mixdrop.sx'],
    },
    streamtape: {
      domains: ['streamtape.com', 'streamtape.to'],
    },
    filemoon: {
      domains: ['filemoon.sx', 'filemoon.to'],
    },
  },

  proxy: {
    injectHeaders: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    },
  },
};
