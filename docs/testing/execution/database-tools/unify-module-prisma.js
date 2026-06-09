/**
 * Re-point each module's PrismaService onto the unified `@rri/database`
 * client (which is generated from `packages/database/prisma/schema.prisma`).
 *
 * This is the smoke-test minimum: it gives every module a Prisma client that
 * actually contains the platform-level models (CallRecord, Transcript, Deal,
 * etc.) that the existing repositories already call. Without this every
 * module ends up with its own per-module @prisma/client generated from a
 * stub schema, so calls like `prisma.callRecord.findMany()` blow up with
 * "Cannot read properties of undefined".
 */
const fs = require('fs');
const path = require('path');

const monorepoRoot = path.resolve(
  __dirname,
  'r-revenue-intelligence-monorepo',
  'boilerplate code',
  'r-revenue-intelligence',
);
const modulesDir = path.join(monorepoRoot, 'modules');

const moduleDirs = fs
  .readdirSync(modulesDir)
  .filter((d) => /^m\d{2}-/.test(d))
  .map((d) => path.join(modulesDir, d));

let edits = 0;
for (const dir of moduleDirs) {
  const prismaServicePath = path.join(dir, 'database', 'prisma.service.ts');
  if (!fs.existsSync(prismaServicePath)) continue;
  const src = fs.readFileSync(prismaServicePath, 'utf8');
  let out = src;
  // Swap the @prisma/client import for the unified @rri/database client.
  out = out.replace(/from\s+['"]@prisma\/client['"]/g, "from '@rri/database'");
  if (out !== src) {
    fs.writeFileSync(prismaServicePath, out);
    edits++;
    console.log('updated', path.relative(monorepoRoot, prismaServicePath));
  }

  // Make sure the module's package.json declares the workspace dep so pnpm
  // resolves @rri/database to the generated client.
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    if (pkg.dependencies['@rri/database'] !== 'workspace:*') {
      pkg.dependencies['@rri/database'] = 'workspace:*';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('  + @rri/database dep in', path.relative(monorepoRoot, pkgPath));
    }
  }
}

console.log('files updated:', edits);
