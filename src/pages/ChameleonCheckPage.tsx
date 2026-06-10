import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldAlert, ShieldCheck, Hash, Search, Loader2, CheckCircle,
  AlertTriangle, Zap, Building2, Info, ArrowLeft, ExternalLink,
} from 'lucide-react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useCarrierData } from '../hooks/useCarrierData'
import { api } from '../services/api'
import ChameleonAlert from '../components/v2/ChameleonAlert'
import { detectChameleonCarrier, mapToV2CarrierData, mapToV2RelatedCarriers } from '../utils/carrierDataMapper'
import type { V2ChameleonAnalysis } from '../components/v2/mockData'

// ============================================================
// HELPERS
// ============================================================
function fmtNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ChameleonCheckPage() {
  const { dotNumber: urlDotNumber } = useParams()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()

  // Search state
  const [dotInput, setDotInput] = useState(urlDotNumber || '')
  const [activeDot, setActiveDot] = useState<string | undefined>(urlDotNumber)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Access gating
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Carrier data
  const { carrierReport, loading: carrierLoading, error: carrierError } = useCarrierData(activeDot)

  // Check access on mount — reuse CarrierPulse access (same subscription tier)
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'seller') {
      setHasAccess(true)
      setAccessChecked(true)
      return
    }

    async function checkAccess() {
      try {
        const res = await api.getCarrierPulseAccess()
        if (res.success && res.data) {
          setHasAccess(res.data.hasAccess)
          setCurrentPlan(res.data.currentPlan)
        }
      } catch {
        setHasAccess(true)
      } finally {
        setAccessChecked(true)
      }
    }
    checkAccess()
  }, [user?.role])

  // Handle purchase success return
  useEffect(() => {
    if (searchParams.get('purchase') === 'success') {
      setPurchaseSuccess(true)
      setHasAccess(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  // Compute analysis from carrier report
  const analysis = useMemo<V2ChameleonAnalysis | null>(() => {
    if (!carrierReport) return null
    return detectChameleonCarrier(carrierReport)
  }, [carrierReport])

  const carrier = useMemo(() => {
    if (!carrierReport) return null
    return mapToV2CarrierData(carrierReport)
  }, [carrierReport])

  const relatedCarriers = useMemo(() => {
    if (!carrierReport) return []
    return mapToV2RelatedCarriers(carrierReport)
  }, [carrierReport])

  // Search handler
  const handleSearch = () => {
    const cleaned = dotInput.replace(/\D/g, '')
    if (!cleaned) {
      setSearchError('Please enter a valid DOT number')
      return
    }
    if (cleaned.length < 3) {
      setSearchError('DOT number must be at least 3 digits')
      return
    }
    setSearchError(null)
    setActiveDot(cleaned)
    const basePath = window.location.pathname.replace(/\/chameleon-check.*/, '/chameleon-check')
    window.history.pushState(null, '', `${basePath}/${cleaned}`)
  }

  const handleSearchAnother = () => {
    setActiveDot(undefined)
    setDotInput('')
    const basePath = window.location.pathname.replace(/\/chameleon-check.*/, '/chameleon-check')
    window.history.pushState(null, '', basePath)
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await api.createCarrierPulseCheckout()
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ==========================================
  // LOADING AUTH CHECK
  // ==========================================
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // ==========================================
  // PAYWALL
  // ==========================================
  if (!hasAccess) {
    const isStarter = currentPlan === 'STARTER'
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chameleon Check</h1>
          <p className="text-gray-500 mt-2 mb-8">Detect reincarnated carriers before you buy</p>

          <Card padding="lg">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold mb-4">
                <ShieldAlert className="w-4 h-4" />
                {isStarter ? 'Add to Your Plan' : 'Unlock Chameleon Check'}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isStarter ? 'Add Chameleon Check to your plan' : 'Get Chameleon Check access'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Search any carrier by DOT number and instantly detect chameleon carrier risk — shared EINs, officers, addresses, VINs, and revocation patterns.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-black text-gray-900">$12.99</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Includes CarrierPulse access. Cancel anytime.</p>
              </div>

              <div className="space-y-2 text-left mb-6">
                {[
                  'Unlimited chameleon carrier checks',
                  'Shared EIN, officer & address detection',
                  'Revocation history & quick restart analysis',
                  'Shared equipment (VIN) cross-referencing',
                  'Detailed evidence & risk scoring',
                  'Plus full CarrierPulse carrier intelligence',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button fullWidth size="lg" onClick={handleCheckout} loading={checkoutLoading}>
                <ShieldAlert className="w-5 h-5 mr-2" />
                {isStarter ? 'Add Chameleon Check — $12.99/mo' : 'Get Chameleon Check — $12.99/mo'}
              </Button>

              {!currentPlan && (
                <p className="text-xs text-gray-400 mt-4">
                  Or <Link to="/buyer/subscription" className="text-indigo-600 hover:text-indigo-700 font-medium">upgrade to Professional</Link> to get all tools included
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ==========================================
  // SEARCH VIEW — no DOT entered
  // ==========================================
  if (!activeDot) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
          {/* Purchase success */}
          {purchaseSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Chameleon Check activated!</p>
                <p className="text-xs text-emerald-600">You now have unlimited chameleon carrier checks. Start searching below.</p>
              </div>
            </motion.div>
          )}

          {/* Branding */}
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/25">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Chameleon Check</h1>
            <p className="text-gray-500 mt-2">Detect reincarnated carriers by DOT number</p>
          </div>

          {/* Search Box */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={dotInput}
                onChange={(e) => setDotInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter DOT number..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-mono"
              />
            </div>
            <Button size="lg" onClick={handleSearch}>
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {searchError && (
            <p className="text-sm text-red-500 mt-2 text-left">{searchError}</p>
          )}

          {/* What we check */}
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              { icon: Building2, label: 'Shared EIN & Officers', desc: 'Same legal entity under different MC' },
              { icon: AlertTriangle, label: 'Revocation History', desc: 'Past shutdowns & quick restarts' },
              { icon: ExternalLink, label: 'Shared Address & Phone', desc: 'Contact info reuse across carriers' },
              { icon: ShieldAlert, label: 'Shared Equipment', desc: 'VINs registered to multiple DOTs' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <item.icon className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // ==========================================
  // RESULTS VIEW — analysis displayed
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleSearchAnother} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chameleon Check</h1>
              <p className="text-sm text-gray-500">DOT #{activeDot}</p>
            </div>
          </div>
        </div>
        {/* Quick search */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative">
            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={dotInput}
              onChange={(e) => setDotInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="New DOT..."
              className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-mono w-36 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <Button size="sm" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {carrierLoading && !carrierReport && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Analyzing carrier for chameleon indicators...</p>
          <p className="text-xs text-gray-400 mt-1">Checking related carriers, shared equipment, authority history...</p>
        </div>
      )}

      {/* Error state */}
      {carrierError && !carrierReport && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-400 mb-4" />
          <p className="text-gray-700 font-semibold mb-2">Carrier not found</p>
          <p className="text-gray-500 text-sm max-w-md">
            No carrier data found for DOT #{activeDot}. Please verify the DOT number and try again.
          </p>
          <Button className="mt-4" onClick={handleSearchAnother}>Search Another</Button>
        </div>
      )}

      {/* Results */}
      {analysis && carrier && (
        <div className="space-y-6">
          {/* Carrier header card */}
          <Card padding="md">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 break-words">{carrier.legalName || 'Unknown Carrier'}</h2>
                {carrier.dbaName && <p className="text-sm text-gray-500 break-words">DBA: {carrier.dbaName}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  <span>DOT #{carrier.dotNumber}</span>
                  {carrier.mcNumber && <span>MC {carrier.mcNumber}</span>}
                  <span>{carrier.location}</span>
                </div>
              </div>
              {/* Risk badge */}
              <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                analysis.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                analysis.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                analysis.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                analysis.riskLevel === 'low' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {analysis.riskLevel === 'none' ? 'Clear' : `${analysis.riskLevel} Risk`}
              </div>
            </div>
          </Card>

          {/* Main analysis */}
          <ChameleonAlert analysis={analysis} />

          {/* Carrier identity */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Carrier Identity
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Authority Age</span>
                <span className="font-medium text-gray-900">
                  {carrier.authorityAgeDays > 0
                    ? carrier.authorityAgeDays >= 365
                      ? `${Math.round(carrier.authorityAgeDays / 365)} years`
                      : `${Math.round(carrier.authorityAgeDays / 30)} months`
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Revocations</span>
                <span className={`font-medium ${carrier.totalRevocations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {carrier.totalRevocations}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">EIN</span>
                <span className="font-medium font-mono text-gray-900">{carrier.ein || 'Not available'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Related Carriers</span>
                <span className="font-medium text-gray-900">{relatedCarriers.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Entity Type</span>
                <span className="font-medium text-gray-900">{carrier.entityType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Days Since Last Revocation</span>
                <span className="font-medium text-gray-900">
                  {carrier.daysSinceLastRevocation != null ? fmtNumber(carrier.daysSinceLastRevocation) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Operating Status</span>
                <span className={`font-medium ${carrier.operatingStatus === 'authorized' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {carrier.operatingStatus === 'authorized' ? 'Authorized' : carrier.operatingStatus === 'pending' ? 'Pending' : 'Not Authorized'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Power Units</span>
                <span className="font-medium text-gray-900">{carrier.powerUnits}</span>
              </div>
            </div>
          </Card>

          {/* Educational section */}
          <Card padding="md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              What is a Chameleon Carrier?
            </h3>
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              <p>
                A <strong>chameleon carrier</strong> is a motor carrier that has been shut down by the Federal Motor Carrier Safety Administration (FMCSA) for safety violations, insurance lapses, or compliance failures — and then reopens under a new name, MC number, or DOT number to evade their prior safety record.
              </p>
              <p>
                FMCSA actively tracks chameleon carriers through their <strong>New Entrant Safety Audit</strong> program by cross-referencing shared addresses, officers, EINs, phone numbers, and vehicle VINs across carrier registrations.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-xs font-semibold text-red-800 mb-1">Why it matters for buyers</p>
                  <p className="text-xs text-red-700">Chameleon carriers carry hidden safety risks. Their prior violations, crashes, and OOS rates don't appear on the new authority — making it look clean when it isn't.</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1">How we detect it</p>
                  <p className="text-xs text-blue-700">We analyze shared EINs, officers, addresses, phone numbers, vehicle VINs, authority timelines, and revocation history across all FMCSA-registered carriers.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
