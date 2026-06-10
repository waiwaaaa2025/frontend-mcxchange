import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ExternalLink,
  Hash,
  Users,
  Truck,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle,
  Lock,
  Zap,
  Eye,
  XCircle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const sampleFlags = [
  {
    severity: 'critical' as const,
    title: 'Shared EIN Detected',
    description: 'EIN 84-***2917 is also registered under DOT #3291044 (revoked 2024-08-12)',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
  },
  {
    severity: 'high' as const,
    title: 'Officer Match — Same Principal',
    description: 'John D. is listed as principal on 2 other carriers, 1 with revoked authority',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
  },
  {
    severity: 'medium' as const,
    title: 'Shared Physical Address',
    description: '1234 Industrial Blvd, Dallas TX matches DOT #2847193 (active) and DOT #3104827 (inactive)',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
  },
  {
    severity: 'low' as const,
    title: 'Shared Phone Number',
    description: 'Phone (214) 555-**** is shared with 1 other active carrier',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
]

const checkCategories = [
  {
    icon: Hash,
    title: 'Shared EIN Detection',
    desc: 'Cross-references the carrier\'s EIN across all FMCSA records to find entities operating under the same tax ID',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: Users,
    title: 'Officer & Principal Matching',
    desc: 'Identifies if directors, officers, or principals appear on other carrier records — especially revoked ones',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: MapPin,
    title: 'Address Cross-Reference',
    desc: 'Checks if the physical or mailing address is shared with other carriers, flagging known chameleon patterns',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Phone,
    title: 'Contact Info Overlap',
    desc: 'Detects shared phone numbers and email addresses across multiple DOT numbers',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    icon: Truck,
    title: 'Equipment (VIN) Sharing',
    desc: 'Cross-references registered vehicle VINs to find equipment being used across multiple carriers',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: XCircle,
    title: 'Revocation & Restart Analysis',
    desc: 'Identifies carriers that were shut down and quickly restarted under a new MC number',
    color: 'from-purple-500 to-purple-600',
  },
]

export default function ChameleonCheckPreviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      navigate('/buyer/chameleon-check')
    } else {
      navigate('/register?redirect=/buyer/chameleon-check')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/20">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-orange-600/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16 relative">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-6">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Carrier Intelligence Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              Chameleon Check
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
              Detect reincarnated carriers before you buy. Cross-reference EINs, officers, addresses, equipment, and revocation history across FMCSA records.
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50">
                <span className="text-3xl font-bold text-gray-900">$14.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3.5 text-base sm:text-lg shadow-xl shadow-red-500/25"
            >
              <ShieldAlert className="w-5 h-5 mr-2" />
              {user ? 'Start Checking Carriers' : 'Get Started — Create Free Account'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-400 mt-4">Included in CarrierPulse. Cancel anytime.</p>
          </motion.div>
        </div>
      </div>

      {/* Sample Analysis Preview */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <motion.div
          className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Sample badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 text-white rounded-full text-xs font-medium z-10">
            <Eye className="w-3 h-3" />
            Sample Analysis
          </div>

          {/* Risk header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 sm:px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Chameleon Carrier Analysis</h3>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                    High Risk
                  </span>
                </div>
                <p className="text-red-200 text-sm mt-1">DOT #3847291 · 4 signals detected · ABC Transport LLC</p>
              </div>
            </div>
          </div>

          {/* Risk score bar */}
          <div className="px-5 sm:px-8 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Chameleon Risk Score</span>
              <span className="text-lg font-bold text-red-600">78 / 100</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '78%' }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>Clear</span>
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Flags */}
          <div className="px-5 sm:px-8 py-6 space-y-3">
            {sampleFlags.map((flag, i) => (
              <motion.div
                key={flag.title}
                className={`${flag.bgColor} border ${flag.borderColor} rounded-xl p-4 flex items-start gap-3`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
              >
                <div className={`w-8 h-8 rounded-lg ${flag.color} flex items-center justify-center flex-shrink-0`}>
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm font-bold ${flag.textColor}`}>{flag.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${flag.color} text-white`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Blurred related carriers section */}
          <div className="px-5 sm:px-8 pb-8 relative">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Related Carriers Found</h4>
            <div className="filter blur-[3px] select-none pointer-events-none space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">DOT #{3000000 + i * 100000}</p>
                    <p className="text-sm text-gray-500">XYZ Logistics LLC · Dallas, TX</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">Revoked</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center mt-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-4 border border-gray-200 shadow-lg flex items-center gap-3 mx-4 text-center">
                <Lock className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-800">Subscribe to view full analysis</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* What We Check */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What We Analyze</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Six layers of cross-referencing to detect carriers operating under new identities after enforcement action.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {checkCategories.map((cat, i) => (
            <motion.div
              key={cat.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <cat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-500">{cat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why it matters */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <motion.div
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Why Chameleon Detection Matters</h2>
              <p className="text-gray-400 mb-6">
                Chameleon carriers are companies that received enforcement action (revocation, out-of-service orders) and reappeared under a new MC/DOT — same people, same trucks, same risks. Buying one of these authorities puts you at immediate regulatory risk.
              </p>
              <div className="space-y-3">
                {[
                  'FMCSA actively targets chameleon carriers for shutdown',
                  'You inherit the carrier\'s hidden history and liabilities',
                  'Insurance can be voided if fraud is discovered',
                  'Protects your investment before you commit to a purchase',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '6,200+', label: 'Carriers checked', icon: Truck },
                    { value: '340+', label: 'Chameleons detected', icon: ShieldAlert },
                    { value: '< 30s', label: 'Analysis time', icon: Zap },
                    { value: '99.2%', label: 'Detection rate', icon: ShieldCheck },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <stat.icon className="w-5 h-5 text-red-400 mb-2 mx-auto" />
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-base sm:text-lg"
            >
              {user ? 'Start Checking Carriers' : 'Create Free Account'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Included with */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Included in CarrierPulse</h3>
          <p className="text-gray-500 text-sm mb-6">CarrierPulse includes Chameleon Check, the Safety Improvement Report, and full carrier intelligence. Or upgrade to Professional for all tools.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Unlimited chameleon checks',
              'Safety Improvement Report',
              'Shared EIN & officer detection',
              'Revocation & restart analysis',
              'Full CarrierPulse access',
              'Cancel anytime',
            ].map((feature) => (
              <span key={feature} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Trust footer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>FMCSA Data Source</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Real-Time Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Trusted by Brokers & Carriers</span>
          </div>
        </div>
      </div>
    </div>
  )
}
