/**
 * One-time: strip TypeORM decorators from entities/*.entity.ts
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'entities');
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.entity.ts')) continue;
  let src = fs.readFileSync(path.join(dir, file), 'utf8');
  src = src.replace(/import\s*\{[^}]*\}\s*from\s*['"]typeorm['"];?\s*\n/g, '');
  src = src.replace(/^\s*@\w+[^\n]*\n/gm, '');
  src = src.replace(/\n\s*\/\/ Relations\s*\n/g, '\n');
  if (!src.includes('Prisma domain')) {
    src = `/** Prisma domain model — TypeORM removed */\n${src}`;
  }
  fs.writeFileSync(path.join(dir, file), src);
  console.log('stripped', file);
}
