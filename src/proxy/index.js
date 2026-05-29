const { fetch, fetchBuffer } = require('../utils/request');
const { rewritePlaylist } = require('../utils/hls-parser');
const config = require('../config');
const logger = require('../utils/logger');

async function proxyMedia(url, proxyBase, options = {}) {
  const referer = options.referer || config.proxy.injectHeaders.Referer || new URL(url).origin;
  const origin = options.origin || config.proxy.injectHeaders.Origin || new URL(url).origin;

  const isM3U8 = url.includes('.m3u8');

  if (isM3U8) {
    const response = await fetch(url, {
      headers: {
        Referer: referer,
        Origin: origin,
        ...config.proxy.injectHeaders,
      },
    });

    const originalBase = url.substring(0, url.lastIndexOf('/') + 1);
    const rewritten = rewritePlaylist(response.data, proxyBase, originalBase, referer, origin);

    return {
      data: rewritten,
      contentType: 'application/vnd.apple.mpegurl',
    };
  }

  const buffer = await fetchBuffer(url, {
    headers: {
      Referer: referer,
      Origin: origin,
      ...config.proxy.injectHeaders,
    },
  });

  const ext = url.split('.').pop().toLowerCase();
  const mimeTypes = {
    ts: 'video/mp2t',
    m4s: 'video/mp4',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    mp4: 'video/mp4',
    vtt: 'text/vtt',
    srt: 'text/plain',
    webm: 'video/webm',
    key: 'application/octet-stream',
  };

  return {
    data: buffer,
    contentType: mimeTypes[ext] || 'application/octet-stream',
  };
}

module.exports = { proxyMedia };
