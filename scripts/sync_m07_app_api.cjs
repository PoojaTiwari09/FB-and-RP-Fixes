// Generates app/api route.ts re-exports for M07 standalone Next.js.
const fs = require('fs');
const path = require('path');

const moduleRoot = path.join(__dirname, '../apps/web/src/modules/m07-revenue-dashboards');
const apiRoot = path.join(moduleRoot, 'api');
const appApiRoot = path.join(moduleRoot, 'app/api');

function walk(dir, rel = '') {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full, relPath);
    } else if (ent.name === 'route.ts') {
      const importPath = `@/modules/m07-revenue-dashboards/api/${relPath.replace(/\\/g, '/')}`;
      const dest = path.join(appApiRoot, relPath);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, `export * from '${importPath}';\n`, 'utf8');
      console.log('linked', relPath);
    }
  }
}

if (!fs.existsSync(apiRoot)) {
  console.error('M07 api root not found:', apiRoot);
  process.exit(1);
}
walk(apiRoot);
console.log('M07 app/api route re-exports synced.');
