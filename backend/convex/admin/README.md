# Admin dashboard functions

Convex functions used only by the admin dashboard. Every function here starts with
`await requireAdmin(ctx)` from `convex/lib/auth.ts`.

| File | Exposed as |
|---|---|
| `students.ts` | `api.admin.students.list`, `.create`, `.update`, `.setStatus` |
| `finance.ts` | `api.admin.finance.getSettings`, `.setSpeedLimit`, `.listMonth`, `.arrears`, `.history`, `.ensureCurrentMonth`, `.markPaid`, `.markUnpaid` |
| `vehicles.ts` | `api.admin.vehicles.list`, `.create`, `.update`, `.setStatus`, `.remove` (riders via `studentIds`) |
| `monitoring.ts` | `api.admin.monitoring.activeTrips`, `.tripHistory`, `.speedAlertHistory`, `.recentSpeedAlerts`, `.vehicleDay` (read-only; filled by tracker ingestion) |
| `parents.ts` | `api.admin.parents.list`, `.create`, `.update`, `.deactivate`, `.reactivate` |
| `notifications.ts` | `api.admin.notifications.list` (paginated), `.unreadCount`, `.markAllRead` (ignition ON/OFF) |
| `trackingSchedule.ts` | `api.admin.trackingSchedule.get`, `.save`, `.refresh` (parent app hours; `.apply` is the minute job) |

Shared schema: `convex/schema.ts`. Shared helpers: `convex/lib/`.
The parent app's functions live separately in `convex/parent/`.
