import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../auth/AuthContext'
import FullPageLoader from '../components/common/FullPageLoader'

// Pages like /login that a signed-in admin shouldn't see.
export default function PublicOnlyRoute() {
  const { isLoaded, isSignedIn } = useAdminAuth()

  if (!isLoaded) return <FullPageLoader />
  if (isSignedIn) return <Navigate to="/" replace />
  return <Outlet />
}
