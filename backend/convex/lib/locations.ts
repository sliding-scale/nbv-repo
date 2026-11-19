import { ConvexError } from "convex/values";
import type { Location } from "./validators";

/**
 * Validate and trim a saved location (or null). `field` names the form field
 * in the error, e.g. "pickupLocation".
 */
export function cleanLocation(field: string, loc: Location | null): Location | null {
  if (!loc) return null;
  if (!loc.address.trim()) {
    throw new ConvexError({ code: "INVALID_INPUT", field, message: "A saved location needs an address." });
  }
  if (Math.abs(loc.lat) > 90 || Math.abs(loc.lng) > 180) {
    throw new ConvexError({ code: "INVALID_INPUT", field, message: "Location coordinates are out of range." });
  }
  return { ...loc, label: loc.label.trim(), address: loc.address.trim(), notes: loc.notes.trim() };
}
