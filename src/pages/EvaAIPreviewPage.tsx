import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Shield,
  ShieldCheck,
  FileText,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Users,
  Truck,
  Activity,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Zap,
  Brain,
  Eye,
  Lock,
  Sparkles,
  CircleDollarSign,
  ClipboardCheck,
  Stethoscope,
  Scale,
  FileWarning,
  Send,
  Building2,
  Star,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

// Simulated chat messages for the demo
const chatDemo = [
  { role: 'user', text: 'When does my BOC-3 filing need to be renewed?' },
  { role: 'eva', text: 'Your BOC-3 (Blanket of Coverage) filing with CT Corporation was filed on 03/15/2025 and is currently active. BOC-3 filings don\'t expire as long as your process agent remains active. However, I noticed your process agent contract renews on 03/15/2026 — I\'ve set a reminder for 30 days before. You\'re all clear.' },
  { role: 'user', text: 'Am I compliant for a DOT audit right now?' },
  { role: 'eva', text: 'Running compliance audit simulation...\n\n**Overall: 94% Audit-Ready**\n\n- Driver Qualification Files: 4/4 complete\n- Vehicle Maintenance Records: Up to date\n- Hours of Service Logs: Compliant\n- Insurance: Active, expires 08/2026\n- Drug & Alcohol Program: Current\n\n**1 Action Needed:** Driver James M. has a medical card expiring in 18 days. I can generate the renewal reminder now.' },
]

const complianceAreas = [
  {
    icon: ShieldCheck,
    title: 'FMCSA Authority Monitoring',
    desc: 'Real-time monitoring of your MC/DOT authority status, insurance filings, and FMCSA alerts. Get notified instantly if anything changes.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: ClipboardCheck,
    title: 'Automated Filing Reminders',
    desc: 'Never miss a deadline — BOC-3, UCR, IFTA, IRP, MCS-150 updates, insurance renewals, and all federal/state filings tracked automatically.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Users,
    title: 'Driver Qualification Management',
    desc: 'Track DQ files, CDL expirations, medical cards, MVRs, drug & alcohol testing, and training certifications for every driver.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: BarChart3,
    title: 'CSA Score Optimization',
    desc: 'AI analyzes your BASIC scores and recommends specific actions to improve each category. Predicts score changes before they happen.',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Stethoscope,
    title: 'DOT Audit Preparation',
    desc: 'Run a simulated compliance audit anytime. Eva identifies gaps, generates missing documents, and scores your audit readiness.',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: Truck,
    title: 'Vehicle & Maintenance Tracking',
    desc: 'Track inspections, maintenance schedules, annual DOT inspections, and out-of-service repairs for your entire fleet.',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Scale,
    title: 'Hours of Service Compliance',
    desc: 'Monitor HOS violations in real-time, track ELD compliance, and get alerts before drivers exceed limits.',
    color: 'from-teal-500 to-teal-600',
  },
  {
    icon: FileWarning,
    title: 'Insurance Lapse Prevention',
    desc: 'Monitors your insurance policies and filings with FMCSA. Alerts you 60, 30, and 7 days before any coverage gaps could shut you down.',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: Brain,
    title: 'Smart Document Vault',
    desc: 'AI-organized storage for all compliance documents. Eva auto-categorizes uploads, flags missing docs, and keeps everything audit-ready.',
    color: 'from-pink-500 to-pink-600',
  },
]

const stats = [
  { value: '47', label: 'Compliance items tracked', icon: ClipboardCheck },
  { value: '24/7', label: 'Real-time monitoring', icon: Eye },
  { value: '< 2min', label: 'Audit report generation', icon: Zap },
  { value: '99.8%', label: 'Filing accuracy', icon: ShieldCheck },
]

export default function EvaAIPreviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  // Authed admins → real Eva chat instead of the marketing teaser
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/team/eva', { replace: true })
    }
  }, [user, navigate])

  // Animate chat messages appearing one by one
  useEffect(() => {
    if (visibleMessages >= chatDemo.length) return

    const delay = visibleMessages === 0 ? 1500 : chatDemo[visibleMessages - 1].role === 'user' ? 800 : 2500

    const timer = setTimeout(() => {
      if (chatDemo[visibleMessages].role === 'eva') {
        setIsTyping(true)
        setTimeout(() => {
          setIsTyping(false)
          setVisibleMessages(prev => prev + 1)
        }, 1500)
      } else {
        setVisibleMessages(prev => prev + 1)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [visibleMessages])

  const handleGetStarted = () => {
    if (user) {
      navigate('/buyer/dashboard')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 relative">
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Bot className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              Meet <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Eva AI</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
              Your AI-powered compliance officer that never sleeps. Eva monitors your authority, tracks every filing deadline, manages driver qualifications, and keeps you audit-ready 24/7.
            </p>
            <p className="text-lg text-indigo-400 font-semibold mb-8">
              Stop worrying about compliance. Let Eva handle it.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-3.5 text-lg shadow-xl shadow-purple-500/25"
              >
                <Bell className="w-5 h-5 mr-2" />
                Join the Waitlist
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-gray-500">Be the first to know when Eva launches. Free for early adopters.</p>
          </motion.div>
        </div>
      </div>

      {/* Live Chat Demo */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Talk to Eva Like a Real Person</h2>
          <p className="text-gray-400">Ask any compliance question in plain English. Eva knows your carrier inside and out.</p>
        </motion.div>

        <motion.div
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Eva AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">Online — monitoring your compliance</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Eye className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">Live Demo</span>
            </div>
          </div>

          {/* Chat messages */}
          <div className="p-6 min-h-[320px] space-y-4">
            <AnimatePresence>
              {chatDemo.slice(0, visibleMessages).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'eva' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-200'
                  }`}>
                    {msg.text.split('\n').map((line, li) => (
                      <p key={li} className={`text-sm ${li > 0 ? 'mt-1.5' : ''} ${line.startsWith('**') ? 'font-semibold text-white' : ''}`}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat input (decorative) */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <span className="text-gray-500 text-sm flex-1">Ask Eva anything about your compliance...</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                <Send className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Compliance Dashboard Preview */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Your Compliance Command Center</h2>
          <p className="text-gray-400">Everything you need to stay legal, in one dashboard.</p>
        </motion.div>

        <motion.div
          className="bg-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {/* Sample badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-gray-300 z-10">
            <Eye className="w-3 h-3" />
            Dashboard Preview
          </div>

          {/* Compliance score */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                <motion.circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke="url(#scoreGradient)" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 80}
                  initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - 0.94) }}
                  transition={{ duration: 2, ease: 'easeOut', delay: 1 }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#C084FC" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-4xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  94%
                </motion.span>
                <span className="text-xs text-gray-400">Compliance Score</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Authority', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Shield },
                { label: 'Insurance', status: 'Current', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: FileText },
                { label: 'Drug Program', status: 'Compliant', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Stethoscope },
                { label: 'Med Cards', status: '1 Expiring', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className={`${item.bg} border border-white/5 rounded-xl p-4`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                >
                  <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.status}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Upcoming Deadlines
            </h4>
            <div className="space-y-2">
              {[
                { task: 'Driver James M. — Medical Card Renewal', due: 'In 18 days', urgency: 'text-amber-400 bg-amber-500/10' },
                { task: 'UCR Annual Registration', due: 'In 45 days', urgency: 'text-blue-400 bg-blue-500/10' },
                { task: 'MCS-150 Biennial Update', due: 'In 67 days', urgency: 'text-gray-400 bg-white/5' },
                { task: 'Annual DOT Inspection — Unit #4082', due: 'In 82 days', urgency: 'text-gray-400 bg-white/5' },
              ].map((item, i) => (
                <motion.div
                  key={item.task}
                  className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + i * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-300">{item.task}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.urgency}`}>
                    {item.due}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Blurred section */}
          <div className="relative">
            <div className="filter blur-[4px] select-none pointer-events-none grid grid-cols-3 gap-3">
              {['Violation Trends', 'Inspection History', 'Fleet Compliance'].map((title) => (
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

      {/* What Eva Handles */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Everything Eva Manages For You</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From authority monitoring to driver qualifications — Eva tracks 47+ compliance items so you don't have to.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complianceAreas.map((area, i) => (
            <motion.div
              key={area.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${area.color} flex items-center justify-center mb-4 shadow-lg`}>
                <area.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{area.title}</h3>
              <p className="text-sm text-gray-400">{area.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <stat.icon className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <motion.div
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 rounded-3xl p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How Eva Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Connect', desc: 'Link your DOT number. Eva pulls your FMCSA data, authority history, and fleet info automatically.', icon: Zap },
              { step: '2', title: 'Scan', desc: 'Eva runs a full compliance audit, identifies gaps, and builds your personalized compliance calendar.', icon: Eye },
              { step: '3', title: 'Monitor', desc: '24/7 monitoring of your authority, insurance, driver files, and every federal/state deadline.', icon: Activity },
              { step: '4', title: 'Act', desc: 'Get alerts before deadlines. Ask Eva questions in plain English. Generate reports in seconds.', icon: Sparkles },
            ].map((item) => (
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

      {/* Example questions */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Ask Eva Anything</h2>
          <p className="text-gray-400">Just type like you're talking to your compliance manager.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            'When is my next UCR filing due?',
            'Which drivers have expiring medical cards?',
            'Generate a DOT audit preparation checklist',
            'What\'s my current CSA score in Unsafe Driving?',
            'Am I compliant with the new HOS rules?',
            'Show me all insurance filing deadlines this quarter',
            'Which vehicles need annual inspections?',
            'Summarize my compliance status for a bank loan',
          ].map((q, i) => (
            <motion.div
              key={q}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/[0.07] transition-colors cursor-default"
              initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            >
              <MessageSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">{q}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <motion.div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-10 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Be First in Line</h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Eva AI is launching soon. Early adopters get free access during beta. Join the waitlist and we'll notify you the moment it's ready.
            </p>
            <Button
              onClick={handleGetStarted}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3.5 text-lg shadow-xl"
            >
              <Star className="w-5 h-5 mr-2" />
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
            <Shield className="w-4 h-4" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>AI-Powered by Claude</span>
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
