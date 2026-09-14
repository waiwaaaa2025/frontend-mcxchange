import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import { DomileaIcon } from './ui/DomileaLogo'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Shown to a buyer who is about to buy a business (the seller accepted their
// offer) but hasn't verified their identity yet.
const IdentityVerificationPrompt = () => {
  const { user, refreshIdentityStatus } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = user?.identityVerificationStatus

  // Coming back from Stripe Identity — pull the latest status so the page opens
  // as soon as the verification has cleared.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('verification') === 'complete') {
      void refreshIdentityStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    try {
      // Return to this same page (deposit or transaction room) after verifying.
      const response = await api.createVerificationSession(window.location.pathname)
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        setError('Failed to start verification. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start verification')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckAgain = async () => {
    setChecking(true)
    try {
      await refreshIdentityStatus()
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Shield className="w-10 h-10 text-amber-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Verify Your Identity to Buy
            </h1>
            <p className="text-gray-600 text-lg">
              Your offer was accepted. Before you pay the deposit and complete the purchase, we need to verify your identity.
            </p>
          </div>

          {/* Main Card */}
          <Card className="mb-6">
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <DomileaIcon size={48} />
              </div>

              {status === 'processing' || status === 'pending' ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Verification In Progress
                    </h2>
                  </div>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Your identity verification is being processed. This usually takes a few minutes.
                    If you didn't finish the Stripe steps, start again below.
                  </p>
                  <div className="max-w-sm mx-auto space-y-3">
                    <Button fullWidth size="lg" variant="secondary" onClick={handleCheckAgain} loading={checking}>
                      Check Again
                    </Button>
                    <Button fullWidth size="lg" variant="ghost" onClick={handleVerify} loading={loading}>
                      Restart Verification
                    </Button>
                  </div>
                </>
              ) : status === 'requires_input' ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Verification Needs Attention
                    </h2>
                  </div>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Your previous verification attempt could not be completed. Please try again with a clear photo of your government-issued ID.
                  </p>
                  <div className="max-w-sm mx-auto space-y-3">
                    <Button fullWidth size="lg" onClick={handleVerify} loading={loading}>
                      Try Again
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Verify Your Identity
                  </h2>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    To protect sellers, every buyer verifies their identity before paying for a business. You only do this once.
                  </p>

                  {/* What you need */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-gray-50">
                      <Shield className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Government ID</div>
                      <div className="text-sm text-gray-500">Driver's license or passport</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Quick Process</div>
                      <div className="text-sm text-gray-500">Takes about 2 minutes</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50">
                      <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Secure</div>
                      <div className="text-sm text-gray-500">Powered by Stripe Identity</div>
                    </div>
                  </div>

                  <div className="max-w-sm mx-auto space-y-3">
                    <Button fullWidth size="lg" onClick={handleVerify} loading={loading}>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify My Identity
                    </Button>
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-500 mt-4">{error}</p>
              )}

              <p className="text-sm text-gray-500 mt-6">
                Your information is securely processed by Stripe and never stored on our servers.
              </p>
            </div>
          </Card>

          {/* Back link */}
          <div className="text-center">
            <Link
              to="/buyer/offers"
              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Offers
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default IdentityVerificationPrompt
