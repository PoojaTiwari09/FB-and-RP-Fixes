const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

const repToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJ0ZW5hbnRJZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSIsInJvbGUiOiJTQUxFU19SRVAiLCJwZXJtaXNzaW9ucyI6WyJ0YXNrLnZpZXciLCJ0YXNrLmNyZWF0ZSIsInRhc2sudXBkYXRlIiwib3Bwb3J0dW5pdHkudmlldyIsIm9wcG9ydHVuaXR5LmNyZWF0ZSIsIm9wcG9ydHVuaXR5LnVwZGF0ZSIsImN1c3RvbWVyLnZpZXciLCJjdXN0b21lci5jcmVhdGUiLCJjdXN0b21lci51cGRhdGUiLCJhaS5xdWVyeSJdLCJlbWFpbCI6InNhcmFoLmNoZW5AcmVsYW50by5jb20iLCJuYW1lIjoiU2FyYWggQ2hlbiIsImlhdCI6MTc4MTE5NTU3MSwiZXhwIjoxNzgxMjgxOTcxLCJhdWQiOiJyLXJldmVudWUtYXBpIiwiaXNzIjoici1yZXZlbnVlLWFwaSJ9.eYcRcC9gGAnYzuGR0SlbkEIS4Qdo_GuxJ5ppwSU88m0';
const mgrToken = repToken;

const endpoints = [
  // Rep + Manager
  { method: 'GET', path: '/api/v1/conversation-intelligence/conversations', roles: ['rep', 'mgr'], group: 'Call list' },
  { method: 'GET', path: '/api/v1/conversation-intelligence/call-reviews', roles: ['rep', 'mgr'], group: 'AI call reviewer' },
  { method: 'GET', path: '/api/v1/conversation-intelligence/scorecards', roles: ['rep', 'mgr'], group: 'AI call reviewer' },
  { method: 'GET', path: '/api/v1/m02-conversation-intelligence/theme-analyses/mock-123', roles: ['rep', 'mgr'], group: 'AI Theme Spotter' },
  { method: 'POST', path: '/api/v1/m02-conversation-intelligence/theme-analyses', roles: ['rep', 'mgr'], group: 'AI Theme Spotter', body: { businessQuestion: 'Testing', filters: {} } },
  // Call Search (Manager only? The user says so)
  { method: 'GET', path: '/api/v1/conversation-intelligence/search/calls', roles: ['mgr'], group: 'Call Search' },
  { method: 'GET', path: '/api/v1/conversation-intelligence/search/options', roles: ['mgr'], group: 'Call Search' },
  // Translator
  { method: 'POST', path: '/api/v1/m02-conversation-intelligence/translate', roles: ['mgr'], group: 'AI Translator', body: { text: 'Hello', sourceLang: 'en', targetLang: 'es', entityType: 'call', entityId: 'c1' } },
  { method: 'GET', path: '/api/v1/m02-conversation-intelligence/translate/settings', roles: ['mgr'], group: 'AI Translator' },
  // Transcriber (Ingest API?)
  // Actually Ingest is x-service-key, not user JWT, but I can check if there's any transcriber
];

function request(method, path, token, body = null) {
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    
    req.on('error', (e) => {
      resolve({ status: 500, error: e.message });
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const results = [];
  
  for (const ep of endpoints) {
    if (ep.roles.includes('rep')) {
      const res = await request(ep.method, ep.path, repToken, ep.body);
      results.push({ ...ep, role: 'rep', status: res.status });
    }
    if (ep.roles.includes('mgr')) {
      const res = await request(ep.method, ep.path, mgrToken, ep.body);
      results.push({ ...ep, role: 'mgr', status: res.status });
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

run();
