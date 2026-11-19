/**
 * Falcon-i tracker integration. Runs every 30 s (see convex/crons.ts):
 *   1. log in if there's no token in memory or it expires within a day,
 *   2. fetch the latest report for every active vehicle in ONE request,
 *   3. hand the reports to ingestion (live state, GPS history, trips, alerts, notifications).
 *
 * Credentials come from deployment env vars (never from the client or the database):
 *   FALCON_USERNAME, FALCON_PASSWORD               required
 *   FALCON_API_URL                                 optional, default https://client-api.falconitracking.com
 *   FALCON_GPS_UTC_OFFSET                          optional, default +05:00 (Pakistan time)
 *
 * The API token is kept only in the poll action's memory, never in the database.
 * Poll errors go to the Convex deployment logs.
 *
 * This file holds the database side (queries/mutations). The network side lives in
 * falconPoll.ts, which runs in the Node.js runtime because Falcon-i's server only offers
 * TLS 1.2 with a CBC cipher (ECDHE-RSA-AES256-SHA384) that Convex's default runtime rejects.
 *
 * Run once by hand:  npx convex run integrations/falconPoll:poll
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { currentSpeedLimit } from "../lib/finance";
import { FALCON_PROVIDER } from "../lib/falcon";
import { type IngestOutcome, ingestReport, refreshGpsStatuses } from "../lib/ingestion";

const reportValidator = v.object({
  vehicleKey: v.string(),
  gpsAt: v.number(),
  lat: v.number(),
  lng: v.number(),
  speed: v.number(),
  ignition: v.union(v.literal("on"), v.literal("off")),
  address: v.string(),
  heading: v.union(v.number(), v.null()),
});

// ---------- database helpers (internal only) ----------

/** Registration numbers of all active vehicles (what we ask Falcon-i about). */
export const getActiveRegistrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();
    return vehicles.filter((v) => v.status === "active").map((v) => v.registrationNumber);
  },
});

/** Ingest one poll's reports and re-grade stale GPS. */
export const ingest = internalMutation({
  args: { reports: v.array(reportValidator), polledAt: v.number() },
  handler: async (ctx, { reports, polledAt }) => {
    const outcomes: Record<IngestOutcome, number> = { stored: 0, duplicate: 0, unknown_vehicle: 0, inactive_vehicle: 0 };
    const speedLimitKmh = await currentSpeedLimit(ctx);
    // Oldest first, so a batch that contains several reports per vehicle is applied in order.
    for (const r of [...reports].sort((a, b) => a.gpsAt - b.gpsAt)) {
      outcomes[await ingestReport(ctx, FALCON_PROVIDER, r, polledAt, speedLimitKmh)]++;
    }
    const staleChanged = await refreshGpsStatuses(ctx, polledAt);
    return { ...outcomes, staleChanged };
  },
});
