const fs = require('fs');
const path = require('path');

const controllers = [
  'modules/m04-deal-intelligence/controllers/deals.controller.ts',
  'modules/m04-deal-intelligence/controllers/deal-boards.controller.ts',
  'modules/m04-deal-intelligence/controllers/manager.controller.ts'
];

controllers.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Search for catch (error: any) { and check if it already has the throw statement
  const target = '} catch (error: any) {';
  const replacement = '} catch (error: any) {\n      if (error instanceof BadRequestException) throw error;';

  // Replace all occurrences where the check is not already present
  let updatedContent = '';
  let index = 0;
  
  while (true) {
    const nextIndex = content.indexOf(target, index);
    if (nextIndex === -1) {
      updatedContent += content.substring(index);
      break;
    }
    
    updatedContent += content.substring(index, nextIndex);
    
    // Check if the next few lines already contain the throw statement to avoid duplicate insertions
    const afterTarget = content.substring(nextIndex + target.length);
    if (afterTarget.trim().startsWith('if (error instanceof BadRequestException)')) {
      updatedContent += target;
    } else {
      updatedContent += replacement;
    }
    
    index = nextIndex + target.length;
  }

  fs.writeFileSync(fullPath, updatedContent, 'utf8');
  console.log(`Updated catch blocks in: ${relPath}`);
});
