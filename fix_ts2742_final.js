const fs = require('fs');

const logPath = 'C:\\Users\\Relanto\\.gemini\\antigravity-ide\\brain\\5bc64aa8-a9c7-4b99-b74c-9d01a816c8fd\\.system_generated\\tasks\\task-571.log';
const log = fs.readFileSync(logPath, 'utf8');
const lines = log.split('\n');
const filesToFix = new Set();

for(const line of lines) {
  const match = line.match(/^(\.\.\/\.\.\/modules\/[^:]+\.ts)\(\d+,\d+\): error TS2742/);
  if(match) filesToFix.add(match[1]);
}

for(const file of filesToFix) {
  const fullPath = file.replace('../../', '');
  let content = fs.readFileSync(fullPath, 'utf8');
  if(!content.includes("import { Prisma } from '@rri/database'")) {
    content = "import { Prisma } from '@rri/database';\n" + content;
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed ' + fullPath);
  }
}
