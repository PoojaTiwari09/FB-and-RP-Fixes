const fs = require('fs');

function replaceFile(path, replacements) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(path, content, 'utf8');
  console.log(`Fixed ${path}`);
}

replaceFile('modules/m02-conversation-intelligence/services/ai-topic-tagger.service.ts', [
  [/response\.candidates/g, '(response as any).candidates']
]);

replaceFile('modules/m02-conversation-intelligence/services/hybrid-search.service.ts', [
  [/response\.hits/g, '(response as any).hits']
]);

replaceFile('modules/m02-conversation-intelligence/services/translation.service.ts', [
  [/response\.choices/g, '(response as any).choices']
]);

replaceFile('modules/m02-conversation-intelligence/services/m02.service.ts', [
  [/return this\.repo\.createSavedSearch\(parsedDto, tenantId, userId\);/g, 'return this.repo.createSavedSearch(parsedDto as any, tenantId, userId);']
]);
