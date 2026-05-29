const config = require('../config');

function detectProvider(url) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  for (const [provider, info] of Object.entries(config.providers)) {
    for (const domain of info.domains) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return provider;
      }
    }
  }

  if (hostname.includes('jwplayer') || hostname.includes('jwpltx')) {
    return 'jwplayer';
  }

  return 'unknown';
}

module.exports = { detectProvider };
