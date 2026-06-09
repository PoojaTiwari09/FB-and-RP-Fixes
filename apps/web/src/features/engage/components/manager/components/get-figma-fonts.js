const fs = require('fs');

const logPath = 'C:\\Users\\Relanto\\.gemini\\antigravity-ide\\brain\\91312fce-5a8a-4551-8588-394a98fcac7b\\.system_generated\\logs\\transcript.jsonl';
if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');

// We want to find any occurrences of "fontFamily" or inline font settings in the RedesignedAppNew.tsx code.
const regex = /(fontFamily|font-family|font-sans|font-mono|font-serif|fontFamily:)[^,\n\}]+/gi;
let match;
let output = '';
let count = 0;

while ((match = regex.exec(content)) !== null) {
  count++;
  const start = Math.max(0, match.index - 150);
  const end = Math.min(content.length, match.index + match[0].length + 150);
  const snippet = content.slice(start, end).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"');
  output += `\n--- Match ${count} ---\n${snippet}\n`;
}

fs.writeFileSync('./font-figma-details.txt', output);
console.log(`Saved ${count} matches to font-figma-details.txt`);
