/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_finance from "../admin/finance.js";
import type * as admin_monitoring from "../admin/monitoring.js";
import type * as admin_notifications from "../admin/notifications.js";
import type * as admin_parents from "../admin/parents.js";
import type * as admin_students from "../admin/students.js";
import type * as admin_trackingSchedule from "../admin/trackingSchedule.js";
import type * as admin_vehicles from "../admin/vehicles.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as integrations_falcon from "../integrations/falcon.js";
import type * as integrations_falconPoll from "../integrations/falconPoll.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_falcon from "../lib/falcon.js";
import type * as lib_finance from "../lib/finance.js";
import type * as lib_geo from "../lib/geo.js";
import type * as lib_ingestion from "../lib/ingestion.js";
import type * as lib_locations from "../lib/locations.js";
import type * as lib_monitoringConfig from "../lib/monitoringConfig.js";
import type * as lib_parents from "../lib/parents.js";
import type * as lib_students from "../lib/students.js";
import type * as lib_trackingSchedule from "../lib/trackingSchedule.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_vehicles from "../lib/vehicles.js";
import type * as parent_access from "../parent/access.js";
import type * as parent_account from "../parent/account.js";
import type * as parent_child from "../parent/child.js";
import type * as parent_driver from "../parent/driver.js";
import type * as parent_emailChange from "../parent/emailChange.js";
import type * as parent_fees from "../parent/fees.js";
import type * as parent_otpEmail from "../parent/otpEmail.js";
import type * as parent_signInRules from "../parent/signInRules.js";
import type * as parent_tracking from "../parent/tracking.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/finance": typeof admin_finance;
  "admin/monitoring": typeof admin_monitoring;
  "admin/notifications": typeof admin_notifications;
  "admin/parents": typeof admin_parents;
  "admin/students": typeof admin_students;
  "admin/trackingSchedule": typeof admin_trackingSchedule;
  "admin/vehicles": typeof admin_vehicles;
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  "integrations/falcon": typeof integrations_falcon;
  "integrations/falconPoll": typeof integrations_falconPoll;
  "lib/auth": typeof lib_auth;
  "lib/falcon": typeof lib_falcon;
  "lib/finance": typeof lib_finance;
  "lib/geo": typeof lib_geo;
  "lib/ingestion": typeof lib_ingestion;
  "lib/locations": typeof lib_locations;
  "lib/monitoringConfig": typeof lib_monitoringConfig;
  "lib/parents": typeof lib_parents;
  "lib/students": typeof lib_students;
  "lib/trackingSchedule": typeof lib_trackingSchedule;
  "lib/validators": typeof lib_validators;
  "lib/vehicles": typeof lib_vehicles;
  "parent/access": typeof parent_access;
  "parent/account": typeof parent_account;
  "parent/child": typeof parent_child;
  "parent/driver": typeof parent_driver;
  "parent/emailChange": typeof parent_emailChange;
  "parent/fees": typeof parent_fees;
  "parent/otpEmail": typeof parent_otpEmail;
  "parent/signInRules": typeof parent_signInRules;
  "parent/tracking": typeof parent_tracking;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
