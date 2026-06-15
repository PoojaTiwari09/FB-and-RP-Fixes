@echo off
setlocal
cd /d "%~dp0"
set DATABASE_URL=postgresql://revenue_user:revenue_pass@127.0.0.1:5432/revenue_intelligence?schema=public
set DIRECT_URL=%DATABASE_URL%
set M10_DATABASE_URL=%DATABASE_URL%
set DISABLE_REDIS=true
set REDIS_HOST=127.0.0.1
set REDIS_PORT=6379
set REDIS_URL=redis://127.0.0.1:6379
set DISABLE_MEILI=true
set NODE_ENV=development
set JWT_SECRET=local-dev-secret
set PORT=3002
set GROQ_API_KEY=test-groq-key
set GEMINI_API_KEY=test-gemini-key
set OPENAI_API_KEY=test-openai-key
set AI_MOCK_MODE=true
set TS_NODE_TRANSPILE_ONLY=true
npx ts-node --transpile-only -r tsconfig-paths/register src/main.ts
