const fs = require('fs');
const path = require('path');

const files = [
  'c:/Users/Relanto/OneDrive - Relanto/Downloads/120_refactoring/122/r-revenue-intelligence-monorepo/docs/API-docs and collections/postman_collection_updated.json',
  'c:/Users/Relanto/OneDrive - Relanto/Downloads/120_refactoring/122/r-revenue-intelligence-monorepo/docs/API-docs and collections/collection-m3.json'
];

files.forEach(file => {
  console.log('--- FILE:', path.basename(file));
  if (!fs.existsSync(file)) {
    console.log('File does not exist');
    return;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('Collection name:', data.info ? data.info.name : 'Unknown');
  if (data.item) {
    data.item.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name} (${item.item ? item.item.length + ' subitems' : 'request'})`);
    });
  }
});
