import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Activity,
  Bot,
  Bell,
  FileText,
  FileCheck,
  Truck,
  Building2,
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  Brain,
  Lock,
  Eye,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

// Who this is built for
const audiences = [
  {
    icon: Truck,
    title: 'Owner-Operators',
    desc: 'One truck, one authority, zero compliance staff. Keep your DOT number clean without hiring anyone — Dia tracks every filing and deadline for you.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Building2,
    title: 'Small Fleets',
    desc: 'Running 2–50 trucks? Monitor your company health, driver files, and safety scores in one place instead of juggling spreadsheets and reminders.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: ShieldCheck,
    title: 'Safety & Compliance Services',
    desc: 'Manage compliance for dozens of carriers at once. Pull fresh FMCSA data daily, flag at-risk clients early, and let the AI agent do the paperwork.',
    color: 'from-purple-500 to-purple-600',
  },
]

// What you can do once you connect your DOT number
const features = [
  {
    icon: RefreshCw,
    title: 'Fresh Data, Updated Daily',
    desc: 'Your authority status, insurance filings, and SMS data are pulled and refreshed every single day — no manual lookups on FMCSA SAFER ever again.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Activity,
    title: 'Monitor Your Company Health',
    desc: 'A single dashboard showing your operating authority, insurance, registrations, and overall compliance health at a glance.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Basic Safety Scores (SMS / CSA)',
    desc: 'See your BASIC scores, inspection history, and out-of-service trends — and understand exactly what is moving them up or down.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Bot,
    title: 'AI Agent Files Documents & Updates',
    desc: 'Dia, your AI compliance agent, helps prepare and file MCS-150 updates, UCR, BOC-3, and other filings — and keeps your records current automatically.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Bell,
    title: 'Driver Document Reminders',
    desc: 'Get reminded the moment a driver is missing a document — CDL, medical card, MVR, drug & alcohol testing, or DQ file — before it becomes a violation.',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: Calendar,
    title: 'Never Miss a Deadline',
    desc: 'Every federal and state deadline tracked on one calendar with alerts at 60, 30, and 7 days — insurance renewals, biennial updates, and more.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: FileCheck,
    title: 'Audit-Ready, Always',
    desc: 'Keep driver qualification files, maintenance records, and HOS logs organized so you are ready for a DOT audit at any moment.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Brain,
    title: 'Plain-English Answers',
    desc: 'Ask the AI agent anything about your compliance — "Am I clear for an audit?", "Which drivers expire this month?" — and get straight answers.',
    color: 'from-pink-500 to-pink-600',
  },
]

const steps = [
  { step: '1', title: 'Enter Your DOT Number', desc: 'That is it. We pull your authority, insurance, fleet, and SMS data straight from FMCSA.', icon: Search },
  { step: '2', title: 'See Your Health Score', desc: 'Get an instant snapshot of your company health, safety scores, and any gaps that need attention.', icon: Activity },
  { step: '3', title: 'Daily Monitoring', desc: 'We refresh your data every day and watch for changes to your authority, insurance, and scores.', icon: Eye },
  { step: '4', title: 'AI Handles the Rest', desc: 'Dia reminds you of deadlines, flags missing driver docs, and helps file your updates.', icon: Sparkles },
]

export default function ComplianceMonitorPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dot, setDot] = useState('')

  const handleWaitlist = () => {
    navigate(user ? '/buyer/dashboard' : '/register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">Coming Soon</span>
            </motion.div>

            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <ShieldCheck className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              Compliance{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">Monitor</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
              Whether you run one truck or a hundred, just enter your DOT number and get fresh FMCSA data that updates daily.
              Monitor your company health, watch your safety scores, and let an AI agent handle the paperwork.
            </p>
            <p className="text-lg text-indigo-400 font-semibold mb-8">
              Built for owner-operators, small fleets, and safety services.
            </p>

            {/* DOT number capture (decorative for now) */}
            <div className="max-w-md mx-auto mb-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dot}
                    onChange={(e) => setDot(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your USDOT number"
                    className="w-full bg-transparent text-white placeholder-gray-500 py-2.5 focus:outline-none text-sm"
                  />
                </div>
                <Button
                  onClick={handleWaitlist}
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white px-6 py-2.5 whitespace-nowrap"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify Me
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                We'll start monitoring this DOT number the moment Compliance Monitor launches. Free for early adopters.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Who it's for */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Made for the People Who Keep Trucks Moving</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            No compliance department? No problem. Compliance Monitor does the watching for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {audiences.map((a, i) => (
            <motion.div
              key={a.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-4 shadow-lg`}>
                <a.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{a.title}</h3>
              <p className="text-sm text-gray-400">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dashboard preview */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-2">Your Whole Company, One Screen</h2>
          <p className="text-gray-400">Enter a DOT number and this is what you'll see — refreshed every day.</p>
        </motion.div>

        <motion.div
          className="bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-gray-300 z-10">
            <RefreshCw className="w-3 h-3" />
            Updated daily
          </div>

          {/* Health score + status tiles */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                <motion.circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke="url(#healthGradient)" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  whileInView={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - 0.91) }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">91%</span>
                <span className="text-xs text-gray-400">Company Health</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Authority', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ShieldCheck },
                { label: 'Insurance', status: 'On File', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: FileText },
                { label: 'BASIC Scores', status: 'All Clear', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: BarChart3 },
                { label: 'Driver Docs', status: '2 Missing', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} border border-white/5 rounded-xl p-4`}>
                  <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              What the AI Agent Is Watching
            </h4>
            <div className="space-y-2">
              {[
                { task: 'Driver Maria L. — Medical card missing', due: 'Action needed', urgency: 'text-amber-400 bg-amber-500/10' },
                { task: 'Driver Sam K. — MVR not on file', due: 'Action needed', urgency: 'text-amber-400 bg-amber-500/10' },
                { task: 'MCS-150 biennial update', due: 'Due in 41 days', urgency: 'text-blue-400 bg-blue-500/10' },
                { task: 'UCR annual registration', due: 'Due in 63 days', urgency: 'text-gray-400 bg-white/5' },
              ].map((item) => (
                <div key={item.task} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-300">{item.task}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.urgency}`}>
                    {item.due}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blurred locked section */}
          <div className="relative">
            <div className="filter blur-[4px] select-none pointer-events-none grid grid-cols-3 gap-3">
              {['SMS Trends', 'Inspection History', 'Filing History'].map((title) => (
                <div key={title} className="bg-white/5 rounded-xl p-4 h-32">
                  <p className="text-xs text-gray-400 mb-2">{title}</p>
                  <div className="h-16 bg-white/5 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 shadow-lg flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-white">Full dashboard available at launch</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Everything Compliance Monitor Does</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From daily FMCSA data to AI-filed paperwork — all from a single DOT number.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.05 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          className="bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-emerald-500/10 border border-white/10 rounded-3xl p-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Up and Running in Minutes</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="text-xs text-indigo-400 font-bold mb-1">Step {item.step}</div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 py-12 pb-20">
        <motion.div
          className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-3xl p-10 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Be First to Monitor Your Company</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Compliance Monitor is launching soon. Join the waitlist with your DOT number and we'll notify you the moment it's live — early adopters get free access during beta.
            </p>
            <Button
              onClick={handleWaitlist}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 text-lg shadow-xl"
            >
              <Bell className="w-5 h-5 mr-2" />
              Join the Waitlist
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-white/50 mt-4">No credit card required. Free during beta.</p>
          </div>
        </motion.div>
      </div>

      {/* Trust footer */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>FMCSA Integrated</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refreshed Daily</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span>AI-Powered Filing</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Bank-Grade Encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}
