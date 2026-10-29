#!/usr/bin/env node
/**
 * Safe Supabase connectivity check for the KOO app.
 *
 *   npm run check:supabase
 *   node scripts/check-supabase.mjs --probe-table=products   # optional read-only probe
 *   npm run check:chat                                       # after pasting the chat SQL
 *
 * Design constraints:
 *  - Reads the root `.env` itself (no dotenv dependency) and NEVER prints a
 *    value — only lengths, HTTP status codes and counts.
 *  - Issues read-only GETs only. It creates nothing and does not assume any
 *    table exists; a deliberately-absent sentinel relation proves the REST role
 *    works without depending on real schema.
 *  - Supabase restricts the OpenAPI root (`GET /rest/v1/`) to secret API keys, so
 *    table *listing* is reported as INFO, never as a failure: a mobile app must
 *    never hold a secret key.
 *  - The React Native client in `src/lib/supabase.ts` cannot be imported here
 *    (AsyncStorage is a native module), so this validates the same env keys
 *    against the same endpoints; the client itself is covered by tsc, lint and a
 *    Metro bundle.
 *
 * On this machine Node needs the OS trust store for TLS:
 *   NODE_OPTIONS=--use-system-ca node scripts/check-supabase.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const values = {};
  // Later files win, matching Expo's precedence (.env.local overrides .env).
  for (const file of ['.env', '.env.local']) {
    let text = '';
    try {
      text = readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const name = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value) values[name] = value;
    }
  }
  return values;
}

const env = loadEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Project-ref host is technically part of the env value, so redact it. */
function redact(raw) {
  try {
    const u = new URL(raw);
    const suffix = u.hostname.split('.').slice(1).join('.');
    const pathname = u.pathname === '/' ? '' : u.pathname;
    return `${u.protocol}//<project-ref>.${suffix}${pathname}`;
  } catch {
    return '<malformed-url>';
  }
}

const results = [];
let failed = false;

/** status is 'PASS' | 'FAIL' | 'INFO'; only FAIL affects the exit code. */
function record(name, status, detail) {
  results.push({ name, status, detail });
  if (status === 'FAIL') failed = true;
}

if (!url || !key) {
  console.error(
    `Missing ${[!url && 'EXPO_PUBLIC_SUPABASE_URL', !key && 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'].filter(Boolean).join(', ')} in the root .env file.`
  );
  process.exit(1);
}

// supabase-js needs the project root; a pasted `/rest/v1/` endpoint is reduced here too.
let base = url.replace(/\/+$/, '');
try {
  base = new URL(url).origin;
} catch {
  /* keep the trimmed value so the probes still report a clear failure */
}

console.log('KOO — Supabase connectivity check (values are never printed)');
console.log('  config file ........ root .env');
console.log(`  project ............ ${redact(url)}`);
console.log(`  url length ......... ${url.length} chars, https: ${url.startsWith('https://')}`);
console.log(`  key length ......... ${key.length} chars, sb_publishable_ prefix: ${key.startsWith('sb_publishable_')}`);

const headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' };

/**
 * @param {(body: any, res: Response) => string} describe  one-line summary
 * @param {{classify?: (body: any, res: Response) => 'PASS'|'FAIL'|'INFO'}} opts
 */
async function probe(name, endpoint, describe, opts = {}) {
  const target = new URL(endpoint, `${base}/`).toString();
  let res;
  let body = null;
  try {
    res = await fetch(target, { headers, method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON body: keep it out of the output entirely */
    }
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timed out after 20s' : `${error?.name ?? 'Error'}: ${error?.message ?? 'unknown'}`;
    record(name, 'FAIL', `no HTTP response — ${reason}`);
    return null;
  }

  const classify = opts.classify ?? ((_b, r) => (r.status === 200 ? 'PASS' : 'FAIL'));
  const status = classify(body, res);
  let note = describe ? (describe(body, res) ?? '') : '';
  // Surface the gateway's own reason (it never echoes the key) so a credential
  // problem is distinguishable from an unreachable project.
  if (status !== 'PASS' && typeof body?.message === 'string') {
    note = `${body.message}${body.hint ? ` (${body.hint})` : ''}${note ? ` — ${note}` : ''}`;
  }
  note = String(note).split(key).join('[KEY]').slice(0, 200);
  record(name, status, `HTTP ${res.status}${note ? ` — ${note}` : ''}`);
  return body;
}

const isRelationMissing = (body) =>
  body?.code === 'PGRST205' || /could not find (the )?(table|view|relation)/i.test(String(body?.message ?? ''));

// 1. Auth service: reachable, and the publishable key passes the gateway.
await probe('auth service health', '/auth/v1/health', (body) => (body?.version ? `GoTrue ${body.version}` : 'responded'));

// 2. Storage: read-only bucket listing for this key's role.
await probe('storage bucket listing', '/storage/v1/bucket', (body) =>
  Array.isArray(body) ? `${body.length} bucket(s) visible to this key` : 'responded'
);

// 3. PostgREST through a sentinel relation that must not exist. A 404 with
//    PostgREST's "relation not found" code proves the publishable key is
//    accepted by the REST API and the schema cache is live — without assuming
//    that any real table exists.
await probe(
  'rest (PostgREST) accepts publishable key',
  '/rest/v1/koo_connection_probe_missing_relation?select=*&limit=1',
  (body, res) =>
    res.status === 404
      ? `sentinel relation absent as intended${body?.code ? ` (code ${body.code})` : ''}`
      : res.status === 200
        ? 'sentinel unexpectedly queried'
        : 'responded',
  {
    classify: (body, res) => {
      if (res.status === 401 || res.status === 403) return 'FAIL';
      if (res.status === 404) return 'PASS'; // absent either way; wording differs across PostgREST versions
      return 'FAIL';
    },
  }
);

// 4. Table listing needs a secret key on Supabase, so this stays informational.
await probe(
  'table listing (OpenAPI root)',
  '/rest/v1/',
  (body) => {
    const tables = body && typeof body.paths === 'object' ? Object.keys(body.paths) : null;
    if (!tables) return 'no OpenAPI document returned';
    return `${tables.length} table(s) exposed to this key`;
  },
  { classify: (_body, res) => (res.status === 200 ? 'PASS' : 'INFO') }
);

// 5. Optional, explicit, read-only probe of one real relation.
const arg = process.argv.find((a) => a.startsWith('--probe-table='));
if (arg) {
  const table = arg.split('=')[1];
  await probe(
    `read-only query on "${table}"`,
    `/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`,
    (body, res) => (res.status === 200 ? `${Array.isArray(body) ? body.length : 0} row(s) returned` : `code ${body?.code ?? 'n/a'}`),
    {
      classify: (body, res) => {
        if (res.status === 200) return 'PASS';
        // Not created yet — expected on a fresh project, and not this check's fault.
        if (res.status === 404 && isRelationMissing(body)) return 'INFO';
        return 'FAIL';
      },
    }
  );
} else {
  console.log('  table queries ...... skipped (no table assumed). Pass --probe-table=<name> to try one.');
}

// 6. Optional: confirm the pasted schema files actually landed. Read-only, and it
//    only asks for the tables those files create, so it answers "did my paste
//    work?" without needing a secret key.
const expectedTables = [
  ...(process.argv.includes('--expect-chat') ? [['chat', 'koo_conversations'], ['chat', 'koo_messages']] : []),
  ...(process.argv.includes('--expect-profile') ? [['profile', 'koo_profiles']] : []),
];

if (expectedTables.length > 0) {
  for (const [label, table] of expectedTables) {
    await probe(
      `${label} table "${table}"`,
      `/rest/v1/${table}?select=*&limit=1`,
      (body, res) =>
        res.status === 200
          ? `present, ${Array.isArray(body) ? body.length : 0} row(s) readable by an anonymous key (RLS hides them all on purpose)`
          : `code ${body?.code ?? 'n/a'}`,
      {
        classify: (body, res) => {
          if (res.status === 200) return 'PASS';
          // Reaching the table but being refused means grants + RLS are working.
          if (res.status === 401 || res.status === 403) return 'PASS';
          // 404 = the SQL has not run yet, or PostgREST has not reloaded its
          // schema cache; wait ~10s and re-run before treating it as missing.
          return 'FAIL';
        },
      }
    );
  }
} else {
  console.log(
    '  schema tables ........ skipped. Pass --expect-chat / --expect-profile after pasting the SQL files.'
  );
}

console.log('\nResults:');
for (const r of results) {
  console.log(`  ${r.status.padEnd(4)} ${r.name}: ${r.detail}`);
}

// Separate "can we reach the project" from "does the key work": any HTTP status
// code at all proves DNS, TLS and routing are fine.
const answered = results.filter((r) => /^HTTP \d{3}/.test(r.detail)).length;
const keyRejected = results.some((r) => /Invalid API key|No API key found/i.test(r.detail));
const restCheck = results.find((r) => r.name === 'rest (PostgREST) accepts publishable key');
const listing = results.find((r) => r.name === 'table listing (OpenAPI root)');

console.log('\nInterpretation:');
console.log(
  `  project reachable ......... ${answered > 0 ? `yes — ${answered} endpoint(s) answered over HTTPS` : 'no — no HTTP response from any endpoint'}`
);
console.log(
  `  publishable key accepted .. ${
    keyRejected
      ? 'no — Supabase rejected the apikey ("Invalid API key"). The URL and key are usually from different projects, or the key was copied incompletely / rotated.'
      : answered > 0
        ? 'yes'
        : 'unknown'
  }`
);
console.log(
  `  database queries .......... ${
    restCheck?.status === 'PASS'
      ? 'ready — REST accepts this key; nothing was created or altered, and no table is required yet'
      : `not confirmed (${restCheck?.detail ?? 'check did not run'})`
  }`
);
console.log(
  `  table inventory ........... ${
    listing?.status === 'PASS' ? listing.detail : 'needs a secret API key (expected for publishable keys); list tables from the Supabase dashboard'
  }`
);
console.log(failed ? '\nOne or more checks FAILED.' : '\nNo failures. INFO lines are expected on a fresh project.');
process.exit(failed ? 1 : 0);
