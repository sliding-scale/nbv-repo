import { v, type Infer } from "convex/values";

/**
 * Validators shared by the schema and by both apps' functions
 * (admin dashboard in convex/admin, parent app in convex/parent).
 */

/** A saved place: pickup/drop-off point chosen on Google Maps. */
export const locationValidator = v.object({
  label: v.string(), // e.g. "Home", "Gate 2" ("" when not set)
  address: v.string(),
  lat: v.number(),
  lng: v.number(),
  placeId: v.union(v.string(), v.null()), // Google place id, null if the pin was placed by hand
  notes: v.string(), // instructions for the driver ("" when not set)
});
export type Location = Infer<typeof locationValidator>;

export const studentStatusValidator = v.union(v.literal("active"), v.literal("inactive"));

/**
 * Editable student fields. Used for both create and update.
 *
 * Parent links live here (student.parentIds) and nowhere else, so the parent
 * management screen and the student form always agree.
 *
 */
export const studentFields = {
  fullName: v.string(),
  gsId: v.string(), // school-issued GS ID, unique across students
  grade: v.string(), // "" when not set
  // This student's monthly fee. Omitted until an admin saves one on the student form.
  monthlyFee: v.optional(v.number()),
  parentIds: v.array(v.id("parents")),
  vehicleId: v.union(v.id("vehicles"), v.null()),
  pickupLocation: v.union(locationValidator, v.null()),
  dropoffLocation: v.union(locationValidator, v.null()),
  status: studentStatusValidator,
};

/**
 * Parent account lifecycle:
 *   invited     – record created, parent hasn't signed in to the parent app yet
 *   active      – parent has access
 *   deactivated – access revoked by an admin (can be reactivated)
 */
export const parentStatusValidator = v.union(
  v.literal("invited"),
  v.literal("active"),
  v.literal("deactivated"),
);
export type ParentStatus = Infer<typeof parentStatusValidator>;

/** Editable parent fields. Associated students are passed separately (see admin/parents.ts). */
export const parentFields = {
  fullName: v.string(),
  email: v.string(), // unique across parents; used to sign in to the parent app
  phone: v.string(), // optional, "" when not set
  relationship: v.string(), // optional, e.g. "Mother", "Guardian" ("" when not set)
  status: parentStatusValidator,
  // Admin switch: whether this parent may see live van tracking in the parent app.
  // Independent of account status (a parent can be active but have tracking hidden).
  trackingEnabled: v.boolean(),
};

// ----- vehicles -----

export const recordStatusValidator = v.union(v.literal("active"), v.literal("inactive"));

/** Admin-managed vehicle details. Riders are stored on students (student.vehicleId). */
export const vehicleFields = {
  name: v.string(), // fleet name, e.g. "Van 01"
  registrationNumber: v.string(), // unique
  model: v.string(), // "" when not set
  driverName: v.string(), // "" when not set
  driverPhone: v.optional(v.string()), // "" or omitted when not set
  status: recordStatusValidator, // inactive = out of service
  parentTrackingEnabled: v.boolean(),
};

export const ignitionStateValidator = v.union(v.literal("on"), v.literal("off"));
export const gpsStatusValidator = v.union(v.literal("online"), v.literal("weak"), v.literal("offline"));

/** Latest tracker report for a vehicle. Written by tracker ingestion (convex/integrations), never by admins. */
export const liveTelemetryValidator = v.object({
  ignition: ignitionStateValidator,
  speed: v.number(), // km/h
  gpsStatus: gpsStatusValidator,
  lat: v.number(),
  lng: v.number(),
  address: v.string(), // tracker-provided landmark/address, "" if unknown
  heading: v.union(v.number(), v.null()), // degrees 0–359 (Falcon-i "angle"), null if unknown
  reportedAt: v.number(), // GPS fix time, ms since epoch
});

// ----- monitoring (filled by tracker ingestion) -----

export const tripStatusValidator = v.union(v.literal("in_progress"), v.literal("delayed"), v.literal("completed"));

/** Where a trip started or ended. Address is reverse-geocoded ("" if unknown). */
export const tripPointValidator = v.object({ lat: v.number(), lng: v.number(), address: v.string() });

// ----- fees (admin dashboard only; written by convex/admin/finance.ts) -----

export const feeStatusValidator = v.union(v.literal("pending"), v.literal("paid"));

/** How a fee was marked paid. Null while the row is still pending. */
export const paymentMethodValidator = v.union(v.literal("cash"), v.literal("online_transfer"), v.null());
