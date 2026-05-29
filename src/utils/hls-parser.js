const { fetch } = require('./request');
const logger = require('./logger');

function parseMasterPlaylist(content, baseUrl) {
  const lines = content.split('\n');
  const streams = [];
  let currentStream = {};

  for (const line of lines) {
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const match = line.match(/RESOLUTION=(\d+)x(\d+)/);
      const bandwidth = line.match(/BANDWIDTH=(\d+)/);

      currentStream = {
        quality: match ? `${match[2]}p` : 'unknown',
        resolution: match ? `${match[1]}x${match[2]}` : null,
        bandwidth: bandwidth ? parseInt(bandwidth[1], 10) : null,
      };
    } else if (line.startsWith('http') && currentStream.quality) {
      currentStream.file = line;
      streams.push(currentStream);
      currentStream = {};
    } else if (line.startsWith('http') && streams.length === 0) {
      streams.push({ file: line, quality: 'auto' });
    }
  }

  return streams;
}

function parseMediaPlaylist(content, baseUrl) {
  const lines = content.split('\n');
  const segments = [];
  let duration = 0;
  let sequence = 0;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/#EXTINF:\s*([\d.]+)/);
      if (match) duration = parseFloat(match[1]);
    } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      sequence = parseInt(line.split(':')[1], 10);
    } else if (line.startsWith('http') && !line.startsWith('#') && duration > 0) {
      segments.push({ url: line, duration, sequence: sequence++ });
      duration = 0;
    } else if (!line.startsWith('#') && line.trim() && duration > 0) {
      const resolvedUrl = new URL(line.trim(), baseUrl).href;
      segments.push({ url: resolvedUrl, duration, sequence: sequence++ });
      duration = 0;
    }
  }

  return { segments, targetDuration: getTargetDuration(lines) };
}

function getTargetDuration(lines) {
  for (const line of lines) {
    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      return parseInt(line.split(':')[1], 10);
    }
  }
  return 10;
}

function extractSubtitles(content) {
  const subtitles = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-MEDIA:TYPE=SUBTITLES')) {
      const match = lines[i].match(/URI="([^"]+)"/);
      const langMatch = lines[i].match(/LANGUAGE="([^"]+)"/);
      if (match) {
        subtitles.push({
          uri: match[1],
          language: langMatch ? langMatch[1] : 'unknown',
        });
      }
    }
  }
  return subtitles;
}

async function parseM3U8(url) {
  try {
    const response = await fetch(url);
    const content = response.data;

    if (content.includes('#EXT-X-STREAM-INF')) {
      const streams = parseMasterPlaylist(content, url);
      return { type: 'master', streams, subtitles: extractSubtitles(content) };
    }

    const playlist = parseMediaPlaylist(content, url);
    return { type: 'media', ...playlist };
  } catch (error) {
    logger.error({ error: error.message, url }, 'Failed to parse m3u8');
    throw error;
  }
}

function rewritePlaylist(content, proxyBase, originalBase, referer, origin) {
  const extraParams = [];
  if (referer) extraParams.push(`referer=${encodeURIComponent(referer)}`);
  if (origin) extraParams.push(`origin=${encodeURIComponent(origin)}`);
  const extra = extraParams.length > 0 ? `&${extraParams.join('&')}` : '';

  return content.replace(/(https?:\/\/[^\s"']+\.(?:ts|m4s|aac|m3u8)[^\s"']*)/g, (match) => {
    const clean = match.trim();
    return `${proxyBase}/proxy?url=${encodeURIComponent(clean)}${extra}`;
  }).replace(/^([^#\s][^\s]*(?:\.ts|\.m4s|\.aac|\.m3u8)[^\s]*)/gm, (match) => {
    const clean = match.trim();
    const resolved = new URL(clean, originalBase).href;
    return `${proxyBase}/proxy?url=${encodeURIComponent(resolved)}${extra}`;
  });
}

module.exports = { parseMasterPlaylist, parseMediaPlaylist, parseM3U8, extractSubtitles, rewritePlaylist };
