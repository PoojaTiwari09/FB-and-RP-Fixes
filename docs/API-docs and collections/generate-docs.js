const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'M01_Capture_Transcription_Frontend_API_Collection.json');
const outputPath = path.join(__dirname, 'M01_API_Documentation.md');

const collection = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

let md = '# M01 Capture Transcription API Documentation\n\n';
md += '## Global Authentication & Headers\n';
md += 'All requests require the following headers to be set:\n\n';
md += '| Header | Example Value | Description |\n';
md += '|---|---|---|\n';
md += '| `tenant-id` | `tenant-123` | Your organization tenant ID |\n';
md += '| `user-id` | `user-123` | Your personal user ID |\n';
md += '| `user-role` | `Admin` | Your role (`Admin`, `Sales Rep`, etc.) |\n';
md += '| `user-name` | `Test User` | Your full name |\n';
md += '| `Authorization` | `Bearer eyJhbG...` | Your JWT Access Token |\n\n';

md += '---\n\n';

function processItem(item, depth = 2) {
  if (item.item) {
    md += `${'#'.repeat(depth)} ${item.name}\n\n`;
    item.item.forEach(subItem => processItem(subItem, depth + 1));
  } else if (item.request) {
    const req = item.request;
    const method = req.method;
    let url = typeof req.url === 'string' ? req.url : req.url.raw;
    url = url.replace('{{baseurl}}', '');
    
    md += `${'#'.repeat(depth)} ${item.name}\n\n`;
    md += `**Method:** \`${method}\`\n\n`;
    md += `**Endpoint:** \`${url}\`\n\n`;

    if (req.body && req.body.mode === 'raw' && req.body.raw) {
      md += `**Request Payload:**\n\`\`\`json\n${req.body.raw}\n\`\`\`\n\n`;
    } else if (req.body && req.body.mode === 'formdata') {
      md += `**Request Payload (Form-Data):**\n`;
      req.body.formdata.forEach(fd => {
        md += `- \`${fd.key}\` (${fd.type}): ${fd.value || '<file>'}\n`;
      });
      md += '\n';
    }

    if (item.response && item.response.length > 0) {
      const res = item.response[0];
      let bodyText = res.body;
      try {
         // pretty print if JSON
         bodyText = JSON.stringify(JSON.parse(res.body), null, 2);
      } catch(e) {}
      
      md += `**Success Response Example (Status ${res.code}):**\n\`\`\`json\n${bodyText}\n\`\`\`\n\n`;
    }
    
    md += '---\n\n';
  }
}

collection.item.forEach(item => processItem(item));

fs.writeFileSync(outputPath, md);
console.log('Markdown generated successfully at:', outputPath);
