// @rri/database — unified Prisma client re-export.
// The schema and generated client live in `packages/database/prisma/` and
// `packages/database/node_modules/.prisma/client` respectively. We surface
// the generated client through this entry point so the rest of the monorepo
// can `import { PrismaClient, ... } from '@rri/database'` without having to
// know about the relative .prisma/client path.
const generated = require('./node_modules/.prisma/client');
module.exports = generated;
