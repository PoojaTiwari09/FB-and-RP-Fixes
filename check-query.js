import fs from 'fs';
import path from 'path';

const postmanPath = path.resolve('modules/m05-account-intelligence/postman.json');
const data = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));

function findAccountsRequest(items) {
  for (const item of items) {
    if (item.request && item.name.includes('List Accounts — demo board')) {
      console.log('Request name:', item.name);
      console.log('URL Raw:', item.request.url.raw);
      console.log('Query Params:', JSON.stringify(item.request.url.query, null, 2));
    }
    if (item.item) {
      findAccountsRequest(item.item);
    }
  }
}

findAccountsRequest(data.item);
