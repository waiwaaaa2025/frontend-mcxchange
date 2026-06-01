import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Coins,
  Check,
  Sparkles,
  Zap,
  Crown,
  Shield,
  ArrowLeft,
  Star,
  TrendingUp,
  Unlock,
  CheckCircle,
  XCircle,
  Calendar,
  AlertCircle,
  Loader2,
  Package,
  ShoppingBag,
  Mail,
  X,
  Send,
  UserSearch,
  Megaphone
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Textarea from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { toast } from 'react-hot-toast'
import type { SubscriptionPlanConfig, CreditPack } from '../types'

// Plan display configuration (styling only - prices come from API)
const planStyles = {
  package_tool: {
    icon: Package,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200',
    popular: false,
  },
  starter: {
    icon: Coins,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    popular: false,
  },
  professional: {
    // Grandfathered — kept so existing Professional subscribers' plan card still styles.
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    popular: false,
  },
  premium: {
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    popular: true,
  },
  enterprise: {
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'from-yellow-50 to-orange-50',
    borderColor: 'border-yellow-200',
    popular: false,
  },
  vip_access: {
    icon: Crown,
    color: 'from-amber-500 to-red-500',
    bgColor: 'from-amber-50 to-red-50',
    borderColor: 'border-amber-300',
    popular: false,
  },
  lead_generator_buyer: {
    icon: UserSearch,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-50 to-blue-50',
    borderColor: 'border-cyan-200',
    popular: false,
  },
  lead_generator_broker: {
    icon: Megaphone,
    color: 'from-fuchsia-500 to-purple-500',
    bgColor: 'from-fuchsia-50 to-purple-50',
    borderColor: 'border-fuchsia-200',
    popular: false,
  },
}

interface DisplayPlan extends SubscriptionPlanConfig {
  id: string
  icon: typeof Coins
  color: string
  bgColor: string
  borderColor: string
  popular: boolean
}

interface Subscription {
  id: string
  plan: string
  status: string
  creditsPerMonth: number
  creditsRemaining: number
  startDate: string
  endDate: string
  renewalDate: string
  isYearly: boolean
}

const BuyerSubscriptionPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isLoading: authLoading, isIdentityVerified } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>('premium')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [credits, setCredits] = useState({ total: 0, used: 0, available: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [plans, setPlans] = useState<DisplayPlan[]>([])
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [carrierPulseAccess, setCarrierPulseAccess] = useState(false)
  const [carrierPulseCheckoutLoading, setCarrierPulseCheckoutLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(true)
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null)

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactSending, setContactSending] = useState(false)

  // Fetch plans and credit packs from API (using public endpoints)
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setPlansLoading(true)
        const [plansResponse, packsResponse] = await Promise.all([
          api.getSubscriptionPlans(),  // Public endpoint: /credits/plans
          api.getCreditPacks(),         // Public endpoint: /credits/packs
        ])

        if (plansResponse.data && plansResponse.data.length > 0) {
          // Transform API plans array into display plans
          // API returns id as 'STARTER', 'PREMIUM', 'ENTERPRISE' (uppercase)
          const displayPlans: DisplayPlan[] = plansResponse.data.map(plan => {
            const planKey = plan.id.toLowerCase() as keyof typeof planStyles
            const styles = planStyles[planKey] || planStyles.starter
            return {
              id: planKey, // Use lowercase for frontend consistency
              name: plan.name,
              credits: plan.credits,
              priceMonthly: plan.priceMonthly,
              priceYearly: plan.priceYearly,
              stripePriceIdMonthly: plan.stripePriceIdMonthly,
              stripePriceIdYearly: plan.stripePriceIdYearly,
              features: plan.features,
              ...styles,
            }
          })
          setPlans(displayPlans)
        }

        if (packsResponse.data) {
          setCreditPacks(packsResponse.data)
        }
      } catch (err) {
        console.error('Failed to fetch pricing data:', err)
      } finally {
        setPlansLoading(false)
      }
    }

    fetchPricingData()
  }, [])

  // Check URL params for success/cancel and verify subscription
  useEffect(() => {
    const verifyAndFulfill = async () => {
      // Handle credit pack success
      if (searchParams.get('credit_pack_success') === 'true' && user) {
        const packId = searchParams.get('pack')
        setSuccessMessage(`Credit pack purchased successfully! Your credits have been added.`)
        // Refresh subscription data to show updated credits
        try {
          const subResponse = await api.getSubscription()
          if (subResponse.data) {
            setSubscription(subResponse.data.subscription)
            setCredits(subResponse.data.credits)
          }
        } catch (err) {
          console.error('Failed to refresh credits:', err)
        }
        window.history.replaceState({}, '', '/buyer/subscription')
        return
      }

      // Handle credit pack cancelled
      if (searchParams.get('credit_pack_cancelled') === 'true') {
        setError('Credit pack purchase was cancelled.')
        window.history.replaceState({}, '', '/buyer/subscription')
        return
      }

      // Handle subscription success
      // NOTE: Credits are granted via webhook (customer.subscription.created), not via this endpoint
      // We just refresh the subscription data to show updated credits from the webhook
      if (searchParams.get('success') === 'true' && user) {
        // Run verifyAndFulfill so the Subscription row is synced from Stripe even
        // if the webhook hasn't landed yet (webhook arrival is not guaranteed
        // before redirect).
        try {
          await api.verifySubscription()
        } catch (err) {
          console.error('verifySubscription failed (continuing):', err)
        }

        // Refresh subscription data to show updated credits (granted via webhook)
        try {
          const subResponse = await api.getSubscription()
          if (subResponse.data) {
            setSubscription(subResponse.data.subscription)
            setCredits(subResponse.data.credits)
          }
        } catch (err) {
          console.error('Failed to fetch subscription:', err)
        }

        // Lead Generator buyers get redirected straight into the tool — that's
        // the whole point of the purchase. Skip identity verification gate.
        if (searchParams.get('tool') === 'lead_generator') {
          window.location.href = '/buyer/lead-generator'
          return
        }

        // Auto-trigger Stripe Identity verification if not yet verified
        if (!isIdentityVerified) {
          try {
            const verifyResponse = await api.createVerificationSession()
            if (verifyResponse.success && verifyResponse.data?.url) {
              // Redirect straight to Stripe Identity — seamless post-payment flow
              window.location.href = verifyResponse.data.url
              return
            }
          } catch (err) {
            console.error('Failed to auto-start identity verification:', err)
            // Fall through to show success message — user can verify later from settings
          }
        }

        setSuccessMessage('Subscription activated successfully! Your credits have been added.')
        // Clear the success param from URL to prevent re-fetch on refresh
        window.history.replaceState({}, '', '/buyer/subscription')
      }
    }
    verifyAndFulfill()

    if (searchParams.get('canceled') === 'true') {
      setError('Subscription checkout was canceled.')
      window.history.replaceState({}, '', '/buyer/subscription')
    }

    // Pre-select VIP / Deal Access Pass if the user landed here via the VIP CTA
    if (searchParams.get('vip') === '1') {
      setSelectedPlan('vip_access')
    }
  }, [searchParams, user])

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      // Only fetch if user is authenticated
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [subResponse, pulseResponse] = await Promise.all([
          api.getSubscription(),
          api.getCarrierPulseAccess().catch(() => null),
        ])
        setSubscription(subResponse.data?.subscription || null)
        if (subResponse.data?.credits) {
          setCredits(subResponse.data.credits)
        }
        if (pulseResponse?.data) {
          setCarrierPulseAccess(pulseResponse.data.hasAccess)
        }
      } catch (err: any) {
        console.error('Failed to fetch subscription:', err)
        // If 401 error, the token is invalid - don't show error to user
        if (err.message?.includes('401') || err.message?.includes('No token') || err.message?.includes('Access denied')) {
          // Token is invalid, let auth context handle cleanup
          setSubscription(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, authLoading])

  const handleSubscribe = async (planId: string) => {
    // Check if user is authenticated - rely on AuthContext state, not api.getToken()
    // which may have timing issues between token being set and React state updating
    if (!user) {
      navigate('/login?redirect=/buyer/subscription')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await api.createSubscriptionCheckout(planId, billingCycle === 'yearly')

      // Redirect to Stripe Checkout
      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to create checkout session')
      setIsProcessing(false)
    }
  }

  const handleContactSubmit = async () => {
    if (!contactMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setContactSending(true)

    try {
      // Send inquiry to admin using existing messaging system
      await api.sendInquiryToAdmin(undefined, `[Subscription Inquiry]\n\nUser: ${user?.name} (${user?.email})\nPlan: ${subscription?.plan || 'None'}\n\nMessage:\n${contactMessage}`)

      toast.success('Message sent! We\'ll get back to you soon.')
      setShowContactModal(false)
      setContactMessage('')
    } catch (err: any) {
      console.error('Contact error:', err)
      toast.error(err.message || 'Failed to send message')
    } finally {
      setContactSending(false)
    }
  }

  // Manual verify/sync subscription for users who paid but credits weren't added
  const handleVerifySubscription = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await api.verifySubscription()
      if (response.data?.fulfilled) {
        setSuccessMessage('Subscription verified! Your credits have been added.')
        // Refresh subscription data
        const subResponse = await api.getSubscription()
        if (subResponse.data) {
          setSubscription(subResponse.data.subscription)
          setCredits(subResponse.data.credits)
        }
      } else {
        setError(response.data?.message || 'No active subscription found. Please complete checkout.')
      }
    } catch (err: any) {
      console.error('Verify error:', err)
      setError(err.message || 'Failed to verify subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  // Purchase CarrierPulse add-on
  const handleCarrierPulseCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=/buyer/subscription')
      return
    }
    setCarrierPulseCheckoutLoading(true)
    setError(null)
    try {
      const response = await api.createCarrierPulseCheckout()
      if (response.data?.url) {
        window.location.href = response.data.url
      }
    } catch (err: any) {
      console.error('CarrierPulse checkout error:', err)
      setError(err.message || 'Failed to start CarrierPulse checkout')
    } finally {
      setCarrierPulseCheckoutLoading(false)
    }
  }

  // Purchase a credit pack
  const handlePurchaseCreditPack = async (packId: string) => {
    if (!user) {
      navigate('/login?redirect=/buyer/subscription')
      return
    }

    setPurchasingPackId(packId)
    setError(null)

    try {
      const response = await api.purchaseCreditPack(packId)
      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      console.error('Credit pack purchase error:', err)
      setError(err.message || 'Failed to start checkout')
      setPurchasingPackId(null)
    }
  }

  // Get yearly price - use dynamic pricing from plan data
  const getYearlyPrice = (plan: DisplayPlan) => {
    return plan.priceYearly.toFixed(2)
  }

  // Get monthly equivalent when billed yearly
  const getMonthlyEquivalent = (plan: DisplayPlan) => {
    return (plan.priceYearly / 12).toFixed(2)
  }

  const currentCredits = credits.available

  // Show loading state while auth is initializing or fetching subscription/plans
  if (authLoading || loading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Show current subscription if user has one
  const hasActiveSubscription = subscription && subscription.status === 'ACTIVE'

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Current Subscription Card */}
        {hasActiveSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Active Subscription</h2>
                      <p className="text-gray-600 capitalize">{subscription.plan.toLowerCase()} Plan</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span>{subscription.creditsRemaining} credits remaining</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Renews {new Date(subscription.renewalDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowContactModal(true)}
                  className="hidden lg:inline-flex text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 mb-4"
          >
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              {hasActiveSubscription ? 'Upgrade Your Plan' : 'Unlock More Listings'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            {hasActiveSubscription ? 'Change Your Plan' : 'Choose Your Plan'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Get credits to unlock full listing details and find the perfect business for you
          </motion.p>

          {/* Current Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-col items-center gap-3"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-600">Current Balance:</span>
              <span className="text-2xl font-bold text-yellow-600">{currentCredits}</span>
              <span className="text-gray-600">credits</span>
            </div>
            {/* Show verify button if user might have paid but credits weren't added */}
            {currentCredits === 0 && (
              <button
                onClick={handleVerifySubscription}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Already paid? Click to sync your subscription
              </button>
            )}
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 flex items-center gap-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {plans.filter(p => p.id !== 'package_tool' && p.id !== 'professional').map((plan, index) => {
            const Icon = plan.icon
            const isSelected = selectedPlan === plan.id
            const isCurrentPlan = hasActiveSubscription && subscription.plan.toLowerCase() === plan.id
            const displayPrice = billingCycle === 'monthly' ? plan.priceMonthly : Number(getMonthlyEquivalent(plan))
            const yearlyTotal = plan.priceYearly
            const isVip = plan.id === 'vip_access'
            const isToolsOnly = plan.credits === 0

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all h-full ${
                    isSelected ? `ring-2 ring-gray-900 ${plan.borderColor}` : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-1 text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-1 text-xs font-bold">
                      CURRENT PLAN
                    </div>
                  )}

                  <div className={`bg-gradient-to-r ${plan.bgColor} -m-6 ${plan.popular || isCurrentPlan ? 'mt-2' : ''} mb-6 p-6 border-b border-gray-100`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">
                          {isVip ? 'All Access Plan' : isToolsOnly ? 'Add-On Tools Package' : `${plan.credits} credits/month`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                      {!isVip && <span className="text-gray-500">/month</span>}
                      {isVip && <span className="text-gray-500">one-time</span>}
                    </div>
                    {billingCycle === 'yearly' && !isVip && (
                      <p className="text-sm text-gray-500 mt-1">
                        Billed ${yearlyTotal.toFixed(2)} annually
                      </p>
                    )}
                  </div>

                  {/* Credits Highlight / VIP Highlight / Tools-Only */}
                  {isVip ? (
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <Sparkles className="w-8 h-8 text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="text-lg font-bold text-amber-600">Unlimited Access</div>
                          <div className="text-sm text-gray-600">Browse & unlock every listing until you buy</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                        <TrendingUp className="w-6 h-6 text-green-500 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold text-green-700">$399.99 applied to your purchase</span>
                          <span className="text-gray-600"> — credited toward your final MC price</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
                        <Mail className="w-6 h-6 text-purple-500 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold text-purple-700">Free consultation call with Maria</span>
                          <span className="text-gray-600"> — personalized guidance on your MC purchase</span>
                        </div>
                      </div>
                    </div>
                  ) : isToolsOnly ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 mb-6">
                      <Package className="w-8 h-8 text-rose-500" />
                      <div>
                        <div className="text-lg font-bold text-rose-600">Add-On Tools</div>
                        <div className="text-sm text-gray-600">No listing credits — tools only</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-50 border border-yellow-200 mb-6">
                      <Coins className="w-8 h-8 text-yellow-500" />
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{plan.credits}</div>
                        <div className="text-sm text-gray-600">Listing unlock credits</div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <Check className={`w-4 h-4 ${plan.popular ? 'text-purple-500' : 'text-green-500'}`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  {isCurrentPlan ? (
                    <Button
                      fullWidth
                      variant="outline"
                      disabled
                      className="bg-green-50 border-green-200 text-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlan(plan.id)
                      }}
                      className={isSelected ? `bg-gradient-to-r ${plan.color} border-0` : ''}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Selected
                        </>
                      ) : (
                        'Select Plan'
                      )}
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Pulse Bundle — legacy add-on, only shown to grandfathered subscribers */}
        {(() => {
          const pkgPlan = plans.find(p => p.id === 'package_tool')
          if (!pkgPlan) return null
          const isCurrentPlan = hasActiveSubscription && subscription.plan.toLowerCase() === 'package_tool'
          if (!isCurrentPlan) return null
          const isSelected = selectedPlan === 'package_tool'
          const displayPrice = billingCycle === 'monthly' ? pkgPlan.priceMonthly : Number(getMonthlyEquivalent(pkgPlan))

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 mb-3">
                  <Package className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-medium text-rose-700">Pulse Bundle</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pulse Bundle</h2>
                <p className="text-gray-600">All carrier intelligence tools in one bundle — no listing credits needed</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card
                  className={`relative overflow-hidden cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-gray-900 border-rose-200' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan('package_tool')}
                >
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-1 text-xs font-bold">
                      CURRENT PLAN
                    </div>
                  )}
                  <div className={`bg-gradient-to-r from-rose-50 to-pink-50 -m-6 ${isCurrentPlan ? 'mt-2' : ''} mb-6 p-6 border-b border-gray-100`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Pulse Bundle</h3>
                          <p className="text-sm text-gray-500">Tools-only add-on — no listing credits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-gray-500">Billed ${pkgPlan.priceYearly.toFixed(2)} annually</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {pkgPlan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrentPlan ? (
                    <Button fullWidth variant="outline" disabled className="bg-green-50 border-green-200 text-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={(e) => { e.stopPropagation(); setSelectedPlan('package_tool') }}
                      className={isSelected ? 'bg-gradient-to-r from-rose-500 to-pink-500 border-0' : ''}
                    >
                      {isSelected ? (
                        <><Check className="w-4 h-4 mr-2" /> Selected</>
                      ) : (
                        'Select Pulse Bundle'
                      )}
                    </Button>
                  )}
                </Card>
              </div>
            </motion.div>
          )
        })()}

        {/* Checkout Section */}
        {selectedPlan && (!hasActiveSubscription || subscription.plan.toLowerCase() !== selectedPlan) && (() => {
          const selectedPlanData = plans.find(p => p.id === selectedPlan)
          if (!selectedPlanData) return null
          const totalPrice = billingCycle === 'monthly' ? selectedPlanData.priceMonthly : selectedPlanData.priceYearly
          const monthlyEquivalent = billingCycle === 'yearly' ? selectedPlanData.priceMonthly * 12 : 0
          const savings = monthlyEquivalent - selectedPlanData.priceYearly

          return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-2xl mx-auto overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 -m-6 mb-6 p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {hasActiveSubscription ? 'Upgrade Your Subscription' : 'Complete Your Subscription'}
                </h2>
                <p className="text-gray-600">
                  {selectedPlanData.name} Plan {selectedPlan === 'vip_access' ? '- All Access' : selectedPlanData.credits === 0 ? '- Tools Only' : `- ${selectedPlanData.credits} credits/month`}
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">
                    {selectedPlanData.name} ({billingCycle})
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                {billingCycle === 'yearly' && savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Annual savings</span>
                    <span>
                      -${savings.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* VIP / Deal Access Pass Notice */}
              {selectedPlan === 'vip_access' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 mb-6">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-700 mb-1">$399.99 one-time — credited toward your MC purchase</p>
                    <p className="text-gray-600">VIP / Deal Access Pass is a one-time payment, not a subscription. Get unlimited unlocks until you purchase, CarrierPulse with 20 company credit reports/mo, admin full support, a 1-on-1 consultation, and AI+ Reports. Your $399.99 is credited toward the final MC purchase price.</p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3 mb-6">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-700 mb-1">Secure Payment via Stripe</p>
                  <p className="text-gray-600">Your payment is encrypted and secure. Cancel anytime.</p>
                </div>
              </div>

              {/* Subscribe / Pass Button */}
              <Button
                fullWidth
                size="lg"
                onClick={() => handleSubscribe(selectedPlan)}
                loading={isProcessing}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {selectedPlan === 'vip_access'
                  ? 'Get the Pass — $399.99 one-time'
                  : hasActiveSubscription ? 'Upgrade Now' : 'Subscribe Now'}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By {selectedPlan === 'vip_access' ? 'purchasing' : 'subscribing'}, you confirm your agreement to our <a href="/terms" target="_blank" className="underline hover:text-gray-700">Terms of Service</a> and <a href="/privacy" target="_blank" className="underline hover:text-gray-700">Privacy Policy</a>, including the Payment Terms, Subscription Billing, and Dispute Prohibition policies (Article 7). {selectedPlan === 'vip_access' ? 'VIP / Deal Access Pass is a one-time payment.' : 'Subscriptions are billed month-to-month.'} All payments are final and non-refundable. You may cancel a subscription at any time by contacting info@domilea.com.
              </p>
            </Card>
          </motion.div>
          )
        })()}

        {/* CarrierPulse Add-On */}
        {(() => {
          const planLower = subscription?.plan?.toLowerCase()
          const hasHigherPlan = planLower === 'package_tool' || planLower === 'professional' || planLower === 'premium' || planLower === 'enterprise' || planLower === 'vip_access'
          // Show add-on card if: user doesn't have CarrierPulse AND doesn't have a plan that includes it
          if (!carrierPulseAccess && !hasHigherPlan) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-4">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Add-On</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">CarrierPulse</h2>
                  <p className="text-gray-600">Instant carrier intelligence — look up any carrier by DOT number</p>
                </div>

                <div className="max-w-lg mx-auto">
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="flex items-start gap-5 pt-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">CarrierPulse</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-3">
                          Full safety reports, authority history, insurance, fleet data & more for any DOT number.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {['Safety & BASICs', 'Authority History', 'Insurance Coverage', 'Fleet Inventory', 'Crash Records'].map(f => (
                            <span key={f} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              {f}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-black text-gray-900">$12.99</span>
                            <span className="text-gray-500 text-sm">/month</span>
                          </div>
                          <Button
                            onClick={handleCarrierPulseCheckout}
                            loading={carrierPulseCheckoutLoading}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            <Zap className="w-4 h-4 mr-1.5" />
                            Add CarrierPulse
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {!subscription && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Or upgrade to <span className="font-medium text-indigo-600">Professional</span> or higher to get CarrierPulse included
                  </p>
                )}
              </motion.div>
            )
          }

          // Show "included" badge if user has access via their plan
          if (hasHigherPlan) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16"
              >
                <div className="max-w-lg mx-auto">
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">CarrierPulse</h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Included
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">Carrier intelligence is included in your {subscription?.plan} plan</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/buyer/carrier-pulse')}
                      >
                        Open
                      </Button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )
          }

          // Show "active" badge if user has standalone access
          if (carrierPulseAccess) {
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-16"
              >
                <div className="max-w-lg mx-auto">
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">CarrierPulse</h3>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">$12.99/mo add-on — unlimited carrier lookups</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/buyer/carrier-pulse')}
                      >
                        Open
                      </Button>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )
          }

          return null
        })()}

        {/* Credit Packs Section - One-Time Purchases */}
        {creditPacks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 mb-4">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">One-Time Purchase</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Credit Packs</h2>
              <p className="text-gray-600">Need more credits without a subscription? Buy a credit pack.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {creditPacks.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 mt-2">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{pack.credits}</div>
                    <div className="text-sm text-gray-500 mb-4">Credits</div>
                    <div className="text-2xl font-bold text-green-600 mb-1">${pack.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mb-6">
                      ${(pack.price / pack.credits).toFixed(2)} per credit
                    </div>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => handlePurchaseCreditPack(pack.id)}
                      loading={purchasingPackId === pack.id}
                      disabled={purchasingPackId !== null}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Why Get Credits?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                <Unlock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Full MC Details</h3>
              <p className="text-gray-600 text-sm">
                Unlock complete information including legal name, address, contact details, and more.
              </p>
            </Card>

            <Card className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Verified Information</h3>
              <p className="text-gray-600 text-sm">
                All MC data is verified through FMCSA and other official sources.
              </p>
            </Card>

            <Card className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Make Better Decisions</h3>
              <p className="text-gray-600 text-sm">
                Access Amazon scores, factoring info, and compliance status before buying.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Contact Us</h2>
                    <p className="text-sm text-gray-500">Questions about your subscription?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Name:</span> {user?.name}</p>
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  {subscription && (
                    <p><span className="font-medium">Current Plan:</span> {subscription.plan}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How can we help?
                </label>
                <Textarea
                  placeholder="Describe your question or concern..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <p className="text-xs text-gray-500">
                We'll respond to your inquiry via email within 1-2 business days.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowContactModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleContactSubmit} disabled={contactSending || !contactMessage.trim()}>
                {contactSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default BuyerSubscriptionPage
