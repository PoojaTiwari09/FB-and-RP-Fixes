const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../modules/m04-deal-intelligence/controllers');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace imports
  content = content.replace(
    /import\s+{[^}]+}\s+from\s+'@\/guards\/auth\.guard';?/g,
    "import { JwtAuthGuard } from '../../platform-core/guards/jwt.guard';\nimport { TenantGuard } from '../../platform-core/guards/tenant.guard';"
  );

  content = content.replace(
    /import\s+{[^}]+}\s+from\s+'@\/guards\/roles\.guard';?/g,
    "import { RolesGuard } from '../../platform-core/guards/roles.guard';"
  );

  content = content.replace(
    /import\s+{[^}]+}\s+from\s+'@\/decorators\/roles\.decorator';?/g,
    "import { Roles } from '../../platform-core/decorators/roles.decorator';"
  );

  content = content.replace(
    /import\s+{[^}]+}\s+from\s+'@\/interfaces\/user-role\.enum';?/g,
    "import { UserRole } from '@rri/database';"
  );

  // Replace UseGuards
  content = content.replace(/@UseGuards\(\s*AuthGuard\s*\)/g, '@UseGuards(JwtAuthGuard, TenantGuard)');
  content = content.replace(/@UseGuards\(\s*AuthGuard\s*,\s*RolesGuard\s*\)/g, '@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)');
  content = content.replace(/@UseGuards\(\s*RolesGuard\s*,\s*AuthGuard\s*\)/g, '@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)');

  // Replace role enum values
  content = content.replace(/UserRole\.USER/g, 'UserRole.SALES_REP');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(controllersDir);
for (const file of files) {
  if (file.endsWith('.ts')) {
    processFile(path.join(controllersDir, file));
  }
}
console.log('Guard replacements completed!');
