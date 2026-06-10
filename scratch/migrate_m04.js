const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const m04ControllerPath = path.join(rootDir, 'modules/m04-deal-intelligence/controllers/deals.controller.ts');
const nextConfigPath = path.join(rootDir, 'apps/web/next.config.ts');
const dealBoardsService1 = path.join(rootDir, 'apps/web/src/features/deal-drivers/dealboards_rep/services/dealBoardsService.ts');
const dealBoardsService2 = path.join(rootDir, 'apps/web/src/features/deal-boards/components/services/dealBoardsService.ts');

function migrateM04() {
  console.log("Migrating M04 backend controllers...");
  if (fs.existsSync(m04ControllerPath)) {
    let content = fs.readFileSync(m04ControllerPath, 'utf8');
    
    // Change @Controller('api/deals') to @Controller('api/v1/deal-management')
    content = content.replace(/@Controller\('api\/deals'\)/g, "@Controller('api/v1/deal-management')");
    
    // Change @Controller('api/deal-boards') to @Controller('api/v1/deal-management/deal-boards')
    content = content.replace(/@Controller\('api\/deal-boards'\)/g, "@Controller('api/v1/deal-management/deal-boards')");
    
    // Change @Controller('api/notifications') to @Controller('api/v1/deal-management/notifications')
    content = content.replace(/@Controller\('api\/notifications'\)/g, "@Controller('api/v1/deal-management/notifications')");

    fs.writeFileSync(m04ControllerPath, content);
    console.log("Updated deals.controller.ts");
  }

  console.log("Removing rewrites from next.config.ts...");
  if (fs.existsSync(nextConfigPath)) {
    let content = fs.readFileSync(nextConfigPath, 'utf8');
    content = content.replace(/\s*\{\s*source:\s*'\/api\/deals\/:path\*'.*?\n/g, '\n');
    content = content.replace(/\s*\{\s*source:\s*'\/api\/deal-boards\/:path\*'.*?\n/g, '\n');
    content = content.replace(/\s*\{\s*source:\s*'\/api\/notifications\/:path\*'.*?\n/g, '\n');
    fs.writeFileSync(nextConfigPath, content);
    console.log("Removed M04 rewrites");
  }

  console.log("Rewiring frontend dealBoardsService...");
  const updateService = (p) => {
    if (fs.existsSync(p)) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Ensure resolveApiBase is imported
      if (!content.includes('resolveApiBase')) {
        content = content.replace("import { ENV } from '@shared/config/env';", "import { resolveApiBase } from '@shared/config/module-api';\nimport { ENV } from '@shared/config/env';");
      }
      
      // Replace ENV base urls with resolveApiBase()
      content = content.replace(/const BASE_URL\s*=\s*(ENV\.M04_API_BASE_URL|ENV\.API_BASE_URL|'[^']+');/g, "const BASE_URL = resolveApiBase() + '/api/v1/deal-management';");
      
      // Replace /api/deals, /api/deal-boards, /api/notifications with appropriate paths
      // Wait, if BASE_URL points to /api/v1/deal-management, then calls like `${BASE_URL}/api/deals/...` will become `/api/v1/deal-management/api/deals/...`
      // I should strip `/api/deals` from the fetch calls or redefine BASE_URL.
      // Actually, if I just replace '/api/deals' with '' (empty string) or ensure it doesn't double up.
      content = content.replace(/\/api\/deals\//g, '/');
      content = content.replace(/\/api\/deals/g, '');
      content = content.replace(/\/api\/deal-boards\//g, '/deal-boards/');
      content = content.replace(/\/api\/deal-boards/g, '/deal-boards');
      content = content.replace(/\/api\/notifications\//g, '/notifications/');
      content = content.replace(/\/api\/notifications/g, '/notifications');

      fs.writeFileSync(p, content);
      console.log(`Updated ${p}`);
    }
  };

  updateService(dealBoardsService1);
  updateService(dealBoardsService2);

  console.log("M04 Migration Complete");
}

migrateM04();
