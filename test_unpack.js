const { unpackEvalPacked } = require('./src/utils/unpacker');
const { fetch } = require('./src/utils/request');

(async () => {
  try {
    const response = await fetch('https://nekowish.my.id/e/h4damflyfe0g');
    const html = response.data;

    const scriptRegex = /<script[^>]*>([\s\S]*?)(?:<\/script>|<\/SCRIPT>)/gi;
    let match;
    let found = false;

    while ((match = scriptRegex.exec(html)) !== null) {
      const script = match[1];
      if (script.includes('eval(') && script.includes('function(p,a,c,k,e,d)')) {
        found = true;
        console.log('Found eval-packed script, length:', script.length);
        const unpacked = unpackEvalPacked(script);
        if (unpacked) {
          console.log('\n=== UNPACKED SUCCESSFULLY ===\n');
          console.log(unpacked.substring(0, 3000));

          const fileRegex = /["'](?:file|src)["']\s*:\s*["']([^"']+)["']/g;
          let fm;
          while ((fm = fileRegex.exec(unpacked)) !== null) {
            if (fm[1].includes('.m3u8') || fm[1].includes('.mp4')) {
              console.log('\n=== FOUND STREAM URL ===');
              console.log(fm[1]);
            }
          }

          const oMatch = unpacked.match(/var\s+(\w+)\s*=\s*\{[^}]+\}/);
          if (oMatch) {
            console.log('\n=== VAR OBJECT ===');
            console.log(oMatch[0]);
          }
        } else {
          console.log('Failed to unpack');
        }
        break;
      }
    }

    if (!found) {
      console.log('No eval-packed script found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
