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
        } else if (file.endsWith('.ts')) {
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

    // Remove old RolesGuard
    if (content.includes('RolesGuard')) {
        // Remove from @UseGuards(...)
        content = content.replace(/@UseGuards\(([^)]*)\)/g, (match, guards) => {
            const newGuards = guards.split(',').map(g => g.trim()).filter(g => g !== 'RolesGuard').join(', ');
            if (newGuards) return `@UseGuards(${newGuards})`;
            return ''; // Remove empty @UseGuards()
        });
        
        // Remove the import statement for RolesGuard
        content = content.replace(/import\s*\{\s*RolesGuard\s*\}\s*from\s*[^;]+;[\r\n]*/g, '');
        // Also remove local export class RolesGuard if it exists
        content = content.replace(/export\s+class\s+RolesGuard\s+implements\s+CanActivate\s*\{[\s\S]*?\n\}\n/g, '');
        changed = true;
    }

    // Replace @Roles with @RequirePermissions
    if (content.includes('@Roles(')) {
        content = content.replace(/@Roles\(([^)]*)\)/g, (match, args) => {
            const upperArgs = args.toUpperCase();
            if (upperArgs.includes('ADMIN') || upperArgs.includes('ORG_ADMIN')) return `@RequirePermissions('system.manage')`;
            if (upperArgs.includes('MANAGER')) return `@RequirePermissions('team.manage')`;
            return `@RequirePermissions('task.view')`;
        });
        changed = true;
    }

    // Handle import { Roles }
    if (content.includes('import { Roles }') || content.includes('import {Roles}')) {
        // Get relative path to platform-core/decorators/permissions.decorator
        const platformCorePath = path.join(rootDir, 'platform-core', 'decorators', 'permissions.decorator.ts');
        let relativePath = path.relative(path.dirname(file), platformCorePath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        relativePath = relativePath.replace('.ts', '');

        content = content.replace(/import\s*\{\s*Roles\s*\}\s*from\s*[^;]+;[\r\n]*/g, `import { RequirePermissions } from '${relativePath}';\n`);
        changed = true;
    } else if (content.includes('@RequirePermissions') && !content.includes('import { RequirePermissions }')) {
        const platformCorePath = path.join(rootDir, 'platform-core', 'decorators', 'permissions.decorator.ts');
        let relativePath = path.relative(path.dirname(file), platformCorePath).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        relativePath = relativePath.replace('.ts', '');
        
        // Insert at the top
        content = `import { RequirePermissions } from '${relativePath}';\n` + content;
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});
