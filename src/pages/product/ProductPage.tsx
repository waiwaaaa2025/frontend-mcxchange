import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fuel,
  Shield,
  Users,
  Truck,
  FileText,
  ArrowRight,
  CheckCircle,
  Search,
  Loader2,
  XCircle,
  Hash,
  Phone,
  Zap,
  Activity,
  Gauge,
  Radar,
  FileBarChart,
  BarChart3,
  TrendingUp,
  Umbrella,
  Sparkles,
  ShieldAlert,
  Eye,
  SquareParking,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'

const ProductPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [mcNumber, setMcNumber] = useState('')
  const [dotNumber, setDotNumber] = useState('')
  const [searchType, setSearchType] = useState<'mc' | 'dot'>('mc')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectToCarrierPulse = (dotNum: string) => {
    if (isAuthenticated && user) {
      const role = user.role === 'admin' ? 'admin' : user.role === 'seller' ? 'seller' : 'buyer'
      navigate(`/${role}/carrier-pulse/${dotNum}`)
    } else {
      navigate(`/carrier-pulse-preview/${dotNum}`)
    }
  }

  const fetchCarrierData = async () => {
    const searchValue = searchType === 'mc' ? mcNumber : dotNumber
    if (!searchValue.trim()) {
      setError(`Please enter a ${searchType === 'mc' ? 'MC' : 'DOT'} number`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const cleanNumber = searchValue.replace(/^(MC|DOT)[-\s]*/i, '').trim()

      if (searchType === 'dot') {
        redirectToCarrierPulse(cleanNumber)
        return
      }

      // MC number — resolve to DOT via backend API
      const { default: api } = await import('../../services/api')
      const res = await api.fmcsaLookupByMC(cleanNumber)
      if (res.success && res.data?.dotNumber) {
        redirectToCarrierPulse(res.data.dotNumber)
      } else {
        setError(`No carrier found with MC number ${cleanNumber}`)
      }
    } catch (err) {
      setError('Unable to find carrier. Please check the number and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchCarrierData()
    }
  }

  const services = [
    {
      icon: SquareParking,
      title: 'Parking',
      description: 'List your truck parking spots and earn extra income, or find secure overnight parking on the road.',
      link: 'https://www.gospotty.com/',
      external: true,
      features: ['Monetize unused parking space', 'Secure overnight parking nationwide', 'Powered by Spotty Network']
    },
    {
      icon: Users,
      title: 'Driver Recruiting',
      description: 'We recruit company drivers, owner operators for Amazon Relay, and lease drivers. Our recruiters are trained by the owner and understand the industry inside out.',
      link: '/product/recruiting',
      features: ['Company drivers, O/Os & lease drivers', '7-day average time to hire', 'Industry-trained recruiters']
    },
    {
      icon: Fuel,
      title: 'Fuel Program',
      description: 'Maximize your savings with our exclusive fuel discount network. Access discounts at all major truck stops nationwide.',
      link: '/product/fuel-program',
      features: ['Up to $0.75/gallon savings', 'All major truck stops', 'No fees or minimums']
    },
    {
      icon: Shield,
      title: 'Safety Services',
      description: 'Stay compliant and protect your business with comprehensive DOT safety compliance and risk management solutions.',
      link: '/product/safety',
      features: ['DOT compliance', 'Driver qualification files', 'Mock audits']
    },
    {
      icon: Truck,
      title: 'Dispatch Services',
      description: 'Professional dispatch services to keep your trucks moving and your revenue growing.',
      link: '/product/dispatch',
      features: ['24/7 dispatch support', 'Load optimization', 'Rate negotiation']
    },
    {
      icon: FileText,
      title: 'Admin Services',
      description: 'Streamline your back office with our comprehensive administrative support services.',
      link: '/product/admin',
      features: ['Invoicing & billing', 'Document management', 'IFTA/IRP filing']
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Carrier Search */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm mb-6">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300">Carrier Intelligence Platform</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-white">
              Carrier Search
              <span className="block bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                Powered by CarrierPulse
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Go beyond raw FMCSA data. Get health scores, risk detection, safety grades, and actionable intelligence — all from one search.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm p-6 shadow-2xl">
                {/* Search Type Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSearchType('mc')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                      searchType === 'mc'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <Hash className="w-4 h-4 inline mr-2" />
                    MC Number
                  </button>
                  <button
                    onClick={() => setSearchType('dot')}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                      searchType === 'dot'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                        : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <Hash className="w-4 h-4 inline mr-2" />
                    DOT Number
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder={searchType === 'mc' ? 'Enter MC Number (e.g., 123456)' : 'Enter DOT Number (e.g., 1234567)'}
                      value={searchType === 'mc' ? mcNumber : dotNumber}
                      onChange={(e) => searchType === 'mc' ? setMcNumber(e.target.value) : setDotNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchCarrierData()}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.08] border border-white/[0.15] text-white placeholder-gray-500 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={fetchCarrierData}
                    disabled={isLoading}
                    className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/25"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                    ) : (
                      <><Search className="w-5 h-5" /> Search</>
                    )}
                  </button>
                </div>

                {/* Quick Examples */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm text-gray-500">
                  <span>Try:</span>
                  <button
                    onClick={() => { setSearchType('mc'); setMcNumber('384859'); }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    MC-384859
                  </button>
                  <button
                    onClick={() => { setSearchType('dot'); setDotNumber('2213110'); }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    DOT-2213110
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <section className="py-4 max-w-3xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            </motion.div>
          </section>
        )}
      </AnimatePresence>

      {/* Why CarrierPulse — FMCSA Comparison + Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Why CarrierPulse</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              FMCSA Gives You Data. We Give You <span className="text-indigo-600">Answers.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Stop spending hours piecing together carrier information from multiple FMCSA pages. CarrierPulse consolidates, analyzes, and scores everything in one search.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left: Feature Cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="grid gap-4">
                {[
                  { icon: Gauge, label: 'Carrier Health Score (0-100)', desc: 'One number that tells you everything. Weighted across safety, compliance, insurance, fleet condition, and operating history — so you don\'t have to manually evaluate 50+ data points.', color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
                  { icon: ShieldAlert, label: 'Chameleon Carrier Detection', desc: 'FMCSA doesn\'t flag this. We cross-reference shared EINs, officers, addresses, phone numbers, and VINs to detect carriers hiding behind new MC numbers after shutdowns.', color: 'bg-red-50 border-red-100 text-red-600', bundle: true },
                  { icon: FileBarChart, label: 'Safety Improvement Report', desc: 'Not just data — a prioritized action plan. Get safety grades from A+ to D with specific recommendations ranked by critical, high, medium, and low priority.', color: 'bg-amber-50 border-amber-100 text-amber-600', bundle: true },
                  { icon: BarChart3, label: 'Industry Benchmarks', desc: 'FMCSA shows your numbers but not how you stack up. We compare vehicle OOS rates, driver OOS rates, and clean inspection rates against national averages in real-time.', color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                  { icon: TrendingUp, label: '24-Month Violation Trends', desc: 'FMCSA gives you a snapshot. We show you the direction — is this carrier getting safer or more dangerous? See if violations are improving, stable, or worsening over time.', color: 'bg-blue-50 border-blue-100 text-blue-600' },
                  { icon: Umbrella, label: 'Insurance Gap Analysis', desc: 'Find what FMCSA\'s insurance page hides: coverage gaps, pending cancellations, renewal timelines, and whether a carrier\'s insurance is actually sufficient for their operations.', color: 'bg-purple-50 border-purple-100 text-purple-600' },
                ].map((feature) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all"
                  >
                    <div className={`w-11 h-11 rounded-xl ${feature.color} border flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{feature.label}</p>
                        {feature.bundle && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-600 uppercase">Bundle</span>}
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Comparison Table */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden sticky top-20">
                <div className="px-6 py-5 bg-gradient-to-r from-[#0f172a] to-[#1e293b]">
                  <h3 className="text-lg font-bold text-white">FMCSA Free Tools vs CarrierPulse</h3>
                  <p className="text-sm text-gray-400 mt-1">What you get from FMCSA alone vs what CarrierPulse delivers</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr,72px,72px] px-5 py-3 bg-gray-50">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Feature</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">FMCSA</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider text-center">Pulse</span>
                  </div>

                  {[
                    { feature: 'MC/DOT Lookup & Authority Status', fmcsa: true, pulse: true },
                    { feature: 'Raw BASIC Safety Scores', fmcsa: true, pulse: true },
                    { feature: 'Inspection & Crash Records', fmcsa: true, pulse: true },
                    { feature: 'Insurance Filing Status', fmcsa: true, pulse: true },
                    { feature: 'Carrier Health Score (0-100)', fmcsa: false, pulse: true },
                    { feature: 'Industry Benchmarks & Comparison', fmcsa: false, pulse: true },
                    { feature: 'Violation Trend Analysis (24 mo)', fmcsa: false, pulse: true },
                    { feature: 'Insurance Gap Detection', fmcsa: false, pulse: true },
                    { feature: 'Coverage Amount Analysis', fmcsa: false, pulse: true },
                    { feature: 'Fleet Age & VIN Inspection Data', fmcsa: false, pulse: true },
                    { feature: 'Chameleon Carrier Detection', fmcsa: false, pulse: true, bundle: true },
                    { feature: 'Safety Improvement Report', fmcsa: false, pulse: true, bundle: true },
                    { feature: 'Prioritized Action Plan (A+ to D)', fmcsa: false, pulse: true, bundle: true },
                  ].map((row, i) => (
                    <div key={i} className={`grid grid-cols-[1fr,72px,72px] px-5 py-3 items-center ${!row.fmcsa ? 'bg-indigo-50/30' : ''}`}>
                      <span className="text-sm text-gray-700">
                        {row.feature}
                        {row.bundle && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-600 uppercase">Bundle</span>}
                      </span>
                      <span className="text-center">
                        {row.fmcsa
                          ? <CheckCircle className="w-4 h-4 text-gray-400 mx-auto" />
                          : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        }
                      </span>
                      <span className="text-center">
                        <CheckCircle className="w-4 h-4 text-indigo-600 mx-auto" />
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA */}
                <div className="px-5 py-5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-t border-indigo-100">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-gray-900">CarrierPulse</p>
                      <p className="text-xs text-gray-500">Unlimited lookups + all tools — <span className="text-indigo-600 font-bold">$12.99/mo</span></p>
                    </div>
                    <Link to="/pricing">
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20">
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

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              More Services for Motor Carriers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run a successful trucking operation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const cardInner = (
                <Card hover className="h-full group cursor-pointer">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                      <service.icon className="w-7 h-7 text-gray-700 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{service.title}</h3>
                  <p className="text-gray-500 mb-6">{service.description}</p>

                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                    Learn more
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              )
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  {service.external ? (
                    <a href={service.link} target="_blank" rel="noopener noreferrer">
                      {cardInner}
                    </a>
                  ) : (
                    <Link to={service.link}>{cardInner}</Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] border-0 overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px]" />
          </div>
          <div className="relative text-center py-12">
            <h2 className="text-4xl font-bold mb-4 text-white">Need Help with Compliance?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Our team of experts can help you maintain a clean safety record and stay compliant with FMCSA regulations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="min-w-[200px] bg-white text-indigo-600 hover:bg-gray-100">
                  Get a Free Consultation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <a href="tel:+18778141807">
                <Button size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white/10">
                  <Phone className="w-5 h-5 mr-2" />
                  Call (877) 814-1807
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default ProductPage
