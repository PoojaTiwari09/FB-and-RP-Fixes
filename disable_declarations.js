const fs = require('fs');
const cp = require('child_process');

const files = cp.execSync('dir /s /b tsconfig.json').toString().split('\r\n').filter(Boolean);

for (const f of files) {
  if (f.includes('node_modules')) continue;
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('"declaration": true')) {
    content = content.replace(/"declaration":\s*true/g, '"declaration": false');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Disabled declaration in ' + f);
  }
}
