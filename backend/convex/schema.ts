import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  feeStatusValidator,
  ignitionStateValidator,
  liveTelemetryValidator,
  parentFields,
  paymentMethodValidator,
  studentFields,
  tripPointValidator,
  tripStatusValidator,
  vehicleFields,
} from "./lib/validators";

/**
 * One schema for the whole system. The admin dashboard (convex/admin/*) and the
 * parent app (convex/parent/*) read and write the same tables.
 */
export default defineSchema({
  // Convex Auth's tables (users, sessions, refresh tokens, hashed sign-in codes, rate limits),
  // used by the parent app's email-code sign-in. Admins sign in with Clerk instead.
  ...authTables,

  students: defineTable({
    ...studentFields,
    // Upper-cased, trimmed copy of gsId so uniqueness checks ignore case/spaces.
    gsIdNormalized: v.string(),
  })
    .index("by_gsIdNormalized", ["gsIdNormalized"])
    .index("by_vehicleId", ["vehicleId"]),

  parents: defineTable({
    ...parentFields,
    // Set when an admin turns this parent on while tracking hours are closed.
    // Cleared when the next pickup or drop-off window opens.
    manualTracking: v.optional(v.boolean()),
    // Lower-cased, trimmed copy of email so uniqueness checks ignore case/spaces.
    emailNormalized: v.string(),
    // Status history (ms since epoch). activatedAt is set the first time the account becomes active.
    invitedAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    deactivatedAt: v.optional(v.number()),
    // The parent app login (Convex Auth user) for this parent, set the first time they sign in.
    authUserId: v.optional(v.id("users")),
  })
    .index("by_emailNormalized", ["emailNormalized"])
    .index("by_authUserId", ["authUserId"]),

  /**
   * A parent's pending change of sign-in email (parent app → Settings). At most one per parent:
   * a new request replaces the old one, and it's deleted once confirmed. The code is stored only
   * as a SHA-256 hash.
   */
  emailChangeRequests: defineTable({
    parentId: v.id("parents"),
    newEmail: v.string(), // normalised (trimmed, lower-case)
    codeHash: v.string(),
    expiresAt: v.number(),
    failedAttempts: v.number(),
  }).index("by_parentId", ["parentId"]),

  vehicles: defineTable({
    ...vehicleFields,
    registrationNormalized: v.string(),
    // Latest tracker report; null until the tracker reports for the first time.
    telemetry: v.union(liveTelemetryValidator, v.null()),
  }).index("by_registrationNormalized", ["registrationNormalized"]),

  // ----- Monitoring history, written by tracker ingestion (not built yet). -----

  /**
   * One stored GPS report. While parked, ingestion only stores a point every few minutes
   * (or when the van moves), so this table doesn't fill up with identical points.
   */
  positions: defineTable({
    vehicleId: v.id("vehicles"),
    t: v.number(), // GPS fix time, ms since epoch
    lat: v.number(),
    lng: v.number(),
    speed: v.number(), // km/h
    heading: v.union(v.number(), v.null()),
    ignition: ignitionStateValidator,
  }).index("by_vehicle_t", ["vehicleId", "t"]),

  /** Every ignition ON/OFF (requirement 4.7). Also drives the admin notification bell. */
  ignitionEvents: defineTable({
    vehicleId: v.id("vehicles"),
    at: v.number(),
    state: ignitionStateValidator,
    location: v.union(tripPointValidator, v.null()), // where it happened, null if no GPS fix
    tripId: v.union(v.id("trips"), v.null()), // trip started (ON) or ended (OFF) by this event
  })
    .index("by_at", ["at"])
    .index("by_vehicle_at", ["vehicleId", "at"]),

  // ----- Tracker integration (convex/integrations/*) -----

  /**
   * Ingestion bookkeeping per vehicle: what the last processed report said, so the next
   * report can be compared with it (ignition change, speeding start/end, duplicates).
   */
  trackerState: defineTable({
    vehicleId: v.id("vehicles"),
    provider: v.string(), // "falcon"
    lastGpsAt: v.number(), // GPS time of the last processed report
    ignition: ignitionStateValidator,
    openTripId: v.union(v.id("trips"), v.null()),
    openAlertId: v.union(v.id("speedAlerts"), v.null()),
    lastStored: v.union(v.object({ t: v.number(), lat: v.number(), lng: v.number() }), v.null()),
    // Last fix actually shown on the map. A later impossible jump does not replace it.
    lastAccepted: v.optional(v.object({ t: v.number(), lat: v.number(), lng: v.number() })),
  }).index("by_vehicleId", ["vehicleId"]),

  // Integration credentials and API tokens are never stored in the database: credentials
  // live in deployment env vars and tokens only in the poll action's memory.

  /** Per-admin notification read state: everything at or before lastReadAt counts as read. */
  adminNotificationState: defineTable({
    adminKey: v.string(), // Clerk user id
    lastReadAt: v.number(),
  }).index("by_adminKey", ["adminKey"]),

  trips: defineTable({
    vehicleId: v.id("vehicles"),
    type: v.string(), // e.g. "Morning pickup"
    status: tripStatusValidator,
    startedAt: v.number(),
    endedAt: v.union(v.number(), v.null()),
    studentsOnboard: v.number(),
    totalStudents: v.number(),
    progress: v.union(v.number(), v.null()), // 0–100
    eta: v.union(v.number(), v.null()), // ms since epoch
    // Trip summary. Start is set when ignition turns ON; the rest when it turns OFF.
    // A trip with no ignition-OFF yet stays ongoing (endedAt/endLocation/… null).
    startLocation: v.union(tripPointValidator, v.null()),
    endLocation: v.union(tripPointValidator, v.null()),
    distanceKm: v.union(v.number(), v.null()),
    maxSpeed: v.union(v.number(), v.null()), // km/h
  })
    .index("by_status", ["status"])
    .index("by_startedAt", ["startedAt"])
    .index("by_vehicle_startedAt", ["vehicleId", "startedAt"]),

  /**
   * One alert per continuous speeding event (requirement 4.6). Created when the van first
   * goes over the limit; `speed` is raised to the peak while it stays over; `endedAt` is set
   * when it drops back under.
   */
  speedAlerts: defineTable({
    vehicleId: v.id("vehicles"),
    at: v.number(), // when the limit was first exceeded
    speed: v.number(), // highest speed recorded during this event, km/h
    speedLimit: v.number(),
    lat: v.number(), // where the peak speed was recorded
    lng: v.number(),
    address: v.string(),
    endedAt: v.union(v.number(), v.null()), // null while still speeding
    tripId: v.union(v.id("trips"), v.null()),
  })
    .index("by_at", ["at"])
    .index("by_vehicle_at", ["vehicleId", "at"]),

  // ----- Fees (admin dashboard only; convex/admin/finance.ts) -----

  /**
   * One school-wide settings row (`key` is always "default").
   * `speedLimitKmh` is omitted until an admin changes it; ingestion and the dashboard
   * then use the default of 60 km/h. Monthly fees live on each student.
   */
  feeSettings: defineTable({
    key: v.string(),
    speedLimitKmh: v.optional(v.number()),
  }).index("by_key", ["key"]),

  /**
   * One school-wide parent-tracking schedule (Asia/Karachi). `open` is written by the
   * minute job and by Settings saves. The parent app reads it; it does not read the clock.
   */
  trackingSchedule: defineTable({
    key: v.string(), // always "default"
    pickupStart: v.number(), // minutes from midnight, inclusive
    pickupEnd: v.number(), // exclusive
    dropoffStart: v.number(),
    dropoffEnd: v.number(),
    override: v.union(v.literal("auto"), v.literal("on"), v.literal("off")),
    // School-wide parent tracking. Omitted means on, so existing rows keep today's hours.
    enabled: v.optional(v.boolean()),
    open: v.boolean(),
    reason: v.union(
      v.literal("pickup"),
      v.literal("dropoff"),
      v.literal("closed"),
      v.literal("forced_on"),
      v.literal("forced_off"),
    ),
  }).index("by_key", ["key"]),

  /**
   * One fee per student per month. Created for active students who have a monthly fee,
   * when the student is saved, when a student becomes active, or when an admin opens Finance.
   * A pending row follows the student's current fee. A paid row keeps the amount that was paid.
   */
  feeCharges: defineTable({
    studentId: v.id("students"),
    year: v.number(),
    month: v.number(), // 1–12, school calendar (Asia/Karachi)
    amount: v.number(), // this student's fee for the month
    status: feeStatusValidator,
    paidAt: v.union(v.number(), v.null()),
    paymentMethod: paymentMethodValidator,
    note: v.string(), // "" when not set; not shown in the ledger table
  })
    .index("by_studentId_and_year_and_month", ["studentId", "year", "month"])
    .index("by_year_and_month", ["year", "month"])
    .index("by_status_and_year_and_month", ["status", "year", "month"]),
});
