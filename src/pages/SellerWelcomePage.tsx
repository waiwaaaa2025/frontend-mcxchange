import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Loader2,
  TrendingUp,
  CheckCircle,
  Truck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const SellerWelcomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mcNumber, setMcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    // If seller already completed MC onboarding, go to dashboard
    const key = `mcx_seller_welcome_seen_${user.id}`
    if (localStorage.getItem(key) === 'true') {
      navigate('/seller/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleaned = mcNumber.replace(/[^0-9]/g, '')
    if (!cleaned) {
      setError('Please enter a valid MC number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.fmcsaLookupByMC(cleaned)
      if (response.success && response.data?.dotNumber) {
        const carrier = response.data

        // Save MC, DOT, and company name to seller's profile
        setSaving(true)
        try {
          await api.updateProfile({
            mcNumber: cleaned,
            dotNumber: String(carrier.dotNumber),
            companyName: carrier.legalName || undefined,
            city: carrier.hqCity || undefined,
            state: carrier.hqState || undefined,
          })
        } catch {
          // Non-critical — continue even if profile save fails
        }
        setSaving(false)

        // Mark onboarding as complete
        if (user) {
          localStorage.setItem(`mcx_seller_welcome_seen_${user.id}`, 'true')
          localStorage.setItem('mcx_carrier_pulse_dismiss_count', '99')
        }

        // Navigate to full CarrierPulse page
        navigate(`/seller/carrier-pulse/${carrier.dotNumber}?fromOnboarding=true&mc=${cleaned}`)
      } else {
        setError('No carrier found with that MC number. Please check and try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to look up carrier. Please try again.')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`mcx_seller_welcome_seen_${user.id}`, 'true')
    }
    navigate('/seller/dashboard', { replace: true })
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/30"
          >
            <Truck className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-gray-900 tracking-tight"
          >
            Welcome to Domilea, {user.name?.split(' ')[0]}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 mt-2 text-lg"
          >
            Let's get your carrier profile set up
          </motion.p>
        </div>

        {/* MC Lookup Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Enter Your MC Number</h2>
              <p className="text-sm text-gray-500">We'll pull your carrier info from FMCSA</p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={mcNumber}
                onChange={e => { setMcNumber(e.target.value); setError('') }}
                placeholder="Enter your MC number (e.g. 123456)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-lg font-medium transition-all outline-none"
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || saving || !mcNumber.trim()}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading || saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {saving ? 'Saving your profile...' : 'Looking up your MC...'}
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Look Up My MC
                </>
              )}
            </button>
          </form>

          {/* What happens next */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What happens next</p>
            <div className="space-y-2.5">
              {[
                'We pull your full carrier profile from FMCSA',
                'You review your safety scores, authority, and insurance details',
                'When ready, list your authority for sale in minutes',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skip link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Skip for now, I'll do this later
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default SellerWelcomePage
