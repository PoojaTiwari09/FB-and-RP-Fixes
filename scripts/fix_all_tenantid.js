const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('modules', function(filePath) {
    if (!filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace property assignments
    content = content.replace(/tenantid:/g, 'tenantId:');
    
    // Replace unique index keys (catch-all for tenantid_...)
    content = content.replace(/tenantid_/g, 'tenantId_');
    
    // Specifically handle the missing play property if any (it might be because of include: { play: true } removed?
    // Actually, let's just fix tenantid for now, and check if other errors persist.
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed tenantid in ${filePath}`);
    }
});
