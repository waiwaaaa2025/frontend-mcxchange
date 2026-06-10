import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Coins, Check, Sparkles, Zap, Crown, Shield,
  TrendingUp, Mail, Star, Package, Activity,
  FileSearch, ShoppingBag,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { SubscriptionPlanConfig, CreditPack } from '../types'

const planStyles = {
  starter: {
    icon: Coins,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    popular: false,
  },
  premium: {
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    popular: true,
  },
  enterprise: {
    icon: Zap,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-50 to-indigo-50',
    popular: false,
  },
  vip_access: {
    icon: Crown,
    color: 'from-amber-500 to-red-500',
    bgColor: 'from-amber-50 to-red-50',
    popular: false,
  },
}

interface DisplayPlan extends SubscriptionPlanConfig {
  id: string
  icon: typeof Coins
  color: string
  bgColor: string
  popular: boolean
}

export default function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<DisplayPlan[]>([])
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getSubscriptionPlans(),
      api.getCreditPacks(),
    ]).then(([plansRes, packsRes]) => {
      if (plansRes.data?.length) {
        const offered = ['starter', 'premium', 'enterprise', 'vip_access']
        setPlans(plansRes.data
          .filter(plan => offered.includes(plan.id.toLowerCase()))
          .map(plan => {
            const key = plan.id.toLowerCase() as keyof typeof planStyles
            return { ...plan, ...(planStyles[key] || planStyles.starter), id: key }
          }))
      }
      if (packsRes.data) setCreditPacks(packsRes.data.filter(p => p.credits !== 5))
    }).finally(() => setLoading(false))
  }, [])

  const getMonthlyEquivalent = (plan: DisplayPlan) => (plan.priceYearly / 12).toFixed(2)

  const handleGetStarted = (planId?: string) => {
    if (!user) {
      navigate(planId === 'vip_access' ? '/register?redirect=/buyer/subscription?vip=1' : '/register')
      return
    }
    if (planId === 'vip_access') {
      navigate('/buyer/subscription?vip=1')
      return
    }
    navigate('/buyer/subscription')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="text-center pt-16 sm:pt-20 pb-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Unlock listings, run credit reports, and find the perfect business opportunity.
          </p>

          {/* Seller free banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <Link to="/register">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-6 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-lg sm:text-xl font-black tracking-tight">Selling Your Authority?</p>
                    <p className="text-emerald-100 font-medium text-sm">List for FREE — no subscription needed. Get started in minutes.</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center mt-8">
          <div className="bg-white rounded-xl p-1 flex items-center gap-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-bold">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const displayPrice = billingCycle === 'monthly' ? plan.priceMonthly : Number(getMonthlyEquivalent(plan))
            const yearlyTotal = plan.priceYearly
            const isVip = plan.id === 'vip_access'

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${plan.popular ? 'lg:-mt-4 lg:mb-4 ring-2 ring-purple-500' : ''}`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className={`bg-gradient-to-r ${plan.bgColor} p-6 border-b border-gray-100`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        {isVip ? 'All Access Plan' : `${plan.credits} credits/month`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                    {!isVip && <span className="text-gray-500">/month</span>}
                    {isVip && <span className="text-gray-500">one-time</span>}
                  </div>
                  {billingCycle === 'yearly' && !isVip && (
                    <p className="text-sm text-gray-500 mt-1">Billed ${yearlyTotal.toFixed(2)} annually</p>
                  )}
                </div>

                <div className="p-6">
                  {/* Credits / VIP Highlight / Tools-Only */}
                  {isVip ? (
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <Sparkles className="w-6 h-6 text-amber-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-amber-600">Unlimited Access</div>
                          <div className="text-xs text-gray-600">Browse & unlock every listing until you buy</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                        <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="text-xs">
                          <span className="font-semibold text-green-700">$399.99 applied to your purchase</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
                        <Mail className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        <div className="text-xs">
                          <span className="font-semibold text-purple-700">Free consultation call with Maria</span>
                        </div>
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
                        <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-purple-500' : 'text-green-500'}`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleGetStarted(plan.id)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/25'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isVip ? 'Get the Pass' : 'Get Started'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add-Ons */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Add-Ons</h2>
          <p className="text-gray-500 mt-2">Enhance your experience with powerful tools.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CarrierPulse */}
          <div className="bg-white rounded-2xl border-2 border-indigo-300 p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
              Best Value
            </div>
            <div className="flex items-center gap-3 mb-4 mt-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">CarrierPulse</h3>
                <p className="text-sm text-gray-500">All-in-one carrier intelligence</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Instant carrier intelligence — BASIC scores, inspections, crashes, violations, insurance, fleet data, plus Chameleon Check and the full Safety Improvement Report.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-gray-700">BASIC scores, inspections & crashes</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-gray-700">Chameleon Check — carrier identity search</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-gray-700">Safety Improvement Report (A+ to D)</span>
              </li>
            </ul>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">$12.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-4">Included free with Professional, Premium & VIP / Deal Access Pass</p>
            <button onClick={() => handleGetStarted()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-colors shadow-lg shadow-indigo-500/25">
              Get CarrierPulse
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <FileSearch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Credit Reports</h3>
                <p className="text-sm text-gray-500">Business credit intelligence</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Full business credit reports — UCC filings, lien holders, judgments, tax liens, bankruptcy status, financial statements, and risk analysis.
            </p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-bold text-gray-900">2 credits</span>
              <span className="text-gray-500">/report</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium mb-1">Included with Professional & Premium plans</p>
            <p className="text-xs text-gray-500 mb-4">Or <span className="font-semibold text-gray-700">$35 per report</span> — no subscription needed</p>
            <button onClick={() => user ? navigate('/buyer/credit-report') : navigate('/register?redirect=/buyer/credit-report')} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
              Buy a Report — $35
            </button>
          </div>

          {/* Credit Packs */}
          {creditPacks.length > 0 && creditPacks.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{pack.credits} Credits</h3>
                  <p className="text-sm text-gray-500">One-time credit pack</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Purchase additional credits anytime — no subscription required. Use them to unlock listings and run reports.
              </p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-gray-900">${pack.price.toFixed(2)}</span>
                <span className="text-gray-500">one-time</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">${(pack.price / pack.credits).toFixed(2)} per credit</p>
              <button
                onClick={() => handleGetStarted()}
                className="w-full py-2.5 rounded-xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition-colors"
              >
                Buy Credits
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {[
            { q: 'What are credits used for?', a: 'Credits are used to unlock full listing details. Each listing unlock costs 1 credit. Credit reports are included with Premium and VIP / Deal Access Pass; otherwise $35 per report.' },
            { q: 'Do unused credits roll over?', a: 'No, credits reset each billing period. You start fresh with your plan\'s credit allocation each month.' },
            { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can change your plan at any time. Contact support and we\'ll help you switch plans.' },
            { q: 'What is CarrierPulse?', a: 'CarrierPulse is our carrier intelligence tool. Look up any carrier by DOT or MC number and get instant safety scores, inspection history, insurance details, and more.' },
            { q: 'What\'s included in the VIP / Deal Access Pass?', a: 'A one-time $399.99 pass (not a subscription) — unlimited listing unlocks until you purchase, CarrierPulse with 20 company credit reports per month, $399.99 credited toward your final MC purchase, admin full support, a 1-on-1 consultation, and AI+ Reports.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
