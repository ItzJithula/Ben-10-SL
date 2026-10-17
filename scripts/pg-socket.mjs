/**
 * Runs PGlite behind a real PostgreSQL wire-protocol TCP socket
 * (`@electric-sql/pglite-socket`), so the app's node-postgres (`pg`) driver
 * path can be tested end-to-end without an external database.
 *
 *   node scripts/pg-socket.mjs   # listens on 127.0.0.1:5433
 */
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dir = path.join(process.env.DATA_DIR ?? path.join(process.cwd(), "data"), "pg-socket");
const db = new PGlite(dir);
await db.waitReady;

const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1" });
await server.start();
console.log("[pg-socket] PostgreSQL wire server on 127.0.0.1:5433");
