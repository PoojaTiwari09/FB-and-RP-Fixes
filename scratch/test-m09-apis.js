const baseUrl = 'http://localhost:3001/api/v1';

async function testApis() {
  console.log('Logging in to get token...');
  let token = '';
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@example.com', password: 'Password123!', tenantSlug: 'acme' })
    });
    const loginData = await loginRes.json();
    token = loginData.token || loginData.access_token || loginData.data?.token || '';
    if (token) {
        console.log('Login successful! Token acquired.');
    } else {
        console.log('Login failed or no token returned. Trying endpoints without token. Response:', loginData);
    }
  } catch (e) {
    console.error('Login error:', e.message);
  }

  const endpoints = [
    '/coaching-training',
    '/coaching-training/sessions',
    '/coaching-training/sessions/voices',
    '/coaching-training/scenarios',
    '/coaching-training/analytics/dashboard',
    '/coaching-training/analytics/reps',
    '/coaching-training/analytics/team',
    '/coaching-training/coaching/notes',
    '/coaching-training/training/assignments'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const text = await res.text();
      let body;
      try { 
        body = JSON.parse(text); 
      } catch { 
        body = text.substring(0, 100) + '...'; 
      }
      
      console.log(`\n--- GET ${ep} ---`);
      console.log(`Status: ${res.status}`);
      let outputStr = JSON.stringify(body, null, 2);
      if (outputStr.length > 500) {
          outputStr = outputStr.substring(0, 500) + '\n... (truncated)';
      }
      console.log(`Response:\n${outputStr}`);
    } catch (e) {
      console.log(`\n--- GET ${ep} ---`);
      console.log(`Error: ${e.message}`);
    }
  }
}
testApis();
