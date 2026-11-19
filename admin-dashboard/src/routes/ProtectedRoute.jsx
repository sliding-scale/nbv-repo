import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useConvexAuth } from 'convex/react'
import { ShieldX } from 'lucide-react'
import { useAdminAuth } from '../auth/AuthContext'
import Button from '../components/common/Button'
import ConfigError from '../components/common/ConfigError'
import FullPageLoader from '../components/common/FullPageLoader'

function AccessDenied({ email, onSignOut }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <ShieldX size={18} /> No admin access
        </div>
        <p className="mb-4">
          {email ? <strong>{email}</strong> : 'This account'} isn't an admin for this dashboard. Contact your
          administrator if you need access.
        </p>
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

// Only signed-in admins can see these routes; everyone else goes to /login.
// Also waits until Convex has verified the Clerk token, so admin queries never run unauthenticated.
export default function ProtectedRoute() {
  const { isLoaded, isSignedIn, isAdmin, user, signOut } = useAdminAuth()
  const convexAuth = useConvexAuth()
  const location = useLocation()

  if (!isLoaded) return <FullPageLoader />
  if (!isSignedIn) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isAdmin) return <AccessDenied email={user?.email} onSignOut={signOut} />
  if (convexAuth.isLoading) return <FullPageLoader />
  if (!convexAuth.isAuthenticated) {
    return (
      <ConfigError>
        Signed in to Clerk, but the backend rejected the session. Check that the Convex integration is enabled in
        Clerk and that <code>CLERK_JWT_ISSUER_DOMAIN</code> is set on the Convex deployment.
      </ConfigError>
    )
  }
  return <Outlet />
}
