import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lock,
  BarChart3,
  Shield,
  Truck,
  FileText,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

const sampleBasics = [
  { name: 'Unsafe Driving', score: 72, threshold: 65, status: 'alert' },
  { name: 'Hours-of-Service', score: 45, threshold: 65, status: 'ok' },
  { name: 'Driver Fitness', score: 88, threshold: 80, status: 'alert' },
  { name: 'Vehicle Maintenance', score: 61, threshold: 80, status: 'ok' },
  { name: 'Controlled Substances', score: null, threshold: 80, status: 'not-scored' },
  { name: 'Crash Indicator', score: 54, threshold: 65, status: 'ok' },
  { name: 'HM Compliance', score: null, threshold: 80, status: 'not-scored' },
]

const sampleRecommendations = [
  { priority: 'critical', title: 'Unsafe Driving BASIC exceeds threshold', desc: 'Implement dash cams, driver coaching program, and review speeding violations.' },
  { priority: 'critical', title: 'Driver Fitness BASIC exceeds threshold', desc: 'Audit driver qualification files. Ensure all medical certificates are current.' },
  { priority: 'high', title: 'Vehicle OOS rate above national average', desc: 'Increase pre-trip inspection rigor. Schedule preventive maintenance every 15K miles.' },
  { priority: 'medium', title: 'No formal FMCSA safety rating on file', desc: 'Request a voluntary compliance review from your FMCSA Division Administrator.' },
]

export default function SafetyReportPreviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleGetStarted = () => {
    if (user) {
      navigate('/carrier-pulse-preview')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Included in CarrierPulse
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Safety Improvement Report
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
              Actionable safety analysis with BASIC scores, trends, risk areas, and prioritized recommendations to improve your carrier's safety profile.
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50">
                <span className="text-3xl font-bold text-gray-900">$14.99</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 text-lg shadow-xl shadow-blue-500/25"
            >
              <Zap className="w-5 h-5 mr-2" />
              {user ? 'Get CarrierPulse' : 'Get Started — Create Free Account'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-400 mt-4">Included in CarrierPulse. Cancel anytime.</p>
          </motion.div>
        </div>
      </div>

      {/* Sample Report Preview */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <motion.div
          className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Safety Improvement Report</p>
                <h2 className="text-xl sm:text-2xl font-bold mt-1">Sample Transport LLC</h2>
                <p className="text-blue-200 mt-1">DOT #3187270 &bull; MC #67138</p>
              </div>
              <div className="sm:text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-xl border border-orange-400/30">
                  <AlertTriangle className="w-5 h-5 text-orange-300" />
                  <span className="font-bold text-orange-200">High Risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* BASIC Scores Grid */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              BASIC Percentile Scores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {sampleBasics.map(b => (
                <div key={b.name} className={`flex items-center justify-between p-3 rounded-xl border ${b.status === 'alert' ? 'bg-red-50 border-red-200' : b.status === 'not-scored' ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex items-center gap-2">
                    {b.status === 'alert' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : b.status === 'ok' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm font-medium text-gray-900">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${b.status === 'alert' ? 'text-red-600' : b.status === 'ok' ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {b.score !== null ? `${b.score}%` : 'N/S'}
                    </span>
                    <span className="text-xs text-gray-400">/ {b.threshold}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations Preview */}
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Prioritized Recommendations
            </h3>
            <div className="space-y-3">
              {sampleRecommendations.map((rec, i) => (
                <div key={i} className={`p-4 rounded-xl border ${rec.priority === 'critical' ? 'bg-red-50 border-red-200' : rec.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rec.priority === 'critical' ? 'bg-red-500 text-white' : rec.priority === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {rec.priority}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{rec.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{rec.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blur overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-8">
            <div className="text-center">
              <Lock className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <span className="font-semibold text-gray-800">Subscribe to view full report</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* What's Included */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What's In the Report</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'BASIC Score Analysis', desc: 'All 7 FMCSA BASIC categories with percentiles, thresholds, and alert status.', color: 'from-blue-500 to-indigo-500' },
              { icon: TrendingUp, title: 'Trend Analysis', desc: 'Track how your scores change over time. Identify improving and declining areas.', color: 'from-emerald-500 to-teal-500' },
              { icon: Shield, title: 'Inspection Summary', desc: 'OOS rates vs national averages, driver and vehicle inspection breakdowns.', color: 'from-purple-500 to-pink-500' },
              { icon: AlertTriangle, title: 'Risk Assessment', desc: 'Overall risk level with weighted scoring across all safety categories.', color: 'from-orange-500 to-red-500' },
              { icon: FileText, title: 'Prioritized Recommendations', desc: 'Actionable steps ranked by impact — know exactly what to fix first.', color: 'from-amber-500 to-orange-500' },
              { icon: Truck, title: 'Fleet & Compliance', desc: 'Fleet size context, compliance scoring, and authority health indicators.', color: 'from-cyan-500 to-blue-500' },
            ].map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{cat.title}</h3>
                <p className="text-sm text-gray-500">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Included in CarrierPulse</h3>
          <p className="text-gray-500 text-sm mb-6">CarrierPulse includes the full Safety Improvement Report, Chameleon Check, and BASIC score analysis.</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              'Safety Improvement Report',
              'Chameleon Check',
              'Full CarrierPulse access',
              'BASIC score analysis',
              'Prioritized recommendations',
              'Cancel anytime',
            ].map((feature) => (
              <span key={feature} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {feature}
              </span>
            ))}
          </div>
          <Button onClick={handleGetStarted} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3">
            {user ? 'Get CarrierPulse' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
