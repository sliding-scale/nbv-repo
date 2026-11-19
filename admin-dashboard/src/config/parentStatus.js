// Parent account statuses, matching the backend (convex/lib/validators.ts).
export const parentStatuses = {
  invited: { label: 'Invited', tone: 'amber', description: 'Hasn’t signed in to the parent app yet' },
  active: { label: 'Active', tone: 'green', description: 'Can use the parent app' },
  deactivated: { label: 'Deactivated', tone: 'gray', description: 'Access revoked by an admin' },
}

export const PARENT_STATUS_ORDER = ['invited', 'active', 'deactivated']
