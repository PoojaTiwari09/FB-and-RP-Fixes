const http = require('http');

const endpoints = [
  '/api/v1/capture-transcription/calls',
  '/api/v1/capture-transcription/calls/search',
  '/api/v1/capture-transcription/calls/accounts',
  '/api/v1/capture-transcription/calls/c12444a8-6cd3-4052-a7e5-fce57cc76c5c',
  '/api/v1/capture-transcription/calls/c12444a8-6cd3-4052-a7e5-fce57cc76c5c/metadata'
];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-token',
        'x-tenant-id': '00000000-0000-0000-0000-000000000001'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${res.statusCode}] ${path}`);
        if (res.statusCode >= 400) {
          console.log(`  Body: ${data.substring(0, 500)}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`Error on ${path}: ${e.message}`);
      resolve();
    });

    req.end();
  });
}

async function main() {
  for (const path of endpoints) {
    await checkEndpoint(path);
  }
}

main();
