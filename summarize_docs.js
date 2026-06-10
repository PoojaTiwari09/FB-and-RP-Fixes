const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Relanto\\Desktop\\RevenueIntellegence\\docs\\reference\\Detialled product level docs\\markdown documents';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

let summary = '';

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract all headings (lines starting with #)
  const headings = content.split('\n').filter(line => line.trim().startsWith('# ')).slice(0, 10).map(l => l.trim()).join(' | ');
  summary += `File: ${file} (Size: ${content.length})\nHeadings: ${headings || 'None'}\n\n`;
}

fs.writeFileSync('C:\\Users\\Relanto\\Desktop\\RevenueIntellegence\\docs_summary.txt', summary, 'utf8');
console.log('Summary created at C:\\Users\\Relanto\\Desktop\\RevenueIntellegence\\docs_summary.txt');
