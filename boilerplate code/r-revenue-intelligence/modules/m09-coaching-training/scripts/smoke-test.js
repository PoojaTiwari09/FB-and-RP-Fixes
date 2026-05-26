const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:4001/api';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  const health = await request('/test/health');
  const seed = await request('/test/seed', { method: 'POST' });
  const repToken = await request('/test/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: seed.repId }),
  });

  const headers = {
    Authorization: `Bearer ${repToken.token}`,
    'Content-Type': 'application/json',
  };

  const voices = await request('/sessions/get-voices', {
    headers: { Authorization: headers.Authorization },
  });
  const scenarios = await request('/scenarios', { headers: { Authorization: headers.Authorization } });
  const session = await request('/sessions/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      scenarioId: scenarios[0].id,
      voiceId: voices[0]?.id,
    }),
  });

  const turn = await request('/sessions/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId: session.sessionId,
      message: 'I would like to understand your current onboarding and pricing concerns first.',
    }),
  });

  const feedback = await request('/sessions/end', {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: session.sessionId }),
  });

  const myAnalytics = await request('/analytics/my', {
    headers: { Authorization: headers.Authorization },
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        health,
        sessionId: session.sessionId,
        replyPreview: turn.reply,
        finalScore: feedback.overall_score,
        analyticsEntries: Array.isArray(myAnalytics) ? myAnalytics.length : 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
