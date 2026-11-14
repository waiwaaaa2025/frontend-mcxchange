import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import GlassCard from './ui/GlassCard'
import Button from './ui/Button'
import Input from './ui/Input'
import api from '../services/api'

interface CarrierPulseOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const CarrierPulseOnboardingModal = ({ isOpen, onClose }: CarrierPulseOnboardingModalProps) => {
  const navigate = useNavigate()
  const [mcNumber, setMcNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleaned = mcNumber.replace(/[^0-9]/g, '')
    if (!cleaned) {
      setError('Please enter a valid MC number')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.fmcsaLookupByMC(cleaned)
      if (response.success && response.data?.dotNumber) {
        // Save MC and DOT to the seller's account
        api.updateProfile({ mcNumber: cleaned, dotNumber: response.data.dotNumber }).catch(() => {})
        // Navigate to full CarrierPulse page with the DOT number
        localStorage.setItem('mcx_carrier_pulse_dismiss_count', '99')
        onClose()
        navigate(`/seller/carrier-pulse/${response.data.dotNumber}?fromOnboarding=true&mc=${cleaned}`)
      } else {
        setError('No carrier found with that MC number. Please check and try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to look up carrier. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMcNumber('')
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg">
              <GlassCard hover={false}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Carrier Pulse</h2>
                      <p className="text-sm text-gray-500">Look up your MC to see your company profile</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-5 mb-6 border border-secondary-100">
                  <h3 className="font-bold text-gray-900 mb-2">Welcome to Domilea!</h3>
                  <p className="text-sm text-gray-600">
                    Before you start listing, let's pull up your carrier information from FMCSA.
                    Enter your MC number below and we'll show you exactly what buyers will see
                    about your authority.
                  </p>
                </div>

                <form onSubmit={handleLookup} className="space-y-4">
                  <Input
                    label="MC Number"
                    placeholder="Enter your MC number (e.g. 123456)"
                    value={mcNumber}
                    onChange={(e) => {
                      setMcNumber(e.target.value)
                      setError(null)
                    }}
                    icon={<Search className="w-4 h-4" />}
                    required
                  />

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
                      Skip for Now
                    </Button>
                    <Button type="submit" fullWidth disabled={loading || !mcNumber.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Look Up My MC
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CarrierPulseOnboardingModal
