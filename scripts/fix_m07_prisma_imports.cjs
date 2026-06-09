// Point M07 API routes at shared @rri/database Prisma client (not bare @prisma/client).
const fs = require('fs');
const path = require('path');

const apiRoot = path.join(
  __dirname,
  '../apps/web/src/modules/m07-revenue-dashboards/api',
);
const prismaImport =
  'import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";\n';

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name === 'route.ts') {
      let src = fs.readFileSync(full, 'utf8');
      if (!src.includes('@rri/database/node_modules/@prisma/client')) continue;

      src = src.replace(
        /import \{ PrismaClient \} from ['"]@rri\/database\/node_modules\/@prisma\/client['"];\s*\n/g,
        '',
      );
      src = src.replace(/const prisma = new PrismaClient\(\);\s*\n/g, '');
      if (!src.includes('m07-revenue-dashboards/lib/prisma')) {
        src = prismaImport + src;
      }
      fs.writeFileSync(full, src, 'utf8');
      console.log('fixed', path.relative(apiRoot, full));
    }
  }
}

walk(apiRoot);
console.log('M07 prisma imports updated.');
