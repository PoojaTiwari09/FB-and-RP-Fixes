const fs = require('fs');
const target = 'r-revenue-intelligence-monorepo/boilerplate code/r-revenue-intelligence/packages/database/prisma/schema.prisma';
const src = fs.readFileSync(target, 'utf8');
const blockRe = /(^|\n)model\s+(\w+)\s*\{([\s\S]*?)\n\}/gm;
let added = 0;
const out = src.replace(blockRe, (full, prefix, name, body) => {
  if (body.includes('@@schema(')) return full;
  added++;
  const trimmed = body.replace(/\n\s*$/, '');
  return prefix + 'model ' + name + ' {' + trimmed + '\n  @@schema("public")\n}';
});
fs.writeFileSync(target, out);
console.log('models patched:', added);
