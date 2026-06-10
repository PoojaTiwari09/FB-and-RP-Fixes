const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const m02Dir = path.join(rootDir, 'modules/m02-conversation-intelligence');
const frontendApiDir = path.join(m02Dir, 'frontend-api');

if (!fs.existsSync(frontendApiDir)) {
  console.log("frontend-api already deleted.");
  process.exit(0);
}

const files = fs.readdirSync(frontendApiDir);

files.forEach(file => {
  const oldPath = path.join(frontendApiDir, file);
  let newDir = '';
  if (file.includes('controller')) newDir = 'controllers';
  else if (file.includes('service')) newDir = 'services';
  else if (file.includes('schema') || file.includes('mapper')) newDir = 'schemas';
  else newDir = 'interfaces';

  const newPath = path.join(m02Dir, newDir, file);
  fs.renameSync(oldPath, newPath);
  console.log(`Moved ${file} to ${newDir}`);

  // If controller, update routes
  if (file.includes('controller')) {
    let content = fs.readFileSync(newPath, 'utf8');
    content = content.replace(/@Controller\('api\//g, "@Controller('api/v1/conversation-intelligence/");
    // Fix imports
    content = content.replace(/\.\/m02-frontend/g, '../services/m02-frontend');
    content = content.replace(/\.\/m02-frontend(.*)\.schema/g, '../schemas/m02-frontend$1.schema');
    content = content.replace(/\.\/m02-frontend(.*)\.mapper/g, '../schemas/m02-frontend$1.mapper');
    fs.writeFileSync(newPath, content);
  } else if (file.includes('service')) {
    let content = fs.readFileSync(newPath, 'utf8');
    content = content.replace(/\.\/m02-frontend(.*)\.schema/g, '../schemas/m02-frontend$1.schema');
    content = content.replace(/\.\/m02-frontend(.*)\.mapper/g, '../schemas/m02-frontend$1.mapper');
    fs.writeFileSync(newPath, content);
  }
});

fs.rmdirSync(frontendApiDir);
console.log("Deleted frontend-api dir");

// Update module file
const modulePath = path.join(m02Dir, 'm02-conversation-intelligence.module.ts');
if (fs.existsSync(modulePath)) {
  let content = fs.readFileSync(modulePath, 'utf8');
  content = content.replace(/\.\/frontend-api\//g, './controllers/');
  // Fix service imports which were just replaced to controllers/
  content = content.replace(/controllers\/m02-frontend-search\.service/g, 'services/m02-frontend-search.service');
  content = content.replace(/controllers\/m02-frontend-call-reviews\.service/g, 'services/m02-frontend-call-reviews.service');
  content = content.replace(/controllers\/m02-frontend-trackers\.service/g, 'services/m02-frontend-trackers.service');
  fs.writeFileSync(modulePath, content);
  console.log("Updated module imports");
}

// Update Next config
const nextConfigPath = path.join(rootDir, 'apps/web/next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  let content = fs.readFileSync(nextConfigPath, 'utf8');
  const rewritesToRemove = [
    '/api/call-reviews',
    '/api/scorecards',
    '/api/users',
    '/api/meta',
    '/api/manager/calls',
    '/api/analytics',
    '/api/search',
    '/api/filters',
    '/api/calls',
    '/api/streams',
    '/api/trackers'
  ];
  rewritesToRemove.forEach(route => {
    const regex = new RegExp(`\\s*\\{\\s*source:\\s*'${route}\\/:path\\*'.*?\\n`, 'g');
    content = content.replace(regex, '\n');
    const regex2 = new RegExp(`\\s*\\{\\s*source:\\s*'${route}'.*?\\n`, 'g');
    content = content.replace(regex2, '\n');
  });
  fs.writeFileSync(nextConfigPath, content);
  console.log("Removed rewrites from next config");
}

console.log("M02 Backend Migration Complete");
