import { motion } from 'framer-motion'
import {
  Check, Download, Shield, FileSearch, AlertTriangle,
  TrendingUp, Lock, Zap, BookOpen,
} from 'lucide-react'

const PAY_LINK_PDF =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK_GUIDE_PDF ||
  'https://buy.stripe.com/5kQdR9deD5zY2Zf9NncV201'
const PAY_LINK_BUNDLE =
  import.meta.env.VITE_STRIPE_PAYMENT_LINK_GUIDE_BUNDLE ||
  'https://buy.stripe.com/bJe00j6Qfd2q1Vb3oZcV202'

const tableOfContents = [
  'How motor-carrier authorities are bought and sold',
  'Reading FMCSA records: what actually matters',
  'Spotting chameleon carriers before you wire money',
  'UCC filings, tax liens, and what they reveal about a seller',
  'Pricing a deal: revenue, equipment, authority age',
  'Step-by-step due-diligence checklist',
  'Negotiating, escrow, and closing safely',
  'Post-close: re-titling, insurance, and operating safely under your new authority',
]

const bundleFeatures = [
  { icon: AlertTriangle, label: 'Chameleon carrier detection' },
  { icon: FileSearch, label: 'UCC filings & lien searches' },
  { icon: Shield, label: 'Tax lien & legal-filing lookups' },
  { icon: TrendingUp, label: 'Safety Improvement Report' },
  { icon: Zap, label: 'Daily updated BASIC safety scores' },
]

export default function BuyersGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            New: Buyer's Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            How to Buy a Trucking Business
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            The step-by-step guide for buyers acquiring a motor-carrier authority — written by
            the people who run the Domilea marketplace. Skip the rookie mistakes that cost
            buyers thousands.
          </p>
          <a
            href="/docs/buyers-guide-preview.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 underline underline-offset-4"
          >
            <Download className="w-4 h-4" />
            Download free preview (PDF)
          </a>
        </motion.div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tier A — PDF only */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">The Guide</h3>
            </div>
            <div className="mt-6">
              <div className="text-4xl font-bold text-slate-900">$15</div>
              <div className="text-sm text-slate-500">One-time, instant download</div>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-700 flex-1">
              <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Full PDF guide</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Due-diligence checklists</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Deal-pricing worksheets</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Email delivery, re-download anytime</li>
            </ul>
            <a
              href={PAY_LINK_PDF}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Get the Guide — $15
            </a>
          </motion.div>

          {/* Tier B — Bundle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-white to-white p-6 sm:p-8 flex flex-col shadow-lg"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
              RECOMMENDED
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Guide + Due-Diligence Toolkit</h3>
            </div>
            <div className="mt-6">
              <div className="text-4xl font-bold text-slate-900">$49</div>
              <div className="text-sm text-slate-500">One-time. Includes 60 days of Pro access.</div>
            </div>
            <p className="mt-4 text-sm text-slate-700">
              The guide tells you what to check. The toolkit lets you actually check it — on every
              MC number you're considering, for 60 days, unlimited.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700 flex-1">
              <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Everything in The Guide</li>
              {bundleFeatures.map(({ icon: Icon, label }) => (
                <li key={label} className="flex gap-2">
                  <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {label}
                </li>
              ))}
              <li className="flex gap-2"><Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" /> Full Domilea Pro account for 60 days</li>
            </ul>
            <a
              href={PAY_LINK_BUNDLE}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Get Guide + Toolkit — $49
            </a>
          </motion.div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">All payments are final.</p>
      </section>

      {/* TOC */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">What's inside</h2>
        <ul className="space-y-3">
          {tableOfContents.map((item, i) => (
            <li key={item} className="flex gap-3 text-slate-700">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
