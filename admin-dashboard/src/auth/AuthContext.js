import { createContext, useContext } from 'react'

/**
 * Shape: { isLoaded, isSignedIn, isAdmin, user: { name, email, imageUrl } | null, signOut() }
 * The rest of the app reads auth only through useAdminAuth(), never from Clerk directly.
 */
export const AuthContext = createContext(null)

export function useAdminAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside an auth provider')
  return ctx
}
