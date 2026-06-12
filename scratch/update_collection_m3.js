const fs = require('fs');

const file = 'c:/Users/Relanto/OneDrive - Relanto/Downloads/120_refactoring/122/r-revenue-intelligence-monorepo/docs/API-docs and collections/collection-m3.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Add variables if not present
const varsToAdd = [
  { key: 'callId', value: '11111111-1111-1111-1111-000000000001', type: 'string' },
  { key: 'briefId', value: 'auto-11111111-1111-1111-1111-000000000001', type: 'string' },
  { key: 'stepId', value: 'step_002', type: 'string' }
];

varsToAdd.forEach(v => {
  if (!data.variable.some(existing => existing.key === v.key)) {
    data.variable.push(v);
  }
});

// Helper to create GET item tests
function createGetEndpoint(name, pathStr, pathArray) {
  return {
    "name": name,
    "item": [
      {
        "name": "1. Valid Request (Happy Path) & Performance",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": `{{baseUrl}}${pathStr}`,
            "host": ["{{baseUrl}}"],
            "path": pathArray
          },
          "auth": {
            "type": "bearer",
            "bearer": [{ "key": "token", "value": "{{jwtToken}}", "type": "string" }]
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 200', function () {",
                "    pm.response.to.have.status(200);",
                "});",
                "pm.test('Response time is less than 5000ms', function () {",
                "    pm.expect(pm.response.responseTime).to.be.below(5000);",
                "});"
              ],
              "type": "text/javascript"
            }
          }
        ]
      },
      {
        "name": "2. Missing JWT",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": `{{baseUrl}}${pathStr}`,
            "host": ["{{baseUrl}}"],
            "path": pathArray
          },
          "auth": {
            "type": "noauth"
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 401', function () {",
                "    pm.response.to.have.status(401);",
                "});"
              ],
              "type": "text/javascript"
            }
          },
          {
            "listen": "prerequest",
            "script": {
              "type": "text/javascript",
              "exec": [
                "pm.request.headers.remove(\"Authorization\");"
              ]
            }
          }
        ]
      },
      {
        "name": "3. Invalid JWT",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": `{{baseUrl}}${pathStr}`,
            "host": ["{{baseUrl}}"],
            "path": pathArray
          },
          "auth": {
            "type": "bearer",
            "bearer": [{ "key": "token", "value": "invalid-token-12345", "type": "string" }]
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 401', function () {",
                "    pm.response.to.have.status(401);",
                "});"
              ],
              "type": "text/javascript"
            }
          }
        ]
      }
    ]
  };
}

// 2. Define the new items
const newItems = [
  // PATCH next-step
  {
    "name": "[PATCH] /api/v1/capture-transcription/calls/:callId/next-steps/:stepId",
    "item": [
      {
        "name": "1. Valid Request (Happy Path) & Performance",
        "request": {
          "method": "PATCH",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": "{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/next-steps/{{stepId}}",
            "host": ["{{baseUrl}}"],
            "path": ["api", "v1", "capture-transcription", "calls", "{{callId}}", "next-steps", "{{stepId}}"]
          },
          "auth": {
            "type": "bearer",
            "bearer": [{ "key": "token", "value": "{{jwtToken}}", "type": "string" }]
          },
          "body": {
            "mode": "raw",
            "raw": "{\"completed\":true}",
            "options": {
              "raw": { "language": "json" }
            }
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 200', function () {",
                "    pm.response.to.have.status(200);",
                "});",
                "pm.test('Response time is less than 5000ms', function () {",
                "    pm.expect(pm.response.responseTime).to.be.below(5000);",
                "});"
              ],
              "type": "text/javascript"
            }
          }
        ]
      },
      {
        "name": "2. Missing JWT",
        "request": {
          "method": "PATCH",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": "{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/next-steps/{{stepId}}",
            "host": ["{{baseUrl}}"],
            "path": ["api", "v1", "capture-transcription", "calls", "{{callId}}", "next-steps", "{{stepId}}"]
          },
          "auth": {
            "type": "noauth"
          },
          "body": {
            "mode": "raw",
            "raw": "{\"completed\":true}",
            "options": {
              "raw": { "language": "json" }
            }
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 401', function () {",
                "    pm.response.to.have.status(401);",
                "});"
              ],
              "type": "text/javascript"
            }
          },
          {
            "listen": "prerequest",
            "script": {
              "type": "text/javascript",
              "exec": [
                "pm.request.headers.remove(\"Authorization\");"
              ]
            }
          }
        ]
      },
      {
        "name": "3. Bad Request (Validation)",
        "request": {
          "method": "PATCH",
          "header": [
            { "key": "Content-Type", "value": "application/json" },
            { "key": "x-tenant-id", "value": "00000000-0000-0000-0000-000000000001" }
          ],
          "url": {
            "raw": "{{baseUrl}}/api/v1/capture-transcription/calls/{{callId}}/next-steps/{{stepId}}",
            "host": ["{{baseUrl}}"],
            "path": ["api", "v1", "capture-transcription", "calls", "{{callId}}", "next-steps", "{{stepId}}"]
          },
          "auth": {
            "type": "bearer",
            "bearer": [{ "key": "token", "value": "{{jwtToken}}", "type": "string" }]
          },
          "body": {
            "mode": "raw",
            "raw": "{\"completed\":\"not-a-boolean\"}",
            "options": {
              "raw": { "language": "json" }
            }
          }
        },
        "event": [
          {
            "listen": "test",
            "script": {
              "exec": [
                "pm.test('Status code is 400', function () {",
                "    pm.response.to.have.status(400);",
                "});"
              ],
              "type": "text/javascript"
            }
          }
        ]
      }
    ]
  },
  // GET discussion-points
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/discussion-points",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/discussion-points",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "discussion-points"]
  ),
  // GET customer-needs
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/customer-needs",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/customer-needs",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "customer-needs"]
  ),
  // GET risks
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/risks",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/risks",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "risks"]
  ),
  // GET commitments
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/commitments",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/commitments",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "commitments"]
  ),
  // GET stakeholders
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/stakeholders",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/stakeholders",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "stakeholders"]
  ),
  // GET activity-context
  createGetEndpoint(
    "[GET] /api/v1/capture-transcription/calls/:callId/briefs/:briefId/activity-context",
    "/api/v1/capture-transcription/calls/{{callId}}/briefs/{{briefId}}/activity-context",
    ["api", "v1", "capture-transcription", "calls", "{{callId}}", "briefs", "{{briefId}}", "activity-context"]
  )
];

// Append items if not already added
newItems.forEach(item => {
  if (!data.item.some(existing => existing.name === item.name)) {
    data.item.push(item);
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated collection-m3.json with new endpoints!');
