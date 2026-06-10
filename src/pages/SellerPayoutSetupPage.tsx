import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  CheckCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowRight,
  Shield,
  DollarSign,
  RefreshCw,
  Banknote,
} from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface ConnectStatus {
  hasAccount: boolean
  accountId?: string
  isOnboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  error?: string
}

const SellerPayoutSetupPage = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [openingDashboard, setOpeningDashboard] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getSellerConnectStatus()
      if (response.success) {
        setStatus(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payout status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Handle return from Stripe onboarding
  useEffect(() => {
    if (searchParams.get('onboarding') === 'complete') {
      toast.success('Onboarding submitted! Checking status...')
      fetchStatus()
    }
    if (searchParams.get('refresh') === 'true') {
      toast('Onboarding session expired. Please try again.', { icon: '⏰' })
    }
  }, [searchParams, fetchStatus])

  const handleSetupAccount = async () => {
    try {
      setCreating(true)
      const response = await api.createSellerConnectAccount()
      if (response.success && response.data?.onboardingUrl) {
        window.location.href = response.data.onboardingUrl
      } else {
        toast.error('Failed to start account setup')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create payout account')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenDashboard = async () => {
    try {
      setOpeningDashboard(true)
      const response = await api.getSellerConnectDashboard()
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank')
      } else {
        toast.error('Failed to open dashboard')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open Stripe dashboard')
    } finally {
      setOpeningDashboard(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const isFullyOnboarded = status?.isOnboarded

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payout Setup</h1>
        <p className="text-gray-600 mt-1">
          Connect your bank account to receive payments when your MC authorities sell.
        </p>
      </div>

      {/* Status Card */}
      <GlassCard className={`border-2 ${isFullyOnboarded ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isFullyOnboarded ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {isFullyOnboarded ? (
              <CheckCircle className="w-7 h-7 text-green-600" />
            ) : (
              <Building2 className="w-7 h-7 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {isFullyOnboarded ? 'Payout Account Active' : 'Set Up Your Payout Account'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isFullyOnboarded
                ? 'Your account is verified and ready to receive payouts from MC sales.'
                : 'Complete your Stripe account setup to receive payments directly to your bank account when a buyer purchases your MC authority.'
              }
            </p>

            {/* Status Indicators */}
            {status?.hasAccount && (
              <div className="mt-4 space-y-2">
                <StatusItem
                  label="Account Created"
                  done={true}
                />
                <StatusItem
                  label="Details Submitted"
                  done={status.detailsSubmitted}
                />
                <StatusItem
                  label="Charges Enabled"
                  done={status.chargesEnabled}
                />
                <StatusItem
                  label="Payouts Enabled"
                  done={status.payoutsEnabled}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3">
              {isFullyOnboarded ? (
                <>
                  <Button
                    onClick={handleOpenDashboard}
                    disabled={openingDashboard}
                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {openingDashboard ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    View Stripe Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchStatus}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSetupAccount}
                    disabled={creating}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {status?.hasAccount ? 'Continue Setup' : 'Set Up Payout Account'}
                  </Button>
                  {status?.hasAccount && (
                    <Button
                      variant="outline"
                      onClick={fetchStatus}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Status
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* How It Works */}
      <GlassCard>
        <h3 className="text-lg font-bold text-gray-900 mb-4">How Payouts Work</h3>
        <div className="space-y-4">
          <Step
            number={1}
            icon={<Building2 className="w-5 h-5" />}
            title="Set Up Your Account"
            description="Connect your bank account through Stripe's secure onboarding. This verifies your identity and sets up direct deposits."
          />
          <Step
            number={2}
            icon={<DollarSign className="w-5 h-5" />}
            title="Buyer Makes Payment"
            description="When a buyer purchases your MC authority, they pay via card or bank transfer. The funds are held securely by Stripe."
          />
          <Step
            number={3}
            icon={<Banknote className="w-5 h-5" />}
            title="You Get Paid"
            description="Once the transaction is confirmed, your payout is automatically transferred to your bank account. Domilea retains a small platform fee."
          />
        </div>
      </GlassCard>

      {/* Security Notice */}
      <GlassCard className="border border-gray-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Secure & Compliant</h4>
            <p className="text-sm text-gray-600 mt-1">
              Payouts are powered by Stripe, trusted by millions of businesses worldwide.
              Your banking information is encrypted and never stored on our servers.
              Stripe handles all compliance and regulatory requirements.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Pending verification notice */}
      {status?.hasAccount && status?.detailsSubmitted && !status?.chargesEnabled && (
        <GlassCard className="border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Verification In Progress</h4>
              <p className="text-sm text-amber-700 mt-1">
                Stripe is reviewing your information. This usually takes 1-2 business days.
                You'll be able to receive payouts once verification is complete.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

function StatusItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={`text-sm ${done ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}

function Step({ number, icon, title, description }: {
  number: number
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-sm">
          Step {number}: {title}
        </h4>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default SellerPayoutSetupPage
