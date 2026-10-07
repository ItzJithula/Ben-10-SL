#!/usr/bin/env node
/**
 * Connectivity check for the Neon database.
 *
 *   npm run db:check
 *
 * Reads the connection string from the environment (or from .env.local), then
 * prints the tables and row counts so you can tell at a glance whether the
 * archive is reachable and seeded.
 */

import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const KEYS = ["DATABASE_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

function fromEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const result = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

const fileEnv = { ...fromEnvFile(path.join(process.cwd(), ".env.local")), ...fromEnvFile(path.join(process.cwd(), ".env")) };
const url = KEYS.map((key) => process.env[key] ?? fileEnv[key]).find((value) => value && value.length);

if (!url) {
  console.error(
    "No connection string found.\n" +
      "Set DATABASE_URL (Neon → Connection string) in the environment or in .env.local.",
  );
  process.exit(1);
}

const masked = url.replace(/:\/\/([^:]+):[^@]+@/, "://$1:••••@");
console.log(`Checking ${masked}\n`);

const sql = neon(url);

try {
  const version = await sql.query("SELECT version() AS version");
  console.log(`Connected: ${version[0].version.split(",")[0]}`);

  const present = await sql.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('categories','releases','qualities','settings')
     ORDER BY table_name`,
  );
  const tables = present.map((row) => row.table_name);

  if (tables.length === 0) {
    console.log("No tables yet — they are created and seeded on the first page load of the site.");
    process.exit(0);
  }

  console.log(`Tables: ${tables.join(", ")}\n`);
  for (const table of tables) {
    const [row] = await sql.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
    console.log(`  ${table.padEnd(10)} ${row.c} row${row.c === 1 ? "" : "s"}`);
  }
} catch (error) {
  console.error(`Connection failed: ${error.message}`);
  process.exit(1);
}
