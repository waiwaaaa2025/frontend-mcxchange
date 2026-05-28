import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Download,
  Save,
  ListChecks,
  Building2,
  Briefcase,
  Megaphone,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

interface Tier {
  id: 'LEAD_GENERATOR_BUYER' | 'LEAD_GENERATOR_BROKER'
  name: string
  audience: string
  audienceIcon: typeof Building2
  price: number
  popular?: boolean
  bullets: string[]
}

const TIERS: Tier[] = [
  {
    id: 'LEAD_GENERATOR_BUYER',
    name: 'For Buyers',
    audience: 'Buyers prospecting acquisition targets',
    audienceIcon: Building2,
    price: 99,
    bullets: [
      'Carrier search with core filters: state, fleet size, insurance expiry window, authority status, safety rating',
      'Save carriers to your personal Lead Generator list',
      'Private notes on every saved lead',
      'Open the tool from your buyer dashboard',
    ],
  },
  {
    id: 'LEAD_GENERATOR_BROKER',
    name: 'For Brokers & Marketers',
    audience: 'Brokers, marketers, and service sellers prospecting in bulk',
    audienceIcon: Megaphone,
    price: 499,
    popular: true,
    bullets: [
      'Everything in the Buyer tier',
      'Advanced filters: power-units range, authority age, cargo type, multi-state',
      'Bulk select + CSV download of every carrier matching your filter',
      'No row cap on exports — built for high-volume outreach',
    ],
  },
]

const featureSections = [
  {
    icon: Search,
    title: 'Carrier discovery, indexed',
    description:
      'Search live carrier data with filters tuned for how acquirers and service sellers actually prospect — not generic FMCSA lookups.',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: Filter,
    title: 'Filter sets that match the work',
    description:
      'Buyer tier covers the essentials. Broker tier unlocks the advanced filters that turn a list into a campaign.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Save,
    title: 'Personal save list',
    description:
      'One click to save a carrier. Add private notes. Pick up where you left off — your saves persist across sessions.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Download,
    title: 'Bulk CSV export (Broker)',
    description:
      'Brokers can download the full result set as CSV — no per-row clicks, no row cap. Feed it straight into your dialer or CRM.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: ListChecks,
    title: 'Built on live data',
    description:
      'Search results come from the same indexed carrier source that powers the rest of Domilea — no stale spreadsheets.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Sparkles,
    title: 'Cancel anytime',
    description:
      'Monthly billing through Stripe. Upgrade between tiers from your buyer dashboard whenever your needs change.',
    color: 'from-rose-500 to-rose-600',
  },
]

export default function LeadGeneratorLandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (!user) return
    api.getSubscription()
      .then((r) => {
        if (!alive) return
        const sub = r.data?.subscription
        if (sub && sub.status === 'ACTIVE') setCurrentPlan(sub.plan)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [user])

  const hasThisProduct =
    currentPlan === 'LEAD_GENERATOR_BUYER' ||
    currentPlan === 'LEAD_GENERATOR_BROKER' ||
    currentPlan === 'VIP_ACCESS'

  const handleSubscribe = async (planId: Tier['id']) => {
    if (!user) {
      navigate(`/register?next=/lead-generator`)
      return
    }
    try {
      setSubmitting(planId)
      const res = await api.createSubscriptionCheckout(planId, false)
      const url = res.data?.url
      if (url) window.location.href = url
    } catch (err) {
      console.error('Lead Generator checkout failed', err)
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
          >
            Lead Generator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-5 max-w-3xl text-lg text-slate-600"
          >
            Find the carriers worth contacting. Filter live carrier data the way buyers and brokers actually work, save the ones that matter, and (on the Broker tier) export the whole list in one click.
          </motion.p>

          {hasThisProduct && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              You already have access.
              <button
                onClick={() => navigate('/buyer/lead-generator')}
                className="ml-2 inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
              >
                Open the tool <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            {TIERS.map((tier) => {
              const Icon = tier.audienceIcon
              const isCurrent = currentPlan === tier.id
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                    tier.popular ? 'border-cyan-500 ring-2 ring-cyan-100' : 'border-slate-200'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <Icon className="h-6 w-6 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{tier.name}</h3>
                      <p className="text-sm text-slate-500">{tier.audience}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">${tier.price}</span>
                    <span className="text-slate-500">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {tier.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {isCurrent ? (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => navigate('/buyer/lead-generator')}
                      >
                        Open the tool
                      </Button>
                    ) : (
                      <Button
                        variant={tier.popular ? 'primary' : 'secondary'}
                        className="w-full"
                        disabled={submitting === tier.id}
                        onClick={() => handleSubscribe(tier.id)}
                      >
                        {submitting === tier.id
                          ? 'Redirecting…'
                          : !user
                          ? 'Sign up to subscribe'
                          : `Subscribe — $${tier.price}/mo`}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            Monthly billing through Stripe. All payments are final.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-900">What you get</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureSections.map((section) => {
              const Icon = section.icon
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className={`inline-flex rounded-lg bg-gradient-to-br ${section.color} p-2.5 text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{section.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{section.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-cyan-500" />
          <h2 className="mt-4 text-3xl font-bold text-slate-900">Ready to start prospecting?</h2>
          <p className="mt-3 text-slate-600">
            Pick the tier that matches your workflow. You can switch between Buyer and Broker from your dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" onClick={() => handleSubscribe('LEAD_GENERATOR_BROKER')}>
              Subscribe — $499/mo Broker
            </Button>
            <Button variant="secondary" onClick={() => handleSubscribe('LEAD_GENERATOR_BUYER')}>
              Subscribe — $99/mo Buyer
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
