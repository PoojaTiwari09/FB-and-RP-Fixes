const fs = require('fs');
const path = require('path');
const dir = 'services/__tests__';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
files.forEach(f => {
  let p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/import\s+\{\s*EventPublisherService\s*\}\s+from\s+['"].*?['"];/g, "import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';");
  fs.writeFileSync(p, content);
});
