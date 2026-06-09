const fs = require('fs');
const file = 'src/features/deal-boards/components/mocks/deal-boards.mocks.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace activityOverTime: generateRandomActivity() with hardcoded arrays for the first 4 deals
content = content.replace(
  /dealId: "deal-1"[\s\S]*?activityOverTime:\s*generateRandomActivity\(\)/,
  (match) => match.replace('generateRandomActivity()', [
        { dateLabel: '', count: 3, interactions: [] },
        { dateLabel: '', count: 5, interactions: [] },
        { dateLabel: '', count: 3, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] }
      ])
);

content = content.replace(
  /dealId: "deal-2"[\s\S]*?activityOverTime:\s*generateRandomActivity\(\)/,
  (match) => match.replace('generateRandomActivity()', [
        { dateLabel: '', count: 4, interactions: [] },
        { dateLabel: '', count: 5, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] }
      ])
);

content = content.replace(
  /dealId: "deal-3"[\s\S]*?activityOverTime:\s*generateRandomActivity\(\)/,
  (match) => match.replace('generateRandomActivity()', [
        { dateLabel: '', count: 3, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] }
      ])
);

content = content.replace(
  /dealId: "deal-4"[\s\S]*?activityOverTime:\s*generateRandomActivity\(\)/,
  (match) => match.replace('generateRandomActivity()', [
        { dateLabel: '', count: 4, interactions: [] },
        { dateLabel: '', count: 4, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] },
        { dateLabel: '', count: 0, interactions: [] }
      ])
);

fs.writeFileSync(file, content);
