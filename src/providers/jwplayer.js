const cheerio = require('cheerio');
const { fetch } = require('../utils/request');
const { parseM3U8 } = require('../utils/hls-parser');
const logger = require('../utils/logger');

async function extract(url) {
  const response = await fetch(url);
  const html = response.data;
  const $ = cheerio.load(html);
  let fileUrl = null;
  let thumbnail = null;

  const scripts = $('script').map((i, el) => $(el).html()).get();

  for (const script of scripts) {
    if (!script) continue;

    if (script.includes('jwplayer(') || script.includes('player.setup')) {
      const source = parseJWPlayer(script);
      if (source) {
        fileUrl = source.file;
        thumbnail = source.image || thumbnail;
      }
    }

    if (!fileUrl && script.includes('file:')) {
      const fMatch = script.match(/file:\s*["']([^"']+)["']/);
      if (fMatch && (fMatch[1].includes('.m3u8') || fMatch[1].includes('.mp4'))) {
        fileUrl = fMatch[1];
      }
    }
  }

  if (!fileUrl) {
    throw new Error('Could not extract JWPlayer stream URL');
  }

  let qualities = [];
  try {
    const parsed = await parseM3U8(fileUrl);
    if (parsed.type === 'master' && parsed.streams) {
      qualities = parsed.streams.map(s => ({
        file: s.file,
        quality: s.quality,
        resolution: s.resolution,
      }));
    }
  } catch (e) {
    logger.warn({ error: e.message }, 'Could not parse master m3u8');
    qualities = [{ file: fileUrl, quality: 'auto' }];
  }

  return {
    file: fileUrl,
    type: 'hls',
    thumbnail,
    qualities,
    subtitles: [],
    headers: {
      Referer: new URL(url).origin,
      Origin: new URL(url).origin,
    },
  };
}

function parseJWPlayer(script) {
  let cleaned = script;

  const setupMatch = script.match(/jwplayer\([^)]+\)\.setup\(\s*({[\s\S]*?})\s*\)/);
  if (setupMatch) {
    cleaned = setupMatch[1];
  }

  try {
    const config = Function(`"use strict"; return (${cleaned})`)();
    if (config) {
      const sources = config.sources || config.playlist?.[0]?.sources || [];
      const file = config.file || config.playlist?.[0]?.file || sources[0]?.file;
      const image = config.image || config.playlist?.[0]?.image;

      if (file) {
        return { file, image: image || null };
      }
    }
  } catch {
    const fileMatch = script.match(/["']file["']\s*:\s*["']([^"']+)["']/);
    const imageMatch = script.match(/["']image["']\s*:\s*["']([^"']+)["']/);
    if (fileMatch) {
      return { file: fileMatch[1], image: imageMatch ? imageMatch[1] : null };
    }
  }

  return null;
}

module.exports = { extract };
