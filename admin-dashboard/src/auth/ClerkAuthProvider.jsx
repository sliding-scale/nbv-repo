import { useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react'
import { AuthContext } from './AuthContext'

function ClerkBridge({ children }) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()

  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const value = {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    // From the "role" claim in the session token (the user's public metadata). The backend checks it too.
    isAdmin: sessionClaims?.role === 'admin',
    user: user
      ? {
          name: user.fullName || user.username || email.split('@')[0] || 'Admin',
          email,
          imageUrl: user.hasImage ? user.imageUrl : null,
        }
      : null,
    signOut: () => signOut({ redirectUrl: '/login' }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function ClerkAuthProvider({ publishableKey, children }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      // Lets Clerk navigate with React Router instead of full page reloads.
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      afterSignOutUrl="/login"
    >
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  )
}
