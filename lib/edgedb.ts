import "server-only" // Mark this module as server-only

/**
 * EdgeDB client helper
 * --------------------
 * In a **Node.js** (server / local scripts) environment we can use the
 * native binary protocol via `createClient()`.
 *
 * In a **browser / edge-runtime** (used by the Next.js preview) the TCP
 * driver is not available.  EdgeDB provides a fallback HTTP driver via
 * `createHttpClient()` which works fine for read / write queries.
 *
 * The following tiny wrapper picks the right implementation at runtime so
 * the same import works everywhere.
 */

import { createClient, createHttpClient, type Client, type HttpClient } from "edgedb"

const INSTANCE = process.env.EDGEDB_INSTANCE
const SECRET = process.env.EDGEDB_SECRET_KEY

// Detect a browser / edge environment (no `process`, but `fetch` exists)
const isBrowser = typeof window !== "undefined"

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const client: Client | HttpClient = isBrowser
  ? createHttpClient({
      instanceName: INSTANCE!,
      secretKey: SECRET, // safe in preview; remove if exposing publicly
    })
  : createClient({
      instance: INSTANCE,
      secretKey: SECRET,
    })
