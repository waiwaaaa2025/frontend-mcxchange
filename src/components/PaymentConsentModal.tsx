import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Lock, Loader2 } from 'lucide-react'

interface PaymentConsentModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called with the customer's typed signature once they've agreed. */
  onAgree: (signature: string) => void
  /** What they're paying for, e.g. "the Premium plan" or "CarrierPulse". */
  productLabel?: string
  /** Disable the button + show a spinner while the checkout request is in flight. */
  submitting?: boolean
}

// Exact payment-terms consent language — MUST stay in sync with the backend
// CHECKOUT_CONSENT constant (backend-mcxchange/src/constants/legal.ts), which is
// what gets recorded and quoted in Stripe dispute evidence.
const CHECKOUT_CONSENT =
  'By subscribing, you confirm your agreement to our Terms of Service and Privacy Policy, including the Payment Terms, ' +
  'Subscription Billing, and Dispute Prohibition policies (Article 7). Subscriptions are billed month-to-month. ' +
  'All payments are final and non-refundable. You may cancel a subscription at any time by contacting info@domilea.com.'

/**
 * Affirmative payment-terms consent gate shown BEFORE redirecting to Stripe
 * Checkout. Captures a required agree-checkbox plus the customer's typed full
 * legal name (their electronic signature). The signature + exact terms + IP +
 * timestamp are recorded server-side as Stripe dispute evidence.
 */
const PaymentConsentModal = ({
  isOpen,
  onClose,
  onAgree,
  productLabel,
  submitting = false,
}: PaymentConsentModalProps) => {
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')

  // Reset each time it opens so a prior signature never carries over.
  useEffect(() => {
    if (isOpen) {
      setAgreed(false)
      setSignature('')
    }
  }, [isOpen])

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const canContinue = agreed && signature.trim().length >= 2 && !submitting

  const handleAgree = () => {
    if (!canContinue) return
    onAgree(signature.trim())
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={submitting ? undefined : onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative flex flex-col w-full h-full sm:m-auto sm:max-w-lg sm:max-h-[92vh] sm:rounded-2xl bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Agree to Payment Terms</h2>
              </div>
              <button
                onClick={onClose}
                disabled={submitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              <p className="text-sm text-gray-600">
                Before continuing to payment{productLabel ? ` for ${productLabel}` : ''}, please review
                and sign to confirm you agree to the payment terms below.
              </p>

              {/* Terms block */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
                {CHECKOUT_CONSENT}
                <div className="mt-2 text-xs text-gray-500">
                  See the full{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-gray-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-gray-700">
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>

              {/* Agree checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">
                  I have read and agree to the Payment Terms, Terms of Service, and Privacy Policy.
                  I understand all payments are final and non-refundable.
                </span>
              </label>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sign by typing your full legal name
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  autoComplete="name"
                  className="w-full px-4 py-3 text-2xl italic border-b-2 border-gray-300 focus:border-green-500 focus:outline-none bg-transparent"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-gray-500">
                  <span>Date: {today}</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Your IP address &amp; timestamp are recorded as your electronic signature.
                  </span>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
              <button
                onClick={handleAgree}
                disabled={!canContinue}
                className={`w-full py-4 px-6 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
                  canContinue
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Redirecting to secure payment…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Agree &amp; Continue to Payment
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PaymentConsentModal
