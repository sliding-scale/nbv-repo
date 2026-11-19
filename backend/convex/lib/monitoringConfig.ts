/**
 * Monitoring thresholds used by tracker ingestion when it raises alerts.
 * The live speed limit is the admin setting in feeSettings.speedLimitKmh.
 * SPEED_LIMIT_KMH is the fallback until that setting is saved.
 */

/** Default speed limit in km/h, used until an admin sets one. */
export const SPEED_LIMIT_KMH = 60;

/**
 * GPS freshness. A fix up to ONLINE age is "online", up to STALE age is "weak" (stale),
 * older is "offline" (unavailable). Trackers report every few seconds while driving but
 * only every ~4–6 minutes when parked (observed on Falcon-i), so parked vans get longer.
 */
export const GPS_ONLINE_MAX_AGE_MS = { driving: 3 * 60_000, parked: 10 * 60_000 };
export const GPS_STALE_MAX_AGE_MS = { driving: 15 * 60_000, parked: 30 * 60_000 };

/** While parked, store a GPS point at most this often unless the van moves. */
export const PARKED_SAMPLE_MS = 5 * 60_000;
/** Movement smaller than this (metres) between reports counts as standing still. */
export const MIN_MOVE_METRES = 15;
