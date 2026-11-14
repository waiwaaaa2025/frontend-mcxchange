import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Download, Shield, AlertTriangle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

type PostPurchaseData = {
  tier: 'pdf' | 'bundle'
  email: string
  downloadUrl: string
  setupUrl?: string | null
  signInUrl?: string | null
  isClaimed?: boolean
  promoActive?: boolean
  promoExpiresAt?: string | null
}

const GuideThankYouPage = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [data, setData] = useState<PostPurchaseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [downloadTriggered, setDownloadTriggered] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError('Missing payment session. If you just paid, check your email for the download link.')
      return
    }

    let cancelled = false

    const fetchOnce = async (): Promise<{ retry: boolean }> => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/guide/post-purchase?session_id=${encodeURIComponent(sessionId)}`
        )
        const body = await res.json().catch(() => ({}))

        if (cancelled) return { retry: false }

        if (res.status === 402 || body?.code === 'PAYMENT_PENDING') {
          setPending(true)
          return { retry: true }
        }

        if (!res.ok || !body?.success) {
          setError(body?.error || 'Could not verify your purchase. Please check your email for the download link.')
          return { retry: false }
        }

        setPending(false)
        setData(body.data as PostPurchaseData)
        return { retry: false }
      } catch (err) {
        if (cancelled) return { retry: false }
        setError('Could not reach the server. Please check your email for the download link.')
        return { retry: false }
      }
    }

    let attempts = 0
    const tick = async () => {
      attempts += 1
      const { retry } = await fetchOnce()
      if (retry && attempts < 6 && !cancelled) {
        setTimeout(tick, 2000)
      }
    }
    tick()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  // Auto-trigger PDF download once we have the URL
  useEffect(() => {
    if (!data?.downloadUrl || downloadTriggered) return
    setDownloadTriggered(true)
    window.location.assign(data.downloadUrl)
  }, [data, downloadTriggered])

  if (error) {
    return (
      <CenteredCard>
        <IconBubble color="amber">
          <AlertTriangle className="w-12 h-12 text-amber-600" />
        </IconBubble>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <p className="text-sm text-gray-500">
          Need help? Email <a className="text-secondary-600 underline" href="mailto:support@domilea.com">support@domilea.com</a>.
        </p>
      </CenteredCard>
    )
  }

  if (pending || !data) {
    return (
      <CenteredCard>
        <div className="w-20 h-20 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-4 border-secondary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Confirming your payment…</h1>
        <p className="text-gray-600">This usually takes a few seconds.</p>
      </CenteredCard>
    )
  }

  const formattedExpiry = data.promoExpiresAt
    ? new Date(data.promoExpiresAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <CenteredCard>
      <IconBubble color="green">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </IconBubble>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        {data.tier === 'bundle' ? "You're in — guide + 60 days of access" : 'Your guide is ready'}
      </h1>

      <p className="text-gray-600 mb-2">
        Thanks for your purchase. We sent a copy of these instructions to{' '}
        <span className="font-medium text-gray-900">{data.email}</span>.
      </p>
      <p className="text-gray-500 text-sm mb-6">
        Your download should start automatically. If it doesn't, use the button below.
      </p>

      <div className="space-y-3 mb-6">
        <Button
          fullWidth
          onClick={() => window.location.assign(data.downloadUrl)}
        >
          <Download className="w-4 h-4 mr-2" />
          Download the Guide (PDF)
        </Button>
      </div>

      {data.tier === 'bundle' && (
        <div className="bg-secondary-50 border border-secondary-100 rounded-xl p-4 sm:p-6 text-left mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Your 60-day Carrier Pulse + Credit Check access is active
              </h3>
              <p className="text-sm text-gray-600">
                Unlimited Chameleon checks, UCC filings, tax-lien lookups, Safety Improvement Reports,
                daily BASIC score updates, and Creditsafe credit reports — included with your bundle.
                {formattedExpiry && (
                  <>
                    {' '}
                    Active through <span className="font-medium text-gray-900">{formattedExpiry}</span>.
                  </>
                )}
              </p>
            </div>
          </div>

          {!data.isClaimed && data.setupUrl ? (
            <>
              <p className="text-sm text-gray-700 mb-3">
                <strong>One step left:</strong> set a password so you can sign in and use it.
              </p>
              <Button fullWidth onClick={() => window.location.assign(data.setupUrl!)}>
                Set Your Password
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Sign in with the email above to start using your access.
              </p>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => data.signInUrl && window.location.assign(data.signInUrl)}
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">All payments are final.</p>
    </CenteredCard>
  )
}

const CenteredCard = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-secondary-50 flex items-center justify-center p-4 sm:p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg w-full"
    >
      <Card className="p-5 sm:p-8 text-center">{children}</Card>
    </motion.div>
  </div>
)

const IconBubble = ({
  color,
  children,
}: {
  color: 'green' | 'amber'
  children: React.ReactNode
}) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', delay: 0.15, duration: 0.5 }}
    className={`w-20 h-20 rounded-full ${
      color === 'green' ? 'bg-green-100' : 'bg-amber-100'
    } flex items-center justify-center mx-auto mb-6`}
  >
    {children}
  </motion.div>
)

export default GuideThankYouPage
