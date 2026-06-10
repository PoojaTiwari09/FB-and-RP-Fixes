const fs = require('fs');

const filesToFix = [
  'modules/m08-sales-engagement/services/m08.service.ts',
  'modules/m08-sales-engagement/services/workflow.service.ts',
  'modules/m09-coaching-training/frontend-api/m09-frontend-revenue-manager.controller.ts',
  'modules/m11-ai-deep-researcher/services/ai-deep-researcher.service.ts'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Only replace methods that do NOT already have a return type and are public methods inside a class.
  // We match "async methodName(args) {"
  content = content.replace(/async\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, (match, p1, p2) => {
    return `async ${p1}(${p2}): Promise<any> {`;
  });
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Fixed ${file}`);
}

// Fix M09 service "unknown" type error
const m09ServicePath = 'modules/m09-coaching-training/services/m09.service.ts';
let m09Content = fs.readFileSync(m09ServicePath, 'utf8');
m09Content = m09Content.replace(/const rep = repMap\.get\(([^)]+)\);/g, 'const rep = repMap.get($1) as any;');
fs.writeFileSync(m09ServicePath, m09Content, 'utf8');
console.log('Fixed M09 service repMap type cast');
