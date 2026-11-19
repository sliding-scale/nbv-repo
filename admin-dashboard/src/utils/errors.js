import { ConvexError } from 'convex/values'

/**
 * Turns a failed Convex call into { field, message } for showing in a form.
 * Backend validation errors are ConvexErrors carrying { code, field, message }.
 */
export function readMutationError(err) {
  if (err instanceof ConvexError && err.data && typeof err.data === 'object') {
    return { field: err.data.field ?? null, message: err.data.message ?? 'Something went wrong.' }
  }
  console.error(err)
  return { field: null, message: 'Could not save. Check that the Convex backend is running and try again.' }
}
