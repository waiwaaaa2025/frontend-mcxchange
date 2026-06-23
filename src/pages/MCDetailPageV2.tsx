import { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isValid } from 'date-fns'

function safeFmtDate(dateStr: string | null | undefined, fmt: string = 'MMM d, yyyy'): string {
  if (!dateStr) return 'N/A';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, fmt) : 'N/A';
  } catch {
    return 'N/A';
  }
}
import {
  LayoutDashboard, Shield, Activity, Umbrella, Truck, FileText,
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, ArrowRight, MapPin,
  Calendar, Users, Hash, Phone, Building2, Package, DollarSign,
  TrendingUp, TrendingDown, Star, Clock, ExternalLink, Mail,
  BarChart3, Eye, Zap, CircleDot, ChevronRight, ChevronDown, ChevronUp, MapPinned,
  Lock, Unlock, Coins, CreditCard, ShoppingCart, Send, Search,
  MessageSquare, Crown, Loader2, X, AlertCircle, Sparkles, ShieldAlert, Info,
} from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { useListing } from '../hooks/useListing'
import { api } from '../services/api'

import CreditReportView from '../components/v2/CreditReportView'
import SellerTrucksSection from '../components/SellerTrucksSection'
import TabNav, { TabItem } from '../components/v2/TabNav'
import CircularGauge from '../components/v2/CircularGauge'
import SpeedometerGauge from '../components/v2/SpeedometerGauge'
import CoverageBar from '../components/v2/CoverageBar'
import StatusBadge from '../components/v2/StatusBadge'
import ScoreCard from '../components/v2/ScoreCard'
import AuthorityTimeline from '../components/v2/AuthorityTimeline'
import CarrierHealthScore from '../components/v2/CarrierHealthScore'
import CertificationBadges from '../components/v2/CertificationBadges'
import HorizontalBenchmarkBar from '../components/v2/HorizontalBenchmarkBar'
import ViolationBreakdownChart from '../components/v2/ViolationBreakdownChart'
import SharedEquipmentAlert from '../components/v2/SharedEquipmentAlert'
import ChameleonAlert from '../components/v2/ChameleonAlert'
import DriverBreakdown from '../components/v2/DriverBreakdown'
import FleetOwnershipBar from '../components/v2/FleetOwnershipBar'
import DonutChart from '../components/v2/DonutChart'
import InfoGrid from '../components/v2/InfoGrid'
import MonitoringAlerts from '../components/v2/MonitoringAlerts'
import SparklineChart from '../components/v2/SparklineChart'
import StateHeatMap from '../components/v2/StateHeatMap'
import InsuranceGapTimeline from '../components/v2/InsuranceGapTimeline'
import FleetAgeHistogram from '../components/v2/FleetAgeHistogram'
import ViolationTrendChart from '../components/v2/ViolationTrendChart'
import RelatedCarriers from '../components/v2/RelatedCarriers'
import CarrierComparison from '../components/v2/CarrierComparison'
import {
  mockCarrier as fallbackCarrier, mockAuthority as fallbackAuthority,
  mockAuthorityHistory as fallbackAuthorityHistory, mockBasicScores as fallbackBasicScores,
  mockInspections as fallbackInspections, mockCrashes as fallbackCrashes,
  mockInsurancePolicies as fallbackInsurancePolicies, mockRenewalTimeline as fallbackRenewalTimeline,
  mockPolicyHistory as fallbackPolicyHistory, mockTrucks as fallbackTrucks,
  mockTrailers as fallbackTrailers, mockVinInspections as fallbackVinInspections,
  mockNetworkSignals as fallbackNetworkSignals, mockBenchmarks as fallbackBenchmarks,
  mockDocuments as fallbackDocuments, mockVerificationChecks as fallbackVerificationChecks,
  mockOperations as fallbackOperations, mockViolationBreakdown as fallbackViolationBreakdown,
  mockBasicAlerts as fallbackBasicAlerts, mockSharedEquipment as fallbackSharedEquipment,
  mockAuthorityPending as fallbackAuthorityPending, mockContactHistory as fallbackContactHistory,
  mockCargoCapabilities as fallbackCargoCapabilities,
  mockComplianceFinancials as fallbackComplianceFinancials, mockAvailableDocuments as fallbackAvailableDocuments,
  mockMonitoringAlerts as fallbackMonitoringAlerts, mockRiskScoreTrend as fallbackRiskScoreTrend,
  mockInsuranceGaps as fallbackInsuranceGaps,
  mockViolationTrend as fallbackViolationTrend, mockRelatedCarriers as fallbackRelatedCarriers,
  mockCarrierPercentiles as fallbackCarrierPercentiles,
  mockISSData as fallbackISSData, mockInspectionRecords as fallbackInspectionRecords,
  mockCrashRecords as fallbackCrashRecords,
  getStatusLevel, statusColors, StatusLevel,
  V2CarrierData, V2AuthorityData, V2AuthorityEvent, V2BasicScore,
  V2InspectionSummary, V2CrashData, V2InsurancePolicy, V2RenewalEvent,
  V2PolicyEvent, V2TruckData, V2TrailerData, V2VinInspection,
  V2InspectionRecord, V2CrashRecord, V2ISSData, V2OperationsSummary,
  V2ViolationBreakdown, V2SharedEquipment, V2AuthorityPending, V2BasicAlerts,
  V2ContactHistory, V2CargoCapabilities, V2ComplianceFinancials,
  V2AvailableDocument, V2MonitoringAlert, V2RiskScoreTrend,
  V2InsuranceGap, V2ViolationTrend, V2RelatedCarrier, V2CarrierPercentile,
  V2NetworkSignal, V2BenchmarkData, V2DocumentItem, V2ChameleonAnalysis,
} from '../components/v2/mockData'
import { useCarrierData } from '../hooks/useCarrierData'
import {
  mapToV2CarrierData, mapToV2AuthorityData, mapToV2AuthorityHistory,
  mapToV2AuthorityPending, mapToV2BasicScores, mapToV2BasicAlerts,
  mapToV2ViolationBreakdown, mapToV2ISSData, mapToV2InspectionSummary,
  mapToV2InspectionRecords, mapToV2Operations, mapToV2ViolationTrend,
  mapToV2CrashData, mapToV2CrashRecords, mapToV2InsurancePolicies,
  mapToV2RenewalTimeline, mapToV2PolicyHistory, mapToV2InsuranceGaps,
  mapToV2Trucks, mapToV2Trailers, mapToV2SharedEquipment,
  mapToV2CargoCapabilities, mapToV2Documents, mapToV2VerificationChecks,
  mapToV2AvailableDocuments, mapToV2RelatedCarriers, mapToV2Percentiles,
  mapToV2MonitoringAlerts, mapToV2RiskScoreTrend, mapToV2ContactHistory,
  mapToV2ComplianceFinancials, mapToV2VinInspections, mapToV2NetworkSignals,
  mapToV2Benchmarks, detectChameleonCarrier,
  calculateCarrierHealthScore,
  mapSMSToV2BasicScores,
  HealthCategory,
} from '../utils/carrierDataMapper'
import type { FMCSASMSData, FMCSAAuthorityHistory, FMCSAInsuranceHistory } from '../types'

// ============================================================
// CARRIER DATA CONTEXT — provides mapped data to all sub-components
// ============================================================
interface CarrierDataContextType {
  carrier: V2CarrierData
  authority: V2AuthorityData
  authorityHistory: V2AuthorityEvent[]
  authorityPending: V2AuthorityPending
  basicScores: V2BasicScore[]
  basicAlerts: V2BasicAlerts
  violationBreakdown: V2ViolationBreakdown
  issData: V2ISSData
  inspections: V2InspectionSummary
  inspectionRecords: V2InspectionRecord[]
  operations: V2OperationsSummary
  violationTrend: V2ViolationTrend[]
  crashes: V2CrashData
  crashRecords: V2CrashRecord[]
  insurancePolicies: V2InsurancePolicy[]
  renewalTimeline: V2RenewalEvent[]
  policyHistory: V2PolicyEvent[]
  insuranceGaps: V2InsuranceGap[]
  trucks: V2TruckData[]
  trailers: V2TrailerData[]
  sharedEquipment: V2SharedEquipment
  cargoCapabilities: V2CargoCapabilities
  documents: V2DocumentItem[]
  verificationChecks: any[]
  availableDocuments: V2AvailableDocument[]
  complianceFinancials: V2ComplianceFinancials
  relatedCarriers: V2RelatedCarrier[]
  percentiles: V2CarrierPercentile[]
  monitoringAlerts: V2MonitoringAlert[]
  riskScoreTrend: V2RiskScoreTrend[]
  contactHistory: V2ContactHistory
  vinInspections: V2VinInspection[]
  networkSignals: V2NetworkSignal[]
  benchmarks: V2BenchmarkData[]
  chameleonAnalysis: V2ChameleonAnalysis
  healthCategories: HealthCategory[]
  smsSnapshotDate: string | null
  carrierLoading: boolean
  carrierError: string | null
}

const CarrierDataContext = createContext<CarrierDataContextType | null>(null)

function useCarrierDataContext(): CarrierDataContextType {
  const ctx = useContext(CarrierDataContext)
  if (!ctx) throw new Error('useCarrierDataContext must be used within CarrierDataContext.Provider')
  return ctx
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK_CARRIER_DATA === 'true'

const tabs: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'authority', label: 'Authority & Compliance', icon: Shield },
  { id: 'safety', label: 'Safety & Inspections', icon: Activity },
  { id: 'insurance', label: 'Insurance', icon: Umbrella },
  { id: 'fleet', label: 'Fleet & Drivers', icon: Truck },
  { id: 'credit', label: 'Credit Report', icon: DollarSign },
  { id: 'chameleon', label: 'Chameleon Check', icon: ShieldAlert },
  { id: 'safety-improvement', label: 'Safety Improvement Report', icon: Zap },
]

// Format currency helper
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

// ============================================================
// CARRIER DATA LOADING SKELETON
// ============================================================
function CarrierLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-36 mb-4" />
            <div className="h-24 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center pt-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading carrier intelligence data...
      </div>
    </div>
  )
}

// ============================================================
// VERIFICATION PREVIEW OVERLAY — shown over tab content when not verified
// ============================================================
function VerificationPreviewOverlay() {
  const [vLoading, setVLoading] = useState(false)
  const [vError, setVError] = useState<string | null>(null)

  const handleVerify = async () => {
    setVLoading(true)
    setVError(null)
    try {
      const response = await api.createVerificationSession()
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      } else {
        setVError('Failed to start verification. Please try again.')
      }
    } catch (err: any) {
      setVError(err.message || 'Failed to start verification')
    } finally {
      setVLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Blurred placeholder content behind */}
      <div className="filter blur-sm opacity-40 pointer-events-none select-none">
        <CarrierLoadingSkeleton />
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-4"
        >
          <Card padding="lg">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Identity</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Complete a quick identity verification to access detailed carrier data, safety records, insurance info, and more.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gray-50">
                  <Shield className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-gray-900">Government ID</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-gray-900">~2 Minutes</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <Lock className="w-6 h-6 text-purple-500 mx-auto mb-1.5" />
                  <div className="text-xs font-medium text-gray-900">Secure</div>
                </div>
              </div>

              <Button fullWidth size="lg" onClick={handleVerify} loading={vLoading}>
                <Shield className="w-5 h-5 mr-2" />
                Verify My Identity
              </Button>

              {vError && <p className="text-sm text-red-500 mt-3">{vError}</p>}

              <p className="text-xs text-gray-400 mt-4">
                Powered by Stripe Identity. Your data is never stored on our servers.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// LOCKED TAB OVERLAY — shown when user clicks a tab that requires unlock
// ============================================================
function LockedTabOverlay({ tabLabel, isAuthenticated, isPremium, freeToUnlock, userCredits, unlocking, userRole, onUnlock, onPremiumRequest, onNavigate }: {
  tabLabel: string
  isAuthenticated: boolean
  isPremium: boolean
  freeToUnlock?: boolean
  userCredits: number
  unlocking: boolean
  userRole?: string
  onUnlock: () => void
  onPremiumRequest: () => void
  onNavigate: (path: string) => void
}) {
  return (
    <div className="relative">
      {/* Blurred skeleton behind */}
      <div className="filter blur-sm opacity-30 pointer-events-none select-none">
        <CarrierLoadingSkeleton />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-4"
        >
          <Card padding="lg">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unlock {tabLabel}</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Unlock this MC to access {tabLabel.toLowerCase()}, along with all other detailed carrier data sections.
              </p>

              {/* Feature preview pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['Authority & Compliance', 'Safety & Inspections', 'Insurance', 'Fleet & Drivers', 'Credit Report', 'Chameleon Check'].map(name => (
                  <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    <Lock className="w-2.5 h-2.5" />
                    {name}
                  </span>
                ))}
              </div>

              {!isAuthenticated ? (
                <div className="space-y-2">
                  <Button fullWidth onClick={() => onNavigate('/login')}>
                    <Lock className="w-4 h-4 mr-2" />Sign In to Unlock
                  </Button>
                  <Button fullWidth variant="secondary" onClick={() => onNavigate('/register')}>
                    Create Account
                  </Button>
                </div>
              ) : isPremium ? (
                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={onPremiumRequest}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Unlock Premium MC
                  </Button>
                  <p className="text-xs text-gray-400">Reviewed by admin within 24-48 hours</p>
                </div>
              ) : userRole === 'buyer' ? (
                <div className="space-y-3">
                  {freeToUnlock ? (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600">Free with Subscription</span>
                      </div>
                      <Button
                        fullWidth
                        size="lg"
                        onClick={onUnlock}
                        disabled={unlocking}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                      >
                        {unlocking ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</>
                        ) : (
                          <><Unlock className="w-4 h-4 mr-2" />Unlock Free</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">Cost: <strong className="text-gray-900">1 Credit</strong></span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-600">You have: <strong className={userCredits > 0 ? 'text-emerald-600' : 'text-red-500'}>{userCredits}</strong></span>
                      </div>
                      <Button
                        fullWidth
                        size="lg"
                        onClick={onUnlock}
                        disabled={userCredits < 1 || unlocking}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        {unlocking ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</>
                        ) : (
                          <><Unlock className="w-4 h-4 mr-2" />Unlock Full MC — 1 Credit</>
                        )}
                      </Button>
                      {userCredits < 1 && (
                        <Button fullWidth variant="secondary" size="sm" onClick={() => onNavigate('/buyer/subscription')}>
                          <CreditCard className="w-4 h-4 mr-2" />
                          {(userCredits === 0) ? 'Get a Subscription' : 'Buy More Credits'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// HERO HEADER
// ============================================================
const AUTHORITY_TYPE_PILL_LABELS: Record<string, string> = {
  MOTOR_CARRIER: 'Motor Carrier',
  BROKER: 'Broker Authority',
  MOTOR_CARRIER_AND_BROKER: 'Carrier + Broker',
  FREIGHT_FORWARDER: 'Freight Forwarder',
}

function HeroHeader({ unlocked, authorityType }: { unlocked: boolean; authorityType?: string }) {
  const { carrier: mockCarrier } = useCarrierDataContext()
  const healthColor = mockCarrier.carrierHealthScore >= 80 ? '#34d399' : mockCarrier.carrierHealthScore >= 60 ? '#fbbf24' : '#f87171'
  const healthRadius = 30
  const healthCirc = 2 * Math.PI * healthRadius
  const normalizedAuthorityType = authorityType || 'MOTOR_CARRIER'
  const isBrokerish = normalizedAuthorityType === 'BROKER' || normalizedAuthorityType === 'MOTOR_CARRIER_AND_BROKER'

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-0 sm:pt-8">
      <div className="relative rounded-none sm:rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
      }}>
        {/* Ambient glow orbs */}
        <motion.div
          className="absolute rounded-full blur-[100px] opacity-40"
          style={{ width: 400, height: 400, top: '-30%', left: '-5%', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-[100px] opacity-30"
          style={{ width: 350, height: 350, bottom: '-25%', right: '-5%', background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          animate={{ x: [0, -25, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          className="absolute rounded-full blur-[80px] opacity-20"
          style={{ width: 250, height: 250, top: '20%', right: '25%', background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          animate={{ x: [0, 15, -10, 0], y: [0, -10, 12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute h-[1px] top-0 left-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 40%, rgba(6,182,212,0.6) 60%, transparent 100%)', width: '30%' }}
          animate={{ x: ['-30%', '400%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />

        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl" style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.04)',
        }} />

        <div className="relative px-6 sm:px-8 py-7 sm:py-10">
          {/* Top row: Company name + Health Score */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Active Authority</span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${
                    isBrokerish
                      ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200'
                      : 'bg-white/[0.06] border-white/10 text-white/70'
                  }`}
                >
                  {AUTHORITY_TYPE_PILL_LABELS[normalizedAuthorityType] || normalizedAuthorityType}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-4xl font-black text-white tracking-tight ${!unlocked ? 'blur-[6px] select-none pointer-events-none' : ''}`}>{mockCarrier.legalName}</h1>
              {mockCarrier.dbaName && (
                <p className={`text-white/40 text-sm mt-1 font-medium ${!unlocked ? 'blur-[6px] select-none pointer-events-none' : ''}`}>DBA: {mockCarrier.dbaName}</p>
              )}
            </div>

            {/* Health Score Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-shrink-0 hidden sm:block"
            >
              <div className="relative w-[80px] h-[80px]">
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={healthRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                  <motion.circle
                    cx={40} cy={40} r={healthRadius} fill="none"
                    stroke={healthColor} strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={healthCirc}
                    initial={{ strokeDashoffset: healthCirc }}
                    animate={{ strokeDashoffset: healthCirc * (1 - mockCarrier.carrierHealthScore / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">{mockCarrier.carrierHealthScore}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-widest text-white/40">Health</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Key metrics — glass cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-6"
          >
            {[
              { label: 'MC Number', value: mockCarrier.mcNumber || 'N/A', accent: false, sensitive: true },
              { label: 'DOT Number', value: mockCarrier.dotNumber, accent: false, sensitive: true },
              { label: 'Location', value: mockCarrier.location, accent: false, sensitive: false },
              { label: 'Authority Age', value: `${mockCarrier.yearsActive} yrs`, accent: false, sensitive: false },
              { label: 'Annual Miles', value: mockCarrier.mcs150Mileage >= 1000000 ? `${(mockCarrier.mcs150Mileage / 1000000).toFixed(1)}M mi` : mockCarrier.mcs150Mileage > 0 ? `${mockCarrier.mcs150Mileage.toLocaleString()} mi` : 'N/A', accent: true, sensitive: false },
            ].map((stat, i) => {
              // Mask sensitive values when not unlocked: show first 3 chars + asterisks
              const displayValue = stat.sensitive && !unlocked && stat.value !== 'N/A'
                ? `${String(stat.value).slice(0, 3)}${'*'.repeat(Math.max(0, String(stat.value).length - 3))}`
                : stat.value
              return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`rounded-xl px-4 py-3 border backdrop-blur-sm ${
                  stat.accent
                    ? 'bg-indigo-500/10 border-indigo-500/20'
                    : 'bg-white/[0.04] border-white/[0.06]'
                }`}
                style={{
                  boxShadow: stat.accent
                    ? '0 0 20px rgba(99,102,241,0.1)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">{stat.label}</p>
                <p className={`text-lg sm:text-xl font-extrabold mt-0.5 ${stat.accent ? 'text-indigo-300' : 'text-white'}`}>
                  {displayValue}
                </p>
              </motion.div>
            )})}
          </motion.div>

          {/* Status ribbon + Price */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 mt-5 pt-5 border-t border-white/[0.06]"
          >
            {/* Status chips */}
            {([
              { label: 'Safety', value: mockCarrier.safetyRating === 'not-rated' ? 'Not Rated' : mockCarrier.safetyRating === 'satisfactory' ? 'Satisfactory' : mockCarrier.safetyRating === 'conditional' ? 'Conditional' : mockCarrier.safetyRating === 'unsatisfactory' ? 'Unsatisfactory' : 'Not Rated', color: mockCarrier.safetyRating === 'satisfactory' ? 'emerald' : mockCarrier.safetyRating === 'conditional' ? 'amber' : mockCarrier.safetyRating === 'unsatisfactory' ? 'red' : 'gray' },
              { label: 'Insurance', value: mockCarrier.insuranceStatus === 'current' ? 'Current' : mockCarrier.insuranceStatus === 'pending' ? 'Pending' : mockCarrier.insuranceStatus === 'expired' ? 'Expired' : 'Unknown', color: mockCarrier.insuranceStatus === 'current' ? 'emerald' : mockCarrier.insuranceStatus === 'pending' ? 'amber' : 'red' },
              { label: 'Fleet', value: `${mockCarrier.powerUnits} Units`, color: 'cyan' },
              { label: 'Drivers', value: `${mockCarrier.totalDriversCDL} CDL`, color: 'cyan' },
            ] as { label: string; value: string; color: string }[]).map((chip, i) => (
              <div key={chip.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className={`w-1.5 h-1.5 rounded-full ${chip.color === 'emerald' ? 'bg-emerald-400' : chip.color === 'amber' ? 'bg-amber-400' : chip.color === 'red' ? 'bg-red-400' : chip.color === 'gray' ? 'bg-gray-400' : 'bg-cyan-400'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{chip.label}</span>
                <span className="text-xs font-bold text-white/80">{chip.value}</span>
              </div>
            ))}

            {/* Certifications */}
            {mockCarrier.smartwayFlag && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">SmartWay</span>
              </div>
            )}

            {/* Spacer pushes price to the right */}
            <div className="flex-1" />

            {/* Price tag */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="px-5 py-2.5 rounded-xl border border-white/10"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)',
                boxShadow: '0 0 30px rgba(99,102,241,0.08)',
              }}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">Listing Price</p>
              <p className="text-xl sm:text-2xl font-black text-white">{fmtCurrency(mockCarrier.listingPrice)}</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB 1: OVERVIEW
// ============================================================
function OverviewTab() {
  const ctx = useCarrierDataContext()
  const { carrier: mockCarrier, complianceFinancials: mockComplianceFinancials, cargoCapabilities: mockCargoCapabilities, percentiles: mockCarrierPercentiles, networkSignals: mockNetworkSignals, benchmarks: mockBenchmarks, healthCategories } = ctx
  const safetyLevel = getStatusLevel('safety', mockCarrier.safetyRating)
  const insuranceLevel = getStatusLevel('insurance', mockCarrier.insuranceStatus)
  const authorityLevel = getStatusLevel('authority', mockCarrier.operatingStatus)
  return (
    <div className="space-y-6">
      {/* 1. Carrier Health Score */}
      <CarrierHealthScore score={mockCarrier.carrierHealthScore} categories={healthCategories.length > 0 ? healthCategories : undefined} />

      {/* 2. Quick Verdict Banner — driven by health score */}
      {(() => {
        const hs = mockCarrier.carrierHealthScore
        const verdict = hs >= 80
          ? { title: 'Good Standing', desc: 'This carrier scores well across safety, compliance, insurance, and fleet categories.', bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', titleColor: 'text-emerald-800', descColor: 'text-emerald-600', Icon: CheckCircle }
          : hs >= 60
          ? { title: 'Fair Standing — Review Recommended', desc: 'Some areas need attention. Review the category breakdown above for details.', bg: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', titleColor: 'text-yellow-800', descColor: 'text-yellow-600', Icon: AlertTriangle }
          : { title: 'Needs Attention — Elevated Risk', desc: 'This carrier has significant issues in one or more categories. Review safety, compliance, and insurance details carefully before proceeding.', bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600', titleColor: 'text-red-800', descColor: 'text-red-600', Icon: AlertCircle }
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border-2 p-5 flex items-center gap-4 ${verdict.bg}`}
          >
            <div className={`p-3 rounded-full ${verdict.iconBg}`}>
              <verdict.Icon className={`w-8 h-8 ${verdict.iconColor}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${verdict.titleColor}`}>{verdict.title}</h3>
              <p className={`text-sm ${verdict.descColor}`}>{verdict.desc}</p>
            </div>
          </motion.div>
        )
      })()}

      {/* 3. Score Summary Grid — enhanced with Trust & Risk row */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ScoreCard icon={Activity} label="Safety" value={mockCarrier.safetyRating === 'not-rated' ? 'Not Rated' : mockCarrier.safetyRating || 'Not Rated'} level={safetyLevel} />
          <ScoreCard icon={Umbrella} label="Insurance" value={mockCarrier.insuranceStatus === 'current' ? 'Current' : mockCarrier.insuranceStatus === 'pending' ? 'Pending' : mockCarrier.insuranceStatus === 'expired' ? 'Expired' : 'Unknown'} level={insuranceLevel} />
          <ScoreCard icon={Truck} label="Fleet Size" value={`${mockCarrier.powerUnits} Units`} level={mockCarrier.powerUnits > 0 ? 'good' : 'neutral'} />
          <ScoreCard icon={CheckCircle} label="Authority" value={mockCarrier.operatingStatus === 'authorized' ? 'Active' : mockCarrier.operatingStatus || 'Unknown'} level={authorityLevel} />
        </div>
      </div>

      {/* 7. Compliance & Financials */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-500" />
          Compliance & Financials
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className={`rounded-lg p-4 border ${mockComplianceFinancials.entryAuditCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {mockComplianceFinancials.entryAuditCompleted ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
              <p className="text-sm font-semibold text-gray-800">New Entrant Audit</p>
            </div>
            <p className="text-xs text-gray-500">
              {mockComplianceFinancials.entryAuditCompleted ? 'Completed — carrier passed entry audit' : 'Pending — audit not yet completed'}
            </p>
          </div>
          <div className={`rounded-lg p-4 border ${mockComplianceFinancials.hasFactoring ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">Factoring</p>
            </div>
            {mockComplianceFinancials.hasFactoring ? (
              <p className="text-xs text-gray-500">
                {mockComplianceFinancials.factoringCompany} — {mockComplianceFinancials.factoringRate}% rate
              </p>
            ) : (
              <p className="text-xs text-gray-500">No factoring company on file</p>
            )}
          </div>
        </div>
      </Card>

      {/* 8. Platform Integrations */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Amazon Relay</h4>
              <p className="text-xs text-gray-500">Load board integration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mockCarrier.amazonRelayScore ? (
              <>
                <StatusBadge level="excellent" label="Active" size="sm" />
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg">Score: {mockCarrier.amazonRelayScore}</span>
              </>
            ) : (
              <StatusBadge level="fair" label="Not Registered" size="sm" />
            )}
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ExternalLink className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Highway</h4>
              <p className="text-xs text-gray-500">Carrier compliance platform</p>
            </div>
          </div>
          <StatusBadge level={mockCarrier.highwaySetup ? 'excellent' : 'warning'} label={mockCarrier.highwaySetup ? 'Setup Complete' : 'Not Setup'} size="sm" />
        </Card>
      </div>

      {/* 9. What's Included */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${mockCarrier.sellingWithEmail ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">Email {mockCarrier.sellingWithEmail ? 'Included' : 'Not Included'}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${mockCarrier.sellingWithPhone ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Phone {mockCarrier.sellingWithPhone ? 'Included' : 'Not Included'}</span>
          </div>
        </div>
      </Card>

      {/* 10. Network Signals */}
      {mockNetworkSignals.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Network Signals
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockNetworkSignals.map((signal, i) => {
              const bgColors = { positive: 'bg-emerald-50 border-emerald-200', neutral: 'bg-amber-50 border-amber-200', negative: 'bg-red-50 border-red-200' }
              const textColors = { positive: 'text-emerald-700', neutral: 'text-amber-700', negative: 'text-red-700' }
              const icons = { positive: <CheckCircle className="w-4 h-4 text-emerald-500" />, neutral: <AlertTriangle className="w-4 h-4 text-amber-500" />, negative: <XCircle className="w-4 h-4 text-red-500" /> }
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${bgColors[signal.status]}`}>
                  <div className="mt-0.5">{icons[signal.status]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{signal.name}</span>
                      <span className={`text-xs font-bold ${textColors[signal.status]}`}>{signal.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{signal.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 11. Industry Benchmarks */}
      {mockBenchmarks.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Industry Benchmarks
          </h3>
          <div className="space-y-4">
            {mockBenchmarks.map((b, i) => {
              const isBetter = b.lowerIsBetter ? b.carrierValue <= b.industryAvg : b.carrierValue >= b.industryAvg
              const barColor = isBetter ? 'bg-emerald-500' : 'bg-red-400'
              const avgBarColor = 'bg-gray-300'
              const maxVal = Math.max(b.carrierValue, b.industryAvg) * 1.2 || 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{b.metric}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${isBetter ? 'text-emerald-600' : 'text-red-500'}`}>{b.carrierValue}{b.unit}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-gray-500">{b.industryAvg}{b.unit} avg</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${Math.min((b.carrierValue / maxVal) * 100, 100)}%` }} />
                    <div className={`absolute top-0 bottom-0 w-0.5 ${avgBarColor}`} style={{ left: `${Math.min((b.industryAvg / maxVal) * 100, 100)}%` }} title={`Industry Avg: ${b.industryAvg}${b.unit}`} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-[10px] font-medium ${isBetter ? 'text-emerald-600' : 'text-red-500'}`}>{isBetter ? (b.lowerIsBetter ? 'Below avg' : 'Above avg') : (b.lowerIsBetter ? 'Above avg' : 'Below avg')}</span>
                    <span className="text-[10px] text-gray-400">National average</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 12. Description */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{mockCarrier.description}</p>
      </Card>

      {/* 13. Industry Percentile Ranking — Full Report */}
      <CarrierComparison percentiles={mockCarrierPercentiles} />
    </div>
  )
}

// ============================================================
// TAB 2: AUTHORITY & COMPLIANCE
// ============================================================
function AuthorityTab() {
  const { carrier: mockCarrier, authority: mockAuthority, authorityHistory: mockAuthorityHistory, authorityPending: mockAuthorityPending, cargoCapabilities: mockCargoCapabilities } = useCarrierDataContext()
  const opLevel = getStatusLevel('authority', mockCarrier.operatingStatus)

  // Cargo capabilities grouped
  const cargoGroups = [
    { title: 'General', items: [
      { name: 'General Freight', active: mockCargoCapabilities.generalFreight },
      { name: 'Household Goods', active: mockCargoCapabilities.householdGoods },
      { name: 'Building Materials', active: mockCargoCapabilities.buildingMaterials },
      { name: 'Paper Products', active: mockCargoCapabilities.paperProducts },
      { name: 'Beverages', active: mockCargoCapabilities.beverages },
      { name: 'Intermodal Containers', active: mockCargoCapabilities.intermodalContainers },
      { name: 'Construction', active: mockCargoCapabilities.construction },
    ]},
    { title: 'Specialized', items: [
      { name: 'Metal: Sheets/Coils', active: mockCargoCapabilities.metalSheets },
      { name: 'Motor Vehicles', active: mockCargoCapabilities.motorVehicles },
      { name: 'Machinery/Large Objects', active: mockCargoCapabilities.machineryLargeObjects },
      { name: 'Oil Field Equipment', active: mockCargoCapabilities.oilFieldEquipment },
      { name: 'Mobile Homes', active: mockCargoCapabilities.mobileHomes },
      { name: 'Driveway/Towaway', active: mockCargoCapabilities.drivewayTowaway },
    ]},
    { title: 'Temperature Controlled', items: [
      { name: 'Fresh Produce', active: mockCargoCapabilities.freshProduce },
      { name: 'Refrigerated Food', active: mockCargoCapabilities.refrigeratedFood },
      { name: 'Meat', active: mockCargoCapabilities.meat },
    ]},
    { title: 'Bulk & Hazardous', items: [
      { name: 'Liquids', active: mockCargoCapabilities.liquids },
      { name: 'Chemicals', active: mockCargoCapabilities.chemicals },
      { name: 'Dry Bulk', active: mockCargoCapabilities.commoditiesDryBulk },
      { name: 'Livestock', active: mockCargoCapabilities.livestock },
      { name: 'Coal/Coke', active: mockCargoCapabilities.coalCoke },
    ]},
  ]

  // Pending flags
  const pendingKeys: { key: keyof typeof mockAuthority; pendingKey: keyof typeof mockAuthorityPending; reviewKey: keyof typeof mockAuthorityPending }[] = [
    { key: 'common', pendingKey: 'commonPending', reviewKey: 'commonReview' },
    { key: 'contract', pendingKey: 'contractPending', reviewKey: 'contractReview' },
    { key: 'broker', pendingKey: 'brokerPending', reviewKey: 'brokerReview' },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Operating Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-6 text-center ${opLevel === 'excellent' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
      >
        <h2 className={`text-3xl font-black tracking-wide ${opLevel === 'excellent' ? 'text-emerald-700' : 'text-red-700'}`}>
          {mockCarrier.operatingStatus === 'authorized' ? 'AUTHORIZED' : 'NOT AUTHORIZED'}
        </h2>
        <p className={`text-sm mt-1 ${opLevel === 'excellent' ? 'text-emerald-600' : 'text-red-600'}`}>
          Operating authority status with FMCSA
        </p>
      </motion.div>

      {/* 2. Authority Cards — enhanced with pending/review flags + age */}
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { key: 'common' as const, label: 'Common Authority', pIdx: 0 },
          { key: 'contract' as const, label: 'Contract Authority', pIdx: 1 },
          { key: 'broker' as const, label: 'Broker Authority', pIdx: 2 },
        ]).map(({ key, label, pIdx }) => {
          const auth = mockAuthority[key]
          const level = getStatusLevel('authority', auth.status)
          const pInfo = pendingKeys[pIdx]
          const isPending = mockAuthorityPending[pInfo.pendingKey]
          const isReview = mockAuthorityPending[pInfo.reviewKey]
          return (
            <Card key={key} padding="none" className="overflow-hidden">
              <div className={`h-1.5 ${auth.status === 'active' ? 'bg-emerald-500' : auth.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <div className="p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge level={level} label={auth.status.toUpperCase()} size="md" />
                  {isPending && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Pending</span>}
                  {isReview && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Review</span>}
                </div>
                {auth.grantedDate && (
                  <p className="text-xs text-gray-400 mt-2">Granted: {safeFmtDate(auth.grantedDate)}</p>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* 3. Authority Risk Indicators */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className={`rounded-lg p-4 text-center border ${mockCarrier.totalRevocations === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-2xl font-bold ${mockCarrier.totalRevocations === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{mockCarrier.totalRevocations}</p>
          <p className="text-xs text-gray-500">Total Revocations</p>
        </div>
        <div className="rounded-lg p-4 text-center border bg-gray-50 border-gray-100">
          <p className="text-2xl font-bold text-gray-800">{mockCarrier.daysSinceLastRevocation ?? 'N/A'}</p>
          <p className="text-xs text-gray-500">Days Since Last Revocation</p>
        </div>
        <div className="rounded-lg p-4 text-center border bg-gray-50 border-gray-100">
          <p className="text-2xl font-bold text-indigo-600">{Math.floor(mockCarrier.authorityAgeDays / 365)}y {Math.floor((mockCarrier.authorityAgeDays % 365) / 30)}m</p>
          <p className="text-xs text-gray-500">Authority Age</p>
        </div>
      </div>

      {/* 4. Business Information — expanded */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Registration Details
        </h3>
        <InfoGrid items={[
          { label: 'Legal Name', value: mockCarrier.legalName },
          { label: 'DBA Name', value: mockCarrier.dbaName || 'N/A' },
          { label: 'EIN', value: mockCarrier.ein, blur: true },
          { label: 'Entity Type', value: mockCarrier.entityType },
          { label: 'MC Number', value: mockCarrier.mcNumber },
          { label: 'DOT Number', value: mockCarrier.dotNumber },
          { label: 'Power Units', value: String(mockCarrier.powerUnits) },
          { label: 'Drivers', value: String(mockCarrier.drivers) },
          { label: 'MCS-150 Date', value: safeFmtDate(mockCarrier.mcs150Date) },
          { label: 'MCS-150 Mileage', value: fmtNumber(mockCarrier.mcs150Mileage) + ' mi' },
          { label: 'Registered', value: safeFmtDate(mockCarrier.registrantDate) },
          { label: 'Years Active', value: `${mockCarrier.yearsActive} years` },
        ]} />
      </Card>

      {/* 6. Cargo Capabilities — full 30+ grid */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Capabilities</h3>
        <div className="space-y-4">
          {cargoGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item.name}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
                      item.active
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        : 'bg-gray-50 text-gray-400 border-gray-100 line-through'
                    }`}
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. Authority History Timeline */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Authority History
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <AuthorityTimeline events={[...mockAuthorityHistory].reverse()} />
      </Card>

    </div>
  )
}

// ============================================================
// INSPECTION RECORDS PANEL (Light Theme)
// ============================================================
// Inspection level metadata
const INSPECTION_LEVELS: Record<string, { label: string; description: string; scope: string; color: string }> = {
  '1': { label: 'Level 1', description: 'North American Standard', scope: 'Full inspection — driver credentials, vehicle mechanical, cargo securement', color: 'bg-indigo-600' },
  '2': { label: 'Level 2', description: 'Walk-Around Driver/Vehicle', scope: 'Driver credentials + walk-around vehicle exterior — no crawling under', color: 'bg-blue-500' },
  '3': { label: 'Level 3', description: 'Driver-Only', scope: 'Driver credentials, logbook, medical card, seatbelt, substance check', color: 'bg-sky-500' },
  '4': { label: 'Level 4', description: 'Special Study', scope: 'One-time examination on a specific item (e.g., recall)', color: 'bg-gray-500' },
  '5': { label: 'Level 5', description: 'Vehicle-Only', scope: 'Vehicle inspection without driver present (terminal/roadside)', color: 'bg-gray-500' },
  '6': { label: 'Level 6', description: 'Radioactive Materials', scope: 'Level 1 + enhanced radioactive materials requirements', color: 'bg-gray-500' },
}

function parseLevel(raw: string): { num: string; meta: typeof INSPECTION_LEVELS[string] } {
  const match = raw.match(/(\d)/)
  const num = match ? match[1] : '0'
  return { num, meta: INSPECTION_LEVELS[num] || { label: raw, description: '', scope: '', color: 'bg-gray-400' } }
}

function InspectionRecordsPanel() {
  const { inspectionRecords: mockInspectionRecords } = useCarrierDataContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'clean' | 'violations' | 'oos'>('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // Filter records
  const filtered = mockInspectionRecords.filter(rec => {
    if (resultFilter === 'clean' && rec.violations > 0) return false
    if (resultFilter === 'violations' && rec.violations === 0) return false
    if (resultFilter === 'oos' && !rec.oos) return false
    if (typeFilter && !rec.level.toLowerCase().includes(typeFilter.toLowerCase())) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        rec.reportNumber.toLowerCase().includes(q) ||
        rec.state.toLowerCase().includes(q) ||
        rec.type.toLowerCase().includes(q) ||
        rec.violationDetails.some(v =>
          v.category.toLowerCase().includes(q) ||
          v.group.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
        )
      )
    }
    return true
  })

  // Summary stats
  const totalInspections = mockInspectionRecords.length
  const cleanCount = mockInspectionRecords.filter(r => r.violations === 0).length
  const violationsOnlyCount = mockInspectionRecords.filter(r => r.violations > 0 && !r.oos).length
  const oosCount = mockInspectionRecords.filter(r => r.oos).length
  const cleanRate = totalInspections > 0 ? Math.round((cleanCount / totalInspections) * 100) : 0

  // Level breakdown
  const levelCounts: Record<string, number> = {}
  mockInspectionRecords.forEach(r => {
    const { num } = parseLevel(r.level)
    levelCounts[num] = (levelCounts[num] || 0) + 1
  })

  const severityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500'
    if (severity >= 5) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const resultBadge = (rec: typeof mockInspectionRecords[0]) => {
    if (rec.oos) return { label: 'Out of Service', abbr: 'OOS', bg: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' }
    if (rec.violations > 0) return { label: 'Violations Found', abbr: 'VIOL', bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' }
    return { label: 'Clean — No Violations', abbr: 'CLEAN', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          Inspection Records
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">24 months</span>
        </h4>
      </div>

      {/* Summary Stats Bar */}
      <div className="px-5 pb-4">
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Result breakdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg border border-emerald-200 px-3 py-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">{cleanCount} Clean</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 rounded-lg border border-yellow-200 px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">{violationsOnlyCount} Violations</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 rounded-lg border border-red-200 px-3 py-1.5">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-xs font-semibold text-red-700">{oosCount} OOS</span>
              </div>
            </div>
            {/* Totals */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">{totalInspections}</p>
                <p className="text-[9px] text-gray-400 uppercase">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{cleanRate}%</p>
                <p className="text-[9px] text-gray-400 uppercase">Clean Rate</p>
              </div>
            </div>
          </div>
          {/* Level breakdown bar */}
          {totalInspections > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">By Inspection Level</p>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(levelCounts).sort(([a], [b]) => a.localeCompare(b)).map(([num, count]) => {
                  const meta = INSPECTION_LEVELS[num]
                  return (
                    <div key={num} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${meta?.color || 'bg-gray-400'}`} />
                      <span className="font-medium text-gray-700">Level {num}</span>
                      <span className="text-gray-400">({count})</span>
                      <span className="text-[10px] text-gray-400 hidden sm:inline">— {meta?.description || ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-5 pb-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search report #, state, violation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 pl-8 pr-3 py-2 w-60 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Result Filter */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Result</p>
          <div className="flex gap-1.5">
            {(['clean', 'violations', 'oos'] as const).map(f => (
              <button
                key={f}
                onClick={() => setResultFilter(resultFilter === f ? 'all' : f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  resultFilter === f
                    ? f === 'clean' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : f === 'violations' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f === 'clean' ? `Clean (${cleanCount})` : f === 'violations' ? `Violations (${violationsOnlyCount})` : `OOS (${oosCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Level Filter */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Level</p>
          <div className="flex gap-1.5">
            {['Level 1', 'Level 2', 'Level 3'].map(lvl => {
              const num = lvl.replace('Level ', '')
              const count = levelCounts[num] || 0
              return (
                <button
                  key={lvl}
                  onClick={() => setTypeFilter(typeFilter === lvl ? null : lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === lvl
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {lvl} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="px-5 pb-3">
        <p className="text-xs text-gray-400">{filtered.length} of {totalInspections} inspection{totalInspections !== 1 ? 's' : ''}{resultFilter !== 'all' || typeFilter ? ' (filtered)' : ''}</p>
      </div>

      {/* Records */}
      <div className="px-5 pb-5 space-y-3">
        {filtered.map(rec => {
          const isExpanded = expandedId === rec.id
          const { num: levelNum, meta: levelMeta } = parseLevel(rec.level)
          const badge = resultBadge(rec)

          return (
            <div
              key={rec.id}
              className={`rounded-xl overflow-hidden border ${rec.oos ? 'border-red-200 bg-red-50/30' : rec.violations > 0 ? 'border-yellow-200 bg-yellow-50/20' : 'border-gray-200 bg-gray-50'}`}
            >
              {/* Inspection Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="w-full px-4 py-3.5 hover:bg-white/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-left flex-wrap min-w-0">
                    {/* Date */}
                    <span className="text-sm font-bold text-gray-900 min-w-[90px]">
                      {safeFmtDate(rec.date)}
                    </span>
                    {/* State */}
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {rec.state}
                    </span>
                    {/* Level badge */}
                    <span className={`text-[10px] text-white font-bold px-2 py-0.5 rounded ${levelMeta.color}`}>
                      L{levelNum}
                    </span>
                    {/* Type */}
                    <span className="text-xs text-gray-500">{rec.type}</span>
                    {/* Report number */}
                    <span className="text-[11px] text-gray-400 font-mono">{rec.reportNumber}</span>
                  </div>
                  {/* Result badge + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${badge.bg}`}>
                      {rec.oos
                        ? `OOS — ${rec.oosViolations} of ${rec.violations} violation${rec.violations > 1 ? 's' : ''}`
                        : rec.violations > 0
                        ? `${rec.violations} Violation${rec.violations > 1 ? 's' : ''}`
                        : 'Clean'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              </button>

              {/* Expanded Detail Panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 bg-white">
                      {/* Inspection Detail Header */}
                      <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Inspection Level</p>
                            <p className="font-semibold text-gray-800">{levelMeta.label} — {levelMeta.description}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{levelMeta.scope}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Inspection Type</p>
                            <p className="font-semibold text-gray-800">{rec.type}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase mb-0.5">Result</p>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              <p className="font-semibold text-gray-800">{badge.label}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Violations Table or Clean confirmation */}
                      {rec.violations === 0 && !rec.oos && rec.oosViolations === 0 ? (
                        <div className="px-4 py-5 text-center">
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-emerald-700">Clean Inspection</p>
                          <p className="text-xs text-gray-400 mt-1">No violations found during this {levelMeta.description.toLowerCase()} inspection</p>
                        </div>
                      ) : (
                        <>
                          <div className="px-4 pt-3 pb-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                              {rec.violations > 0 ? (
                                <>{rec.violations} Violation{rec.violations > 1 ? 's' : ''} Found</>
                              ) : rec.oos ? (
                                <>Vehicle Placed Out of Service</>
                              ) : null}
                              {rec.oosViolations > 0 && <span className="text-red-500 ml-1">({rec.oosViolations} Out of Service)</span>}
                            </p>
                          </div>
                          {rec.violationDetails.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">BASIC Category</th>
                                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Group</th>
                                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                                  <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                                  <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">OOS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rec.violationDetails.map((v, vi) => (
                                  <tr key={vi} className={`border-b border-gray-100 last:border-b-0 ${v.oos ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${v.oos ? 'bg-red-500' : 'bg-indigo-500'}`} />
                                        <span className="text-gray-800 font-medium">{v.category}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-500">{v.group}</td>
                                    <td className="py-3 px-4 text-gray-600 max-w-xs">{v.description}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800">
                                        <span className={`w-2 h-2 rounded-full ${severityColor(v.severity)}`} />
                                        {v.severity}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {v.oos ? (
                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">
                                          OOS
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="px-4 py-4 text-center">
                              <p className="text-sm text-gray-500">
                                {rec.oos ? 'Vehicle was placed Out of Service.' : `${rec.violations} violation${rec.violations !== 1 ? 's' : ''} recorded.`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Detailed violation breakdown is not available for this inspection.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No inspections match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// TAB 3: SAFETY & INSPECTIONS
// ============================================================
function SafetyTab() {
  const { carrier: mockCarrier, basicScores: mockBasicScores, basicAlerts: mockBasicAlerts, violationBreakdown: mockViolationBreakdown, issData: mockISSData, inspections: mockInspections, inspectionRecords: mockInspectionRecords, operations: mockOperations, crashes: mockCrashes, crashRecords: mockCrashRecords, violationTrend: mockViolationTrend, smsSnapshotDate } = useCarrierDataContext()
  const [safetySub, setSafetySub] = useState<'overview' | 'basics' | 'inspections' | 'crashes'>('overview')
  const safetyLevel = getStatusLevel('safety', mockCarrier.safetyRating)

  // Map BASIC names to alert keys — handle ALL naming conventions (FMCSA, MorPro, legacy)
  const alertMap: Record<string, boolean> = {
    'Unsafe Driving': mockBasicAlerts.unsafeDrivingAlert,
    'Hours-of-Service': mockBasicAlerts.hoursOfServiceAlert,
    'Hours-of-Service Compliance': mockBasicAlerts.hoursOfServiceAlert,
    'Hours of Service': mockBasicAlerts.hoursOfServiceAlert,
    'Driver Fitness': mockBasicAlerts.driverFitnessAlert,
    'Controlled Substances': mockBasicAlerts.controlledSubstanceAlert,
    'Controlled Substances/Alcohol': mockBasicAlerts.controlledSubstanceAlert,
    'Controlled Substance': mockBasicAlerts.controlledSubstanceAlert,
    'Vehicle Maintenance': mockBasicAlerts.vehicleMaintenanceAlert,
    'HM Compliance': mockBasicAlerts.hazmatAlert,
    'Hazmat Compliance': mockBasicAlerts.hazmatAlert,
    'Hazardous Materials Compliance': mockBasicAlerts.hazmatAlert,
    'Hazardous Materials': mockBasicAlerts.hazmatAlert,
    'Crash Indicator': mockBasicAlerts.crashIndicatorAlert,
  }

  // Map BASIC names to violation counts — handle ALL naming conventions
  const violationMap: Record<string, number> = {
    'Unsafe Driving': mockViolationBreakdown.unsafeDriving,
    'Hours-of-Service': mockViolationBreakdown.hoursOfService,
    'Hours-of-Service Compliance': mockViolationBreakdown.hoursOfService,
    'Hours of Service': mockViolationBreakdown.hoursOfService,
    'Driver Fitness': mockViolationBreakdown.driverFitness,
    'Controlled Substances': mockViolationBreakdown.controlledSubstance,
    'Controlled Substances/Alcohol': mockViolationBreakdown.controlledSubstance,
    'Controlled Substance': mockViolationBreakdown.controlledSubstance,
    'Vehicle Maintenance': mockViolationBreakdown.vehicleMaintenance,
    'HM Compliance': mockViolationBreakdown.hazardousMaterials,
    'Hazmat Compliance': mockViolationBreakdown.hazardousMaterials,
    'Hazardous Materials Compliance': mockViolationBreakdown.hazardousMaterials,
    'Hazardous Materials': mockViolationBreakdown.hazardousMaterials,
    'Crash Indicator': 0,
  }

  // Total violations and inspections for context — use deduplicated values
  const totalViolations = (mockViolationBreakdown.unsafeDriving || 0) +
    (mockViolationBreakdown.hoursOfService || 0) +
    (mockViolationBreakdown.driverFitness || 0) +
    (mockViolationBreakdown.controlledSubstance || 0) +
    (mockViolationBreakdown.vehicleMaintenance || 0) +
    (mockViolationBreakdown.hazardousMaterials || 0)
  const totalInspections = mockOperations.totalInspections

  // Count active alerts — deduplicate (alertMap has multiple name variants per BASIC)
  const activeAlertCount = [
    mockBasicAlerts.unsafeDrivingAlert,
    mockBasicAlerts.hoursOfServiceAlert,
    mockBasicAlerts.driverFitnessAlert,
    mockBasicAlerts.controlledSubstanceAlert,
    mockBasicAlerts.vehicleMaintenanceAlert,
    mockBasicAlerts.hazmatAlert,
    mockBasicAlerts.crashIndicatorAlert,
  ].filter(Boolean).length

  // BASICs exceeding threshold
  const exceedingBasics = mockBasicScores.filter(b => b.score != null && b.score >= b.threshold)

  // Whether we have ANY real safety signal. When a carrier has no inspections,
  // no crashes, and no scored BASICs (e.g. a brand-new carrier with one clean
  // inspection), we must NOT fabricate a verdict — show N/A, never red/green.
  const scoredBasicsCount = mockBasicScores.filter(b => b.score != null).length
  const hasSafetyData =
    (mockInspections.totalInspections || 0) > 0 ||
    (mockCrashes.total || 0) > 0 ||
    scoredBasicsCount > 0

  const safetySubTabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'basics' as const, label: 'BASICs' },
    { id: 'inspections' as const, label: 'Inspections' },
    { id: 'crashes' as const, label: 'Crashes' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Safety Performance</h2>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </div>
        <p className="text-xs text-gray-500">FMCSA safety data, BASICs, inspections & crash analysis</p>
      </div>

      {/* Sub-tab pills */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {safetySubTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSafetySub(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                safetySub === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {/* ======== OVERVIEW SUB-TAB — SAFER Snapshot style ======== */}
          {safetySub === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Top row: Safety Rating + Operating Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">FMCSA Safety Rating</p>
                  <h3 className={`text-3xl font-black tracking-wide uppercase ${
                    safetyLevel === 'excellent' ? 'text-emerald-600' :
                    safetyLevel === 'fair' ? 'text-amber-500' :
                    safetyLevel === 'danger' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {mockCarrier.safetyRating === 'not-rated' ? 'Not Rated' : mockCarrier.safetyRating}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {mockCarrier.safetyRating === 'not-rated'
                      ? 'FMCSA has not issued a formal safety rating for this carrier'
                      : mockCarrier.safetyRating === 'satisfactory'
                        ? 'Meets FMCSA minimum safety standards'
                        : mockCarrier.safetyRating === 'conditional'
                          ? 'Deficiencies found — corrective action needed'
                          : 'Does not meet FMCSA safety standards'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Operating Status</p>
                  <h3 className={`text-3xl font-black tracking-wide uppercase ${
                    mockCarrier.operatingStatus === 'authorized' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {mockCarrier.operatingStatus === 'authorized' ? 'Authorized' : mockCarrier.operatingStatus === 'not-authorized' ? 'Not Authorized' : mockCarrier.operatingStatus}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {mockCarrier.powerUnits > 0 ? `${mockCarrier.powerUnits} power unit${mockCarrier.powerUnits !== 1 ? 's' : ''}` : ''}
                    {mockCarrier.powerUnits > 0 && mockCarrier.totalDriversCDL > 0 ? ' · ' : ''}
                    {mockCarrier.totalDriversCDL > 0 ? `${mockCarrier.totalDriversCDL} driver${mockCarrier.totalDriversCDL !== 1 ? 's' : ''}` : ''}
                  </p>
                </div>
              </div>

              {/* Inspections table — mirrors FMCSA SAFER Snapshot exactly */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">US Inspection Results for 24 months</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Total Inspections: <strong className="text-gray-700">{mockInspections.totalInspections}</strong>
                    {' · '}Note: Total inspections may be less than the sum of vehicle, driver, and hazmat inspections.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-blue-50/50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600">Inspection Type</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Vehicle</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Driver</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Hazmat</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">IEP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Inspections</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{mockInspections.vehicleInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{mockInspections.driverInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{mockInspections.hazmatInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{mockInspections.iepInspections}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Out of Service</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${mockInspections.vehicleOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{mockInspections.vehicleOOS}</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${mockInspections.driverOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{mockInspections.driverOOS}</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${mockInspections.hazmatOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{mockInspections.hazmatOOS}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{mockInspections.iepOOS}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Out of Service %</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${mockInspections.vehicleInspections > 0 && mockInspections.vehicleOOSRate > mockInspections.nationalVehicleOOSRate ? 'text-amber-600' : 'text-blue-600'}`}>
                          {mockInspections.vehicleInspections > 0 ? `${mockInspections.vehicleOOSRate}%` : '%'}
                        </td>
                        <td className={`py-2.5 px-4 text-center font-bold ${mockInspections.driverInspections > 0 && mockInspections.driverOOSRate > mockInspections.nationalDriverOOSRate ? 'text-amber-600' : 'text-blue-600'}`}>
                          {mockInspections.driverInspections > 0 ? `${mockInspections.driverOOSRate}%` : '%'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-bold">
                          {mockInspections.hazmatInspections > 0 ? `${mockInspections.hazmatOOSRate}%` : '%'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-bold">
                          {mockInspections.iepInspections > 0 ? `${mockInspections.iepOOSRate}%` : '0%'}
                        </td>
                      </tr>
                      <tr className="bg-blue-50/50">
                        <td className="py-2.5 px-4 font-medium text-gray-500 text-xs">Nat'l Average %</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{mockInspections.nationalVehicleOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{mockInspections.nationalDriverOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{mockInspections.nationalHazmatOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-400">N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-red-500 px-4 py-2 border-t border-gray-100">
                  *OOS rates calculated based on the most recent 24 months of inspection data per the latest monthly SAFER Snapshot.
                </p>
              </div>

              {/* Crashes table — mirrors FMCSA SAFER Snapshot */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Crashes reported to FMCSA for 24 months</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Crashes listed represent involvement in reportable crashes, without any determination as to responsibility.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-blue-50/50">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-600">Crash Type</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Fatal</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Injury</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Tow</th>
                        <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-gray-700">Crashes</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${mockCrashes.fatal > 0 ? 'text-red-600' : 'text-blue-600'}`}>{mockCrashes.fatal}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${mockCrashes.injury > 0 ? 'text-yellow-600' : 'text-blue-600'}`}>{mockCrashes.injury}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${mockCrashes.towaway > 0 ? 'text-orange-600' : 'text-blue-600'}`}>{mockCrashes.towaway}</td>
                        <td className={`py-2.5 px-4 text-center font-black ${mockCrashes.total > 0 ? 'text-gray-900' : 'text-blue-600'}`}>{mockCrashes.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick verdict banner */}
              {!hasSafetyData ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Insufficient safety data — N/A
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        FMCSA has not published enough inspection, crash, or BASIC data to rate
                        this carrier yet. We only show data that is actually on file — no score is
                        implied either way.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
              <div className={`rounded-xl border p-4 ${
                mockCrashes.fatal > 0 || exceedingBasics.length >= 3
                  ? 'bg-red-50 border-red-200'
                  : mockCrashes.total > 0 || exceedingBasics.length > 0 || (mockInspections.vehicleOOSRate > mockInspections.nationalVehicleOOSRate && mockInspections.vehicleInspections > 0)
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-start gap-2">
                  {mockCrashes.fatal > 0 || exceedingBasics.length >= 3 ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                  ) : mockCrashes.total > 0 || exceedingBasics.length > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${
                      mockCrashes.fatal > 0 || exceedingBasics.length >= 3 ? 'text-red-700' :
                      mockCrashes.total > 0 || exceedingBasics.length > 0 ? 'text-yellow-700' : 'text-emerald-700'
                    }`}>
                      {mockCrashes.fatal > 0
                        ? 'Serious safety concerns — fatal crash on record'
                        : exceedingBasics.length >= 3
                          ? `${exceedingBasics.length} BASICs exceeding FMCSA thresholds — high risk`
                          : exceedingBasics.length > 0
                            ? `${exceedingBasics.length} BASIC(s) exceeding threshold: ${exceedingBasics.map(b => b.name).join(', ')}`
                            : mockCrashes.total > 0
                              ? `${mockCrashes.total} crash${mockCrashes.total !== 1 ? 'es' : ''} on record — review details in Crashes tab`
                              : mockInspections.vehicleOOSRate > mockInspections.nationalVehicleOOSRate && mockInspections.vehicleInspections > 0
                                ? 'Vehicle OOS rate above national average — review in Inspections tab'
                                : 'No major safety flags — clean SAFER record'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      See BASICs, Inspections, and Crashes tabs for SMS deep-dive data.
                    </p>
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          )}

          {/* ======== BASICs SUB-TAB ======== */}
          {safetySub === 'basics' && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Explainer */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>What are BASICs?</strong> FMCSA's SMS (Safety Measurement System) scores carriers in 7 categories called BASICs.
                  Each score is a <strong>percentile</strong> (0–100) — higher means worse compared to peer carriers.
                  When a score crosses the <strong>threshold</strong>, FMCSA may intervene. "Not Scored" means insufficient inspection data.
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-700">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                    <strong>Percentile scores</strong> — FMCSA SMS, updated monthly{smsSnapshotDate ? ` (${safeFmtDate(smsSnapshotDate, 'MMM yyyy')})` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                    <strong>Inspections &amp; violations</strong> — updated daily
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-blue-600/80">
                  New inspections may appear in the Inspections tab before the percentile scores are recalculated by FMCSA.
                </p>
              </div>

              {/* Alert summary */}
              {activeAlertCount > 0 && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">
                      {activeAlertCount} of 7 BASICs flagged for alert
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">
                      Alerts mean FMCSA has identified enough violations in this category to warrant attention, even if the carrier isn't formally scored yet.
                    </p>
                  </div>
                </div>
              )}

              {/* BASIC Scores Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    BASIC Scores
                  </h4>
                  {smsSnapshotDate && (
                    <span className="text-[10px] text-gray-400 font-medium">
                      FMCSA SMS as of {safeFmtDate(smsSnapshotDate, 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Description</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Percentile</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Threshold</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Violations</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockBasicScores.map((basic, i) => {
                        const isScored = basic.score != null
                        const exceedsThreshold = isScored && basic.score! >= basic.threshold
                        const apiAlert = alertMap[basic.name] || false
                        const hasAlert = exceedsThreshold || apiAlert
                        const violations = violationMap[basic.name] ?? 0
                        return (
                          <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${hasAlert ? 'bg-red-50/50' : ''}`}>
                            <td className="py-2.5 px-4 font-medium text-gray-900">
                              {basic.name}
                              {hasAlert && <span className="ml-1.5 inline-flex w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            </td>
                            <td className="py-2.5 px-4 text-xs text-gray-500 hidden sm:table-cell">{basic.description}</td>
                            <td className="py-2.5 px-4 text-right">
                              {isScored ? (
                                <span className={`font-bold ${
                                  exceedsThreshold ? 'text-red-600' : basic.score! >= basic.threshold * 0.85 ? 'text-orange-600' : 'text-emerald-600'
                                }`}>{basic.score}%</span>
                              ) : (
                                <span className="text-gray-400 text-xs">Not Scored</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-400">{basic.threshold}%</td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{violations}</td>
                            <td className="py-2.5 px-4 text-right">
                              {exceedsThreshold ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">Exceeding</span>
                              ) : apiAlert ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Alert</span>
                              ) : isScored ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">OK</span>
                              ) : violations > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{violations} viol.</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">No Data</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 7 BASIC Gauge Cards */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    BASIC Percentile Gauges
                    <span className="text-[10px] text-gray-400 font-normal">Higher = worse. Red zone = above threshold.</span>
                  </span>
                  {smsSnapshotDate && (
                    <span className="text-[10px] text-gray-400 font-normal">
                      SMS {safeFmtDate(smsSnapshotDate, 'MMM yyyy')}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockBasicScores.map((basic, i) => {
                    // Determine alert: score exceeds threshold OR API flagged an alert
                    const exceedsThreshold = basic.score != null && basic.score >= basic.threshold
                    const apiAlert = alertMap[basic.name] || false
                    return (
                      <motion.div
                        key={basic.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-gray-50 rounded-xl border border-gray-200 p-3"
                      >
                        <SpeedometerGauge
                          name={basic.name}
                          score={basic.score}
                          threshold={basic.threshold}
                          alert={exceedsThreshold || apiAlert}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Violation Breakdown */}
              {totalViolations > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Violation Breakdown by BASIC
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">24 months</span>
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">{totalViolations} total violations across {totalInspections} inspections</p>
                  <ViolationBreakdownChart violations={mockViolationBreakdown} alerts={mockBasicAlerts} />
                </div>
              )}

              {/* Violation Trend */}
              {mockViolationTrend.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-indigo-500" />
                    Violation Trend
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">24 months</span>
                  </h4>
                  <ViolationTrendChart data={mockViolationTrend} />
                </div>
              ) : totalViolations > 0 ? (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
                  <p className="text-sm text-gray-400">Violation trend data not available for this carrier</p>
                  <p className="text-xs text-gray-300 mt-1">Trend requires multiple months of data to calculate</p>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* ======== INSPECTIONS SUB-TAB ======== */}
          {safetySub === 'inspections' && (
            <motion.div
              key="inspections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <p className="text-[11px] text-gray-400 -mb-2">Inspection and violation data is updated daily. BASIC percentile scores (BASICs tab) are recalculated monthly by FMCSA.</p>
              {/* Row 1: 4 Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{mockOperations.cleanInspectionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Clean Rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  {mockInspections.vehicleInspections > 0 ? (
                    <p className={`text-2xl font-bold ${mockInspections.vehicleOOSRate <= mockInspections.nationalVehicleOOSRate ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mockInspections.vehicleOOSRate}%
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-300">—</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Vehicle OOS Rate</p>
                  {mockInspections.vehicleInspections > 0 && <p className="text-[10px] text-gray-400">{mockInspections.vehicleOOS}/{mockInspections.vehicleInspections} inspections</p>}
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  {mockInspections.driverInspections > 0 ? (
                    <p className={`text-2xl font-bold ${mockInspections.driverOOSRate <= mockInspections.nationalDriverOOSRate ? 'text-emerald-600' : 'text-red-600'}`}>
                      {mockInspections.driverOOSRate}%
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-300">—</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Driver OOS Rate</p>
                  {mockInspections.driverInspections > 0 && <p className="text-[10px] text-gray-400">{mockInspections.driverOOS}/{mockInspections.driverInspections} inspections</p>}
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{safeFmtDate(mockOperations.lastInspectionDate)}</p>
                  <p className="text-xs text-gray-500 mt-1">Last Inspection</p>
                </div>
              </div>

              {/* Row 2: OOS Summary Table — matches FMCSA SAFER Snapshot layout */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Out-of-Service Summary</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">OOS Rate = Out of Service / Inspections. Based on most recent 24 months of inspection data.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Inspection Type</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Inspections</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Out of Service</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Out of Service %</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Nat'l Average %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'Vehicle', inspections: mockInspections.vehicleInspections, oos: mockInspections.vehicleOOS, rate: mockInspections.vehicleOOSRate, natl: mockInspections.nationalVehicleOOSRate },
                        { type: 'Driver', inspections: mockInspections.driverInspections, oos: mockInspections.driverOOS, rate: mockInspections.driverOOSRate, natl: mockInspections.nationalDriverOOSRate },
                        { type: 'Hazmat', inspections: mockInspections.hazmatInspections, oos: mockInspections.hazmatOOS, rate: mockInspections.hazmatOOSRate, natl: mockInspections.nationalHazmatOOSRate },
                        { type: 'IEP', inspections: mockInspections.iepInspections, oos: mockInspections.iepOOS, rate: mockInspections.iepOOSRate, natl: null as number | null },
                      ].map((row, i) => {
                        const hasData = row.inspections > 0
                        const belowAvg = row.natl != null && row.rate <= row.natl
                        const rateDisplay = hasData ? `${row.rate}%` : row.inspections === 0 && row.type === 'Hazmat' ? '%' : '0%'
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2.5 px-4 font-medium text-gray-900">{row.type}</td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{row.inspections}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={`font-semibold ${row.oos > 0 ? 'text-red-600' : 'text-gray-700'}`}>{row.oos}</span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {hasData ? (
                                <span className={`font-bold ${belowAvg ? 'text-emerald-600' : row.natl != null ? 'text-red-600' : 'text-gray-700'}`}>{rateDisplay}</span>
                              ) : (
                                <span className="text-gray-400">{rateDisplay}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-400">{row.natl != null ? `${row.natl}%` : 'N/A'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 3: Inspections by Level */}
              {mockInspectionRecords.length > 0 && (() => {
                const levelData: Record<string, { total: number; clean: number; violations: number; oos: number; description: string }> = {}
                const LEVEL_DESC: Record<string, string> = {
                  '1': 'Full inspection — driver + vehicle + cargo',
                  '2': 'Walk-around — driver + vehicle exterior',
                  '3': 'Driver-only — credentials, logbook, medical',
                  '4': 'Special study — one specific item',
                  '5': 'Vehicle-only — no driver present',
                  '6': 'Radioactive materials — Level 1 enhanced',
                }
                mockInspectionRecords.forEach(rec => {
                  const match = rec.level.match(/(\d)/)
                  const num = match ? match[1] : '?'
                  if (!levelData[num]) levelData[num] = { total: 0, clean: 0, violations: 0, oos: 0, description: LEVEL_DESC[num] || '' }
                  levelData[num].total++
                  if (rec.violations === 0) levelData[num].clean++
                  else if (rec.oos) levelData[num].oos++
                  else levelData[num].violations++
                })
                const sortedLevels = Object.entries(levelData).sort(([a], [b]) => a.localeCompare(b))
                return (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-900">Inspections by Level</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">DOT roadside inspections are classified into levels based on scope. Level 1 is the most comprehensive.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Level</th>
                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Description</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Clean</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Violations</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">OOS</th>
                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Clean Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLevels.map(([num, d]) => {
                            const cleanRate = d.total > 0 ? Math.round((d.clean / d.total) * 100) : 0
                            return (
                              <tr key={num} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5 px-4 font-bold text-gray-900">Level {num}</td>
                                <td className="py-2.5 px-4 text-xs text-gray-500 hidden sm:table-cell">{d.description}</td>
                                <td className="py-2.5 px-4 text-right font-semibold text-gray-700">{d.total}</td>
                                <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{d.clean}</td>
                                <td className="py-2.5 px-4 text-right text-yellow-600 font-semibold">{d.violations}</td>
                                <td className="py-2.5 px-4 text-right text-red-600 font-semibold">{d.oos}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className={`font-bold ${cleanRate >= 80 ? 'text-emerald-600' : cleanRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{cleanRate}%</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              {/* Row 4: Inspections by State */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Inspections by State</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">State</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Inspections</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">OOS</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">OOS Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockOperations.operatingStates.map((s, i) => {
                        const belowAvg = s.oosRate <= 12.9
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2.5 px-4">
                              <span className="font-medium text-gray-900">{s.state}</span>
                              <span className="text-gray-400 ml-1 text-xs">({s.stateCode})</span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{s.inspections}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={`font-semibold ${s.oosCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{s.oosCount}</span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={`font-bold ${belowAvg ? 'text-emerald-600' : 'text-red-600'}`}>{s.oosRate}%</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 4: Inspection Records — CarrierOk Dark Style */}
              <InspectionRecordsPanel />
            </motion.div>
          )}

          {/* ======== CRASHES SUB-TAB ======== */}
          {safetySub === 'crashes' && (
            <motion.div
              key="crashes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* Row 1: 4 Crash Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Fatal', value: mockCrashes.fatal, color: mockCrashes.fatal > 0 ? 'text-red-600' : 'text-emerald-600', bg: mockCrashes.fatal > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Injury', value: mockCrashes.injury, color: mockCrashes.injury > 0 ? 'text-yellow-600' : 'text-emerald-600', bg: mockCrashes.injury > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Towaway', value: mockCrashes.towaway, color: mockCrashes.towaway > 0 ? 'text-orange-600' : 'text-emerald-600', bg: mockCrashes.towaway > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Total', value: mockCrashes.total, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
                ].map((c, i) => (
                  <div key={i} className={`rounded-xl border ${c.bg} p-4 text-center`}>
                    <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.label}</p>
                    <p className="text-[10px] text-gray-400">24 months</p>
                  </div>
                ))}
              </div>

              {/* Row 2: Crash Records List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Crash Records</h4>
                </div>
                {mockCrashRecords.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {mockCrashRecords.map((crash) => (
                      <div key={crash.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            crash.severity === 'Injury' ? 'bg-yellow-500' :
                            crash.severity === 'Towaway' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{crash.severity} Crash</p>
                            <p className="text-xs text-gray-500">{safeFmtDate(crash.date)} · {crash.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="text-xs space-y-0.5">
                            <p className={`font-medium ${crash.fatalities > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {crash.fatalities} fatal
                            </p>
                            <p className={`font-medium ${crash.injuries > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                              {crash.injuries} injury
                            </p>
                          </div>
                          <div>
                            {crash.hazmatRelease && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">HazMat</span>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">{crash.reportNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-emerald-600">No crashes on record</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================
// TAB 4: INSURANCE
// ============================================================
function InsuranceTab() {
  const { carrier: mockCarrier, insurancePolicies: mockInsurancePolicies, renewalTimeline: mockRenewalTimeline, policyHistory: mockPolicyHistory, insuranceGaps: mockInsuranceGaps } = useCarrierDataContext()
  const insLevel = getStatusLevel('insurance', mockCarrier.insuranceStatus)

  return (
    <div className="space-y-6">
      {/* Insurance Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-6 text-center ${
          insLevel === 'excellent' ? 'bg-emerald-50 border-emerald-200'
          : insLevel === 'warning' ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200'
        }`}
      >
        <p className="text-sm text-gray-500 mb-1">Insurance Status</p>
        <h2 className={`text-3xl font-black tracking-wide uppercase ${statusColors[insLevel].text}`}>
          {mockCarrier.insuranceStatus === 'pending' ? 'CANCELLATION PENDING'
            : mockCarrier.insuranceStatus === 'expired' ? 'EXPIRED'
            : 'CURRENT'}
        </h2>
        {mockCarrier.insuranceStatus === 'pending' && (
          <p className="text-sm text-yellow-600 mt-1">One or more policies have a pending cancellation or are near expiration</p>
        )}
      </motion.div>

      {/* Coverage Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Analysis</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {mockInsurancePolicies.map((policy, i) => (
            <CoverageBar
              key={i}
              label={`${policy.type} Coverage`}
              actual={policy.coverage}
              required={policy.required}
            />
          ))}
        </div>
      </div>

      {/* Active Policies Table */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Policies</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Insurer</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Policy #</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Coverage</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Effective</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Expires</th>
              </tr>
            </thead>
            <tbody>
              {mockInsurancePolicies.map((policy, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{policy.insurer}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-600">{policy.policyNumber}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">{policy.type}</span>
                  </td>
                  <td className="py-2 px-3 font-semibold">{fmtCurrency(policy.coverage)}</td>
                  <td className="py-2 px-3">
                    <StatusBadge level={getStatusLevel('insurance', policy.status)} label={policy.status.toUpperCase()} size="sm" />
                  </td>
                  <td className="py-2 px-3 text-gray-600">{safeFmtDate(policy.effectiveDate)}</td>
                  <td className="py-2 px-3 text-gray-600">{safeFmtDate(policy.expirationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Renewal Timeline */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Renewal Timeline
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <div className="relative">
          {/* Horizontal timeline */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {mockRenewalTimeline.map((renewal, i) => {
              const urgencyColors: Record<string, string> = {
                ok: 'bg-emerald-100 border-emerald-300 text-emerald-700',
                low: 'bg-emerald-100 border-emerald-300 text-emerald-700',
                medium: 'bg-yellow-100 border-yellow-300 text-yellow-700',
                warning: 'bg-yellow-100 border-yellow-300 text-yellow-700',
                high: 'bg-orange-100 border-orange-300 text-orange-700',
                expired: 'bg-gray-100 border-gray-300 text-gray-700',
                critical: 'bg-red-100 border-red-300 text-red-700',
              }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1 min-w-[160px]"
                >
                  <div className={`rounded-xl border-2 p-4 text-center ${urgencyColors[renewal.urgency]}`}>
                    <p className="text-xs font-semibold uppercase tracking-wider">{renewal.policyType}</p>
                    <p className="text-lg font-bold mt-1">{renewal.daysUntil} days</p>
                    <p className="text-xs mt-1">{safeFmtDate(renewal.date)}</p>
                  </div>
                  {i < mockRenewalTimeline.length - 1 && (
                    <div className="flex justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Policy Event History */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Policy Event History
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <AuthorityTimeline events={mockPolicyHistory} />
      </Card>

      {/* Insurance Gap Detection */}
      <InsuranceGapTimeline gaps={mockInsuranceGaps} />
    </div>
  )
}

// ============================================================
// TAB 5: FLEET & EQUIPMENT
// ============================================================
function FleetTab() {
  const { carrier: mockCarrier, trucks: mockTrucks, trailers: mockTrailers, sharedEquipment: mockSharedEquipment } = useCarrierDataContext()
  const rawAvgYear = mockTrucks.length > 0 ? Math.round(mockTrucks.filter(t => t.year >= 1900 && t.year <= 2100).reduce((s, t, _, a) => s + t.year / a.length, 0)) : 0
  const avgYear = rawAvgYear >= 1900 && rawAvgYear <= 2100 ? rawAvgYear : 'N/A'

  // Fleet composition by make for donut chart
  const makeCount: Record<string, number> = {}
  mockTrucks.forEach((t) => { makeCount[t.make] = (makeCount[t.make] || 0) + 1 })
  const makeSegments = Object.entries(makeCount).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
    label, value, color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][i % 5],
  }))

  // Trailer composition by type for donut chart
  const typeCount: Record<string, number> = {}
  mockTrailers.forEach((t) => { typeCount[t.type] = (typeCount[t.type] || 0) + 1 })
  const typeSegments = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
    label, value, color: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 4],
  }))

  return (
    <div className="space-y-6">
      {/* 1. Fleet Summary — expanded to 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <ScoreCard icon={Truck} label="Trucks" value={mockTrucks.length} level="good" />
        <ScoreCard icon={Package} label="Trailers" value={mockTrailers.length} level="good" />
        <ScoreCard icon={Users} label="CDL Drivers" value={mockCarrier.totalDriversCDL} level="good" />
        <ScoreCard icon={Calendar} label="Avg Fleet Year" value={avgYear} level="good" subtitle="model year" />
        <ScoreCard icon={MapPinned} label="Annual Miles" value={mockCarrier.mcs150Mileage > 0 ? (mockCarrier.mcs150Mileage >= 1000000 ? `${(mockCarrier.mcs150Mileage / 1000000).toFixed(1)}M` : fmtNumber(mockCarrier.mcs150Mileage)) : 'N/A'} level="good" subtitle="mi/yr" />
      </div>

      {/* 2. Fleet Ownership */}
      <FleetOwnershipBar owned={mockCarrier.ownedTractors} leased={mockCarrier.termLeasedTractors} />

      {/* 3. Driver CDL Breakdown */}
      <DriverBreakdown
        totalCDL={mockCarrier.totalDriversCDL}
        within100mi={mockCarrier.driversInterstate100mi}
        beyond100mi={mockCarrier.driversInterstateBeyond100mi}
      />

      {/* 4. Fleet Composition — donut charts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card padding="md">
          <DonutChart segments={makeSegments} title="Fleet by Make" />
        </Card>
        <Card padding="md">
          <DonutChart segments={typeSegments} title="Trailers by Type" />
        </Card>
      </div>

      {/* 4b. Fleet Age Distribution */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Fleet Age Distribution
        </h3>
        <FleetAgeHistogram trucks={mockTrucks} trailers={mockTrailers} />
      </Card>

      {/* 5. Shared Equipment Alert */}
      <SharedEquipmentAlert data={mockSharedEquipment} />

      {/* 6. Truck Inventory */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          Truck Inventory
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">VIN</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Year</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Make</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Model</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Body Class</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">GVWR</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Inspections</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">OOS</th>
              </tr>
            </thead>
            <tbody>
              {mockTrucks.map((truck, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{truck.vin}</td>
                  <td className="py-2 px-3">{truck.year}</td>
                  <td className="py-2 px-3 font-medium">{truck.make}</td>
                  <td className="py-2 px-3 text-gray-600">{truck.model}</td>
                  <td className="py-2 px-3 text-gray-600 text-xs">{truck.bodyClass}</td>
                  <td className="py-2 px-3 text-gray-600 text-xs">{truck.gvwr}</td>
                  <td className="py-2 px-3 text-center">{truck.inspections}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${truck.oosCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {truck.oosCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 7. Trailer Inventory */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          Trailer Inventory
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">VIN</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Year</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Make</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Model</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Length</th>
              </tr>
            </thead>
            <tbody>
              {mockTrailers.map((trailer, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{trailer.vin}</td>
                  <td className="py-2 px-3">{trailer.year}</td>
                  <td className="py-2 px-3 font-medium">{trailer.make}</td>
                  <td className="py-2 px-3 text-gray-600">{trailer.model}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${trailer.type === 'Reefer' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {trailer.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{trailer.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB 6: DOCUMENTS
// ============================================================
function DocumentsTab() {
  const { carrier: mockCarrier, documents: mockDocuments, verificationChecks: mockVerificationChecks, availableDocuments: mockAvailableDocuments } = useCarrierDataContext()
  const verifiedCount = mockDocuments.filter((d) => d.status === 'verified').length

  return (
    <div className="space-y-6">
      {/* 1. Document Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-5 text-center ${verifiedCount === mockDocuments.length ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle className={`w-6 h-6 ${verifiedCount === mockDocuments.length ? 'text-emerald-500' : 'text-yellow-500'}`} />
          <h3 className={`text-xl font-bold ${verifiedCount === mockDocuments.length ? 'text-emerald-700' : 'text-yellow-700'}`}>
            {verifiedCount} of {mockDocuments.length} Verified
          </h3>
        </div>
        <p className="text-sm text-gray-500">All required documents have been verified</p>
      </motion.div>

      {/* 2. Verification Checks (from V1) */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Verification Checks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mockVerificationChecks.map((check, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-lg border p-3 text-center ${
                check.status === 'clean' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}
            >
              {check.status === 'clean' ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
              )}
              <p className="text-sm font-semibold text-gray-800">{check.name}</p>
              <p className="text-xs text-gray-500">{check.detail}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* 3. Document Cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {mockDocuments.map((doc, i) => {
          const isVerified = doc.status === 'verified'
          const isPending = doc.status === 'pending'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 rounded-xl border p-4 ${isVerified ? 'bg-white border-emerald-100' : isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${isVerified ? 'bg-emerald-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {isVerified ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : isPending ? (
                  <Clock className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                  <StatusBadge
                    level={isVerified ? 'excellent' : isPending ? 'fair' : 'danger'}
                    label={doc.status.toUpperCase()}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 4. Available Documents Checklist (from V1) */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Available Documents Checklist
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {mockAvailableDocuments.map((doc, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${doc.available ? 'bg-emerald-50' : 'bg-gray-50'}`}
            >
              {doc.available ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm ${doc.available ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{doc.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. What's Included in Sale */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included in Sale</h3>
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${mockCarrier.sellingWithEmail ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">Email {mockCarrier.sellingWithEmail ? 'Included' : 'Not Included'}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${mockCarrier.sellingWithPhone ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Phone {mockCarrier.sellingWithPhone ? 'Included' : 'Not Included'}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB 7: CREDIT REPORT (Creditsafe)
// ============================================================
function CreditReportTab() {
  const { carrier: c } = useCarrierDataContext()
  const [fullReport, setFullReport] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [accessState, setAccessState] = useState<'checking' | 'locked' | 'unlocked'>('checking')
  const [unlocking, setUnlocking] = useState(false)

  // Step 1: Check if credit report is unlocked for this DOT
  useEffect(() => {
    if (!c.dotNumber) return
    api.checkCreditReportAccess(c.dotNumber, 'check')
      .then(res => {
        setAccessState(res.data?.unlocked ? 'unlocked' : 'locked')
      })
      .catch(() => setAccessState('locked'))
  }, [c.dotNumber])

  // Step 2: Once unlocked, auto-search Creditsafe
  useEffect(() => {
    if (accessState !== 'unlocked' || !c.legalName || hasSearched) return
    const state = c.location?.split(',').pop()?.trim() || ''
    setSearchLoading(true)
    setSearchError(null)
    setHasSearched(true)
    api.carrierPulseCreditsafeSearch({ name: c.legalName, state })
      .then(res => {
        const results = res.data?.companies || []
        if (!results.length) {
          setSearchError('No credit data found for this carrier.')
          setSearchLoading(false)
          return
        }
        const carrierCity = (c.location?.split(',')[0]?.trim() || '').toLowerCase()
        const carrierState = state.toLowerCase()
        let best = results[0]
        if (results.length > 1) {
          const scored = results.map((co: any) => {
            let score = 0
            const addr = co.address || {}
            const addrStr = (addr.simpleValue || '').toLowerCase()
            const coCity = (addr.city || '').toLowerCase()
            const coProvince = (addr.province || '').toLowerCase()
            if (carrierState && (coProvince === carrierState || addrStr.includes(carrierState))) score += 1
            if (carrierCity && (coCity === carrierCity || addrStr.includes(carrierCity))) score += 2
            if (co.status?.toLowerCase().includes('active')) score += 1
            if (co.name?.toLowerCase() === c.legalName.toLowerCase()) score += 3
            return { co, score }
          })
          scored.sort((a: any, b: any) => b.score - a.score)
          best = scored[0].co
        }
        const connectId = best.connectId || best.id
        setSearchLoading(false)
        setReportLoading(true)
        return api.carrierPulseCreditsafeReport(connectId)
      })
      .then(res => {
        if (res?.data) setFullReport(res.data)
      })
      .catch(() => setSearchError('Failed to load credit report.'))
      .finally(() => { setSearchLoading(false); setReportLoading(false) })
  }, [accessState, c.legalName])

  const handleUnlock = async () => {
    if (!c.dotNumber || !c.legalName) return
    setUnlocking(true)
    setSearchError(null)
    try {
      // Step 1: Search Creditsafe FIRST to verify data exists before charging
      const state = c.location?.split(',').pop()?.trim() || ''
      const searchRes = await api.carrierPulseCreditsafeSearch({ name: c.legalName, state })
      const results = searchRes.data?.companies || []
      if (!results.length) {
        setSearchError('No credit data found for this carrier in Creditsafe. You were not charged.')
        setUnlocking(false)
        return
      }

      // Step 2: Data exists — now charge credits
      const unlockRes = await api.checkCreditReportAccess(c.dotNumber, 'unlock')
      if (unlockRes.data?.unlocked) {
        setAccessState('unlocked')
      }
    } catch (err: any) {
      const msg = err.message || ''
      setSearchError(msg.includes('Insufficient') ? 'Not enough credits. You need 2 credits to unlock this report.' : 'Failed to unlock credit report.')
    } finally {
      setUnlocking(false)
    }
  }

  // Checking access
  if (accessState === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking access...</p>
      </div>
    )
  }

  // Locked — show unlock prompt
  if (accessState === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
          <Lock className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Credit Report</h3>
        <p className="text-gray-500 text-sm max-w-md mb-1">
          Get the full business credit report for <strong>{c.legalName}</strong> including UCC filings, liens, judgments, bankruptcy status, financial statements, and more.
        </p>
        <p className="text-indigo-600 font-semibold text-sm mb-6">Cost: 2 credits</p>
        {searchError && <p className="text-red-500 text-sm mb-4">{searchError}</p>}
        <button
          onClick={handleUnlock}
          disabled={unlocking}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold transition-colors flex items-center gap-2"
        >
          {unlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Unlock className="w-5 h-5" />}
          {unlocking ? 'Unlocking...' : 'Unlock for 2 Credits'}
        </button>
      </div>
    )
  }

  if (searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Searching Creditsafe for "{c.legalName}"...</p>
      </div>
    )
  }

  if (searchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">No credit data found</p>
        <p className="text-gray-500 text-sm max-w-md">{searchError}</p>
      </div>
    )
  }

  return <CreditReportView fullReport={fullReport} isLoading={reportLoading} />
}

// ============================================================
// TAB 8: CHAMELEON CHECK
// ============================================================
function ChameleonTab() {
  const { chameleonAnalysis, carrier, relatedCarriers } = useCarrierDataContext()
  return (
    <div className="space-y-6">
      {/* Main analysis panel */}
      <ChameleonAlert analysis={chameleonAnalysis} />

      {/* Educational context */}
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

      {/* Carrier identity snapshot */}
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
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// TAB 10: SAFETY IMPROVEMENT REPORT
// ============================================================

interface SafetyRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  impact: string
  timeline: string
  estimatedImprovement: string
}

function generateSafetyRecommendations(
  basicScores: ReturnType<typeof useCarrierDataContext>['basicScores'],
  basicAlerts: ReturnType<typeof useCarrierDataContext>['basicAlerts'],
  inspections: ReturnType<typeof useCarrierDataContext>['inspections'],
  crashes: ReturnType<typeof useCarrierDataContext>['crashes'],
  violationBreakdown: ReturnType<typeof useCarrierDataContext>['violationBreakdown'],
  carrier: ReturnType<typeof useCarrierDataContext>['carrier'],
  insurancePolicies: ReturnType<typeof useCarrierDataContext>['insurancePolicies'],
  insuranceGaps: ReturnType<typeof useCarrierDataContext>['insuranceGaps'],
  trucks: ReturnType<typeof useCarrierDataContext>['trucks'],
  healthCategories: ReturnType<typeof useCarrierDataContext>['healthCategories'],
): SafetyRecommendation[] {
  const recs: SafetyRecommendation[] = []
  let idx = 0

  // --- BASIC Score recommendations ---
  const basicThresholds: Record<string, { alert: boolean; field: string }> = {
    'Unsafe Driving': { alert: basicAlerts.unsafeDrivingAlert, field: 'unsafeDriving' },
    'Hours of Service': { alert: basicAlerts.hoursOfServiceAlert, field: 'hoursOfService' },
    'Driver Fitness': { alert: basicAlerts.driverFitnessAlert, field: 'driverFitness' },
    'Controlled Substances': { alert: basicAlerts.controlledSubstanceAlert, field: 'controlledSubstance' },
    'Vehicle Maintenance': { alert: basicAlerts.vehicleMaintenanceAlert, field: 'vehicleMaintenance' },
    'Hazardous Materials': { alert: basicAlerts.hazmatAlert, field: 'hazardousMaterials' },
    'Crash Indicator': { alert: basicAlerts.crashIndicatorAlert, field: '' },
  }

  for (const bs of basicScores) {
    const pct = bs.percentile ?? 0
    const info = basicThresholds[bs.name]
    if (!info) continue
    if (info.alert || pct >= 65) {
      const isCritical = pct >= 80 || info.alert
      const violationCount = info.field ? (violationBreakdown as any)[info.field] ?? 0 : 0

      const actionMap: Record<string, string> = {
        'Unsafe Driving': 'Implement driver coaching program focused on speeding, lane discipline, and distracted driving. Install dashcam/telematics to monitor driving behavior and provide real-time feedback.',
        'Hours of Service': 'Deploy ELD compliance auditing tools. Conduct weekly HOS log reviews with drivers. Train dispatchers on realistic scheduling that avoids pushing drivers past limits.',
        'Driver Fitness': 'Verify all CDL certifications and medical cards are current. Implement a pre-hire screening process with thorough MVR checks and drug testing protocols.',
        'Controlled Substances': 'Strengthen random drug/alcohol testing program beyond FMCSA minimums. Implement return-to-duty monitoring and a substance abuse awareness program.',
        'Vehicle Maintenance': 'Establish a preventive maintenance schedule for all units. Conduct weekly pre-trip/post-trip inspection audits. Address top vehicle OOS items: brakes, tires, lights, and coupling devices.',
        'Hazardous Materials': 'Ensure all HM drivers have current HazMat endorsements. Review shipping paper accuracy and placarding compliance. Conduct quarterly HM emergency response drills.',
        'Crash Indicator': 'Conduct post-crash root cause analysis for every incident. Implement defensive driving training. Consider DataQ challenges for any crashes where you were not at fault.',
      }

      recs.push({
        id: `basic-${idx++}`,
        priority: isCritical ? 'critical' : 'high',
        category: 'BASIC Score',
        title: `Reduce ${bs.name} Score (${pct}th percentile)`,
        description: actionMap[bs.name] || `Focus on reducing violations in the ${bs.name} category.`,
        impact: violationCount > 0 ? `${violationCount} violations recorded in this category` : `Percentile at ${pct}% — above intervention threshold`,
        timeline: isCritical ? 'Immediate — within 30 days' : 'Short-term — within 60 days',
        estimatedImprovement: `Could lower percentile by 10-25 points over 6 months with consistent effort`,
      })
    }
  }

  // --- Inspection OOS Rate recommendations ---
  const natDriverOOS = inspections.nationalDriverOOSRate || 5.51
  const natVehicleOOS = inspections.nationalVehicleOOSRate || 20.72
  if (inspections.driverOOSRate > natDriverOOS) {
    recs.push({
      id: `oos-driver-${idx++}`,
      priority: inspections.driverOOSRate > natDriverOOS * 2 ? 'critical' : 'high',
      category: 'Inspection Readiness',
      title: `Driver OOS Rate Above National Average (${inspections.driverOOSRate.toFixed(1)}% vs ${natDriverOOS.toFixed(1)}%)`,
      description: 'Ensure all drivers carry current CDL, medical certificates, and required endorsements. Conduct mock roadside inspections monthly. Review HOS logs for common errors before each trip.',
      impact: `${inspections.driverOOS} out of ${inspections.driverInspections} driver inspections resulted in OOS`,
      timeline: 'Short-term — within 30-60 days',
      estimatedImprovement: 'Reducing driver OOS rate to national average would improve Driver Fitness and HOS BASIC scores',
    })
  }
  if (inspections.vehicleOOSRate > natVehicleOOS) {
    recs.push({
      id: `oos-vehicle-${idx++}`,
      priority: inspections.vehicleOOSRate > natVehicleOOS * 1.5 ? 'critical' : 'high',
      category: 'Inspection Readiness',
      title: `Vehicle OOS Rate Above National Average (${inspections.vehicleOOSRate.toFixed(1)}% vs ${natVehicleOOS.toFixed(1)}%)`,
      description: 'Implement daily DVIR (Driver Vehicle Inspection Report) compliance checks. Focus on top OOS items: brake systems (adjustment & components), tires (tread depth & inflation), lighting, and cargo securement.',
      impact: `${inspections.vehicleOOS} out of ${inspections.vehicleInspections} vehicle inspections resulted in OOS`,
      timeline: 'Short-term — within 30-60 days',
      estimatedImprovement: 'Reducing vehicle OOS rate to national average would significantly improve Vehicle Maintenance BASIC',
    })
  }

  // --- Crash recommendations ---
  if (crashes.fatal > 0) {
    recs.push({
      id: `crash-fatal-${idx++}`,
      priority: 'critical',
      category: 'Crash Mitigation',
      title: `${crashes.fatal} Fatal Crash${crashes.fatal > 1 ? 'es' : ''} on Record`,
      description: 'Conduct thorough post-crash analysis. If the carrier was not at fault, file a DataQ challenge to request review. Implement advanced collision mitigation technology (automatic emergency braking, lane departure warning). Review and strengthen driver hiring standards.',
      impact: 'Fatal crashes heavily weight the Crash Indicator BASIC and trigger FMCSA scrutiny',
      timeline: 'Immediate — ongoing',
      estimatedImprovement: 'Successful DataQ challenges can remove non-preventable crashes from your record within 60-90 days',
    })
  }
  if (crashes.total > 3) {
    recs.push({
      id: `crash-freq-${idx++}`,
      priority: 'high',
      category: 'Crash Mitigation',
      title: `${crashes.total} Total Crashes in Recording Period`,
      description: 'Establish a crash review board that meets after every incident. Analyze patterns (time of day, routes, driver tenure). Invest in collision avoidance technology and require defensive driving courses for all drivers.',
      impact: `${crashes.injury} injury and ${crashes.towaway} towaway crashes recorded`,
      timeline: 'Short-term — implement within 30 days',
      estimatedImprovement: 'A 30% reduction in crash frequency can lower Crash Indicator BASIC by 15-20 percentile points',
    })
  }

  // --- Insurance recommendations ---
  if (insuranceGaps.length > 0) {
    const activeGaps = insuranceGaps.filter(g => !g.gapEnd || g.status === 'active')
    recs.push({
      id: `ins-gap-${idx++}`,
      priority: activeGaps.length > 0 ? 'critical' : 'medium',
      category: 'Insurance & Compliance',
      title: `${insuranceGaps.length} Insurance Coverage Gap${insuranceGaps.length > 1 ? 's' : ''} Detected`,
      description: activeGaps.length > 0
        ? 'You have active insurance coverage gaps. Contact your insurance provider immediately to restore coverage. Operating without valid insurance can result in authority revocation by FMCSA.'
        : 'Historical insurance gaps are on record. Ensure current policies are maintained without lapses. Set up automatic renewal reminders 60 days before expiration.',
      impact: activeGaps.length > 0 ? 'Active gap — authority at risk of revocation' : 'Historical gaps may concern potential buyers or partners',
      timeline: activeGaps.length > 0 ? 'Immediate' : 'Ongoing monitoring',
      estimatedImprovement: 'Maintaining continuous coverage improves carrier credibility and Insurance health score',
    })
  }

  // --- Safety Rating ---
  if (carrier.safetyRating === 'conditional' || carrier.safetyRating === 'unsatisfactory') {
    const ratingLabel = carrier.safetyRating === 'unsatisfactory' ? 'Unsatisfactory' : 'Conditional'
    recs.push({
      id: `rating-${idx++}`,
      priority: 'critical',
      category: 'Safety Rating',
      title: `${ratingLabel} Safety Rating — Upgrade Required`,
      description: carrier.safetyRating === 'unsatisfactory'
        ? 'An Unsatisfactory rating means FMCSA has found serious safety deficiencies. You must request a safety rating upgrade by demonstrating corrective actions. Contact your FMCSA Division Administrator to schedule a compliance review.'
        : 'A Conditional rating indicates FMCSA found safety management deficiencies. Address all identified issues and request a change of rating review. Focus on correcting the specific regulatory deficiencies cited in your compliance review report.',
      impact: carrier.safetyRating === 'unsatisfactory'
        ? 'Unsatisfactory-rated carriers face operating restrictions and cannot transport passengers or certain hazmat'
        : 'Conditional rating may limit contract opportunities and raises red flags for shippers',
      timeline: 'Immediate — begin corrective actions now',
      estimatedImprovement: 'Achieving Satisfactory rating adds +5 to your Safety health score and opens new business opportunities',
    })
  } else if (carrier.safetyRating === 'not-rated') {
    recs.push({
      id: `rating-none-${idx++}`,
      priority: 'medium',
      category: 'Safety Rating',
      title: 'No FMCSA Safety Rating on File',
      description: 'Request a voluntary compliance review from your FMCSA Division office. Having a Satisfactory safety rating on file demonstrates commitment to safety and can be a competitive advantage when bidding on contracts.',
      impact: 'Many shippers and brokers prefer carriers with a Satisfactory safety rating',
      timeline: 'Medium-term — within 90 days',
      estimatedImprovement: 'Obtaining a Satisfactory rating adds +5 to Safety health score',
    })
  }

  // --- Fleet age / maintenance ---
  const oldTrucks = trucks.filter(t => {
    return t.year > 0 && t.year < new Date().getFullYear() - 10
  })
  if (oldTrucks.length > 0 && trucks.length > 0) {
    const pct = Math.round((oldTrucks.length / trucks.length) * 100)
    if (pct >= 30) {
      recs.push({
        id: `fleet-age-${idx++}`,
        priority: 'medium',
        category: 'Fleet Health',
        title: `${pct}% of Fleet Over 10 Years Old (${oldTrucks.length} of ${trucks.length} units)`,
        description: 'Older equipment requires more frequent maintenance and is more likely to result in vehicle OOS violations. Consider a fleet renewal plan targeting the oldest units first. Increase inspection frequency for vehicles over 10 years old.',
        impact: 'Aging fleet directly correlates with higher Vehicle Maintenance BASIC scores',
        timeline: 'Long-term — phased replacement over 12-24 months',
        estimatedImprovement: 'Newer equipment typically reduces vehicle OOS rates by 15-30%',
      })
    }
  }

  // --- Low inspection volume ---
  if (inspections.totalInspections < 5 && inspections.totalInspections > 0) {
    recs.push({
      id: `insp-volume-${idx++}`,
      priority: 'low',
      category: 'Inspection Readiness',
      title: 'Low Inspection Volume — Limited Safety Data',
      description: 'With fewer than 5 inspections on record, BASIC scores are less statistically reliable but individual violations carry outsized weight. Ensure every inspection counts by maintaining pristine equipment and driver compliance.',
      impact: 'Each violation has a proportionally larger impact on your BASIC percentiles',
      timeline: 'Ongoing',
      estimatedImprovement: 'Clean inspections will steadily improve your BASIC positioning as data accumulates',
    })
  }

  // --- General health score recommendation ---
  const safetyCategory = healthCategories.find(c => c.name === 'Safety')
  if (safetyCategory && safetyCategory.score < 50) {
    recs.push({
      id: `health-safety-${idx++}`,
      priority: 'high',
      category: 'Overall Safety',
      title: `Safety Health Score Below 50 (${safetyCategory.score}/100)`,
      description: 'Your overall safety health score indicates significant room for improvement. Focus on the critical and high-priority recommendations above. Consider engaging a safety consultant or enrolling in FMCSA\'s Compliance, Safety, Accountability (CSA) program resources.',
      impact: 'Low safety scores reduce carrier attractiveness to shippers, brokers, and potential buyers',
      timeline: 'Ongoing — target measurable improvement within 6 months',
      estimatedImprovement: 'Addressing top 3 critical items typically improves overall safety score by 20-30 points',
    })
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recs
}

function SafetyImprovementReportTab() {
  const {
    basicScores, basicAlerts, inspections, crashes, violationBreakdown,
    carrier, insurancePolicies, insuranceGaps, trucks, healthCategories,
    violationTrend, crashRecords,
  } = useCarrierDataContext()

  const recommendations = useMemo(() => generateSafetyRecommendations(
    basicScores, basicAlerts, inspections, crashes, violationBreakdown,
    carrier, insurancePolicies, insuranceGaps, trucks, healthCategories,
  ), [basicScores, basicAlerts, inspections, crashes, violationBreakdown, carrier, insurancePolicies, insuranceGaps, trucks, healthCategories])

  const criticalCount = recommendations.filter(r => r.priority === 'critical').length
  const highCount = recommendations.filter(r => r.priority === 'high').length
  const mediumCount = recommendations.filter(r => r.priority === 'medium').length
  const lowCount = recommendations.filter(r => r.priority === 'low').length

  const overallGrade = criticalCount > 0 ? 'D' : highCount > 2 ? 'C' : highCount > 0 ? 'B' : recommendations.length === 0 ? 'A+' : 'A'
  const gradeColors: Record<string, string> = {
    'A+': 'from-emerald-400 to-emerald-600',
    'A': 'from-emerald-400 to-emerald-500',
    'B': 'from-blue-400 to-blue-600',
    'C': 'from-yellow-400 to-yellow-600',
    'D': 'from-red-400 to-red-600',
  }
  const gradeBg: Record<string, string> = {
    'A+': 'bg-emerald-50 border-emerald-200',
    'A': 'bg-emerald-50 border-emerald-200',
    'B': 'bg-blue-50 border-blue-200',
    'C': 'bg-yellow-50 border-yellow-200',
    'D': 'bg-red-50 border-red-200',
  }

  const priorityColors: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
    high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-200' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', border: 'border-yellow-200' },
    low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  }

  const [expandedRec, setExpandedRec] = useState<string | null>(null)

  // Violation trend direction
  const trendDirection = useMemo(() => {
    if (violationTrend.length < 3) return 'insufficient'
    const recent = violationTrend.slice(-3).reduce((s, v) => s + v.violations, 0)
    const earlier = violationTrend.slice(0, 3).reduce((s, v) => s + v.violations, 0)
    if (recent < earlier * 0.8) return 'improving'
    if (recent > earlier * 1.2) return 'worsening'
    return 'stable'
  }, [violationTrend])

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className={`rounded-2xl border p-6 ${gradeBg[overallGrade]}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-500" />
              Safety Improvement Report
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Actionable recommendations to improve {carrier.legalName || 'this carrier'}'s safety profile
            </p>
          </div>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColors[overallGrade]} flex items-center justify-center`}>
              <span className="text-2xl font-black text-white">{overallGrade}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Safety Grade</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-xl bg-white/70 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-xs text-gray-500 font-medium">Critical</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{highCount}</p>
            <p className="text-xs text-gray-500 font-medium">High Priority</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{mediumCount}</p>
            <p className="text-xs text-gray-500 font-medium">Medium</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{lowCount}</p>
            <p className="text-xs text-gray-500 font-medium">Low</p>
          </div>
        </div>
      </div>

      {/* Quick Safety Snapshot */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Safety Snapshot
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Safety Rating</p>
            <p className={`text-lg font-bold capitalize ${
              carrier.safetyRating === 'satisfactory' ? 'text-emerald-600' :
              carrier.safetyRating === 'conditional' ? 'text-yellow-600' :
              carrier.safetyRating === 'unsatisfactory' ? 'text-red-600' : 'text-gray-400'
            }`}>{carrier.safetyRating === 'not-rated' ? 'Not Rated' : carrier.safetyRating || 'Not Rated'}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Inspections (24 mo)</p>
            <p className="text-lg font-bold text-gray-900">{fmtNumber(inspections.totalInspections)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Total Crashes</p>
            <p className={`text-lg font-bold ${crashes.total > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {crashes.total}{crashes.fatal > 0 && <span className="text-sm font-normal text-red-500 ml-1">({crashes.fatal} fatal)</span>}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Driver OOS Rate</p>
            <p className={`text-lg font-bold ${inspections.driverOOSRate > (inspections.nationalDriverOOSRate || 5.51) ? 'text-red-600' : 'text-emerald-600'}`}>
              {inspections.driverOOSRate.toFixed(1)}%
              <span className="text-xs font-normal text-gray-400 ml-1">(nat'l avg {(inspections.nationalDriverOOSRate || 5.51).toFixed(1)}%)</span>
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Vehicle OOS Rate</p>
            <p className={`text-lg font-bold ${inspections.vehicleOOSRate > (inspections.nationalVehicleOOSRate || 20.72) ? 'text-red-600' : 'text-emerald-600'}`}>
              {inspections.vehicleOOSRate.toFixed(1)}%
              <span className="text-xs font-normal text-gray-400 ml-1">(nat'l avg {(inspections.nationalVehicleOOSRate || 20.72).toFixed(1)}%)</span>
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Violation Trend</p>
            <p className={`text-lg font-bold flex items-center gap-1 ${
              trendDirection === 'improving' ? 'text-emerald-600' :
              trendDirection === 'worsening' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trendDirection === 'improving' && <><TrendingDown className="w-5 h-5" /> Improving</>}
              {trendDirection === 'worsening' && <><TrendingUp className="w-5 h-5" /> Worsening</>}
              {trendDirection === 'stable' && 'Stable'}
              {trendDirection === 'insufficient' && 'Insufficient Data'}
            </p>
          </div>
        </div>
      </Card>

      {/* BASIC Scores Overview */}
      {basicScores.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            BASIC Score Risk Map
          </h3>
          <div className="space-y-3">
            {basicScores.map((bs, i) => {
              const isScored = bs.score != null
              const pct = bs.percentile ?? 0
              const isAboveThreshold = isScored && pct >= bs.threshold
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-40 text-sm font-medium text-gray-700 truncate">{bs.name}</div>
                  {isScored ? (
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= bs.threshold ? 'bg-red-500' : pct >= bs.threshold * 0.85 ? 'bg-orange-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                      {/* Threshold marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                        style={{ left: `${bs.threshold}%` }}
                        title={`Intervention threshold: ${bs.threshold}%`}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 h-6 bg-gray-50 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">Not Scored — Insufficient Data</span>
                    </div>
                  )}
                  <div className="w-16 text-right">
                    {isScored ? (
                      <span className={`text-sm font-bold ${
                        pct >= bs.threshold ? 'text-red-600' : pct >= bs.threshold * 0.85 ? 'text-orange-600' : 'text-emerald-600'
                      }`}>{pct}%</span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </div>
                  {isAboveThreshold && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
              )
            })}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-gray-800" /> = FMCSA intervention threshold
            </p>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-500" />
            Priority Action Plan
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{recommendations.length} items</span>
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const colors = priorityColors[rec.priority]
              const isExpanded = expandedRec === rec.id
              return (
                <motion.div
                  key={rec.id}
                  className={`rounded-xl border ${colors.border} overflow-hidden`}
                  layout
                >
                  <button
                    onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 ${colors.bg} hover:opacity-90 transition-opacity`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase ${colors.text}`}>{rec.priority}</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs font-medium text-gray-500">{rec.category}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{rec.title}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 space-y-3 bg-white">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">What to do</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{rec.description}</p>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Current Impact</p>
                              <p className="text-xs text-gray-700">{rec.impact}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Timeline</p>
                              <p className="text-xs text-gray-700">{rec.timeline}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Expected Improvement</p>
                              <p className="text-xs text-gray-700">{rec.estimatedImprovement}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </Card>
      ) : (
        <Card padding="md">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellent Safety Profile</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              This carrier meets or exceeds all safety benchmarks. No critical improvements needed at this time.
              Continue maintaining current safety practices and monitoring BASIC scores.
            </p>
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-600 mb-1">Disclaimer</p>
            <p>
              This Safety Improvement Report is generated based on publicly available FMCSA data and industry benchmarks.
              It is intended as guidance only and does not constitute legal or regulatory advice. Actual BASIC score
              improvements depend on many factors including inspection frequency, violation severity weighting, and
              the FMCSA Safety Measurement System methodology. Consult a qualified safety consultant or your FMCSA
              Division Administrator for specific compliance guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB 9: FULL REPORT
// ============================================================
function FullReportTab() {
  const { contactHistory: mockContactHistory, riskScoreTrend: mockRiskScoreTrend, vinInspections: mockVinInspections, monitoringAlerts: mockMonitoringAlerts, relatedCarriers: mockRelatedCarriers, percentiles: mockCarrierPercentiles } = useCarrierDataContext()
  return (
    <div className="space-y-6">
      {/* Contact & Entity History */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Contact & Entity History
        </h3>
        <AuthorityTimeline events={mockContactHistory.changes.map(c => ({
          date: c.date,
          event: `${c.field}: "${c.oldValue}" → "${c.newValue}"`,
          type: 'changed' as const,
          policyType: c.changeType,
        }))} />
      </Card>

      {/* VIN Inspection History */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-500" />
          VIN Inspection History
          {mockVinInspections.length > 0 && (
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{mockVinInspections.length} records</span>
          )}
        </h3>
        {mockVinInspections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">VIN</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Result</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Violations</th>
                </tr>
              </thead>
              <tbody>
                {mockVinInspections.map((insp, i) => {
                  const resultColors: Record<string, string> = {
                    pass: 'bg-emerald-50 text-emerald-700',
                    fail: 'bg-red-50 text-red-700',
                    oos: 'bg-red-50 text-red-700',
                    warning: 'bg-yellow-50 text-yellow-700',
                  }
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{insp.vin}</td>
                      <td className="py-2 px-3 text-gray-600">{safeFmtDate(insp.date)}</td>
                      <td className="py-2 px-3 text-gray-600">{insp.location}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{insp.type}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${resultColors[insp.result]}`}>{insp.result}</span>
                      </td>
                      <td className="py-2 px-3 text-center">{insp.violations}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No VIN-level inspection data available for this carrier</p>
          </div>
        )}
      </Card>

      {/* Carrier Monitoring */}
      <MonitoringAlerts alerts={mockMonitoringAlerts} />

      {/* Related Carriers */}
      <RelatedCarriers carriers={mockRelatedCarriers} />
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function MCDetailPageV2() {
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()
  const { id } = useParams()
  const { isAuthenticated, user, isIdentityVerified, isLoading: authLoading } = useAuth()
  const { listing, loading, error, isUnlocked, unlocking, unlock } = useListing(id)

  // Check if current user is the listing owner (seller viewing their own listing)
  const isListingOwner = listing?.sellerId === user?.id || listing?.isOwner

  // Preview mode: logged in but not identity verified (admins, sellers, and listing owners bypass)
  const isPreviewMode = isAuthenticated && !isIdentityVerified && user?.role !== 'admin' && user?.role !== 'seller' && !isListingOwner

  // Mark non-overview tabs as locked until listing is unlocked (admins and listing owners bypass)
  const canAccessAllTabs = isUnlocked || user?.role === 'admin' || isListingOwner
  const visibleTabs = tabs.map(t => ({
    ...t,
    locked: !canAccessAllTabs && t.id !== 'overview',
  }))

  // Use real DOT number for API calls (backend provides _realDotNumber when dotNumber is masked)
  const carrierDotNumber = listing?._realDotNumber || listing?.dotNumber

  // Carrier intelligence data from MorPro API
  const { carrierReport, loading: carrierLoading, error: carrierError } = useCarrierData(
    USE_MOCK ? undefined : carrierDotNumber
  )

  // FMCSA data (source of truth for BASIC scores, cargo, authority, insurance)
  const [smsData, setSmsData] = useState<FMCSASMSData | null>(null)
  const [fmcsaCargoTypes, setFmcsaCargoTypes] = useState<string[]>([])
  const [fmcsaAuthority, setFmcsaAuthority] = useState<FMCSAAuthorityHistory | null>(null)
  const [fmcsaInsurance, setFmcsaInsurance] = useState<FMCSAInsuranceHistory[] | null>(null)
  const fmcsaFetchedRef = useRef<string | null>(null)
  useEffect(() => {
    const dot = carrierDotNumber?.replace(/\D/g, '')
    if (!dot || USE_MOCK) return
    if (fmcsaFetchedRef.current === dot) return
    fmcsaFetchedRef.current = dot
    // Fetch SMS + cargo + authority + insurance in parallel
    api.fmcsaGetSMSData(dot)
      .then(res => { if (res.success && res.data) setSmsData(res.data) })
      .catch(() => {})
    api.fmcsaGetCargoCarried(dot)
      .then(res => { if (res.success && res.data) setFmcsaCargoTypes(res.data) })
      .catch(() => {})
    api.fmcsaGetAuthorityHistory(dot)
      .then(res => { if (res.success && res.data) setFmcsaAuthority(res.data) })
      .catch(() => {})
    api.fmcsaGetInsuranceHistory(dot)
      .then(res => { if (res.success && res.data) setFmcsaInsurance(res.data) })
      .catch(() => {})
  }, [carrierDotNumber])

  // Map API data to V2 interfaces (memoized)
  const carrierDataCtx = useMemo<CarrierDataContextType>(() => {
    // Use mock/fallback data only if env var is set
    if (USE_MOCK) {
      return {
        carrier: fallbackCarrier,
        authority: fallbackAuthority,
        authorityHistory: fallbackAuthorityHistory,
        authorityPending: fallbackAuthorityPending,
        basicScores: fallbackBasicScores,
        basicAlerts: fallbackBasicAlerts,
        violationBreakdown: fallbackViolationBreakdown,
        issData: fallbackISSData,
        inspections: fallbackInspections,
        inspectionRecords: fallbackInspectionRecords,
        operations: fallbackOperations,
        violationTrend: fallbackViolationTrend,
        crashes: fallbackCrashes,
        crashRecords: fallbackCrashRecords,
        insurancePolicies: fallbackInsurancePolicies,
        renewalTimeline: fallbackRenewalTimeline,
        policyHistory: fallbackPolicyHistory,
        insuranceGaps: fallbackInsuranceGaps,
        trucks: fallbackTrucks,
        trailers: fallbackTrailers,
        sharedEquipment: fallbackSharedEquipment,
        cargoCapabilities: fallbackCargoCapabilities,
        documents: fallbackDocuments,
        verificationChecks: fallbackVerificationChecks,
        availableDocuments: fallbackAvailableDocuments,
        complianceFinancials: fallbackComplianceFinancials,
        relatedCarriers: fallbackRelatedCarriers,
        percentiles: fallbackCarrierPercentiles,
        monitoringAlerts: fallbackMonitoringAlerts,
        riskScoreTrend: fallbackRiskScoreTrend,
        contactHistory: fallbackContactHistory,
        vinInspections: fallbackVinInspections,
        networkSignals: fallbackNetworkSignals,
        benchmarks: fallbackBenchmarks,
        chameleonAnalysis: { riskScore: 0, riskLevel: 'none', flags: [], summary: '', relatedRevokedCarriers: [], linkedCarriers: [] },
        healthCategories: [],
        smsSnapshotDate: null,
        carrierLoading: false,
        carrierError: null,
      }
    }

    // Real data mode — pass loading/error state through so components can show skeletons
    if (!carrierReport || !listing) {
      return {
        carrier: fallbackCarrier,
        authority: fallbackAuthority,
        authorityHistory: [],
        authorityPending: fallbackAuthorityPending,
        // No MorPro report — show ONLY real data. Never fabricate safety/inspection
        // numbers: use honest-empty mappers (zeros / "Not Scored") so a carrier with
        // no FMCSA history reads as N/A, not as a fake risky record. SMS data is
        // independent of the MorPro report, so surface it when it loaded.
        basicScores: smsData ? mapSMSToV2BasicScores(smsData) : mapToV2BasicScores({}),
        basicAlerts: mapToV2BasicAlerts({}, smsData),
        violationBreakdown: mapToV2ViolationBreakdown({}),
        issData: mapToV2ISSData({}),
        inspections: mapToV2InspectionSummary({}, smsData),
        inspectionRecords: [],
        operations: mapToV2Operations({}),
        violationTrend: [],
        crashes: mapToV2CrashData({}, smsData),
        crashRecords: [],
        insurancePolicies: [],
        renewalTimeline: [],
        policyHistory: [],
        insuranceGaps: [],
        trucks: [],
        trailers: [],
        sharedEquipment: fallbackSharedEquipment,
        cargoCapabilities: fallbackCargoCapabilities,
        documents: [],
        verificationChecks: [],
        availableDocuments: [],
        complianceFinancials: fallbackComplianceFinancials,
        relatedCarriers: [],
        percentiles: [],
        monitoringAlerts: [],
        riskScoreTrend: [],
        contactHistory: fallbackContactHistory,
        vinInspections: [],
        networkSignals: [],
        benchmarks: [],
        chameleonAnalysis: { riskScore: 0, riskLevel: 'none', flags: [], summary: '', relatedRevokedCarriers: [], linkedCarriers: [] },
        healthCategories: [],
        smsSnapshotDate: null,
        carrierLoading,
        carrierError,
      }
    }

    // Map real API data
    const healthResult = calculateCarrierHealthScore(carrierReport, listing, smsData)

    // FMCSA insurance override — detect pending cancellation that MorPro may miss
    const carrierData = mapToV2CarrierData(carrierReport, listing)
    if (fmcsaInsurance && fmcsaInsurance.length > 0) {
      const hasPendingCancel = fmcsaInsurance.some(p =>
        p.cancellationDate && new Date(p.cancellationDate) > new Date() &&
        String(p.status || '').toLowerCase() !== 'cancelled'
      )
      const allCancelled = fmcsaInsurance.every(p =>
        String(p.status || '').toLowerCase() === 'cancelled' ||
        (p.cancellationDate && new Date(p.cancellationDate) <= new Date())
      )
      if (hasPendingCancel) carrierData.insuranceStatus = 'pending'
      else if (allCancelled) carrierData.insuranceStatus = 'expired'
    }

    return {
      carrier: carrierData,
      authority: mapToV2AuthorityData(carrierReport, fmcsaAuthority),
      authorityHistory: mapToV2AuthorityHistory(carrierReport),
      authorityPending: mapToV2AuthorityPending(carrierReport),
      // MorPro first, FMCSA SMS fills gaps
      basicScores: smsData ? mapSMSToV2BasicScores(smsData, carrierReport) : mapToV2BasicScores(carrierReport),
      basicAlerts: mapToV2BasicAlerts(carrierReport, smsData),
      violationBreakdown: mapToV2ViolationBreakdown(carrierReport),
      issData: mapToV2ISSData(carrierReport),
      inspections: mapToV2InspectionSummary(carrierReport, smsData),
      inspectionRecords: mapToV2InspectionRecords(carrierReport),
      operations: mapToV2Operations(carrierReport),
      violationTrend: mapToV2ViolationTrend(carrierReport),
      crashes: mapToV2CrashData(carrierReport, smsData),
      crashRecords: mapToV2CrashRecords(carrierReport),
      insurancePolicies: mapToV2InsurancePolicies(carrierReport),
      renewalTimeline: mapToV2RenewalTimeline(carrierReport),
      policyHistory: mapToV2PolicyHistory(carrierReport),
      insuranceGaps: mapToV2InsuranceGaps(carrierReport),
      trucks: mapToV2Trucks(carrierReport),
      trailers: mapToV2Trailers(carrierReport),
      sharedEquipment: mapToV2SharedEquipment(carrierReport),
      cargoCapabilities: mapToV2CargoCapabilities(carrierReport, fmcsaCargoTypes),
      documents: mapToV2Documents(carrierReport),
      verificationChecks: mapToV2VerificationChecks(carrierReport),
      availableDocuments: mapToV2AvailableDocuments(carrierReport),
      complianceFinancials: mapToV2ComplianceFinancials(listing, carrierReport),
      relatedCarriers: mapToV2RelatedCarriers(carrierReport),
      percentiles: mapToV2Percentiles(carrierReport),
      monitoringAlerts: mapToV2MonitoringAlerts(carrierReport),
      riskScoreTrend: mapToV2RiskScoreTrend(carrierReport),
      contactHistory: mapToV2ContactHistory(carrierReport),
      vinInspections: mapToV2VinInspections(carrierReport),
      networkSignals: mapToV2NetworkSignals(carrierReport, listing),
      benchmarks: mapToV2Benchmarks(carrierReport, smsData),
      chameleonAnalysis: detectChameleonCarrier(carrierReport, listing),
      healthCategories: healthResult.categories,
      smsSnapshotDate: smsData?.snapshotDate || null,
      carrierLoading: false,
      carrierError: null,
    }
  }, [carrierReport, listing, carrierLoading, carrierError, smsData, fmcsaCargoTypes, fmcsaAuthority, fmcsaInsurance])

  // Credits
  const userCredits = user?.totalCredits ? (user.totalCredits - (user.usedCredits || 0)) : 0

  // Subscription plan
  const [buyerPlan, setBuyerPlan] = useState<string | null>(null)
  useEffect(() => {
    if (user?.role !== 'buyer') return
    let active = true
    api.getSubscription().then((res) => {
      if (active) setBuyerPlan(res.data?.subscription?.plan || null)
    }).catch(() => { if (active) setBuyerPlan(null) })
    return () => { active = false }
  }, [user?.role])

  // Premium request state
  const isPremiumListing = listing?.isPremium || listing?.isVip || false
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumRequestSent, setPremiumRequestSent] = useState(false)
  const [premiumMessage, setPremiumMessage] = useState('')
  const [sendingPremiumRequest, setSendingPremiumRequest] = useState(false)

  // Terms state
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [termsSignature, setTermsSignature] = useState('')
  const [acceptingTerms, setAcceptingTerms] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)

  // Contact state
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  const [sendingInquiry, setSendingInquiry] = useState(false)

  // Offer state
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showBuyNowModal, setShowBuyNowModal] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [buyNowMessage, setBuyNowMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [submittingBuyNow, setSubmittingBuyNow] = useState(false)
  const [offerSuccess, setOfferSuccess] = useState(false)
  const [buyNowSuccess, setBuyNowSuccess] = useState(false)

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Not authenticated — show auth prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Card padding="lg">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
              <p className="text-gray-500 mb-6">Create an account or sign in to view MC authority listings.</p>
              <div className="space-y-3">
                <Link to="/login"><Button fullWidth><Lock className="w-4 h-4 mr-2" />Sign In</Button></Link>
                <Link to="/register"><Button fullWidth variant="secondary">Create Account</Button></Link>
              </div>
              <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4">
                <ArrowLeft className="w-4 h-4" />Back to Marketplace
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading listing details...</p>
        </div>
      </div>
    )
  }

  // VIP listing — buyer does not have Enterprise/VIP subscription
  if (error === 'ENTERPRISE_REQUIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Card padding="lg">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">VIP Listing</h1>
              <p className="text-gray-500 mb-6">
                This is an exclusive VIP listing. Upgrade to an <span className="font-semibold text-amber-600">Enterprise</span> or <span className="font-semibold text-amber-600">VIP Access</span> plan to view VIP listings.
              </p>
              <div className="space-y-3">
                <Link to="/buyer/subscription">
                  <Button fullWidth className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade Your Plan
                  </Button>
                </Link>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Generic error state
  if (error && !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Card padding="lg">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Listing</h1>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={() => navigate('/marketplace')}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ---- Handlers ----
  const handleUnlockWithCredit = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (user?.role !== 'buyer') return
    if (userCredits < 1) { navigate('/buyer/subscription'); return }
    try { await unlock() } catch (err: any) {
      console.error('Failed to unlock listing:', err)
      alert(err.message || 'Failed to unlock listing. Please try again.')
    }
  }

  const handlePremiumRequest = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setShowTermsModal(true)
  }

  const handleAcceptTerms = async () => {
    if (!termsSignature.trim() || termsSignature.trim().length < 2) {
      alert('Please enter your full name to sign the terms.'); return
    }
    try {
      setAcceptingTerms(true)
      const statusResponse = await api.getTermsStatus()
      if (!statusResponse.data.hasAccepted) await api.acceptTerms(termsSignature.trim())
      setShowTermsModal(false)
      setTermsSignature('')
      setHasReadTerms(false)
      setShowPremiumModal(true)
    } catch (err: any) {
      console.error('Failed to accept terms:', err)
      alert(err.message || 'Failed to accept terms. Please try again.')
    } finally { setAcceptingTerms(false) }
  }

  const handleSubmitPremiumRequest = async () => {
    if (!listing) return
    if (buyerPlan === 'starter') { setShowPremiumModal(false); setShowUpgradeModal(true); return }
    try {
      setSendingPremiumRequest(true)
      const message = premiumMessage.trim() || 'Interested in this premium MC authority.'
      const response = await api.createPremiumRequest(listing.id, message)
      setShowPremiumModal(false)
      setPremiumMessage('')
      if (response.data?.status === 'COMPLETED') window.location.reload()
      else setPremiumRequestSent(true)
    } catch (err: any) {
      console.error('Failed to submit premium request:', err)
      alert(err.message || 'Failed to submit request. Please try again.')
    } finally { setSendingPremiumRequest(false) }
  }

  const handleContactClick = () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setShowContactModal(true)
  }

  const handleSubmitContact = async () => {
    if (!listing) return
    try {
      setSendingInquiry(true)
      await api.sendInquiryToAdmin(listing.id, contactMessage.trim(), contactPhone.trim() || undefined)
      setMessageSent(true)
      setShowContactModal(false)
      setContactMessage('')
      setContactPhone('')
    } catch (err: any) {
      console.error('Failed to send inquiry:', err)
      alert(err.message || 'Failed to send message. Please try again.')
    } finally { setSendingInquiry(false) }
  }

  const handleSubmitOffer = async () => {
    if (!listing || !offerAmount) return
    setSubmittingOffer(true); setOfferSuccess(false)
    try {
      await api.createOffer({ listingId: listing.id, amount: parseFloat(offerAmount), message: offerMessage || 'I am interested in purchasing this MC authority.' })
      setOfferSuccess(true)
      setTimeout(() => { setShowOfferModal(false); setOfferAmount(''); setOfferMessage(''); setOfferSuccess(false) }, 2000)
    } catch (err: any) { alert(err.message || 'Failed to submit offer.') }
    finally { setSubmittingOffer(false) }
  }

  const handleBuyNow = async () => {
    if (!listing) return
    setSubmittingBuyNow(true); setBuyNowSuccess(false)
    try {
      const price = listing.listingPrice || listing.askingPrice || (listing as any).price || 0
      await api.createOffer({ listingId: listing.id, amount: price, message: buyNowMessage || 'I want to buy this MC at the listed price.', isBuyNow: true })
      setBuyNowSuccess(true)
      setTimeout(() => { setShowBuyNowModal(false); setBuyNowMessage(''); setBuyNowSuccess(false) }, 2000)
    } catch (err: any) { alert(err.message || 'Failed to submit offer.') }
    finally { setSubmittingBuyNow(false) }
  }

  const listingPrice = listing ? (listing.listingPrice || listing.askingPrice || (listing as any).price || 0) : 0

  const showSkeleton = !USE_MOCK && carrierLoading && !carrierReport

  const tabContent: Record<string, JSX.Element> = {
    overview: showSkeleton ? <CarrierLoadingSkeleton /> : <OverviewTab />,
    authority: showSkeleton ? <CarrierLoadingSkeleton /> : <AuthorityTab />,
    safety: showSkeleton ? <CarrierLoadingSkeleton /> : <SafetyTab />,
    insurance: showSkeleton ? <CarrierLoadingSkeleton /> : <InsuranceTab />,
    fleet: showSkeleton ? <CarrierLoadingSkeleton /> : <FleetTab />,
    credit: showSkeleton ? <CarrierLoadingSkeleton /> : <CreditReportTab />,
    chameleon: showSkeleton ? <CarrierLoadingSkeleton /> : <ChameleonTab />,
    'safety-improvement': showSkeleton ? <CarrierLoadingSkeleton /> : <SafetyImprovementReportTab />,
  }

  return (
    <CarrierDataContext.Provider value={carrierDataCtx}>
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>
      </div>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="max-w-7xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <Eye className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold text-amber-800">Preview Mode</span>
              <span className="text-sm text-amber-600 ml-1">— Buy a subscription to see full listing details.</span>
            </div>
            <Link to="/buyer/subscription">
              <Button size="sm" variant="secondary">
                <CreditCard className="w-3.5 h-3.5 mr-1" />Buy Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <HeroHeader unlocked={!!canAccessAllTabs} authorityType={(listing as any)?.authorityType} />

      {/* Trucks included in the sale (shown if seller attached any) */}
      <SellerTrucksSection
        trucks={(listing as any)?.trucks}
        isUnlocked={!!canAccessAllTabs}
      />

      {/* Tab Navigation */}
      <TabNav tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content + Action Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {!canAccessAllTabs && activeTab !== 'overview' ? (
                  <LockedTabOverlay
                    tabLabel={tabs.find(t => t.id === activeTab)?.label || ''}
                    isAuthenticated={isAuthenticated}
                    isPremium={isPremiumListing}
                    freeToUnlock={listing?.freeToUnlock}
                    userCredits={userCredits}
                    unlocking={unlocking}
                    userRole={user?.role}
                    onUnlock={handleUnlockWithCredit}
                    onPremiumRequest={handlePremiumRequest}
                    onNavigate={navigate}
                  />
                ) : tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Sidebar - desktop only */}
          <div className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="sticky top-32 space-y-4">
              {/* Contact Representative */}
              <Card padding="md">
                <h3 className="text-base font-bold mb-3">Contact Representative</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">D</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Domilea Representative</div>
                    <div className="text-xs text-gray-500">Domilea Team</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Verified Team Member</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Our team assists with pricing, documentation, and transfer.
                  </p>
                </div>
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response Time</span>
                    <span className="font-semibold">Within 24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability</span>
                    <span className="font-semibold">Mon-Fri 9am-6pm</span>
                  </div>
                </div>

                {isPremiumListing ? (
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-yellow-700">Premium Listing</div>
                        <p className="text-xs text-yellow-600">Use "Unlock Premium MC" below to request access.</p>
                      </div>
                    </div>
                  </div>
                ) : messageSent ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-emerald-700">Message Sent!</div>
                  </div>
                ) : (
                  <Button fullWidth size="sm" onClick={handleContactClick}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                )}
              </Card>

              {/* Credits & Actions Card */}
              <Card padding="md">
                {isPreviewMode ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-gray-900">Subscription Required</span>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center mb-3">
                      <CreditCard className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 mb-1">Preview Mode</div>
                      <div className="text-xs text-gray-500 mb-1">Buy a subscription to see full listing details, make offers, and purchase.</div>
                    </div>
                    <Link to="/buyer/subscription">
                      <Button fullWidth>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-400 text-center mt-2">Choose a plan that fits your needs</p>
                  </>
                ) : isPremiumListing && !isUnlocked ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-yellow-600">Premium Listing</span>
                    </div>
                    {premiumRequestSent ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <div className="font-bold text-emerald-700">Request Submitted!</div>
                        <div className="text-xs text-gray-500 mt-1">Our team will review and contact you within 24-48 hours.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          fullWidth
                          onClick={handlePremiumRequest}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Unlock Premium MC
                        </Button>
                        <p className="text-xs text-gray-400 text-center">Reviewed by admin within 24-48 hours</p>
                      </div>
                    )}
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="w-5 h-5 text-indigo-500" />
                      <span className="font-semibold text-gray-900">Sign in to Unlock</span>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center mb-3">
                      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <div className="font-bold text-gray-900 mb-1">Unlock Full Details</div>
                      <div className="text-xs text-gray-500 mb-3">Sign in to unlock this MC listing and view all details.</div>
                      <div className="text-xl font-bold text-indigo-600">1 Credit</div>
                    </div>
                    <div className="space-y-2">
                      <Link to="/login"><Button fullWidth><Lock className="w-4 h-4 mr-2" />Sign In to Unlock</Button></Link>
                      <Link to="/register"><Button fullWidth variant="secondary">Create Account</Button></Link>
                    </div>
                  </>
                ) : user?.role === 'buyer' ? (
                  <>
                    {/* Credit display */}
                    <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 -mx-6 -mt-6 px-6 pt-4 pb-3 border-b border-yellow-100">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900">Your Credits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-yellow-500">{userCredits}</span>
                        <span className="text-xs text-gray-500">remaining</span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <Unlock className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                          <div className="text-sm font-bold text-emerald-700">MC Unlocked!</div>
                          <div className="text-xs text-emerald-600">Full details are now visible</div>
                        </div>

                        <Button
                          fullWidth
                          onClick={() => { setBuyNowMessage(''); setShowBuyNowModal(true) }}
                          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now at {fmtCurrency(listingPrice)}
                        </Button>

                        <Button
                          fullWidth
                          variant="secondary"
                          onClick={() => { setOfferAmount(listingPrice.toString()); setOfferMessage(''); setShowOfferModal(true) }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Place an Offer
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {listing?.freeToUnlock ? (
                          <Button
                            fullWidth
                            onClick={handleUnlockWithCredit}
                            disabled={unlocking}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                          >
                            {unlocking ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</>
                            ) : (
                              <><Unlock className="w-4 h-4 mr-2" />Unlock Free</>
                            )}
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            onClick={handleUnlockWithCredit}
                            disabled={userCredits < 1 || unlocking}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          >
                            {unlocking ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Unlocking...</>
                            ) : (
                              <><Unlock className="w-4 h-4 mr-2" />Unlock Full MC with 1 Credit</>
                            )}
                          </Button>
                        )}

                        {!listing?.freeToUnlock && user?.totalCredits === 0 ? (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                            <p className="text-xs text-red-600 mb-2">You don't have a subscription yet</p>
                            <Link to="/buyer/subscription">
                              <Button size="sm" fullWidth><CreditCard className="w-4 h-4 mr-2" />Get Subscription</Button>
                            </Link>
                          </div>
                        ) : userCredits < 1 ? (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                            <p className="text-xs text-red-600 mb-2">You're out of credits!</p>
                            <Link to="/buyer/subscription">
                              <Button size="sm" fullWidth><CreditCard className="w-4 h-4 mr-2" />Buy More Credits</Button>
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Buyer accounts can unlock MC listings.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-lg">
        {isPreviewMode ? (
          <Link to="/buyer/subscription" className="w-full">
            <Button fullWidth size="sm">
              <CreditCard className="w-4 h-4 mr-1" />Buy Subscription to Unlock
            </Button>
          </Link>
        ) : isPremiumListing && !isUnlocked ? (
          <div className="flex gap-3">
            {isAuthenticated && user?.role === 'buyer' && (
              <Link to="/buyer/subscription" className="flex-1">
                <Button variant="secondary" fullWidth size="sm">
                  <Coins className="w-4 h-4 mr-1" />
                  {user.totalCredits === 0 ? 'Subscribe' : userCredits < 1 ? 'Credits' : `${userCredits} Credits`}
                </Button>
              </Link>
            )}
            {premiumRequestSent ? (
              <div className="flex-[2] flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Request Sent</span>
              </div>
            ) : (
              <Button
                className="flex-[2] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                onClick={handlePremiumRequest}
                size="sm"
              >
                <Crown className="w-4 h-4 mr-1" />
                Unlock Premium MC
              </Button>
            )}
          </div>
        ) : !isAuthenticated ? (
          <div className="flex gap-3">
            <Link to="/register" className="flex-1"><Button variant="secondary" fullWidth size="sm">Sign Up</Button></Link>
            <Link to="/login" className="flex-[2]"><Button fullWidth size="sm"><Lock className="w-4 h-4 mr-1" />Sign In to Unlock</Button></Link>
          </div>
        ) : user?.role === 'buyer' ? (
          isUnlocked ? (
            <div className="flex gap-2">
              <Button
                variant="secondary" size="sm" className="flex-1"
                onClick={() => { setOfferAmount(listingPrice.toString()); setOfferMessage(''); setShowOfferModal(true) }}
              >
                <Send className="w-4 h-4 mr-1" />Offer
              </Button>
              <Button
                size="sm" className="flex-[2] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                onClick={() => { setBuyNowMessage(''); setShowBuyNowModal(true) }}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />Buy Now
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/buyer/subscription" className="flex-1">
                <Button variant="secondary" fullWidth size="sm">
                  <Coins className="w-4 h-4 mr-1" />
                  {user?.totalCredits === 0 ? 'Subscribe' : userCredits < 1 ? 'Credits' : `${userCredits}`}
                </Button>
              </Link>
              {user?.totalCredits === 0 || userCredits < 1 ? (
                <Link to="/buyer/subscription" className="flex-[2]">
                  <Button fullWidth size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500">
                    <CreditCard className="w-4 h-4 mr-1" />{user?.totalCredits === 0 ? 'Get Subscription' : 'Buy Credits'}
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm" className="flex-[2] bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={handleUnlockWithCredit}
                  disabled={unlocking}
                >
                  {unlocking ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Unlocking...</> : <><Unlock className="w-4 h-4 mr-1" />Unlock (1 Credit)</>}
                </Button>
              )}
            </div>
          )
        ) : null}
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 -m-6 mb-6 p-6 border-b border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Terms of Service</h3>
                        <p className="text-xs text-gray-300">Please read and sign to continue</p>
                      </div>
                    </div>
                    <button onClick={() => setShowTermsModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div
                    className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-xl border text-sm text-gray-700"
                    onScroll={(e) => {
                      const t = e.target as HTMLDivElement
                      if (t.scrollHeight - t.scrollTop <= t.clientHeight + 50) setHasReadTerms(true)
                    }}
                  >
                    <h4 className="font-bold mb-2">MC Authority Transfer Terms</h4>
                    <p className="mb-2">By proceeding with this premium MC authority request, you acknowledge and agree to the following terms:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                      <li>All MC authority transfers are subject to FMCSA regulations and approval.</li>
                      <li>Domilea acts as a marketplace facilitator and does not guarantee transfer completion.</li>
                      <li>Pricing is subject to negotiation between buyer and seller.</li>
                      <li>Due diligence is the responsibility of both parties.</li>
                      <li>All deposits and payments are handled through our secure escrow system.</li>
                      <li>Transfer timelines vary based on FMCSA processing and insurance requirements.</li>
                      <li>Buyer is responsible for meeting all regulatory requirements post-transfer.</li>
                      <li>Cancellation policies apply as outlined in the purchase agreement.</li>
                    </ul>
                    <p className="mb-2">By signing below, you confirm that you have read, understood, and agree to these terms. You also confirm that you are authorized to enter into this agreement.</p>
                    <p className="text-xs text-gray-400">Last updated: January 2025. For questions, contact our team.</p>
                  </div>
                  {!hasReadTerms && (
                    <p className="text-xs text-yellow-600 text-center">Please scroll through the terms to continue.</p>
                  )}
                  {hasReadTerms && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <label className="block text-sm font-semibold text-gray-900 mb-1">Electronic Signature</label>
                      <p className="text-xs text-gray-600 mb-2">Type your full name to sign.</p>
                      <input
                        type="text" placeholder="Type your full legal name" value={termsSignature}
                        onChange={(e) => setTermsSignature(e.target.value)}
                        className="w-full px-4 py-2.5 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-serif italic"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Button fullWidth variant="outline" onClick={() => setShowTermsModal(false)}>Cancel</Button>
                    <Button fullWidth onClick={handleAcceptTerms} disabled={!hasReadTerms || termsSignature.trim().length < 2 || acceptingTerms} className="bg-emerald-600 hover:bg-emerald-700">
                      {acceptingTerms ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing...</> : <><CheckCircle className="w-4 h-4 mr-2" />Sign & Accept</>}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Request Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md" onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 -m-6 mb-6 p-6 border-b border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Premium MC Request</h3>
                        <p className="text-xs text-gray-500">MC Authority Inquiry</p>
                      </div>
                    </div>
                    <button onClick={() => setShowPremiumModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">Important:</span> Your request must be reviewed and approved by our admin team first. Credits will only be charged upon approval.
                    </p>
                  </div>
                  <Textarea label="Message to Admin (Optional)" placeholder="Tell us about your business needs..." value={premiumMessage} onChange={(e) => setPremiumMessage(e.target.value)} rows={3} />
                  <div className="flex gap-3 pt-2">
                    <Button fullWidth variant="outline" onClick={() => setShowPremiumModal(false)}>Cancel</Button>
                    <Button fullWidth onClick={handleSubmitPremiumRequest} disabled={sendingPremiumRequest} className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      {sendingPremiumRequest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Submit Request</>}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md" onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 -m-6 mb-6 p-6 border-b border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Contact Us</h3>
                        <p className="text-xs text-gray-500">MC Authority Inquiry</p>
                      </div>
                    </div>
                    <button onClick={() => setShowContactModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Send a message about this MC authority. We'll respond within 24 hours.</p>
                  <Input label="Phone Number (Optional)" type="tel" placeholder="(555) 555-5555" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  <Textarea label="Your Message" placeholder="I'm interested in this MC authority..." value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} required />
                  <div className="flex gap-3 pt-2">
                    <Button fullWidth variant="outline" onClick={() => setShowContactModal(false)}>Cancel</Button>
                    <Button fullWidth onClick={handleSubmitContact} disabled={!contactMessage.trim() || sendingInquiry}>
                      {sendingInquiry ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Message</>}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && listing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 -m-6 mb-6 p-6 border-b border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Place an Offer</h3>
                        <p className="text-xs text-gray-500">MC #{listing.mcNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowOfferModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                {offerSuccess ? (
                  <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Offer Submitted!</h3>
                    <p className="text-sm text-gray-600">Admin will review your offer and contact you shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="font-semibold text-gray-900 text-sm">{listing.title}</div>
                      <div className="text-xs text-gray-500">Listed at {fmtCurrency(listingPrice)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Offer Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" placeholder="Enter amount" />
                      </div>
                    </div>
                    <Textarea label="Message (Optional)" placeholder="Add a message about your offer..." value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} rows={3} />
                    <div className="flex gap-3 pt-2">
                      <Button fullWidth variant="outline" onClick={() => setShowOfferModal(false)}>Cancel</Button>
                      <Button fullWidth onClick={handleSubmitOffer} disabled={!offerAmount || submittingOffer}>
                        {submittingOffer ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" />Submit Offer</>}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Now Modal */}
      <AnimatePresence>
        {showBuyNowModal && listing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBuyNowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md" onClick={(e) => e.stopPropagation()}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 -m-6 mb-6 p-6 border-b border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Buy Now</h3>
                        <p className="text-xs text-gray-500">MC #{listing.mcNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowBuyNowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                {buyNowSuccess ? (
                  <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Purchase Submitted!</h3>
                    <p className="text-sm text-gray-600">Admin will finalize the transaction and contact you shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-sm text-gray-500 mb-1">Purchase Price</div>
                      <div className="text-3xl font-bold text-gray-900">{fmtCurrency(listingPrice)}</div>
                    </div>
                    <Textarea label="Message (Optional)" placeholder="Any notes about your purchase..." value={buyNowMessage} onChange={(e) => setBuyNowMessage(e.target.value)} rows={3} />
                    <div className="flex gap-3 pt-2">
                      <Button fullWidth variant="outline" onClick={() => setShowBuyNowModal(false)}>Cancel</Button>
                      <Button fullWidth onClick={handleBuyNow} disabled={submittingBuyNow} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                        {submittingBuyNow ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><ShoppingCart className="w-4 h-4 mr-2" />Confirm Purchase</>}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Required Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}
            >
              <Card padding="lg" className="text-center">
                <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2">Upgrade Required</h3>
                <p className="text-sm text-gray-500 mb-4">Premium listings require a Premium or Enterprise subscription.</p>
                <div className="space-y-2">
                  <Link to="/buyer/subscription"><Button fullWidth>View Plans</Button></Link>
                  <Button fullWidth variant="outline" onClick={() => setShowUpgradeModal(false)}>Close</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </CarrierDataContext.Provider>
  )
}
