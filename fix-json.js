const fs = require('fs');
const file = 'modules/m05-account-intelligence/postman.json';
let data = fs.readFileSync(file, 'utf8');

// The original JSON has `?page=1&size=20` and the query block starts with `page`.
// I want to replace `?page=1&size=20` with `?board_slug=demo&page=1&size=20`
data = data.replace(
  /"raw": "\{\{base_url\}\}\/api\/manager\/revenue\/accounts\?page=1&size=20"/g,
  '"raw": "{{base_url}}/api/manager/revenue/accounts?board_slug=demo&page=1&size=20"'
);

// I want to inject the `board_slug` parameter before the `page` parameter in the `query` array.
data = data.replace(
  /"query": \[\s*\{\s*"key": "page"/g,
  `"query": [
                  {
                    "key": "board_slug",
                    "value": "demo"
                  },
                  {
                    "key": "page"`
);

// And I'll add the test block to the List Accounts request
// The List Accounts request ends with:
//               }
//             }
//           },
//           {
//             "name": "Get Viewers (GET /viewers)",

data = data.replace(
  /"key": "size",\s*"value": "20"\s*\}\s*\]\s*\}\s*\}\s*\},/g,
  `"key": "size",
                    "value": "20"
                  }
                ]
              }
            },
            "event": [
              {
                "listen": "test",
                "script": {
                  "type": "text/javascript",
                  "exec": [
                    "pm.test('Status 200', () => pm.response.to.have.status(200));",
                    "pm.test('Has accounts array and pagination', () => {",
                    "  const resBody = pm.response.json();",
                    "  const body = ('data' in resBody && 'meta' in resBody) ? resBody.data : resBody;",
                    "  pm.expect(body).to.have.property('accounts');",
                    "  pm.expect(body.accounts).to.be.an('array');",
                    "  pm.expect(body).to.have.property('page');",
                    "  pm.expect(body).to.have.property('total');",
                    "});"
                  ]
                }
              }
            ]
          },`
);

fs.writeFileSync(file, data);
console.log('Fixed postman.json');
