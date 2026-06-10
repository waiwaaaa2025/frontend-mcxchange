import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  XCircle,
  Mail,
  FileText,
  HelpCircle
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

interface DisputeData {
  id: string
  cardholderName: string
  userName: string
  status: 'PENDING' | 'SUBMITTED' | 'RESOLVED' | 'REJECTED'
  createdAt: string
  submittedAt?: string
  autoUnblockAt?: string
}

const DisputePage = () => {
  const { disputeId } = useParams<{ disputeId: string }>()
  const navigate = useNavigate()

  const [dispute, setDispute] = useState<DisputeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const loadDispute = async () => {
      if (!disputeId) {
        setError('Invalid dispute ID')
        setLoading(false)
        return
      }

      try {
        const response = await api.getDispute(disputeId)
        setDispute(response.data as DisputeData)

        // If already submitted or resolved, show that status
        if (response.data.status === 'SUBMITTED') {
          setSubmitted(true)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dispute')
      } finally {
        setLoading(false)
      }
    }

    loadDispute()
  }, [disputeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!disputeId) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await api.submitDispute(disputeId, {
        disputeEmail: email,
        disputeInfo: info,
        disputeReason: reason,
      })

      setSubmitted(true)
      setDispute(prev => prev ? {
        ...prev,
        status: 'SUBMITTED',
        submittedAt: response.data.submittedAt,
        autoUnblockAt: response.data.autoUnblockAt,
      } : null)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit dispute')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <Loader2 className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Dispute</h2>
          <p className="text-gray-500">Please wait...</p>
        </Card>
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dispute Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'This dispute does not exist or has expired.'}</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </Card>
      </div>
    )
  }

  // Show resolved status
  if (dispute.status === 'RESOLVED') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Restored</h2>
          <p className="text-gray-500 mb-6">
            Your account has been restored. You can now log in and continue using the platform.
          </p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    )
  }

  // Show rejected status
  if (dispute.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Dispute Rejected</h2>
          <p className="text-gray-500 mb-6">
            Your dispute has been reviewed and rejected. Your account remains blocked.
            If you believe this is an error, please contact support.
          </p>
          <a
            href="mailto:support@domilea.io"
            className="text-primary-500 hover:text-primary-600"
          >
            Contact Support
          </a>
        </Card>
      </div>
    )
  }

  // Show submitted status (waiting for auto-unblock)
  if (submitted || dispute.status === 'SUBMITTED') {
    const autoUnblockTime = dispute.autoUnblockAt ? new Date(dispute.autoUnblockAt) : null
    const now = new Date()
    const hoursRemaining = autoUnblockTime
      ? Math.max(0, Math.ceil((autoUnblockTime.getTime() - now.getTime()) / (1000 * 60 * 60)))
      : 24

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full py-12">
          <div className="text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dispute Submitted</h2>
            <p className="text-gray-500 mb-6">
              Thank you for submitting your dispute. Your account is being reviewed.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Automatic Restoration</h3>
                <p className="text-sm text-yellow-700">
                  Your account will be automatically restored in approximately{' '}
                  <strong>{hoursRemaining} hours</strong> if no further action is required.
                </p>
                {autoUnblockTime && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Expected restoration: {autoUnblockTime.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                We will review your submitted information
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                An admin may manually resolve your dispute before the 24-hour period
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                You will receive a notification when your account is restored
              </li>
            </ul>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Have questions?{' '}
              <a href="mailto:support@domilea.io" className="text-primary-500 hover:text-primary-600">
                Contact Support
              </a>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Show dispute form (PENDING status)
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Blocked</h1>
          <p className="text-gray-500">
            Your account has been blocked due to a payment verification issue.
            Please submit the form below to dispute this action.
          </p>
        </div>

        {/* Reason Card */}
        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Why was my account blocked?</h3>
              <p className="text-sm text-gray-600 mb-4">
                We detected a mismatch between the name on the payment card and your account name.
                This security measure helps protect our users from unauthorized transactions.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Cardholder Name</span>
                    <span className="font-medium text-gray-900">{dispute.cardholderName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Account Name</span>
                    <span className="font-medium text-gray-900">{dispute.userName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Dispute Form */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Submit Dispute
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Please provide the following information to verify your identity and explain the name mismatch.
            After submission, your account will be reviewed and restored within 24 hours.
          </p>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{submitError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Your Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll use this to contact you about your dispute
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <HelpCircle className="w-4 h-4 inline mr-1" />
                Why does the name not match?
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., I used my spouse's card with permission, the card is in my maiden name, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Additional Information
              </label>
              <textarea
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Provide any additional details that can help verify your identity (e.g., phone number associated with account, recent transactions, etc.)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Automatic restoration:</strong> After submitting this form, your account will be
                  automatically restored within 24 hours if no issues are found. An admin may also
                  restore your account manually before that time.
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !email || !reason || !info}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="mailto:support@domilea.io" className="text-primary-500 hover:text-primary-600">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default DisputePage
