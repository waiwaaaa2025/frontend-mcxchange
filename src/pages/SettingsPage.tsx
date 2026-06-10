import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Shield, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { user, isIdentityVerified, refreshIdentityStatus } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-check status when returning from Stripe
  useEffect(() => {
    if (searchParams.get('verification') === 'complete') {
      handleCheckStatus()
    }
  }, [searchParams])

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.createVerificationSession()
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

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      await refreshIdentityStatus()
      const statusResponse = await api.getIdentityStatus()
      if (statusResponse.data?.identityVerified) {
        toast.success('Identity verified successfully!')
      } else if (statusResponse.data?.identityVerificationStatus === 'processing') {
        toast('Verification is still being processed. Please check back in a few minutes.', { icon: '⏳' })
      } else if (statusResponse.data?.identityVerificationStatus === 'requires_input') {
        toast.error('Verification needs attention. Please try again.')
      }
    } catch (err: any) {
      console.error('Failed to check status:', err)
    } finally {
      setChecking(false)
    }
  }

  const status = user?.identityVerificationStatus

  const getStatusDisplay = () => {
    if (isIdentityVerified) {
      return {
        icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
        label: 'Verified',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        description: 'Your identity has been verified. You have full access to all platform features.'
      }
    }
    if (status === 'processing') {
      return {
        icon: <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />,
        label: 'Processing',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200',
        description: 'Your verification is being processed. This usually takes a few minutes.'
      }
    }
    if (status === 'requires_input') {
      return {
        icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
        label: 'Needs Attention',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        description: 'Your verification could not be completed. Please try again with a clear photo of your government ID.'
      }
    }
    if (status === 'pending') {
      return {
        icon: <Clock className="w-6 h-6 text-gray-500" />,
        label: 'Pending',
        color: 'text-gray-700',
        bg: 'bg-gray-50 border-gray-200',
        description: 'Verification session started. Please complete the verification process.'
      }
    }
    return {
      icon: <Shield className="w-6 h-6 text-gray-400" />,
      label: 'Not Verified',
      color: 'text-gray-700',
      bg: 'bg-gray-50 border-gray-200',
      description: 'Verify your identity to access all platform features.'
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">Manage your account settings and verification status</p>

      {/* Identity Verification Section */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Identity Verification</h2>
          </div>

          {/* Status */}
          <div className={`border rounded-lg p-4 mb-6 ${statusDisplay.bg}`}>
            <div className="flex items-center gap-3">
              {statusDisplay.icon}
              <div>
                <span className={`font-semibold ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
                <p className={`text-sm mt-0.5 ${statusDisplay.color} opacity-80`}>
                  {statusDisplay.description}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isIdentityVerified && (
            <div className="space-y-3">
              {status === 'requires_input' || !status || status === 'canceled' ? (
                <Button onClick={handleVerify} loading={loading}>
                  <Shield className="w-4 h-4 mr-2" />
                  {status === 'requires_input' ? 'Try Again' : 'Verify Identity'}
                </Button>
              ) : null}

              {(status === 'processing' || status === 'pending') && (
                <Button onClick={handleCheckStatus} loading={checking} variant="secondary">
                  <Loader2 className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  Check Status
                </Button>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Why verify?</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Access detailed MC Authority listings</li>
              <li>• Make and receive offers on listings</li>
              <li>• Send messages to other users</li>
              <li>• Purchase credits and subscribe to plans</li>
              <li>• Help maintain a trusted marketplace</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
