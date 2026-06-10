const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../packages/database/prisma/schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const lines = schemaContent.split('\n');
const tables = [];
let currentModel = null;
let hasTenantId = false;

for (let line of lines) {
    line = line.trim();
    if (line.startsWith('model ')) {
        if (currentModel && hasTenantId) {
            tables.push(currentModel);
        }
        currentModel = line.split(' ')[1];
        hasTenantId = false;
    } else if (line.startsWith('tenantid ') || line.startsWith('tenantId ')) {
        hasTenantId = true;
    }
}
if (currentModel && hasTenantId) {
    tables.push(currentModel);
}

let sql = `-- Enable RLS on all tenant-aware tables\n\n`;

for (const table of tables) {
    // In Postgres, unquoted names map to lower case if they were created by Prisma, but Prisma puts double quotes around exact case
    // We will use double quotes exactly matching the model name if it's mixed case, or just Prisma's default mapping
    // Usually Prisma maps model names to EXACT case if they use @@map, otherwise same as model name
    // Assuming double quotes are safest:
    sql += `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;\n`;
    sql += `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;\n`;
    
    // Drop policy if exists so migration is rerunnable
    sql += `DROP POLICY IF EXISTS "tenant_isolation_policy" ON "${table}";\n`;
    
    // We check if current_setting('app.current_tenant', true) is not null.
    // By default, current_setting('app.current_tenant', true) returns NULL or empty if missing.
    // The policy ensures tenantid matches. Note: column is usually "tenantid" if not mapped.
    sql += `CREATE POLICY "tenant_isolation_policy" ON "${table}"\n`;
    sql += `  AS PERMISSIVE FOR ALL\n`;
    sql += `  USING ("tenantid" = current_setting('app.current_tenant', true)::uuid);\n\n`;
}

const outDir = path.join(__dirname, '../packages/database/prisma/migrations/20260610170000_enable_rls');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'migration.sql'), sql);
console.log(`Generated RLS script for ${tables.length} tables.`);
