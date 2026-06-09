const fs = require('fs');
const file = 'src/features/deal-boards/components/mocks/deal-boards.mocks.ts';
let content = fs.readFileSync(file, 'utf8');

const reasons = [
  "Manager has escalated this deal due to lack of recent progress.",
  "Escalated by VP of Sales — requires immediate action.",
  "Manager has escalated this deal: close date is at risk.",
  "Regional Director escalated this opportunity for priority review."
];

let replaced = 0;
// First remove any existing flagReason lines
content = content.replace(/\n\s*flagReason:\s*".*",/g, '');

// Then add the new ones
content = content.replace(/flagCount:\s*([0-9]+),/g, (match, countStr) => {
  const count = parseInt(countStr);
  let reason = '';
  if (count > 0) {
    reason = '\n      flagReason: "' + reasons[replaced % reasons.length] + '",';
    replaced++;
  }
  return match + reason;
});

fs.writeFileSync(file, content);
