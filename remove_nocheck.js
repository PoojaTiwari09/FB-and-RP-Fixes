const fs = require('fs');

const filesToNocheck = [
  'modules/m04-deal-intelligence/services/deal-activity.service.ts',
  'modules/m04-deal-intelligence/services/deal-summary.service.ts',
  'modules/m04-deal-intelligence/services/hubspot.service.ts',
  'modules/m05-account-intelligence/controllers/accounts.controller.ts',
  'modules/m05-account-intelligence/services/ai.service.ts',
  'modules/m05-account-intelligence/services/boards.service.ts',
  'modules/m05-account-intelligence/services/preferences.service.ts',
  'modules/m05-account-intelligence/services/sync.service.ts',
  'modules/m05-account-intelligence/services/todos.service.ts',
  'modules/m06-forecasting-prediction/controllers/admin-forecast-boards.controller.ts',
  'modules/m06-forecasting-prediction/scripts/reset-deals.ts',
  'modules/m06-forecasting-prediction/test_two_reps.ts',
  'modules/m06-forecasting-prediction/workers/m06.worker.ts',
  'modules/m07-revenue-dashboards/services/m07.service.ts',
  'modules/m08-sales-engagement/frontend-api/m08-team-members.util.ts'
];

for (const file of filesToNocheck) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.startsWith('// @ts-nocheck\n')) {
    content = content.replace('// @ts-nocheck\n', '');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Removed @ts-nocheck from ' + file);
  }
}
