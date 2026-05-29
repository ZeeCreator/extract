function unpackEvalPacked(script) {
  try {
    const fnCallMatch = script.match(/eval\s*\(\s*function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\(([\s\S]*?)\)\s*\)\s*;?\s*$/);
    if (!fnCallMatch) return null;

    const argsStr = fnCallMatch[1];

    const argParts = splitArgs(argsStr);
    if (argParts.length < 4) return null;

    const encodedStr = argParts[0].replace(/^['"]|['"]$/g, '').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const radix = parseInt(argParts[1], 10);
    const count = parseInt(argParts[2], 10);
    const dictStr = argParts[3].replace(/^['"]|['"]$/g, '');

    const dictMatch = dictStr.match(/^([^'"]+)(?:\.split\s*\(\s*['"]\|['"]\s*\))?/);
    if (!dictMatch) return null;

    const dictionary = dictMatch[1].split('|');

    let result = encodedStr;
    for (let i = 0; i < Math.min(count, dictionary.length); i++) {
      if (dictionary[i]) {
        const pattern = new RegExp('\\b' + i.toString(radix) + '\\b', 'g');
        result = result.replace(pattern, dictionary[i]);
      }
    }

    return result;
  } catch (err) {
    return null;
  }
}

function splitArgs(str) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = null;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      current += ch;
      if (ch === stringChar && str[i - 1] !== '\\') {
        inString = false;
        stringChar = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') {
      depth++;
      current += ch;
      continue;
    }

    if (ch === ')' || ch === '}' || ch === ']') {
      depth--;
      current += ch;
      continue;
    }

    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

function extractStreamUrls(unpacked) {
  const seen = new Set();
  const m3u8Urls = [];
  const txtUrls = [];

  const linksMatch = unpacked.match(/var\s+links\s*=\s*\{([^}]+)\}/);
  if (linksMatch) {
    const propRe = /["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g;
    let m;
    while ((m = propRe.exec(linksMatch[1])) !== null) {
      const key = m[1], url = m[2];
      if (seen.has(url)) continue;
      seen.add(url);
      (url.includes('.m3u8') ? m3u8Urls : url.includes('.txt') ? txtUrls : []).push({ key, url });
    }
  }

  const httpUrls = unpacked.match(/https?:\/\/[^\s"'<>,;)]+/g) || [];
  for (const url of httpUrls) {
    if (seen.has(url)) continue;
    seen.add(url);
    if (url.includes('.m3u8')) m3u8Urls.push({ key: 'direct', url });
    else if (url.includes('.txt')) txtUrls.push({ key: 'direct', url });
  }

  return m3u8Urls.length > 0 ? m3u8Urls : txtUrls;
}

function extractImageUrl(unpacked) {
  const match = unpacked.match(/image\s*:\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}

module.exports = { unpackEvalPacked, extractStreamUrls, extractImageUrl };
