import { anyApi } from 'convex/server';
import type { api as BackendApi } from '@backend/_generated/api';

/**
 * Typed references to the backend's functions (backend/convex). Only the types are imported
 * from the backend folder, so Metro never bundles backend code; at runtime `anyApi` builds the
 * same function references by name.
 */
export const api = anyApi as unknown as typeof BackendApi;
