/**
 * Repro harness for the Neon serverless (HTTP) driver usage in src/lib/db.ts.
 * Captures the exact HTTP requests the driver makes and can answer them from a
 * canned response so we can see what `query()` / `transaction()` put on the wire
 * and how results/errors come back.
 *
 * Run: node scripts/neon-repro.mjs
 */
import { neon } from "@neondatabase/serverless";

const requests = [];

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

globalThis.fetch = async (url, init = {}) => {
  const entry = {
    url: String(url),
    method: init.method ?? "GET",
    headers: Object.fromEntries(Object.entries(init.headers ?? {})),
    body: init.body,
  };
  requests.push(entry);
  console.log("\n=== fetch #" + requests.length + " ===");
  console.log("URL:", entry.url);
  console.log("headers:", JSON.stringify(entry.headers, null, 2));
  let parsed = entry.body;
  try {
    parsed = JSON.parse(entry.body);
  } catch {}
  console.log("body:", JSON.stringify(parsed, null, 2).slice(0, 2000));

  // Canned responses: mimic what Neon returns for each kind of call.
  const bodyObj = parsed ?? {};
  if (Array.isArray(bodyObj.queries)) {
    // transaction batch
    return jsonResponse(200, bodyObj.queries.map(() => []));
  }
  if (typeof bodyObj.query === "string") {
    if (/COUNT\(\*\)/i.test(bodyObj.query)) return jsonResponse(200, [{ c: 0 }]);
    return jsonResponse(200, []);
  }
  return jsonResponse(200, []);
};

const sql = neon("postgresql://user:pass@ep-test-pooler.region.aws.neon.tech/neondb?sslmode=require");

const statements = [
  { text: "CREATE TABLE IF NOT EXISTS t (id int)", params: [] },
  { text: "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING", params: ["k", "v"] },
];

console.log(">>> transaction with txn.query() form (what src/lib/db.ts does)");
try {
  const out = await sql.transaction((txn) =>
    statements.map((s) => txn.query(s.text, s.params ?? [])),
  );
  console.log("transaction resolved:", JSON.stringify(out));
} catch (err) {
  console.log("transaction THREW:", err && err.message ? err.message : err);
  console.log(err);
}

console.log("\n>>> single query");
try {
  const rows = await sql.query("SELECT COUNT(*)::int AS c FROM categories", []);
  console.log("query resolved:", JSON.stringify(rows), "| isArray:", Array.isArray(rows));
} catch (err) {
  console.log("query THREW:", err && err.message ? err.message : err);
}

console.log("\n>>> query with undefined param (getNeighbours case)");
try {
  const rows = await sql.query("SELECT 1 WHERE COALESCE($4, 0) = 0", [1, 2, 3, null]);
  console.log("query resolved:", JSON.stringify(rows));
} catch (err) {
  console.log("query THREW:", err && err.message ? err.message : err);
}
