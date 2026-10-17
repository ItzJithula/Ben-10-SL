/**
 * Preload (NODE_OPTIONS="--import ...") that installs the Neon HTTP mock for
 * `next start` production testing without a real Neon account.
 *
 * NEON_MOCK_LOG=1    log every intercepted query
 * NEON_MOCK_FAIL=1   answer every SQL-over-HTTP call with HTTP 400 (to exercise
 *                    the node-postgres TCP fallback) and point *.neon.tech DNS
 *                    at 127.0.0.1 so the fallback can reach the local
 *                    `scripts/pg-socket.mjs` wire server on port 5433.
 */
import dns from "node:dns";

import { installNeonMock } from "./neon-mock.mjs";

if (process.env.NEON_MOCK_FAIL === "1") {
  const realLookup = dns.lookup.bind(dns);
  const fakeLookup = (hostname, ...args) => {
    if (typeof hostname === "string" && hostname.endsWith(".neon.tech")) {
      return realLookup("127.0.0.1", ...args);
    }
    return realLookup(hostname, ...args);
  };
  dns.lookup = fakeLookup;
  dns.promises.lookup = fakeLookup;
  console.log("[neon-mock] FAIL mode: SQL-over-HTTP returns 400, *.neon.tech resolves to 127.0.0.1");
}

installNeonMock({ log: process.env.NEON_MOCK_LOG === "1", fail: process.env.NEON_MOCK_FAIL === "1" });
console.log("[neon-mock] installed (fetch → PGlite)");
