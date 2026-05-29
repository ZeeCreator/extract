const axios = require('axios');
const { unpackEvalPacked, extractStreamUrls, extractImageUrl } = require('./src/utils/unpacker');

async function main() {
  try {
    const resp = await axios.get('https://nekowish.my.id/e/h4damflyfe0g', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://nekowish.my.id/',
      },
      timeout: 15000,
    });

    const html = resp.data;
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      const inner = match[1].trim();
      if (inner.includes('eval(') && inner.includes('function(p,a,c,k,e,d)')) {
        const unpacked = unpackEvalPacked(inner);
        if (unpacked) {
          console.log('=== UNPACKED (first 2000 chars) ===');
          console.log(unpacked.substring(0, 2000));

          const urls = extractStreamUrls(unpacked);
          console.log('\n=== STREAM URLS FOUND ===');
          console.log(JSON.stringify(urls, null, 2));

          const img = extractImageUrl(unpacked);
          console.log('\n=== IMAGE URL ===');
          console.log(img);

          const allFileMatches = unpacked.match(/["'](?:file|src)["']\s*:\s*["']([^"']+)["']/g);
          console.log('\n=== ALL file/src MATCHES ===');
          if (allFileMatches) {
            allFileMatches.forEach(m => console.log(m));
          } else {
            console.log('NONE');
          }

          const allUrl = unpacked.match(/https?:\/\/[^\s"'<>]+/g);
          console.log('\n=== ALL HTTP URLS ===');
          if (allUrl) {
            allUrl.forEach(u => console.log(u));
          } else {
            console.log('NONE');
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
