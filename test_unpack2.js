const { fetch } = require('./src/utils/request');

(async () => {
  try {
    const response = await fetch('https://nekowish.my.id/e/h4damflyfe0g');
    const html = response.data;

    const scriptRegex = /<script[^>]*>([\s\S]*?)(?:<\/script>|<\/SCRIPT>)/gi;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      const script = match[1].trim();
      if (script.includes('eval(') && script.includes('function(p,a,c,k,e,d)')) {
        console.log('=== RAW SCRIPT (first 500 chars) ===');
        console.log(script.substring(0, 500));

        const evalMatch = script.match(/eval\s*\(\s*function\s*\(p,\s*a,\s*c,\s*k,\s*e,\s*d\)\s*\{[\s\S]*?\}\s*\(([^)]+)\)\s*\)/);
        if (evalMatch) {
          console.log('\n=== EVAL MATCHED ===');
          console.log('Args group:', evalMatch[1].substring(0, 300));

          const args = evalMatch[1];
          const parts = args.split(',');
          console.log('\nParts count:', parts.length);
          parts.forEach((p, i) => {
            console.log(`Part ${i}: ${p.substring(0, 100)}`);
          });
        } else {
          console.log('\nFailed to match eval pattern');
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
