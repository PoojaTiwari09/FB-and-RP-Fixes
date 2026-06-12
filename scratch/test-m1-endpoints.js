const http = require('http');

const callId = '11111111-1111-1111-1111-000000000001';
const stepId = 'step_002'; // From output above

const payload = JSON.stringify({ completed: true });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/v1/capture-transcription/calls/${callId}/next-steps/${stepId}`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': '00000000-0000-0000-0000-000000000001',
    'Authorization': 'Bearer demo-valid-token-for-testing',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('PATCH Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('PATCH Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error PATCH:', e);
});

req.write(payload);
req.end();
