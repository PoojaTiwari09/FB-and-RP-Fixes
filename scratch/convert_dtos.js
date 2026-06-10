const fs = require('fs');
const path = require('path');

const modulesDir = path.resolve(__dirname, '../modules');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      callback(filepath);
    }
  });
}

walk(modulesDir, filepath => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Replace export type XXXDto = z.infer<typeof YYY>;
  // with export interface XXXDto extends z.infer<typeof YYY> {}
  content = content.replace(
    /export\s+type\s+(\w+Dto)\s+=\s+z\.infer<typeof\s+(\w+)>;/g,
    'export interface $1 extends z.infer<typeof $2> {}'
  );

  // Replace export type XXXDto = { ... }
  // with export interface XXXDto { ... }
  content = content.replace(
    /export\s+type\s+(\w+Dto)\s+=\s*\{/g,
    'export interface $1 {'
  );

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated DTOs in: ${filepath}`);
  }
});
