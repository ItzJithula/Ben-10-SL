/**
 * Neon SQL-over-HTTP protocol mock, backed by PGlite (real Postgres, WASM).
 *
 * Installed as a global `fetch` stub, it speaks the exact protocol that
 * `@neondatabase/serverless`'s `neon()` driver uses:
 *
 *   POST <endpoint>
 *   headers: Neon-Connection-String, Neon-Raw-Text-Output: true, Neon-Array-Mode: true
 *   body:    { query, params }            (single)
 *            { queries: [{query,params}] } (transaction batch)
 *   200:     { fields: [{name,dataTypeID}], rows: [[text|null, ...]] }
 *            or { results: [<same>, ...] } for batches
 *   400:     { message, severity, code, detail, hint, position, ... }
 *
 * This lets the real app run in production mode against a faithful stand-in
 * for Neon — no network required.
 */
import fs from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

const state = {
  pg: /** @type {import("@electric-sql/pglite").PGlite | undefined} */ (undefined),
  ready: /** @type {Promise<any> | undefined} */ (undefined),
  requests: /** @type {any[]} */ ([]),
};

function getDb() {
  if (!state.ready) {
    const dir = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), "data"), "mock-pg");
    fs.mkdirSync(dir, { recursive: true });
    state.pg = new PGlite(dir);
    state.ready = state.pg.waitReady;
  }
  return state.ready.then(() => state.pg);
}

/** Encode one PGlite value the way the Neon HTTP API does: raw text or null. */
function wireValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function wireResult(result) {
  return {
    fields: (result.fields ?? []).map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
    rows: (result.rows ?? []).map((row) =>
      Array.isArray(row) ? row.map(wireValue) : (result.fields ?? []).map((f) => wireValue(row[f.name])),
    ),
  };
}

function errorBody(err) {
  return {
    message: String(err?.message ?? err),
    severity: err?.severity ?? "ERROR",
    code: err?.code,
    detail: err?.detail,
    hint: err?.hint,
    position: err?.position,
    internalPosition: err?.internalPosition,
    internalQuery: err?.internalQuery,
    where: err?.where,
    schema: err?.schema,
    table: err?.table,
    column: err?.column,
    dataType: err?.dataType,
    constraint: err?.constraint,
    file: err?.file,
    line: err?.line,
    routine: err?.routine,
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function installNeonMock({ log = false, fail = false } = {}) {
  if (globalThis.fetch.__neonMock) return globalThis.fetch;

  const realFetch = globalThis.fetch.bind(globalThis);
  const mockFetch = async (url, init = {}) => {
    const target = String(url);
    if (!/\/sql\b|\/sql$|neon/i.test(target) && !init.headers?.["Neon-Connection-String"]) {
      return realFetch(url, init);
    }

    if (fail) {
      if (log) console.log("[neon-mock] FAIL mode → HTTP 400 for", target);
      return json(400, { message: "neon-mock fail mode: simulated endpoint outage", severity: "ERROR", code: "XX000" });
    }

    let body = {};
    try {
      body = JSON.parse(init.body ?? "{}");
    } catch {
      /* fall through */
    }
    state.requests.push({ target, body });

    const pg = await getDb();
    const started = Date.now();
    try {
      if (Array.isArray(body.queries)) {
        const results = [];
        // one transaction, like the real batch endpoint
        await pg.transaction(async (tx) => {
          for (const q of body.queries) {
            const result = await tx.query(q.query, q.params ?? []);
            results.push(wireResult(result));
          }
        });
        if (log) console.log(`[neon-mock] batch of ${body.queries.length} ok in ${Date.now() - started}ms`);
        return json(200, { results });
      }
      if (typeof body.query === "string") {
        const result = await pg.query(body.query, body.params ?? []);
        if (log) console.log(`[neon-mock] query ok in ${Date.now() - started}ms: ${body.query.slice(0, 60)}`);
        return json(200, wireResult(result));
      }
      return json(400, { message: "neon-mock: request body contained no query", severity: "ERROR" });
    } catch (err) {
      if (log) console.log(`[neon-mock] ERROR after ${Date.now() - started}ms:`, String(err?.message ?? err));
      return json(400, errorBody(err));
    }
  };

  mockFetch.__neonMock = true;
  mockFetch.__realFetch = realFetch;
  globalThis.fetch = mockFetch;
  return mockFetch;
}

export function mockRequestLog() {
  return state.requests;
}
