const fs = require('fs');

function fixFile(path) {
    let content = fs.readFileSync(path, 'utf8');
    // Replace property assignments
    content = content.replace(/tenantid:/g, 'tenantId:');
    // Replace unique index keys
    content = content.replace(/tenantid_domain/g, 'tenantId_domain');
    content = content.replace(/tenantid_activityId_entityType_entityId/g, 'tenantId_activityId_entityType_entityId');
    content = content.replace(/tenantid_crmSource_entityType/g, 'tenantId_crmSource_entityType');
    
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Fixed ${path}`);
}

fixFile('modules/m10-data-compliance/repositories/data-cloud.repository.ts');
fixFile('modules/m10-data-compliance/revenue-graph/repositories/revenue-graph.repository.ts');
