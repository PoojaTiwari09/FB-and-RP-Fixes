const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../modules/m04-deal-intelligence');

function walkDir(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.ts')) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace @/ in from or import or require strings
  content = content.replace(/(from\s+['"])@\//g, "$1@m04/");
  content = content.replace(/(import\s+['"])@\//g, "$1@m04/");
  content = content.replace(/(require\(['"])@\//g, "$1@m04/");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated path alias: ${path.relative(targetDir, filePath)}`);
  }
}

console.log('Starting path alias replacement...');
walkDir(targetDir);
console.log('Path alias replacement completed!');
