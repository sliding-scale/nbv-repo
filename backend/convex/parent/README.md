# Parent app functions

Everything the parent app needs from the backend lives in this folder. For example,
`convex/parent/account.ts` becomes `api.parent.account.*`. Admin dashboard code lives in
`convex/admin/` and is never called from the parent app.

| File | What it is |
|---|---|
| `access.ts` | `requireActiveParent(ctx)`: who is calling. Start every parent function with it. |
| `account.ts` | `api.parent.account.me`: the signed-in parent's name, email and status. |
| `child.ts` | `findActiveChild`: the parent's active child (a child with a van wins). Used by the queries below. |
| `driver.ts` | `api.parent.driver.details`: the child's name and grade, plus the van name, registration, driver name and contact number. No location. |
| `fees.ts` | `api.parent.fees.mine`: that child's fee rows (amount, paid or pending). No admin note. |
| `tracking.ts` | `api.parent.tracking.myVan`: `{ van, stops }`: the van's live position + last report time (or why it can't be shown) and the child's pickup/drop-off points. |
| `emailChange.ts` | `api.parent.emailChange.request` / `.confirm`: change the sign-in email, confirmed with a code sent to the new address. |
| `otpEmail.ts` | Email sign-in code provider: 6 digits, 10-minute expiry, sent with Resend. Also `sendCodeEmail` for other codes. |
| `signInRules.ts` | Who may sign in, the 60 s resend cooldown, and linking the login to the parent record. |

## Sign-in (passwordless, email code)

Parents sign in with [Convex Auth](https://labs.convex.dev/auth). Admins use Clerk; both are
listed in `convex/auth.config.ts`. Convex Auth requires two root files, which only wire this folder up:
`convex/auth.ts` (the client calls `auth:signIn` / `auth:signOut` by that path) and `convex/http.ts`.

1. The app calls `signIn("resend-otp", { email })`.
2. `signInRules.createOrUpdateParentUser` checks for a parent with that email (the one the admin
   entered on the Parents page) whose account isn't deactivated. Otherwise it throws `NOT_REGISTERED`
   and nothing is created or sent. If a code went to this address under 60 s ago it throws `RESEND_TOO_SOON`.
3. Convex Auth stores a **SHA-256 hash** of a new 6-digit code (`authVerificationCodes`) and
   `otpEmail.ts` emails the code.
4. The app calls `signIn("resend-otp", { email, code })`. Convex Auth hashes the code and checks
   it against the stored hash, the email and the expiry. A correct code is **deleted** straight away
   (single use); an expired one is deleted too. Requesting a new code deletes the old one. Five wrong
   codes per email per hour block further attempts (`authRateLimits`).
5. On success, `createOrUpdateParentUser` runs again: it re-checks the parent, links the login
   (`parents.authUserId`) and moves an **invited** parent to **active**. Convex Auth then issues a
   JWT (1 hour) plus a refresh token; sessions last 30 days of inactivity / 90 days in total (`convex/auth.ts`).

## Access control

`requireActiveParent(ctx)` accepts only parent-app tokens and rejects parents an admin has
**deactivated**, so deactivation takes effect on the parent's next request.

Before returning any live location, the school tracking switch must be on and a pickup or
drop-off window must be open. `canParentTrack(parent, vehicleAllowsTracking)` then checks
that the parent is active and that this van allows parent tracking (Vehicles page).

## Live tracking

`myVan` returns **only** `{ lat, lng, reportedAt }` for one van (in `van`): never speed, ignition, heading,
address, driver or trips. It picks the first active child of the parent that has a van (one van
per parent for now). The van is hidden (`tracking_off`) when the school switch or this van's
switch is off, and `outside_hours` when the window is closed. It's reactive, so a Settings
or Vehicles change hides the van straight away.
`stops` holds the child's pickup and drop-off points (`{ lat, lng, label }` or null), set on the
Students page. They're the parent's own child's data, so they're returned even when tracking is off.

## Changing the sign-in email

`request({ newEmail })` (an action, so the code is truly random) checks the address is valid,
different and not used by another parent, then emails a 6-digit code to it (`emailChangeRequests`
stores only its hash; 10-minute expiry, 60 s between requests). `confirm({ code })` allows 5 wrong
tries, then updates `parents.email`, the Convex Auth login (`authAccounts`) and `users.email` in one
transaction: the old address can no longer sign in and the new one can.

## Deployment environment variables

See `backend/.env.example`. Set them with `npx convex env set NAME value`.
