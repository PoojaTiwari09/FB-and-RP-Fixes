const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist')) {
                results = results.concat(walk(file));
            }
        } else if (file.endsWith('prisma.service.ts')) {
            results.push(file);
        }
    });
    return results;
}

const rootDir = 'c:/Users/Relanto/Desktop/RevenueIntellegence/modules';
const files = walk(rootDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (!content.includes('getExtendedPrismaClient')) {
        // Get relative path to platform-core/database/prisma.extension
        const extensionPath = path.join(rootDir, 'platform-core', 'database', 'prisma.extension.ts');
        let relativePath = path.relative(path.dirname(file), extensionPath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        relativePath = relativePath.replace('.ts', '');

        content = `import { getExtendedPrismaClient } from '${relativePath}';\n` + content;
        
        // Add constructor
        if (content.includes('class PrismaService extends PrismaClient')) {
            // Find class body start
            const classRegex = /class PrismaService[^{]*\{/;
            content = content.replace(classRegex, (match) => {
                return match + `\n  constructor() {\n    super();\n    return getExtendedPrismaClient(this as any) as any;\n  }\n`;
            });
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
