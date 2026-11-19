import { BrowserRouter } from 'react-router-dom'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/react'
import ConfigError from '../components/common/ConfigError'
import ClerkAuthProvider from '../auth/ClerkAuthProvider'
import FleetProvider from '../store/FleetProvider'
import MapsProvider from './MapsProvider'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

export default function AppProviders({ children }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ConfigError>
        Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>admin-dashboard/.env.local</code> and restart the dev
        server.
      </ConfigError>
    )
  }

  return (
    <BrowserRouter>
      <ClerkAuthProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {/* Sends the Clerk session token with every Convex call. */}
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <MapsProvider>
            <FleetProvider>{children}</FleetProvider>
          </MapsProvider>
        </ConvexProviderWithClerk>
      </ClerkAuthProvider>
    </BrowserRouter>
  )
}
