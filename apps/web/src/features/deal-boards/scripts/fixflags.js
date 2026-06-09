const fs = require('fs');
const file = 'src/features/deal-boards/components/mocks/deal-boards.mocks.ts';
let content = fs.readFileSync(file, 'utf8');

const reasons = [
  "Deal stalled for > 14 days",
  "Competitor mentioned in recent call",
  "Budget lacking final executive approval",
  "Primary champion left the company",
  "Legal review delayed by 2 weeks"
];

let replaced = 0;
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
