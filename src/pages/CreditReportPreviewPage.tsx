import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Building2,
  TrendingUp,
  Scale,
  DollarSign,
  Users,
  FileText,
  Activity,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  BarChart3,
  Banknote,
  Clock,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const sampleSections = [
  {
    icon: Activity,
    title: 'Credit Score & Rating',
    description: 'Proprietary credit score (0–100), risk level, and rating trend over time',
    sample: '82 / 100 — Low Risk',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Banknote,
    title: 'Payment History & DBT',
    description: 'Days Beyond Terms (DBT), payment trend indicators, and trade payment summary',
    sample: 'DBT: 12 days — Industry Avg: 18 days',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Scale,
    title: 'Legal Filings',
    description: 'Bankruptcies, tax liens, judgments, UCC filings, and lawsuits',
    sample: '0 Bankruptcies · 0 Liens · 2 UCC Filings',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: DollarSign,
    title: 'Financial Statements',
    description: 'Revenue, net worth, total assets, liabilities, and profit/loss trends',
    sample: 'Revenue: $4.2M · Net Worth: $1.8M',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Users,
    title: 'Directors & Officers',
    description: 'Current directors, officers, registered agents, and their roles',
    sample: '3 Current Directors · 1 Registered Agent',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Building2,
    title: 'Company Overview',
    description: 'Registration details, SIC codes, incorporation date, state, employee count',
    sample: 'Est. 2015 · 45 Employees · Active',
    color: 'from-gray-600 to-gray-700',
  },
  {
    icon: BarChart3,
    title: 'Credit Limit Recommendation',
    description: 'Suggested credit limit based on company financials and payment behavior',
    sample: 'Recommended: $150,000',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: FileText,
    title: 'Rating Commentary',
    description: 'Analyst commentary explaining key factors behind the credit rating',
    sample: 'Strong payment history with moderate growth...',
    color: 'from-rose-500 to-rose-600',
  },
]

export default function CreditReportPreviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      navigate('/buyer/credit-report')
    } else {
      navigate('/register?redirect=/buyer/credit-report')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 relative">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Powered by CreditSafe</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Business Credit Reports
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
              Get comprehensive credit intelligence on any US business. Verify financial health before you buy a motor carrier authority.
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">35</span>
                <span className="text-gray-500">per report</span>
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3.5 text-base sm:text-lg shadow-xl shadow-blue-500/25"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {user ? 'Search & Purchase a Report' : 'Get Started — Create Free Account'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-400 mt-4">No subscription required. Pay only for what you need.</p>
          </motion.div>
        </div>
      </div>

      {/* Sample Credit Score Preview */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <motion.div
          className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-5 sm:p-8 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Blurred overlay hint */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 text-white rounded-full text-xs font-medium z-10">
            <Lock className="w-3 h-3" />
            Sample Preview
          </div>

          {/* Sample score gauge */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="relative w-48 h-48 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#F3F4F6" strokeWidth="16" />
                <motion.circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke="#10B981" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - 0.82) }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-5xl font-bold text-emerald-600"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  82
                </motion.span>
                <span className="text-sm text-gray-500 mt-1">out of 100</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">ABC Transport LLC</h3>
              <p className="text-gray-500 mb-4">Dallas, TX · Est. 2015 · Motor Carrier</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Low Risk
                </span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Score Improving
                </span>
                <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> DBT: 12 days
                </span>
              </div>
            </div>
          </div>

          {/* Blurred sample stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 relative">
            {[
              { label: 'Credit Limit', value: '$150,000', icon: DollarSign },
              { label: 'Employees', value: '45', icon: Users },
              { label: 'UCC Filings', value: '2', icon: FileText },
              { label: 'Judgments', value: '0', icon: Scale },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <stat.icon className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </motion.div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent pointer-events-none rounded-xl" />
          </div>

          {/* Blurred legal section */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 filter blur-[3px] select-none pointer-events-none">
              <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Bankruptcies</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-800">None</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-emerald-700 font-medium">Tax Liens</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-800">0</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-amber-700 font-medium">Lawsuits</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-800">1 Resolved</p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 shadow-lg flex items-center gap-2 sm:gap-3 max-w-[90%]">
                <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-gray-800">Purchase to view full report</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* What's Included */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What's Included in Every Report</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Each report pulls live data from CreditSafe's database covering millions of US businesses.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {sampleSections.map((section, i) => (
            <motion.div
              key={section.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{section.description}</p>
              <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-medium text-gray-600">{section.sample}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-10">
            {[
              { step: '1', title: 'Search', desc: 'Enter any company name to find them in our database' },
              { step: '2', title: 'Purchase', desc: 'Pay $35 securely via Stripe — no subscription needed' },
              { step: '3', title: 'View Report', desc: 'Access your full credit report instantly after payment' },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={handleGetStarted}
            className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3 text-base sm:text-lg"
          >
            {user ? 'Search & Purchase Now' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Trust badges */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>256-bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Powered by Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>CreditSafe Certified Data</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>No Subscription Required</span>
          </div>
        </div>
      </div>
    </div>
  )
}
