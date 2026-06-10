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
    fs.writeFileSync(file, "import { Prisma } from '@rri/database';\n" + content, 'utf8');
    console.log(`Added Prisma to ${file}`);
  }
}

// Ensure TS2322 is fixed for M07 since I checked out the service
const m07Service = 'modules/m07-revenue-dashboards/services/m07.service.ts';
let m07Content = fs.readFileSync(m07Service, 'utf8');
m07Content = m07Content.replace(/filterTags: dashboard.filterTags as string\[\],/g, "filterTags: dashboard.filterTags as any,");
m07Content = m07Content.replace(/tabs: dashboard.tabs as string\[\],/g, "tabs: dashboard.tabs as any,");
fs.writeFileSync(m07Service, m07Content, 'utf8');
