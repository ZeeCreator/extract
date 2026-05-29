const cheerio = require('cheerio');
const { fetch } = require('../utils/request');
const { unpackEvalPacked, extractStreamUrls, extractImageUrl } = require('../utils/unpacker');
const logger = require('../utils/logger');

async function extract(url) {
  const response = await fetch(url, {
    headers: {
      Referer: new URL(url).origin,
    },
  });

  const html = response.data;
  const $ = cheerio.load(html);
  let m3u8Url = null;
  let thumbnail = null;

  const scripts = $('script').map((i, el) => $(el).html()).get();

  for (const script of scripts) {
    if (!script) continue;

    const isPacked = script.includes('eval(') && script.includes('function(p,a,c,k,e,d)');
    const isJW = script.includes('jwplayer') && (script.includes('.setup') || script.includes('setup({'));

    if (!isPacked && !isJW) continue;

    if (isPacked) {
      const unpacked = unpackEvalPacked(script);
      if (unpacked) {
        logger.info('Successfully unpacked eval-packed script');
        const urls = extractStreamUrls(unpacked);
        if (urls.length > 0) {
          m3u8Url = urls[0].url || urls[0];
          logger.info({ m3u8Url }, 'Found stream URL from unpacked script');
        }
        const img = extractImageUrl(unpacked);
        if (img) thumbnail = img;
      }
    }

    if (!m3u8Url && isPacked) {
      const m = script.match(/https?:\/\/[^\s"'<>,;)]*\.m3u8[^\s"'<>,;)]*/);
      if (m) m3u8Url = m[0];
    }

    if (!m3u8Url && isJW) {
      const fMatch = script.match(/file:\s*["']([^"']+\.m3u8[^"']*)["']/);
      if (fMatch) m3u8Url = fMatch[1];
      const iMatch = script.match(/image:\s*["']([^"']+)["']/);
      if (iMatch && !thumbnail) thumbnail = iMatch[1];
    }

    if (m3u8Url) break;
  }

  if (!m3u8Url) {
    const iframe = $('iframe[src*="stream"], iframe[src*="embed"]').first();
    if (iframe.length) {
      const src = iframe.attr('src');
      if (src) {
        logger.info('Found iframe, recursing into:', src);
        return extract(src);
      }
    }
  }

  if (!m3u8Url) {
    throw new Error('Could not extract stream URL from StreamWish');
  }

  const origin = new URL(url).origin;
  return {
    file: m3u8Url,
    type: 'hls',
    thumbnail: thumbnail || null,
    subtitles: [],
    qualities: [],
    headers: {
      Referer: origin,
      Origin: origin,
    },
  };
}

module.exports = { extract };
