const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (dir.includes('node_modules') || dir.includes('.next')) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      if (fs.statSync(dirFile).isDirectory()) {
        filelist = walkSync(dirFile, filelist);
      } else {
        if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
          filelist.push(dirFile);
        }
      }
    } catch(e) {}
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, '../apps/web/src'));

const M02_ROUTES = [
  'call-reviews',
  'scorecards',
  'users',
  'meta',
  'manager/calls',
  'analytics',
  'search',
  'filters',
  'calls',
  'streams',
  'trackers'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace base URLs
  if (content.includes('ENV.M02_API_BASE_URL')) {
    if (!content.includes('resolveApiBase')) {
      content = content.replace("import { ENV } from '@shared/config/env';", "import { resolveApiBase } from '@shared/config/module-api';\nimport { ENV } from '@shared/config/env';");
    }
    content = content.replace(/\$\{ENV\.M02_API_BASE_URL\}/g, "${resolveApiBase()}");
  }

  // Replace routes
  M02_ROUTES.forEach(route => {
    // We only want to replace /api/route with /api/v1/conversation-intelligence/route
    const regex = new RegExp(`\\/api\\/${route.replace('/', '\\/')}`, 'g');
    content = content.replace(regex, `/api/v1/conversation-intelligence/${route}`);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
