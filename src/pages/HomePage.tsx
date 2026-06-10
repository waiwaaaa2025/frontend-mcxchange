import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Lock,
  FileCheck,
  Search,
  Sparkles,
  Star,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  EyeOff,
  Clock,
  Loader2,
  Hash,
  XCircle,
  Activity,
  Gauge,
  BarChart3,
  Umbrella,
  ShieldCheck,
  Cpu,
  FileSearch,
  Handshake,
  Database,
  AlertCircle,
  Zap,
  Headphones,
  Building2,
  Bell,
  Eye,
  Stethoscope,
  ClipboardCheck,
  Users,
  Scale,
  Truck,
  Bot,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import AnimatedCounter from '../components/v2/AnimatedCounter'
import api from '../services/api'
import TalkToMariaModal from '../components/TalkToMariaModal'

// =========================================================================
// Domilea homepage — original visual style (dark hero with orbs, alternating
// dark/light sections, AnimatedCounter, Card/Button, FAB + Maria modal)
// rewired to the AI carrier intelligence / buyer-as-hero positioning.
// No marketplace language. The buyer is the hero; Domilea is the partner.
// =========================================================================

// ── Data ──────────────────────────────────────────────────

const heroStats = [
  { value: 63, suffix: 'M+', prefix: '', label: 'Trucking Data Records' },
  { value: 600, suffix: 'k+', prefix: '', label: 'Active US Carriers' },
  { value: 24, suffix: '/7', prefix: '', label: 'Real-Time Monitoring' },
  { value: 30, suffix: 's', prefix: '', label: 'AI Analysis Per Carrier' },
  { value: 50, suffix: '+', prefix: '', label: 'US States Covered' },
]

const problems = [
  {
    icon: AlertTriangle,
    title: 'Scattered FMCSA Data',
    description: 'Raw FMCSA screens, spreadsheet exports, and a dozen tabs open. By the time you piece the picture together, the deal has already moved on without you.',
    accent: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: EyeOff,
    title: 'Hidden Compliance Risk',
    description: 'Authority gaps, insurance lapses, SMS regressions, chameleon ties — the signals that kill deals are buried in places most buyers never look.',
    accent: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Clock,
    title: 'No Tools to Move Fast',
    description: 'By the time you finish your homework on a carrier, someone else has already called. The first call with a real answer wins.',
    accent: 'text-orange-500',
    bg: 'bg-orange-50',
  },
]

const tools = [
  { icon: Activity, title: 'CarrierPulse', tagline: 'Carrier Intelligence', description: 'Health scores, SMS analysis, FMCSA intelligence on any MC or DOT — in one screen.', href: '/carrier-pulse-preview', color: 'from-cyan-500 to-indigo-500' },
  { icon: Bot, title: 'Eva AI', tagline: 'AI Compliance Manager', description: 'Watches your authority, files paperwork, runs audits — 24/7. Like a CFO for compliance.', href: '/eva-ai', color: 'from-indigo-500 to-purple-500' },
  { icon: Umbrella, title: 'Insurance Leads', tagline: 'Lead Generation', description: 'Find carriers with upcoming BMC-91X cancellations before competitors call them.', href: '/insurance-leads-preview', color: 'from-amber-500 to-orange-500' },
  { icon: ShieldCheck, title: 'Chameleon Check', tagline: 'Fraud Detection', description: 'Spot hidden ties between revoked authorities and freshly-issued ones — before the deal closes.', href: '/chameleon-check', color: 'from-rose-500 to-red-500' },
  { icon: FileSearch, title: 'Credit Reports', tagline: 'Business Credit Intelligence', description: 'UCC filings, tax liens, payment history, credit lines — the financial side of every carrier.', href: '/credit-report-preview', color: 'from-emerald-500 to-teal-500' },
  { icon: Sparkles, title: 'AI Due Diligence', tagline: 'Risk Analysis', description: 'AI-generated carrier risk reports — explainable, actionable, in plain English.', href: '/carrier-pulse-preview', color: 'from-purple-500 to-fuchsia-500' },
]

const steps = [
  { number: '01', icon: Search, title: 'Search & Discover', description: 'Filter 63M+ records by state, fleet, insurance, safety, authority age — pinpoint what fits your thesis in seconds.' },
  { number: '02', icon: Cpu, title: 'Analyze & Verify', description: 'Our AI reads every signal and tells you what matters. Compliance layer flags red flags before you commit.' },
  { number: '03', icon: Handshake, title: 'Pursue with Confidence', description: 'Save leads, track outreach, and request Domilea’s team to help you walk through the deal — every step of the way.' },
]

const evaFeatures = [
  { icon: ShieldCheck, title: 'Authority Monitoring', description: 'Real-time FMCSA authority status, revocations, and reinstatements — Eva watches and alerts.' },
  { icon: ClipboardCheck, title: 'Filing Reminders', description: 'BOC-3, UCR, MCS-150, IFTA, insurance renewals — every deadline tracked automatically.' },
  { icon: Users, title: 'Driver Qualifications', description: 'DQ files, CDL expirations, medical cards, drug & alcohol testing — all in one place.' },
  { icon: BarChart3, title: 'CSA Optimization', description: 'AI reads your BASIC scores and recommends actions before they hurt your insurance.' },
  { icon: Stethoscope, title: 'DOT Audit Prep', description: 'Run a simulated audit anytime. Eva flags gaps and generates the missing paperwork.' },
  { icon: Umbrella, title: 'Insurance Monitoring', description: 'Coverage gaps, pending cancellations, renewal reminders — 60, 30, and 7 days out.' },
]

const evaActivities = [
  { id: 1, icon: MessageSquare, iconBg: 'bg-indigo-500', category: 'Knowledge', badgeStyle: 'bg-indigo-500/15 text-indigo-300', text: 'Answered HOS question — "Can I split sleeper after 14h?" Yes, 7/3 split applies.' },
  { id: 2, icon: FileCheck, iconBg: 'bg-emerald-500', category: 'Compliance', badgeStyle: 'bg-emerald-500/15 text-emerald-300', text: 'MCS-150 biennial update filed. Confirmation #4827-MC0312.' },
  { id: 3, icon: AlertTriangle, iconBg: 'bg-amber-500', category: 'Alert', badgeStyle: 'bg-amber-500/15 text-amber-300', text: 'Insurance cancellation detected on DOT 3602389 — effective in 32 days.' },
  { id: 4, icon: Stethoscope, iconBg: 'bg-purple-500', category: 'Strategy', badgeStyle: 'bg-purple-500/15 text-purple-300', text: 'Audit readiness check — 94% ready, 1 action needed (medical card).' },
  { id: 5, icon: Bell, iconBg: 'bg-cyan-500', category: 'Reminder', badgeStyle: 'bg-cyan-500/15 text-cyan-300', text: 'Driver James M. — medical card expires in 18 days. Renewal email sent.' },
]

const monitorItems = [
  { icon: ShieldCheck, title: 'Authority Status', description: 'Active vs revoked, reinstatement, suspensions.', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  { icon: Umbrella, title: 'Insurance Coverage', description: 'Active policies, pending cancellations, gap detection.', bg: 'bg-amber-50', text: 'text-amber-600' },
  { icon: Activity, title: 'SMS BASIC Scores', description: 'All 7 BASIC categories, tracked over time.', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  { icon: Users, title: 'Driver Qualifications', description: 'DQ files, medical cards, MVRs, CDL expirations.', bg: 'bg-purple-50', text: 'text-purple-600' },
  { icon: AlertTriangle, title: 'CSA Violations', description: 'Real-time alert on every new violation filed.', bg: 'bg-red-50', text: 'text-red-600' },
  { icon: Truck, title: 'Vehicle Maintenance', description: 'DOT inspections, annual checkups, ELD compliance.', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { icon: Scale, title: 'Hours of Service', description: 'HOS violations tracked driver-by-driver in real time.', bg: 'bg-blue-50', text: 'text-blue-600' },
  { icon: ClipboardCheck, title: 'Filings & Deadlines', description: 'BOC-3, UCR, IFTA, MCS-150, IRP — automated.', bg: 'bg-orange-50', text: 'text-orange-600' },
  { icon: Eye, title: 'FMCSA Enforcement', description: 'Suspensions, audits, rated reviews — watched 24/7.', bg: 'bg-rose-50', text: 'text-rose-600' },
]

const testimonials = [
  {
    name: 'James Rodriguez',
    role: 'Strategic Acquirer',
    location: 'Houston, TX',
    quote: 'Domilea flagged a carrier whose insurance was about to lapse two weeks before anyone else knew. We called first, structured a deal, and closed in 11 days. That single insight paid for the platform.',
    stars: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Acquisitions Lead',
    location: 'Los Angeles, CA',
    quote: 'The AI due diligence catches things I would’ve missed — chameleon ties, SMS regressions, suspicious authority history. I trust it to walk me through a carrier before I ever pick up the phone.',
    stars: 5,
  },
  {
    name: 'Michael Williams',
    role: 'Investor',
    location: 'Miami, FL',
    quote: 'I used to live in FMCSA screens and spreadsheets. Now I run a query, get an AI summary, and decide in 60 seconds whether to dig deeper. The compliance layer alone is worth it.',
    stars: 5,
  },
]

// ── Animation Variants ─────────────────────────────────────

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

// ── Component ──────────────────────────────────────────────

const HomePage = () => {
  const navigate = useNavigate()
  const [isConsultationOpen, setIsConsultationOpen] = useState(false)

  const [searchType, setSearchType] = useState<'mc' | 'dot'>('mc')
  const [searchValue, setSearchValue] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleCarrierSearch = async () => {
    if (!searchValue.trim()) {
      setSearchError(`Please enter a ${searchType === 'mc' ? 'MC' : 'DOT'} number`)
      return
    }
    setSearchLoading(true)
    setSearchError(null)
    try {
      const cleanNumber = searchValue.replace(/^(MC|DOT)[-\s]*/i, '').trim()
      if (searchType === 'dot') {
        navigate(`/carrier-pulse-preview/${cleanNumber}`)
        return
      }
      const res = await api.fmcsaLookupByMC(cleanNumber)
      if (res.success && res.data?.dotNumber) {
        navigate(`/carrier-pulse-preview/${res.data.dotNumber}`)
      } else {
        setSearchError(`No carrier found with MC number ${cleanNumber}`)
      }
    } catch {
      setSearchError('Unable to find carrier. Please check the number and try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* ── Announcement bar ────────────────────────────── */}
      <Link to="/contact" className="block bg-[#07111F] text-white text-xs sm:text-sm border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 group">
          <span className="hidden sm:inline-flex items-center gap-1 text-cyan-400 font-semibold">
            <Zap className="w-3.5 h-3.5" /> New
          </span>
          <span className="opacity-90">AI-powered carrier intelligence for trucking company discovery is here.</span>
          <span className="font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Explore Domilea <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {/* ─── Section 1: Dark Hero ────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px]" />
          <motion.div animate={{ x: [0, -40, 30, 0], y: [0, 30, -30, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />
          <motion.div animate={{ x: [0, 20, -30, 0], y: [0, -20, 40, 0] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute bottom-1/4 left-1/2 w-[450px] h-[450px] rounded-full bg-purple-500/15 blur-[100px]" />
        </div>

        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }} className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-gray-300">Live · AI Carrier Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
              <span className="text-white">Trucking’s first</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                AI marketplace.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Find your next trucking business. Use AI to vet it, acquire it, and monitor it — for life.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link to="/carrier-pulse-preview">
                <Button size="lg" className="min-w-[200px] bg-indigo-600 hover:bg-indigo-500 text-white">
                  Search Carrier Data
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/carrier-pulse-preview">
                <Button size="lg" variant="ghost" className="min-w-[200px] border border-white/20 text-white hover:bg-white/10">
                  Analyze My Company
                </Button>
              </Link>
            </div>

            <button onClick={() => setIsConsultationOpen(true)} className="text-lg font-medium text-gray-300 hover:text-white transition-colors inline-flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Book Consultation
            </button>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Due Diligence</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>Live FMCSA Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Compliance Monitoring</span>
              </div>
            </div>

            <p className="mt-10 text-xs text-gray-500 max-w-md mx-auto">
              Domilea does not sell MC or USDOT numbers. We provide carrier data, AI tools, and guided support for legitimate trucking business opportunities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Section 2: Tools Showcase ─────────────────────── */}
      <section className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">The Domilea Suite</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              A platform built for trucking acquisitions.
            </h2>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              Six AI-powered tools. One platform. Everything you need to find, vet, acquire, and monitor a trucking business.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((t) => (
              <motion.div key={t.title} variants={fadeUp}>
                <Link to={t.href}>
                  <Card hover className="h-full group cursor-pointer">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-5 shadow-lg`}>
                      <t.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5">{t.tagline}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{t.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.description}</p>
                    <div className="text-sm font-semibold text-indigo-600 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 3: Problems ─────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Most Trucking Deals Start with Bad Data.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every day, buyers and acquirers lose deals to better-informed competitors — and inherit hidden risk because they couldn’t see the whole picture in time.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <motion.div key={p.title} variants={fadeUp}>
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                    <p.icon className={`w-6 h-6 ${p.accent}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-gray-500">{p.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-12 text-lg font-semibold text-indigo-600">
            That’s why we built Domilea.
          </motion.p>
        </div>
      </section>

      {/* ─── Section 4: Stats counter bar ────────────────── */}
      <section className="bg-[#1e293b] border-t border-white/[0.06] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {heroStats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center p-5 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 5: CarrierPulse Search (Stop Guessing) ─── */}
      <section className="relative py-16 bg-gradient-to-b from-[#1e293b] to-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Carrier Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stop Guessing. Start <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Knowing.</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
              FMCSA gives you raw data. Domilea tells you what it means — health scores, risk detection, safety grades, and actionable recommendations all in one place.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm p-6 mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Search Any Carrier — Free Preview</h3>
                <p className="text-sm text-gray-400 mb-4">Enter an MC or DOT number to see what Domilea reveals.</p>

                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => { setSearchType('mc'); setSearchError(null) }} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${searchType === 'mc' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/15'}`}>MC Number</button>
                  <button onClick={() => { setSearchType('dot'); setSearchError(null) }} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${searchType === 'dot' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/15'}`}>DOT Number</button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => { setSearchValue(e.target.value); setSearchError(null) }}
                      onKeyDown={(e) => e.key === 'Enter' && handleCarrierSearch()}
                      placeholder={searchType === 'mc' ? 'Enter MC number (e.g. 123456)' : 'Enter DOT number (e.g. 3602389)'}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/[0.08] border border-white/[0.15] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all"
                    />
                  </div>
                  <button onClick={handleCarrierSearch} disabled={searchLoading} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-600/25">
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search
                  </button>
                </div>
                {searchError && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    {searchError}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  What you get with Domilea
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Gauge, label: 'Health Score (0-100)', desc: 'Weighted score across safety, compliance, insurance, fleet & history' },
                    { icon: BarChart3, label: 'Industry Benchmarks', desc: 'Compare OOS rates, clean inspection rates vs national averages' },
                    { icon: TrendingUp, label: 'Violation Trends', desc: '24-month trends showing if safety is improving or worsening' },
                    { icon: Umbrella, label: 'Insurance Gap Analysis', desc: 'Coverage gaps, pending cancellations & renewal timeline' },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{feature.label}</p>
                        <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-white/[0.05] border border-white/[0.1] backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.08]">
                  <h3 className="text-lg font-bold text-white">FMCSA Free Tools vs Domilea</h3>
                  <p className="text-xs text-gray-400 mt-1">See what you’re missing with free FMCSA data alone</p>
                </div>

                <div className="divide-y divide-white/[0.06] overflow-x-auto">
                  <div className="grid grid-cols-[1fr,80px,80px] min-w-[340px] px-6 py-2.5 bg-white/[0.03]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Feature</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">FMCSA</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider text-center">Domilea</span>
                  </div>

                  {[
                    { feature: 'MC/DOT Lookup & Authority Status', fmcsa: true, ours: true },
                    { feature: 'Raw BASIC Safety Scores', fmcsa: true, ours: true },
                    { feature: 'Inspection & Crash Records', fmcsa: true, ours: true },
                    { feature: 'Insurance Filing Status', fmcsa: true, ours: true },
                    { feature: 'AI Carrier Risk Summary', fmcsa: false, ours: true },
                    { feature: 'Industry Benchmarks & Comparison', fmcsa: false, ours: true },
                    { feature: 'Violation Trend Analysis (24 mo)', fmcsa: false, ours: true },
                    { feature: 'BMC-91X Cancellation Alerts', fmcsa: false, ours: true },
                    { feature: 'Chameleon Carrier Detection', fmcsa: false, ours: true },
                    { feature: 'Saved Lead Pipeline & Outreach', fmcsa: false, ours: true },
                    { feature: 'Guided Deal Support', fmcsa: false, ours: true, bundle: true },
                  ].map((row, i) => (
                    <div key={i} className={`grid grid-cols-[1fr,80px,80px] min-w-[340px] px-6 py-2.5 items-center ${!row.fmcsa ? 'bg-indigo-500/[0.03]' : ''}`}>
                      <span className="text-sm text-gray-300">
                        {row.feature}
                        {row.bundle && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-cyan-500/15 text-cyan-400 uppercase">White-glove</span>}
                      </span>
                      <span className="text-center">
                        {row.fmcsa ? <CheckCircle className="w-4 h-4 text-gray-500 mx-auto" /> : <XCircle className="w-4 h-4 text-gray-700 mx-auto" />}
                      </span>
                      <span className="text-center">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mx-auto" />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600/10 to-cyan-600/10 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white">Domilea</p>
                      <p className="text-xs text-gray-400">AI carrier intelligence + deal support — <span className="text-cyan-400 font-semibold">starts at $12.99/mo</span></p>
                    </div>
                    <Link to="/pricing">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25">
                        View Plans
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: How It Works ─────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How Domilea Works</h2>
            <p className="text-lg text-gray-500">Three steps. You stay in the driver’s seat — we hand you the data, the AI, and the team.</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div key={step.number} variants={fadeUp} className="relative">
                <Card hover className="h-full relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 text-[80px] font-black text-gray-100 leading-none select-none pointer-events-none">
                    {step.number}
                  </div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                    <ChevronRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 7: Eva — AI Compliance Manager ────────── */}
      <section className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 mb-5">
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">AI Compliance Manager</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Eva, your AI compliance manager.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              The AI executive that watches every authority, every filing, every deadline — and tells you exactly what needs your attention. Built for owner-operators who want to run like a tech company.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* LEFT: Feature list */}
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-6">
              {evaFeatures.map((f) => (
                <motion.div key={f.title} variants={fadeUp} className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* RIGHT: Animated live activity feed (dark glass) */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/[0.08] overflow-hidden shadow-2xl shadow-indigo-500/10">
                <div className="px-5 py-3 border-b border-white/[0.08] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="text-xs text-gray-400 ml-2 flex-1">Eva · Compliance Activity · Live</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    Live
                  </div>
                </div>

                <motion.div
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.35, delayChildren: 0.3 } } }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                  className="p-4 space-y-3"
                >
                  {evaActivities.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">Eva</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.badgeStyle}`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 8: Everything to monitor ───────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight max-w-3xl mx-auto leading-tight">
              Everything you need to monitor your trucking business health.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Authority, insurance, safety, drivers, vehicles, filings — Domilea watches all of it, 24/7. One platform. One source of truth.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitorItems.map((m) => (
              <motion.div key={m.title} variants={fadeUp}>
                <Card hover className="h-full">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
                      <m.icon className={`w-5 h-5 ${m.text}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{m.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 9: Run like a tech company ───────────── */}
      <section className="py-24 lg:py-32 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Operate Differently</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 leading-[1.05] tracking-tight">
              <span className="text-white">Run your authority</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                like a tech company.
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Real-time data. AI making the calls. Compliance handled before you ask. The smartest trucking operators don’t run on spreadsheets anymore — they run on Domilea.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 px-8 shadow-xl">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Section 10: Testimonials ─────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Trusted by Acquirers and Investors</h2>
            <p className="text-lg text-gray-500">Real buyers. Real deals. Real intelligence behind every move.</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <article>
                  <Card hover className="h-full flex flex-col">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 mb-6 flex-1 leading-relaxed">"{t.quote}"</p>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.role} — {t.location}</div>
                    </div>
                  </Card>
                </article>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 9: Final CTA — Dual Path ────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Your Next Chapter Starts Here</h2>
            <p className="text-lg text-gray-500">Whether you’re finding the next opportunity or monitoring your own carrier — Domilea has you covered.</p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp}>
              <Card className="h-full border-indigo-200 border-2">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Discover Trucking Companies</h3>
                  <p className="text-gray-500 mb-6">
                    Search 63M+ records, run AI due diligence, monitor compliance, and request Domilea’s team to help pursue the opportunity.
                  </p>
                  <Link to="/carrier-pulse-preview">
                    <Button size="lg" fullWidth className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      Search Carrier Data
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="h-full border-emerald-200 border-2">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Monitor My Carrier</h3>
                  <p className="text-gray-500 mb-6">
                    Already operating? Watch your own company’s health — safety, SMS, compliance, insurance — before problems hurt your value.
                  </p>
                  <Link to="/carrier-pulse-preview">
                    <Button size="lg" fullWidth className="bg-emerald-600 hover:bg-emerald-500 text-white">
                      Analyze My Company
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          <div className="text-center mt-8">
            <button onClick={() => setIsConsultationOpen(true)} className="text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-2 text-base font-medium">
              <MessageSquare className="w-5 h-5" />
              Not sure where to start? Book Consultation
            </button>
          </div>
        </div>
      </section>

      {/* ─── Section 10: Compliance disclaimer ───────────── */}
      <section className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            <ShieldCheck className="w-3 h-3" /> Compliance
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Domilea does not sell, lease, or transfer MC or USDOT numbers as standalone assets. Domilea provides carrier data, AI tools, due diligence workflows, company health monitoring, and guided support for users evaluating legitimate trucking business opportunities.
          </p>
        </div>
      </section>

      {/* ─── Floating FAB + Modal ─────────────────────────── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsConsultationOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center hover:bg-gray-800 transition-colors"
      >
        <MessageSquare className="w-7 h-7 text-white" />
      </motion.button>

      <TalkToMariaModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
      />
    </main>
  )
}

export default HomePage
