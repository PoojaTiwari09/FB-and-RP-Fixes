const fs = require('fs');
const file = 'modules/m05-account-intelligence/postman.json';
let data = fs.readFileSync(file, 'utf8');

// The broken JSON starts after "summary" endpoint:
//               "path": [
//                 "api",
//                 "manager",
//                 "revenue",
//                 "accounts",
//                 "summary"
//               ]
//             }
//           }
//         },
//                 },

// We need to find this block and replace it up to the next valid object
const regex = /"accounts",\s*"summary"\s*\]\s*\}\s*\}\s*\},[\s\S]*?"value": "20"\s*\}\s*\]\s*\}\s*\},/g;

const replacement = `"accounts",
                "summary"
              ]
            }
          }
        },
        {
          "name": "List Accounts (GET /)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "x-tenant-id",
                "value": "{{tenant_id}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/manager/revenue/accounts?board_slug=demo&page=1&size=20",
              "host": [
                "{{base_url}}"
              ],
              "path": [
                "api",
                "manager",
                "revenue",
                "accounts"
              ],
              "query": [
                {
                  "key": "board_slug",
                  "value": "demo"
                },
                {
                  "key": "page",
                  "value": "1"
                },
                {
                  "key": "size",
                  "value": "20"
                }
              ]
            }
          },`;

data = data.replace(regex, replacement);
fs.writeFileSync(file, data);
console.log('Fixed postman.json JSON syntax');
