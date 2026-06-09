const fs = require('fs');
const file = 'src/features/deal-boards/components/mocks/deal-boards.mocks.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /activityOverTime:\s*generateRandomActivity\(\)\s*\},[\s\S]*?\]\,/g;
content = content.replace(regex, 'activityOverTime: generateRandomActivity(),');

fs.writeFileSync(file, content);
console.log('Fixed syntax errors');
