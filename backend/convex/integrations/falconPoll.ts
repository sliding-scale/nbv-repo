"use node";

/**
 * Falcon-i poll (network side). Runs in Convex's Node.js runtime because Falcon-i's server
 * only negotiates TLS 1.2 with ECDHE-RSA-AES256-SHA384, which Convex's default runtime rejects.
 * Database work is delegated to the internal functions in ./falcon.ts.
 *
 * The API token is never written to the database. It is cached only in this module's memory,
 * which Convex may reuse between runs while the Node process stays warm; after a cold start
 * we simply log in again.
 *
 * Scheduled every 30 s in convex/crons.ts. Run once by hand:
 *   npx convex run integrations/falconPoll:poll
 */

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import {
  DEFAULT_FALCON_API_URL,
  DEFAULT_GPS_UTC_OFFSET,
  type FalconLocationResponse,
  jwtExpiry,
  normalizeFalconReport,
} from "../lib/falcon";
import type { IngestOutcome } from "../lib/ingestion";

/** Log in again when the in-memory token has less than this left. */
const TOKEN_REFRESH_MARGIN_MS = 24 * 60 * 60_000;
const REQUEST_TIMEOUT_MS = 15_000;

/** In-memory only — never persisted. */
let cachedToken: { token: string; expiresAt: number | null } | null = null;

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function postJson(url: string, body: unknown, token?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new HttpError(res.status, `Falcon-i ${new URL(url).pathname} returned HTTP ${res.status}`);
  return await res.json();
}

type IngestResult = Record<IngestOutcome, number> & { staleChanged: number };
type PollResult =
  | ({ ok: true; requested: number; received: number; skipped: number } & IngestResult)
  | { ok: false; error: string };

export const poll = internalAction({
  args: {},
  handler: async (ctx): Promise<PollResult> => {
    const polledAt = Date.now();
    const username = process.env.FALCON_USERNAME;
    const password = process.env.FALCON_PASSWORD;
    const baseUrl = (process.env.FALCON_API_URL || DEFAULT_FALCON_API_URL).replace(/\/+$/, "");
    const utcOffset = process.env.FALCON_GPS_UTC_OFFSET || DEFAULT_GPS_UTC_OFFSET;

    const fail = async (error: string): Promise<PollResult> => {
      // Still re-grade stale GPS so vehicles don't look live while the tracker API is down.
      await ctx.runMutation(internal.integrations.falcon.ingest, { reports: [], polledAt });
      console.error(`Falcon-i poll failed: ${error}`);
      return { ok: false, error };
    };

    if (!username || !password) return await fail("FALCON_USERNAME / FALCON_PASSWORD are not set on the deployment.");

    const registrations: string[] = await ctx.runQuery(internal.integrations.falcon.getActiveRegistrations, {});
    if (registrations.length === 0) return await fail("No active vehicles to poll.");

    const login = async (): Promise<string> => {
      const { token } = (await postJson(`${baseUrl}/Login`, { Id: username, Password: password })) as { token?: string };
      if (!token) throw new Error("Falcon-i login returned no token (check the username and password).");
      cachedToken = { token, expiresAt: jwtExpiry(token) };
      return token;
    };

    const fetchLatest = (token: string) =>
      postJson(`${baseUrl}/Vehicle/LastLocationStatus`, { Vehicles: registrations.join(","), V: 1.1, F: 1 }, token) as Promise<FalconLocationResponse>;

    try {
      const fresh =
        cachedToken && (!cachedToken.expiresAt || cachedToken.expiresAt - polledAt > TOKEN_REFRESH_MARGIN_MS);
      let token = fresh ? cachedToken!.token : await login();
      let response: FalconLocationResponse;
      try {
        response = await fetchLatest(token);
      } catch (err) {
        if (!(err instanceof HttpError && err.status === 401)) throw err;
        cachedToken = null;
        token = await login(); // token revoked or expired early: log in once and retry
        response = await fetchLatest(token);
      }

      // "NotFound" (with HTTP 200) just means none of the plates are on this account.
      const known = response.status === "OK" || response.status === "NotFound";
      if (!known) throw new Error(`Falcon-i returned status "${response.status}" (${response.statusCode}).`);

      const raw = response.data ?? [];
      const reports = raw.map((r) => normalizeFalconReport(r, utcOffset)).filter((r) => r !== null);
      const skipped = raw.length - reports.length;
      if (skipped > 0) console.warn(`Falcon-i: ${skipped} report(s) had missing or invalid fields and were skipped.`);
      const result: IngestResult = await ctx.runMutation(internal.integrations.falcon.ingest, { reports, polledAt });
      return { ok: true, requested: registrations.length, received: raw.length, skipped, ...result };
    } catch (err) {
      return await fail(err instanceof Error ? err.message : String(err));
    }
  },
});
