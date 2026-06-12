const fs = require('fs');
const file = 'c:/Users/Relanto/OneDrive - Relanto/Downloads/120_refactoring/122/r-revenue-intelligence-monorepo/docs/API-docs and collections/collection-m3.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('Variables:', data.variable || []);
