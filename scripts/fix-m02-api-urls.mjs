import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../apps/web/src/modules/m02-conversation-intelligence',
);

const SKIP = new Set(['api-env.js', 'fix-m02-api-urls.mjs']);

function walk(d, files = []) {
  for (const name of fs.readdirSync(d)) {
    if (name === 'node_modules') continue;
    const p = path.join(d, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|jsx|js)$/.test(name) && !SKIP.has(name)) files.push(p);
  }
  return files;
}

function addImport(s, file) {
  const relDepth = path.relative(root, path.dirname(file)).split(path.sep).length;
  const prefix = relDepth === 0 ? './' : '../'.repeat(relDepth);
  const imp = `import { m02ApiV1, DEV_TENANT_ID, DEV_USER_ID, defaultHeaders } from '${prefix}lib/api-env';\n`;
  if (s.includes('lib/api-env')) return s;
  if (s.startsWith('"use client";')) return s.replace('"use client";\n', `"use client";\n${imp}`);
  if (s.startsWith("'use client';")) return s.replace("'use client';\n", `'use client';\n${imp}`);
  return imp + s;
}

for (const file of walk(root)) {
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('http://localhost:3001/api/v1')) continue;
  s = s.replace(/http:\/\/localhost:3001\/api\/v1([^`'"]*)/g, (_, suffix) =>
    `\${m02ApiV1('${suffix}')}`,
  );
  s = addImport(s, file);
  fs.writeFileSync(file, s);
  console.log('fixed', path.relative(root, file));
}
