const fs = require('fs');

const filesToFix = [
  'modules/m07-revenue-dashboards/controllers/m07.controller.ts',
  'modules/m07-revenue-dashboards/services/m07.service.ts',
  'modules/m08-sales-engagement/frontend-api/m08-frontend-engage.controller.ts',
  'modules/m08-sales-engagement/frontend-api/m08-frontend-engage.service.ts',
  'modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.controller.ts',
  'modules/m08-sales-engagement/frontend-api/manager/m08-frontend-engage-manager.service.ts'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { Prisma } from '@rri/database';")) {
    // Add import after the first line
    content = content.replace(/^(.*?\n)/, "$1import { Prisma } from '@rri/database';\n");
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Added Prisma to ${file}`);
  }
}

// Fix M08 repositories import paths
const repos = [
  'modules/m08-sales-engagement/repositories/m08.repository.ts',
  'modules/m08-sales-engagement/repositories/workflow.repository.ts'
];
for (const repo of repos) {
  let content = fs.readFileSync(repo, 'utf8');
  content = content.replace(/import \{ PrismaService \} from '\.\.\/\.\.\/platform-core\/database\/prisma\.service';/g, "import { PrismaService } from '../database/prisma.service';");
  fs.writeFileSync(repo, content, 'utf8');
  console.log(`Fixed PrismaService path in ${repo}`);
}

// Fix M08 util TS2322 error
const m08Util = 'modules/m08-sales-engagement/frontend-api/m08-team-members.util.ts';
let utilContent = fs.readFileSync(m08Util, 'utf8');
// Replace const x: string = y with const x: any = y OR just add "as any"
utilContent = utilContent.replace(/export const M08_TEAM_MEMBERS: string\[\]/g, "export const M08_TEAM_MEMBERS: any[]");
utilContent = utilContent.replace(/export const M08_TEAM_NAMES: string\[\]/g, "export const M08_TEAM_NAMES: any[]");
fs.writeFileSync(m08Util, utilContent, 'utf8');
console.log(`Fixed M08 util TS2322 error`);

// Fix M07 service TS2322 type unknown[] is not assignable to type string[]
const m07Service = 'modules/m07-revenue-dashboards/services/m07.service.ts';
let m07Content = fs.readFileSync(m07Service, 'utf8');
m07Content = m07Content.replace(/filterTags: dashboard.filterTags as string\[\],/g, "filterTags: dashboard.filterTags as any,");
m07Content = m07Content.replace(/tabs: dashboard.tabs as string\[\],/g, "tabs: dashboard.tabs as any,");
fs.writeFileSync(m07Service, m07Content, 'utf8');
console.log(`Fixed M07 service TS2322 errors`);
