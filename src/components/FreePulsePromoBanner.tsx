import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Mirrors backend FREE_TOOLS_PROMO_ENDS_AT (end of day 2026-10-13 US Central).
// The banner hides itself once the promo is over — no deploy needed.
const PROMO_ENDS_AT = new Date('2026-10-14T04:59:59Z').getTime()
const DISMISS_KEY = 'freePulsePromoBannerDismissed'

const FreePulsePromoBanner = () => {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed || Date.now() >= PROMO_ENDS_AT) return null

  const role = user?.role?.toLowerCase()
  const to = !user
    ? '/register'
    : role === 'seller' || role === 'admin'
      ? `/${role}/carrier-pulse`
      : '/buyer/carrier-pulse'

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
      <div className="max-w-7xl mx-auto px-10 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-center">
        <span className="flex items-center gap-1.5 font-semibold">
          <Activity className="w-4 h-4 shrink-0" />
          CarrierPulse is FREE until Oct 13
        </span>
        <span className="text-indigo-100 hidden sm:inline">Full carrier checks for every signed-in account. No card needed.</span>
        <Link
          to={to}
          className="font-semibold underline underline-offset-2 hover:text-indigo-100 whitespace-nowrap"
        >
          {user ? 'Open CarrierPulse →' : 'Sign up free →'}
        </Link>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default FreePulsePromoBanner
