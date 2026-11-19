import { useLocation } from 'react-router-dom'
import { SignIn } from '@clerk/react'
import { Bus, Eye, MapPinned, ShieldCheck } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

const features = [
  { icon: MapPinned, text: 'Live location of every van on one map' },
  { icon: Eye, text: 'Control which parents can track each vehicle' },
  { icon: ShieldCheck, text: 'Speed alerts and GPS health at a glance' },
]

// Clerk's sign-in form, styled to match the dashboard.
const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    borderRadius: '0.5rem',
    fontFamily: 'inherit',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'none', border: '1px solid #e2e8f0' },
    // No registration: hide the "Don't have an account? Sign up" link.
    footerAction: { display: 'none' },
  },
}

export default function LoginPage() {
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname ?? '/'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (hidden on small screens) */}
      <aside className="relative hidden overflow-hidden bg-slate-900 p-12 text-slate-300 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
            <Bus size={22} />
          </span>
          <span className="text-xl font-bold text-white">VanTrack</span>
        </div>

        <div className="relative my-auto max-w-md">
          <h1 className="text-4xl leading-tight font-bold text-white">Every school van, tracked in real time.</h1>
          <p className="mt-4 text-slate-400">
            The admin console for managing vehicles, trips and parent access, all in one place.
          </p>
          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-800 text-blue-400">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {CURRENT_YEAR} VanTrack</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex items-center justify-center bg-slate-50 p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
              <Bus size={22} />
            </span>
            <span className="text-xl font-bold text-slate-900">VanTrack</span>
          </div>

          <SignIn
            routing="path"
            path="/login"
            // Sign-in only: an unknown email shows an error instead of switching to Clerk's sign-up form.
            withSignUp={false}
            fallbackRedirectUrl={redirectTo}
            appearance={clerkAppearance}
          />

          <p className="mt-6 text-center text-xs text-slate-500">
            Admin access only. Contact your administrator if you need an account.
          </p>
        </div>
      </main>
    </div>
  )
}
