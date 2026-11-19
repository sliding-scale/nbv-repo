import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Pull the latest GPS report for every active vehicle from Falcon-i.
// Falcon-i only offers "last location", so this interval is our tracking resolution.
crons.interval("poll Falcon-i trackers", { seconds: 30 }, internal.integrations.falconPoll.poll, {});

// Open parent tracking during the pickup and drop-off windows, and close it when each one ends.
crons.interval("apply parent tracking schedule", { seconds: 60 }, internal.admin.trackingSchedule.apply, {});

export default crons;
