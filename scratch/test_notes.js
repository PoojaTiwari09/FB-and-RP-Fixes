const http = require('http');

const BACKEND_ORG_ID = '00000000-0000-0000-0000-000000000001';
const BACKEND_USER_ID = '00000000-0000-0000-0000-000000000003';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-tenant-id': BACKEND_ORG_ID,
  'x-org-id': BACKEND_ORG_ID,
  'x-user-id': BACKEND_USER_ID,
};

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('Fetching calls from api...');
  const callsRes = await makeRequest({
    host: 'localhost',
    port: 3001,
    path: '/api/v1/capture-transcription/calls',
    method: 'GET',
    headers: HEADERS,
  });

  if (callsRes.statusCode !== 200) {
    console.error('Failed to fetch calls:', callsRes.body);
    process.exit(1);
  }

  const calls = callsRes.body.records || [];
  if (calls.length === 0) {
    console.error('No calls found in the database. Please make sure database is seeded.');
    process.exit(1);
  }

  const callId = calls[0].id;
  console.log(`Found callId: ${callId}`);

  console.log('\n--- Testing POST /api/calls/:callId/notes ---');
  const postNoteData = {
    note: 'Test note from validation script at ' + new Date().toISOString(),
    userId: 'usr_002',
  };
  const postRes = await makeRequest({
    host: 'localhost',
    port: 3001,
    path: `/api/calls/${callId}/notes`,
    method: 'POST',
    headers: HEADERS,
  }, postNoteData);

  console.log('POST status:', postRes.statusCode);
  console.log('POST response:', JSON.stringify(postRes.body, null, 2));

  if (postRes.statusCode !== 201 && postRes.statusCode !== 200) {
    console.error('POST note failed!');
    process.exit(1);
  }

  console.log('\n--- Testing GET /api/calls/:callId/notes ---');
  const getRes = await makeRequest({
    host: 'localhost',
    port: 3001,
    path: `/api/calls/${callId}/notes`,
    method: 'GET',
    headers: HEADERS,
  });

  console.log('GET status:', getRes.statusCode);
  console.log('GET response:', JSON.stringify(getRes.body, null, 2));

  if (getRes.statusCode !== 200) {
    console.error('GET notes failed!');
    process.exit(1);
  }

  console.log('\nAll tests completed successfully!');
}

run().catch(console.error);
