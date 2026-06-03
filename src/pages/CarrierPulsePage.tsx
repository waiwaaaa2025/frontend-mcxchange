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
  CheckCircle, XCircle, AlertTriangle, ArrowLeft, MapPin,
  Calendar, Users, Hash, Phone, Building2, Package, DollarSign,
  TrendingUp, TrendingDown, Clock, ExternalLink, Mail,
  BarChart3, Eye, Zap, ChevronRight, ChevronDown, ChevronUp, MapPinned,
  Coins, Search, Loader2, AlertCircle, ShieldAlert, Info, Lock, Crown,
} from 'lucide-react'
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

import SellerListingGuideModal from '../components/SellerListingGuideModal'
import CreditReportView from '../components/v2/CreditReportView'
import TabNav, { TabItem } from '../components/v2/TabNav'
import SpeedometerGauge from '../components/v2/SpeedometerGauge'
import CoverageBar from '../components/v2/CoverageBar'
import StatusBadge from '../components/v2/StatusBadge'
import ScoreCard from '../components/v2/ScoreCard'
import AuthorityTimeline from '../components/v2/AuthorityTimeline'
import CarrierHealthScore from '../components/v2/CarrierHealthScore'
import ViolationBreakdownChart from '../components/v2/ViolationBreakdownChart'
import SharedEquipmentAlert from '../components/v2/SharedEquipmentAlert'
import ChameleonAlert from '../components/v2/ChameleonAlert'
import DriverBreakdown from '../components/v2/DriverBreakdown'
import FleetOwnershipBar from '../components/v2/FleetOwnershipBar'
import DonutChart from '../components/v2/DonutChart'
import InfoGrid from '../components/v2/InfoGrid'
import PreviewBlurValue, { PreviewModeContext } from '../components/v2/PreviewBlurValue'
import InsuranceGapTimeline from '../components/v2/InsuranceGapTimeline'
import FleetAgeHistogram from '../components/v2/FleetAgeHistogram'
import ViolationTrendChart from '../components/v2/ViolationTrendChart'
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
// CARRIER DATA CONTEXT
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
  carrierLoading: boolean
  carrierError: string | null
  previewMode: boolean
}

const CarrierDataContext = createContext<CarrierDataContextType | null>(null)

function useCarrierDataContext(): CarrierDataContextType {
  const ctx = useContext(CarrierDataContext)
  if (!ctx) throw new Error('useCarrierDataContext must be used within CarrierDataContext.Provider')
  return ctx
}

const baseTabs: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'authority', label: 'Authority & Compliance', icon: Shield },
  { id: 'safety', label: 'Safety & Inspections', icon: Activity },
  { id: 'insurance', label: 'Insurance', icon: Umbrella },
  { id: 'fleet', label: 'Fleet & Drivers', icon: Truck },
  { id: 'chameleon', label: 'Chameleon Check', icon: ShieldAlert },
  { id: 'safety-improvement', label: 'Safety Improvement Report', icon: Zap },
]

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

// ============================================================
// RECENT SEARCHES — localStorage
// ============================================================
interface RecentSearch {
  dotNumber: string
  carrierName: string
  timestamp: number
}

const RECENT_SEARCHES_KEY_PREFIX = 'carrierPulse_recentSearches'

function getRecentSearchesKey(userId?: string): string {
  return userId ? `${RECENT_SEARCHES_KEY_PREFIX}_${userId}` : RECENT_SEARCHES_KEY_PREFIX
}

function getRecentSearches(userId?: string): RecentSearch[] {
  try {
    const raw = localStorage.getItem(getRecentSearchesKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addRecentSearch(dotNumber: string, carrierName: string, userId?: string) {
  const key = getRecentSearchesKey(userId)
  const existing = getRecentSearches(userId).filter(s => s.dotNumber !== dotNumber)
  const updated = [{ dotNumber, carrierName, timestamp: Date.now() }, ...existing].slice(0, 10)
  localStorage.setItem(key, JSON.stringify(updated))
}

// ============================================================
// LOADING SKELETON
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
      <div className="flex items-center justify-center pt-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading carrier intelligence data...
      </div>
    </div>
  )
}

// ============================================================
// HERO HEADER — simplified, no pricing
// ============================================================
function PulseHeroHeader({ onSearchAnother }: { onSearchAnother: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { carrier: c } = useCarrierDataContext()
  const [showListingGuide, setShowListingGuide] = useState(false)
  const healthColor = c.carrierHealthScore >= 80 ? '#34d399' : c.carrierHealthScore >= 60 ? '#fbbf24' : '#f87171'
  const healthRadius = 30
  const healthCirc = 2 * Math.PI * healthRadius

  const navigateToListing = () => {
    const params = new URLSearchParams({ fromPulse: 'true' })
    if (c.mcNumber) params.set('mc', c.mcNumber)
    if (c.dotNumber) params.set('dot', c.dotNumber)
    const basePath = user?.role === 'admin' ? '/admin/create-listing' : '/seller/create-listing'
    navigate(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="w-full">
      <SellerListingGuideModal
        isOpen={showListingGuide}
        onClose={() => setShowListingGuide(false)}
        onConfirm={() => {
          setShowListingGuide(false)
          navigateToListing()
        }}
      />
      <div className="relative rounded-2xl overflow-hidden" style={{
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

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Shimmer */}
        <motion.div
          className="absolute h-[1px] top-0 left-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 40%, rgba(6,182,212,0.6) 60%, transparent 100%)', width: '30%' }}
          animate={{ x: ['-30%', '400%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />

        <div className="relative px-6 sm:px-8 py-7 sm:py-10">
          {/* Top row */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  {c.operatingStatus === 'authorized' ? 'Active Authority' : 'Not Authorized'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{c.legalName}</h1>
              {c.dbaName && <p className="text-white/40 text-sm mt-1 font-medium">DBA: {c.dbaName}</p>}
            </div>

            {/* Health Score Ring */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="flex-shrink-0 hidden sm:block">
              <div className="relative w-[80px] h-[80px]">
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <circle cx={40} cy={40} r={healthRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                  <motion.circle
                    cx={40} cy={40} r={healthRadius} fill="none"
                    stroke={healthColor} strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={healthCirc}
                    initial={{ strokeDashoffset: healthCirc }}
                    animate={{ strokeDashoffset: healthCirc * (1 - c.carrierHealthScore / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">{c.carrierHealthScore}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-widest text-white/40">Health</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Key metrics */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-6">
            {[
              { label: 'MC Number', value: c.mcNumber || 'N/A', accent: false },
              { label: 'DOT Number', value: c.dotNumber, accent: false },
              { label: 'Location', value: c.location, accent: false },
              { label: 'Authority Age', value: `${c.yearsActive} yrs`, accent: false },
              { label: 'Annual Miles', value: c.mcs150Mileage >= 1000000 ? `${(c.mcs150Mileage / 1000000).toFixed(1)}M mi` : c.mcs150Mileage > 0 ? `${c.mcs150Mileage.toLocaleString()} mi` : 'N/A', accent: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`rounded-xl px-4 py-3 border backdrop-blur-sm ${
                  stat.accent ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-white/[0.04] border-white/[0.06]'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">{stat.label}</p>
                <p className={`text-lg sm:text-xl font-extrabold mt-0.5 ${stat.accent ? 'text-indigo-300' : 'text-white'}`}>{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Status ribbon */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 mt-5 pt-5 border-t border-white/[0.06]"
          >
            {[
              { label: 'Safety', value: c.safetyRating === 'not-rated' ? 'Not Rated' : 'Satisfactory', color: c.safetyRating === 'satisfactory' ? 'emerald' as const : 'cyan' as const },
              { label: 'Insurance', value: c.insuranceStatus === 'current' ? 'Current' : c.insuranceStatus === 'pending' ? 'Pending' : 'Expired', color: c.insuranceStatus === 'current' ? 'emerald' as const : 'cyan' as const },
              { label: 'Fleet', value: `${c.powerUnits} Units`, color: 'cyan' as const },
              { label: 'Drivers', value: `${c.totalDriversCDL} CDL`, color: 'cyan' as const },
            ].map((chip) => (
              <div key={chip.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className={`w-1.5 h-1.5 rounded-full ${chip.color === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{chip.label}</span>
                <span className="text-xs font-bold text-white/80">{chip.value}</span>
              </div>
            ))}

            {c.smartwayFlag && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">SmartWay</span>
              </div>
            )}

            <div className="flex-1" />

            {/* List This Authority button for sellers and admins */}
            {(user?.role === 'seller' || user?.role === 'admin') && (
              <button
                onClick={() => setShowListingGuide(true)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <Package className="w-4 h-4" />
                List This Authority
              </button>
            )}

            {/* Search Another button */}
            <button
              onClick={onSearchAnother}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-sm font-medium text-white/70 hover:text-white flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Another
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TAB 1: OVERVIEW — stripped listing-specific sections
// ============================================================
function OverviewTab() {
  const ctx = useCarrierDataContext()
  const { carrier: c, complianceFinancials, percentiles, networkSignals, benchmarks, healthCategories } = ctx
  const safetyLevel = getStatusLevel('safety', c.safetyRating)
  const insuranceLevel = getStatusLevel('insurance', c.insuranceStatus)
  const authorityLevel = getStatusLevel('authority', c.operatingStatus)

  return (
    <div className="space-y-6">
      {/* 1. Carrier Health Score */}
      <CarrierHealthScore score={c.carrierHealthScore} categories={healthCategories.length > 0 ? healthCategories : undefined} />

      {/* 2. Quick Verdict Banner — driven by health score */}
      {(() => {
        const hs = c.carrierHealthScore
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

      {/* 3. Score Summary Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ScoreCard icon={Activity} label="Safety" value={c.safetyRating === 'not-rated' ? 'Not Rated' : c.safetyRating || 'Not Rated'} level={safetyLevel} />
          <ScoreCard icon={Umbrella} label="Insurance" value={c.insuranceStatus === 'current' ? 'Current' : c.insuranceStatus === 'pending' ? 'Pending' : c.insuranceStatus === 'expired' ? 'Expired' : 'Unknown'} level={insuranceLevel} />
          <ScoreCard icon={Truck} label="Fleet Size" value={`${c.powerUnits} Units`} level={c.powerUnits > 0 ? 'good' : 'neutral'} />
          <ScoreCard icon={CheckCircle} label="Authority" value={c.operatingStatus === 'authorized' ? 'Active' : c.operatingStatus || 'Unknown'} level={authorityLevel} />
        </div>
      </div>

      {/* 4. Compliance & Financials */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-500" />
          Compliance & Financials
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className={`rounded-lg p-4 border ${complianceFinancials.entryAuditCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {complianceFinancials.entryAuditCompleted ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              <p className="text-sm font-semibold text-gray-800">New Entrant Audit</p>
            </div>
            <p className="text-xs text-gray-500">{complianceFinancials.entryAuditCompleted ? 'Completed — carrier passed entry audit' : 'Pending — audit not yet completed'}</p>
          </div>
          <div className={`rounded-lg p-4 border ${complianceFinancials.hasFactoring ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">Factoring</p>
            </div>
            {complianceFinancials.hasFactoring ? (
              <p className="text-xs text-gray-500">{complianceFinancials.factoringCompany} — {complianceFinancials.factoringRate}% rate</p>
            ) : (
              <p className="text-xs text-gray-500">No factoring company on file</p>
            )}
          </div>
        </div>
      </Card>

      {/* 5. Network Signals */}
      {networkSignals.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            Network Signals
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {networkSignals.map((signal, i) => {
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

      {/* 6. Industry Benchmarks */}
      {benchmarks.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Industry Benchmarks
          </h3>
          <div className="space-y-4">
            {benchmarks.map((b, i) => {
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

      {/* 7. Description */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{c.description}</p>
      </Card>

      {/* 8. Industry Percentile Ranking */}
      <CarrierComparison percentiles={percentiles} />
    </div>
  )
}

// ============================================================
// TAB 2: AUTHORITY & COMPLIANCE
// ============================================================
function AuthorityTab() {
  const { carrier: c, authority, authorityHistory, authorityPending, cargoCapabilities, previewMode: pm } = useCarrierDataContext()
  const opLevel = getStatusLevel('authority', c.operatingStatus)

  const cargoGroups = [
    { title: 'General', items: [
      { name: 'General Freight', active: cargoCapabilities.generalFreight },
      { name: 'Household Goods', active: cargoCapabilities.householdGoods },
      { name: 'Building Materials', active: cargoCapabilities.buildingMaterials },
      { name: 'Paper Products', active: cargoCapabilities.paperProducts },
      { name: 'Beverages', active: cargoCapabilities.beverages },
      { name: 'Intermodal Containers', active: cargoCapabilities.intermodalContainers },
      { name: 'Construction', active: cargoCapabilities.construction },
    ]},
    { title: 'Specialized', items: [
      { name: 'Metal: Sheets/Coils', active: cargoCapabilities.metalSheets },
      { name: 'Motor Vehicles', active: cargoCapabilities.motorVehicles },
      { name: 'Machinery/Large Objects', active: cargoCapabilities.machineryLargeObjects },
      { name: 'Oil Field Equipment', active: cargoCapabilities.oilFieldEquipment },
      { name: 'Mobile Homes', active: cargoCapabilities.mobileHomes },
      { name: 'Driveway/Towaway', active: cargoCapabilities.drivewayTowaway },
    ]},
    { title: 'Temperature Controlled', items: [
      { name: 'Fresh Produce', active: cargoCapabilities.freshProduce },
      { name: 'Refrigerated Food', active: cargoCapabilities.refrigeratedFood },
      { name: 'Meat', active: cargoCapabilities.meat },
    ]},
    { title: 'Bulk & Hazardous', items: [
      { name: 'Liquids', active: cargoCapabilities.liquids },
      { name: 'Chemicals', active: cargoCapabilities.chemicals },
      { name: 'Dry Bulk', active: cargoCapabilities.commoditiesDryBulk },
      { name: 'Livestock', active: cargoCapabilities.livestock },
      { name: 'Coal/Coke', active: cargoCapabilities.coalCoke },
    ]},
  ]

  const pendingKeys: { key: keyof typeof authority; pendingKey: keyof typeof authorityPending; reviewKey: keyof typeof authorityPending }[] = [
    { key: 'common', pendingKey: 'commonPending', reviewKey: 'commonReview' },
    { key: 'contract', pendingKey: 'contractPending', reviewKey: 'contractReview' },
    { key: 'broker', pendingKey: 'brokerPending', reviewKey: 'brokerReview' },
  ]

  return (
    <div className="space-y-6">
      {/* Operating Status Banner */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-6 text-center ${opLevel === 'excellent' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
      >
        <h2 className={`text-3xl font-black tracking-wide ${opLevel === 'excellent' ? 'text-emerald-700' : 'text-red-700'}`}>
          <PreviewBlurValue>{c.operatingStatus === 'authorized' ? 'AUTHORIZED' : 'NOT AUTHORIZED'}</PreviewBlurValue>
        </h2>
        <p className={`text-sm mt-1 ${opLevel === 'excellent' ? 'text-emerald-600' : 'text-red-600'}`}>
          Operating authority status with FMCSA
        </p>
      </motion.div>

      {/* Authority Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          { key: 'common' as const, label: 'Common Authority', pIdx: 0 },
          { key: 'contract' as const, label: 'Contract Authority', pIdx: 1 },
          { key: 'broker' as const, label: 'Broker Authority', pIdx: 2 },
        ]).map(({ key, label, pIdx }) => {
          const auth = authority[key]
          const level = getStatusLevel('authority', auth.status)
          const pInfo = pendingKeys[pIdx]
          const isPending = authorityPending[pInfo.pendingKey]
          const isReview = authorityPending[pInfo.reviewKey]
          return (
            <Card key={key} padding="none" className="overflow-hidden">
              <div className={`h-1.5 ${auth.status === 'active' ? 'bg-emerald-500' : auth.status === 'inactive' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <div className="p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <PreviewBlurValue><StatusBadge level={level} label={auth.status.toUpperCase()} size="md" /></PreviewBlurValue>
                  {isPending && <PreviewBlurValue><span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Pending</span></PreviewBlurValue>}
                  {isReview && <PreviewBlurValue><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Review</span></PreviewBlurValue>}
                </div>
                {auth.grantedDate && <p className="text-xs text-gray-400 mt-2">Granted: <PreviewBlurValue>{safeFmtDate(auth.grantedDate)}</PreviewBlurValue></p>}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Authority Risk Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-lg p-4 text-center border ${c.totalRevocations === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-2xl font-bold ${c.totalRevocations === 0 ? 'text-emerald-600' : 'text-red-600'}`}><PreviewBlurValue>{c.totalRevocations}</PreviewBlurValue></p>
          <p className="text-xs text-gray-500">Total Revocations</p>
        </div>
        <div className="rounded-lg p-4 text-center border bg-gray-50 border-gray-100">
          <p className="text-2xl font-bold text-gray-800"><PreviewBlurValue>{c.daysSinceLastRevocation ?? 'N/A'}</PreviewBlurValue></p>
          <p className="text-xs text-gray-500">Days Since Last Revocation</p>
        </div>
        <div className="rounded-lg p-4 text-center border bg-gray-50 border-gray-100">
          <p className="text-2xl font-bold text-indigo-600"><PreviewBlurValue>{Math.floor(c.authorityAgeDays / 365)}y {Math.floor((c.authorityAgeDays % 365) / 30)}m</PreviewBlurValue></p>
          <p className="text-xs text-gray-500">Authority Age</p>
        </div>
      </div>

      {/* Registration Details */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Registration Details
        </h3>
        <InfoGrid items={[
          { label: 'Legal Name', value: c.legalName },
          { label: 'DBA Name', value: c.dbaName || 'N/A' },
          { label: 'EIN', value: c.ein, blur: true },
          { label: 'Entity Type', value: c.entityType },
          { label: 'MC Number', value: c.mcNumber },
          { label: 'DOT Number', value: c.dotNumber },
          { label: 'Phone', value: c.phone || 'N/A' },
          { label: 'Email Domain', value: c.emailDomain || 'N/A' },
          { label: 'Fax', value: c.fax || 'N/A' },
          { label: 'Power Units', value: String(c.powerUnits) },
          { label: 'Drivers', value: String(c.drivers) },
          { label: 'MCS-150 Date', value: safeFmtDate(c.mcs150Date) },
          { label: 'MCS-150 Mileage', value: fmtNumber(c.mcs150Mileage) + ' mi' },
          { label: 'Registered', value: safeFmtDate(c.registrantDate) },
          { label: 'Years Active', value: `${c.yearsActive} years` },
        ]} />
      </Card>

      {/* Cargo Capabilities */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Capabilities</h3>
        <div className="space-y-4">
          {cargoGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item.name}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${pm ? 'blur-[5px] select-none pointer-events-none' : ''} ${item.active ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-400 border-gray-100 line-through'}`}
                  >{item.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Authority History Timeline */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Authority History
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h3>
        <PreviewBlurValue variant="chart"><AuthorityTimeline events={[...authorityHistory].reverse()} /></PreviewBlurValue>
      </Card>
    </div>
  )
}

// ============================================================
// INSPECTION RECORDS PANEL
// ============================================================
function InspectionRecordsPanel() {
  const { inspectionRecords } = useCarrierDataContext()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [resultFilter, setResultFilter] = useState<'all' | 'clean' | 'violations' | 'oos'>('all')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filtered = inspectionRecords.filter(rec => {
    if (resultFilter === 'clean' && rec.violations > 0) return false
    if (resultFilter === 'violations' && rec.violations === 0) return false
    if (resultFilter === 'oos' && !rec.oos) return false
    if (typeFilter && !rec.level.toLowerCase().includes(typeFilter.toLowerCase())) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return rec.reportNumber.toLowerCase().includes(q) || rec.state.toLowerCase().includes(q) || rec.type.toLowerCase().includes(q) ||
        rec.violationDetails.some(v => v.category.toLowerCase().includes(q) || v.group.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))
    }
    return true
  })

  const totalInspections = inspectionRecords.length
  const cleanCount = inspectionRecords.filter(r => r.violations === 0).length
  const oosCount = inspectionRecords.filter(r => r.oos).length
  const cleanRate = totalInspections > 0 ? Math.round((cleanCount / totalInspections) * 100) : 0

  const severityColor = (severity: number) => severity >= 8 ? 'bg-red-500' : severity >= 5 ? 'bg-yellow-500' : 'bg-blue-500'

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      <div className="px-5 pt-5 pb-4">
        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          Inspection Records
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </h4>
      </div>

      <div className="px-5 pb-4">
        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-1.5">
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Inspections</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-gray-400" /> Clean <span className="font-semibold text-gray-700">{cleanCount}</span></span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Violations <span className="font-semibold text-gray-700">{totalInspections - cleanCount - oosCount}</span></span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /> OOS <span className="font-semibold text-gray-700">{oosCount}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-lg font-bold text-indigo-600">{totalInspections}</p><p className="text-[9px] text-gray-400 uppercase">Total</p></div>
            <div className="text-center"><p className="text-lg font-bold text-emerald-600">{cleanRate}%</p><p className="text-[9px] text-gray-400 uppercase">Clean Rate</p></div>
            <div className="text-center"><p className="text-lg font-bold text-red-600">{oosCount}</p><p className="text-[9px] text-gray-400 uppercase">OOS</p></div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder="Enter violation code, catego..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 pl-8 pr-3 py-2 w-52 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Result</p>
          <div className="flex gap-1.5">
            {(['clean', 'violations', 'oos'] as const).map(f => (
              <button key={f} onClick={() => setResultFilter(resultFilter === f ? 'all' : f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  resultFilter === f
                    ? f === 'clean' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : f === 'violations' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >{f === 'clean' ? 'Clean' : f === 'violations' ? 'Violations' : 'OOS'}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Type</p>
          <div className="flex gap-1.5">
            {['Level 1', 'Level 2', 'Level 3'].map(lvl => (
              <button key={lvl} onClick={() => setTypeFilter(typeFilter === lvl ? null : lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${typeFilter === lvl ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:text-gray-700 hover:bg-gray-100'}`}
              >{lvl}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 pb-3"><p className="text-xs text-gray-400">{filtered.length} inspection{filtered.length !== 1 ? 's' : ''}</p></div>

      <div className="px-5 pb-5 space-y-3">
        {filtered.map(rec => {
          const isExpanded = expandedId === rec.id
          const hasViolations = rec.violations > 0
          return (
            <div key={rec.id} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <button onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 text-left flex-wrap">
                  <span className="text-sm font-bold text-gray-900 min-w-[100px]">{safeFmtDate(rec.date)}</span>
                  <span className="text-sm font-medium text-gray-500">{rec.state}</span>
                  <span className="text-sm text-gray-700">{rec.level}</span>
                  <a href={`https://ai.fmcsa.dot.gov/SMS/Event/Inspection/${rec.fmcsaId}.aspx`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 hover:border-indigo-300 transition-colors"
                  >{rec.reportNumber}<ExternalLink className="w-3 h-3" /></a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!hasViolations && <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">Clean</span>}
                  {rec.violations > 0 && <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">{rec.violations} Violation{rec.violations > 1 ? 's' : ''}</span>}
                  {rec.oosViolations > 0 && <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">{rec.oosViolations} OOS</span>}
                  {hasViolations ? (isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />) : <div className="w-4" />}
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && hasViolations && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="border-t border-gray-200">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white">
                            <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Violation</th>
                            <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Group</th>
                            <th className="text-left py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                            <th className="text-center py-2.5 px-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">OOS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.violationDetails.map((v, vi) => (
                            <tr key={vi} className="border-b border-gray-100 last:border-b-0 hover:bg-white bg-gray-50/50">
                              <td className="py-3 px-4"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${v.oos ? 'bg-red-500' : 'bg-indigo-500'}`} /><span className="text-gray-800 font-medium">{v.category}</span></div></td>
                              <td className="py-3 px-4 text-gray-500">{v.group}</td>
                              <td className="py-3 px-4 text-gray-600 max-w-xs">{v.description}</td>
                              <td className="py-3 px-4 text-center"><span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800"><span className={`w-2 h-2 rounded-full ${severityColor(v.severity)}`} />{v.severity}</span></td>
                              <td className="py-3 px-4 text-center">{v.oos ? <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">OOS</span> : <span className="text-gray-300">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="text-center py-8"><p className="text-sm text-gray-400">No inspections match your filters</p></div>}
      </div>
    </div>
  )
}

// ============================================================
// TAB 3: SAFETY & INSPECTIONS
// ============================================================
function SafetyTab() {
  const { carrier: c, basicScores, basicAlerts, violationBreakdown, issData, inspections, inspectionRecords, operations, crashes, crashRecords, violationTrend, previewMode: pm } = useCarrierDataContext()
  const [safetySub, setSafetySub] = useState<'overview' | 'basics' | 'inspections' | 'crashes'>('overview')
  const safetyLevel = getStatusLevel('safety', c.safetyRating)

  const alertMap: Record<string, boolean> = {
    'Unsafe Driving': basicAlerts.unsafeDrivingAlert,
    'Hours-of-Service': basicAlerts.hoursOfServiceAlert,
    'Driver Fitness': basicAlerts.driverFitnessAlert,
    'Controlled Substances': basicAlerts.controlledSubstanceAlert,
    'Vehicle Maintenance': basicAlerts.vehicleMaintenanceAlert,
    'HM Compliance': basicAlerts.hazmatAlert,
    'Hazmat Compliance': basicAlerts.hazmatAlert,
    'Crash Indicator': basicAlerts.crashIndicatorAlert,
  }

  const violationMap: Record<string, number> = {
    'Unsafe Driving': violationBreakdown.unsafeDriving,
    'Hours-of-Service': violationBreakdown.hoursOfService,
    'Driver Fitness': violationBreakdown.driverFitness,
    'Controlled Substances': violationBreakdown.controlledSubstance,
    'Vehicle Maintenance': violationBreakdown.vehicleMaintenance,
    'HM Compliance': violationBreakdown.hazardousMaterials,
    'Hazmat Compliance': violationBreakdown.hazardousMaterials,
    'Crash Indicator': 0,
  }

  const totalViolations = Object.values(violationMap).reduce((a, b) => a + b, 0)
  const totalInspections = operations.totalInspections
  const activeAlertCount = Object.values(alertMap).filter(Boolean).length
  const exceedingBasics = basicScores.filter(b => b.score != null && b.score > b.threshold)

  const safetySubTabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'basics' as const, label: 'BASICs' },
    { id: 'inspections' as const, label: 'Inspections' },
    { id: 'crashes' as const, label: 'Crashes' },
  ]

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-gray-900">Safety Performance</h2>
          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">CarrierOk</span>
        </div>
        <p className="text-xs text-gray-500">FMCSA safety data, BASICs, inspections & crash analysis</p>
      </div>

      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {safetySubTabs.map(tab => (
            <button key={tab.id} onClick={() => setSafetySub(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${safetySub === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {safetySub === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">FMCSA Safety Rating</p>
                  <h3 className={`text-3xl font-black tracking-wide uppercase ${safetyLevel === 'excellent' ? 'text-emerald-600' : safetyLevel === 'fair' ? 'text-amber-500' : safetyLevel === 'danger' ? 'text-red-600' : 'text-gray-500'}`}>
                    <PreviewBlurValue>{c.safetyRating === 'not-rated' ? 'Not Rated' : c.safetyRating}</PreviewBlurValue>
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Operating Status</p>
                  <h3 className={`text-3xl font-black tracking-wide uppercase ${c.operatingStatus === 'authorized' ? 'text-emerald-600' : 'text-red-600'}`}>
                    <PreviewBlurValue>{c.operatingStatus === 'authorized' ? 'Authorized' : c.operatingStatus === 'not-authorized' ? 'Not Authorized' : c.operatingStatus}</PreviewBlurValue>
                  </h3>
                  <p className="text-xs text-gray-400 mt-2">
                    <PreviewBlurValue>
                    {c.powerUnits > 0 ? `${c.powerUnits} power unit${c.powerUnits !== 1 ? 's' : ''}` : ''}
                    {c.powerUnits > 0 && c.totalDriversCDL > 0 ? ' · ' : ''}
                    {c.totalDriversCDL > 0 ? `${c.totalDriversCDL} driver${c.totalDriversCDL !== 1 ? 's' : ''}` : ''}
                    </PreviewBlurValue>
                  </p>
                </div>
              </div>

              {/* Inspections table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">US Inspection Results for 24 months</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Total Inspections: <strong className="text-gray-700"><PreviewBlurValue>{inspections.totalInspections}</PreviewBlurValue></strong></p>
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
                    <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Inspections</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{inspections.vehicleInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{inspections.driverInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{inspections.hazmatInspections}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{inspections.iepInspections}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Out of Service</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${inspections.vehicleOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{inspections.vehicleOOS}</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${inspections.driverOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{inspections.driverOOS}</td>
                        <td className={`py-2.5 px-4 text-center font-semibold ${inspections.hazmatOOS > 0 ? 'text-amber-600' : 'text-blue-600'}`}>{inspections.hazmatOOS}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-semibold">{inspections.iepOOS}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2.5 px-4 font-medium text-gray-700">Out of Service %</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${inspections.vehicleInspections > 0 && inspections.vehicleOOSRate > inspections.nationalVehicleOOSRate ? 'text-amber-600' : 'text-blue-600'}`}>{inspections.vehicleInspections > 0 ? `${inspections.vehicleOOSRate}%` : '%'}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${inspections.driverInspections > 0 && inspections.driverOOSRate > inspections.nationalDriverOOSRate ? 'text-amber-600' : 'text-blue-600'}`}>{inspections.driverInspections > 0 ? `${inspections.driverOOSRate}%` : '%'}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-bold">{inspections.hazmatInspections > 0 ? `${inspections.hazmatOOSRate}%` : '%'}</td>
                        <td className="py-2.5 px-4 text-center text-blue-600 font-bold">{inspections.iepInspections > 0 ? `${inspections.iepOOSRate}%` : '0%'}</td>
                      </tr>
                      <tr className="bg-blue-50/50">
                        <td className="py-2.5 px-4 font-medium text-gray-500 text-xs">Nat'l Average %</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{inspections.nationalVehicleOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{inspections.nationalDriverOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-700 font-medium">{inspections.nationalHazmatOOSRate}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-400">N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-100">*OOS rates calculated based on the most recent 24 months of inspection data per the latest monthly SAFER Snapshot.</p>
              </div>

              {/* Crashes table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Crashes reported to FMCSA for 24 months</h4>
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
                    <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-gray-700">Crashes</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${crashes.fatal > 0 ? 'text-red-600' : 'text-blue-600'}`}>{crashes.fatal}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${crashes.injury > 0 ? 'text-amber-500' : 'text-blue-600'}`}>{crashes.injury}</td>
                        <td className={`py-2.5 px-4 text-center font-bold ${crashes.towaway > 0 ? 'text-amber-500' : 'text-blue-600'}`}>{crashes.towaway}</td>
                        <td className="py-2.5 px-4 text-center font-black text-gray-900">{crashes.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {safetySub === 'basics' && (
            <motion.div key="basics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <p className="text-sm text-blue-800"><strong>What are BASICs?</strong> FMCSA's SMS scores carriers in 7 categories. Each score is a percentile (0–100) — higher means worse. When a score crosses the threshold, FMCSA may intervene.</p>
              </div>


              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500" />BASIC Scores</h4>
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
                    <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
                      {basicScores.map((basic, i) => {
                        const isScored = basic.score != null
                        const exceedsThreshold = isScored && basic.score! > basic.threshold
                        const apiAlert = alertMap[basic.name] || false
                        const hasAlert = exceedsThreshold || apiAlert
                        const violations = violationMap[basic.name] ?? 0
                        return (
                          <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${hasAlert ? 'bg-yellow-50/50' : ''}`}>
                            <td className="py-2.5 px-4 font-medium text-gray-900">{basic.name}{hasAlert && <span className="ml-1.5 inline-flex w-2 h-2 rounded-full bg-yellow-400" />}</td>
                            <td className="py-2.5 px-4 text-xs text-gray-500 hidden sm:table-cell">{basic.description}</td>
                            <td className="py-2.5 px-4 text-right">{isScored ? <span className={`font-bold ${exceedsThreshold ? 'text-amber-600' : basic.score! >= basic.threshold * 0.75 ? 'text-yellow-600' : 'text-emerald-600'}`}>{basic.score}%</span> : <span className="text-gray-400 text-xs">Not Scored</span>}</td>
                            <td className="py-2.5 px-4 text-right text-gray-400">{basic.threshold}%</td>
                            <td className="py-2.5 px-4 text-right text-gray-700">{violations}</td>
                            <td className="py-2.5 px-4 text-right">
                              {exceedsThreshold ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Exceeding</span>
                                : apiAlert ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Alert</span>
                                : isScored ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">OK</span>
                                : violations > 0 ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{violations} viol.</span>
                                : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">No Data</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">BASIC Percentile Gauges <span className="text-[10px] text-gray-400 font-normal">Higher = worse. Red zone = above threshold.</span></h4>
                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${pm ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
                  {basicScores.map((basic, i) => (
                    <motion.div key={basic.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                      <SpeedometerGauge name={basic.name} score={basic.score} threshold={basic.threshold} alert={alertMap[basic.name] || false} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {totalViolations > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Violation Breakdown by BASIC</h4>
                  <p className="text-xs text-gray-500 mb-4">{totalViolations} total violations across {totalInspections} inspections</p>
                  <PreviewBlurValue variant="chart"><ViolationBreakdownChart violations={violationBreakdown} alerts={basicAlerts} /></PreviewBlurValue>
                </div>
              )}

              {violationTrend.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-indigo-500" />Violation Trend</h4>
                  <PreviewBlurValue variant="chart"><ViolationTrendChart data={violationTrend} /></PreviewBlurValue>
                </div>
              )}
            </motion.div>
          )}

          {safetySub === 'inspections' && (
            <motion.div key="inspections" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{operations.cleanInspectionRate}%</p><p className="text-xs text-gray-500 mt-1">Clean Rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  {inspections.vehicleInspections > 0 ? <p className={`text-2xl font-bold ${inspections.vehicleOOSRate <= inspections.nationalVehicleOOSRate ? 'text-emerald-600' : 'text-red-600'}`}>{inspections.vehicleOOSRate}%</p> : <p className="text-2xl font-bold text-gray-300">—</p>}
                  <p className="text-xs text-gray-500 mt-1">Vehicle OOS Rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  {inspections.driverInspections > 0 ? <p className={`text-2xl font-bold ${inspections.driverOOSRate <= inspections.nationalDriverOOSRate ? 'text-emerald-600' : 'text-red-600'}`}>{inspections.driverOOSRate}%</p> : <p className="text-2xl font-bold text-gray-300">—</p>}
                  <p className="text-xs text-gray-500 mt-1">Driver OOS Rate</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{safeFmtDate(operations.lastInspectionDate)}</p><p className="text-xs text-gray-500 mt-1">Last Inspection</p>
                </div>
              </div>

              {/* OOS Summary Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900">Out-of-Service Summary</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Inspections</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">OOS</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">OOS %</th>
                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Nat'l Avg %</th>
                      </tr>
                    </thead>
                    <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
                      {[
                        { type: 'Vehicle', insp: inspections.vehicleInspections, oos: inspections.vehicleOOS, rate: inspections.vehicleOOSRate, natl: inspections.nationalVehicleOOSRate },
                        { type: 'Driver', insp: inspections.driverInspections, oos: inspections.driverOOS, rate: inspections.driverOOSRate, natl: inspections.nationalDriverOOSRate },
                        { type: 'Hazmat', insp: inspections.hazmatInspections, oos: inspections.hazmatOOS, rate: inspections.hazmatOOSRate, natl: inspections.nationalHazmatOOSRate },
                        { type: 'IEP', insp: inspections.iepInspections, oos: inspections.iepOOS, rate: inspections.iepOOSRate, natl: null as number | null },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-medium text-gray-900">{row.type}</td>
                          <td className="py-2.5 px-4 text-right text-gray-700">{row.insp}</td>
                          <td className="py-2.5 px-4 text-right"><span className={`font-semibold ${row.oos > 0 ? 'text-red-600' : 'text-gray-700'}`}>{row.oos}</span></td>
                          <td className="py-2.5 px-4 text-right"><span className={`font-bold ${row.insp > 0 && row.natl != null && row.rate <= row.natl ? 'text-emerald-600' : row.insp > 0 && row.natl != null ? 'text-red-600' : 'text-gray-400'}`}>{row.insp > 0 ? `${row.rate}%` : '0%'}</span></td>
                          <td className="py-2.5 px-4 text-right text-gray-400">{row.natl != null ? `${row.natl}%` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspections by State */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50"><h4 className="text-sm font-semibold text-gray-900">Inspections by State</h4></div>
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
                    <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
                      {operations.operatingStates.map((s, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-4"><span className="font-medium text-gray-900">{s.state}</span> <span className="text-gray-400 text-xs">({s.stateCode})</span></td>
                          <td className="py-2.5 px-4 text-right text-gray-700">{s.inspections}</td>
                          <td className="py-2.5 px-4 text-right"><span className={`font-semibold ${s.oosCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{s.oosCount}</span></td>
                          <td className="py-2.5 px-4 text-right"><span className={`font-bold ${s.oosRate <= 12.9 ? 'text-emerald-600' : 'text-red-600'}`}>{s.oosRate}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <InspectionRecordsPanel />
            </motion.div>
          )}

          {safetySub === 'crashes' && (
            <motion.div key="crashes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
              <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
                {[
                  { label: 'Fatal', value: crashes.fatal, color: crashes.fatal > 0 ? 'text-red-600' : 'text-emerald-600', bg: crashes.fatal > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Injury', value: crashes.injury, color: crashes.injury > 0 ? 'text-yellow-600' : 'text-emerald-600', bg: crashes.injury > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Towaway', value: crashes.towaway, color: crashes.towaway > 0 ? 'text-orange-600' : 'text-emerald-600', bg: crashes.towaway > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200' },
                  { label: 'Total', value: crashes.total, color: 'text-gray-900', bg: 'bg-gray-50 border-gray-200' },
                ].map((cr, i) => (
                  <div key={i} className={`rounded-xl border ${cr.bg} p-4 text-center`}>
                    <p className={`text-3xl font-bold ${cr.color}`}>{cr.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{cr.label}</p>
                    <p className="text-[10px] text-gray-400">24 months</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50"><h4 className="text-sm font-semibold text-gray-900">Crash Records</h4></div>
                {crashRecords.length > 0 ? (
                  <div className={`divide-y divide-gray-100 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
                    {crashRecords.map((crash) => (
                      <div key={crash.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${crash.severity === 'Injury' ? 'bg-yellow-500' : crash.severity === 'Towaway' ? 'bg-orange-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{crash.severity} Crash</p>
                            <p className="text-xs text-gray-500">{safeFmtDate(crash.date)} · {crash.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="text-xs space-y-0.5">
                            <p className={`font-medium ${crash.fatalities > 0 ? 'text-red-600' : 'text-gray-400'}`}>{crash.fatalities} fatal</p>
                            <p className={`font-medium ${crash.injuries > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{crash.injuries} injury</p>
                          </div>
                          <div>
                            {crash.hazmatRelease && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">HazMat</span>}
                            <p className="text-[10px] text-gray-400 mt-0.5">{crash.reportNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center"><CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" /><p className="text-sm text-emerald-600">No crashes on record</p></div>
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
  const { carrier: c, insurancePolicies, renewalTimeline, policyHistory, insuranceGaps, previewMode: pm } = useCarrierDataContext()
  const insLevel = getStatusLevel('insurance', c.insuranceStatus)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-6 text-center ${insLevel === 'excellent' ? 'bg-emerald-50 border-emerald-200' : insLevel === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}
      >
        <p className="text-sm text-gray-500 mb-1">Insurance Status</p>
        <h2 className={`text-3xl font-black tracking-wide uppercase ${statusColors[insLevel].text}`}>
          <PreviewBlurValue>{c.insuranceStatus === 'pending' ? 'CANCELLATION PENDING' : c.insuranceStatus === 'expired' ? 'EXPIRED' : 'CURRENT'}</PreviewBlurValue>
        </h2>
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Analysis</h3>
        <div className={`grid sm:grid-cols-3 gap-4 ${pm ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
          {insurancePolicies.map((policy, i) => <CoverageBar key={i} label={`${policy.type} Coverage`} actual={policy.coverage} required={policy.required} />)}
        </div>
      </div>

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
            <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
              {insurancePolicies.map((policy, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{policy.insurer}</td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-600">{policy.policyNumber}</td>
                  <td className="py-2 px-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">{policy.type}</span></td>
                  <td className="py-2 px-3 font-semibold">{fmtCurrency(policy.coverage)}</td>
                  <td className="py-2 px-3"><StatusBadge level={getStatusLevel('insurance', policy.status)} label={policy.status.toUpperCase()} size="sm" /></td>
                  <td className="py-2 px-3 text-gray-600">{safeFmtDate(policy.effectiveDate)}</td>
                  <td className="py-2 px-3 text-gray-600">{safeFmtDate(policy.expirationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" />Renewal Timeline</h3>
        <div className={`flex items-center gap-1 overflow-x-auto pb-2 ${pm ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
          {renewalTimeline.map((renewal, i) => {
            const urgencyColors: Record<string, string> = { ok: 'bg-emerald-100 border-emerald-300 text-emerald-700', low: 'bg-emerald-100 border-emerald-300 text-emerald-700', medium: 'bg-yellow-100 border-yellow-300 text-yellow-700', warning: 'bg-yellow-100 border-yellow-300 text-yellow-700', high: 'bg-orange-100 border-orange-300 text-orange-700', expired: 'bg-gray-100 border-gray-300 text-gray-700', critical: 'bg-red-100 border-red-300 text-red-700' }
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex-1 min-w-[160px]">
                <div className={`rounded-xl border-2 p-4 text-center ${urgencyColors[renewal.urgency]}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider">{renewal.policyType}</p>
                  <p className="text-lg font-bold mt-1">{renewal.daysUntil} days</p>
                  <p className="text-xs mt-1">{safeFmtDate(renewal.date)}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" />Policy Event History</h3>
        <PreviewBlurValue variant="chart"><AuthorityTimeline events={policyHistory} /></PreviewBlurValue>
      </Card>

      <PreviewBlurValue variant="chart"><InsuranceGapTimeline gaps={insuranceGaps} /></PreviewBlurValue>
    </div>
  )
}

// ============================================================
// TAB 5: FLEET & DRIVERS
// ============================================================
function FleetTab() {
  const { carrier: c, trucks, trailers, sharedEquipment, previewMode: pm } = useCarrierDataContext()
  const avgYear = trucks.length > 0 ? Math.round(trucks.reduce((s, t) => s + t.year, 0) / trucks.length) : 0

  const makeCount: Record<string, number> = {}
  trucks.forEach((t) => { makeCount[t.make] = (makeCount[t.make] || 0) + 1 })
  const makeSegments = Object.entries(makeCount).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'][i % 5] }))

  const typeCount: Record<string, number> = {}
  trailers.forEach((t) => { typeCount[t.type] = (typeCount[t.type] || 0) + 1 })
  const typeSegments = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 4] }))

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
        <ScoreCard icon={Truck} label="Trucks" value={trucks.length} level="good" />
        <ScoreCard icon={Package} label="Trailers" value={trailers.length} level="good" />
        <ScoreCard icon={Users} label="CDL Drivers" value={c.totalDriversCDL} level="good" />
        <ScoreCard icon={Calendar} label="Avg Fleet Year" value={avgYear} level="good" subtitle="model year" />
        <ScoreCard icon={MapPinned} label="Annual Miles" value={c.mcs150Mileage > 0 ? `${(c.mcs150Mileage / 1000000).toFixed(1)}M` : 'N/A'} level="good" subtitle="mi/yr" />
      </div>

      <PreviewBlurValue variant="chart"><FleetOwnershipBar owned={c.ownedTractors} leased={c.termLeasedTractors} /></PreviewBlurValue>
      <PreviewBlurValue variant="chart"><DriverBreakdown totalCDL={c.totalDriversCDL} within100mi={c.driversInterstate100mi} beyond100mi={c.driversInterstateBeyond100mi} /></PreviewBlurValue>

      <div className={`grid sm:grid-cols-2 gap-4 ${pm ? 'blur-[4px] select-none pointer-events-none' : ''}`}>
        <Card padding="md"><DonutChart segments={makeSegments} title="Fleet by Make" /></Card>
        <Card padding="md"><DonutChart segments={typeSegments} title="Trailers by Type" /></Card>
      </div>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" />Fleet Age Distribution</h3>
        <PreviewBlurValue variant="chart"><FleetAgeHistogram trucks={trucks} trailers={trailers} /></PreviewBlurValue>
      </Card>

      <SharedEquipmentAlert data={sharedEquipment} />

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-500" />Truck Inventory</h3>
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
            <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
              {trucks.map((truck, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{truck.vin}</td>
                  <td className="py-2 px-3">{truck.year}</td>
                  <td className="py-2 px-3 font-medium">{truck.make}</td>
                  <td className="py-2 px-3 text-gray-600">{truck.model}</td>
                  <td className="py-2 px-3 text-gray-600 text-xs">{truck.bodyClass}</td>
                  <td className="py-2 px-3 text-gray-600 text-xs">{truck.gvwr}</td>
                  <td className="py-2 px-3 text-center">{truck.inspections}</td>
                  <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${truck.oosCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{truck.oosCount}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" />Trailer Inventory</h3>
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
            <tbody className={pm ? 'blur-[6px] select-none pointer-events-none' : ''}>
              {trailers.map((trailer, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs">{trailer.vin}</td>
                  <td className="py-2 px-3">{trailer.year}</td>
                  <td className="py-2 px-3 font-medium">{trailer.make}</td>
                  <td className="py-2 px-3 text-gray-600">{trailer.model}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${trailer.type === 'Reefer' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{trailer.type}</span></td>
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
// TAB 6: DOCUMENTS — stripped "What's Included in Sale"
// ============================================================
function DocumentsTab() {
  const { documents, verificationChecks, availableDocuments } = useCarrierDataContext()
  const verifiedCount = documents.filter((d) => d.status === 'verified').length

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-5 text-center ${verifiedCount === documents.length ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle className={`w-6 h-6 ${verifiedCount === documents.length ? 'text-emerald-500' : 'text-yellow-500'}`} />
          <h3 className={`text-xl font-bold ${verifiedCount === documents.length ? 'text-emerald-700' : 'text-yellow-700'}`}>{verifiedCount} of {documents.length} Verified</h3>
        </div>
      </motion.div>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500" />Verification Checks</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {verificationChecks.map((check: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-lg border p-3 text-center ${check.status === 'clean' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
            >
              {check.status === 'clean' ? <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" /> : <XCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />}
              <p className="text-sm font-semibold text-gray-800">{check.name}</p>
              <p className="text-xs text-gray-500">{check.detail}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {documents.map((doc, i) => {
          const isVerified = doc.status === 'verified'
          const isPending = doc.status === 'pending'
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 rounded-xl border p-4 ${isVerified ? 'bg-white border-emerald-100' : isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${isVerified ? 'bg-emerald-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'}`}>
                {isVerified ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : isPending ? <Clock className="w-5 h-5 text-yellow-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                  <StatusBadge level={isVerified ? 'excellent' : isPending ? 'fair' : 'danger'} label={doc.status.toUpperCase()} size="sm" />
                </div>
                <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" />Available Documents Checklist</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {availableDocuments.map((doc, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${doc.available ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              {doc.available ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
              <span className={`text-sm ${doc.available ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{doc.name}</span>
            </div>
          ))}
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
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [fullReport, setFullReport] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Auto-search on mount using carrier's legal name + state
  useEffect(() => {
    if (!c.legalName || hasSearched) return
    const state = c.location?.split(',').pop()?.trim() || ''
    setSearchLoading(true)
    setSearchError(null)
    setHasSearched(true)
    api.carrierPulseCreditsafeSearch({ name: c.legalName, state })
      .then(res => {
        const results = res.data?.companies || []
        setCompanies(results)
        // Auto-select best match by cross-referencing carrier location
        if (results.length === 1) {
          handleSelectCompany(results[0])
        } else if (results.length > 1) {
          const carrierCity = (c.location?.split(',')[0]?.trim() || '').toLowerCase()
          const carrierState = state.toLowerCase()
          // Score each company: state match = 1pt, city match = 2pts, active status = 1pt, name exact match = 3pts
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
          handleSelectCompany(scored[0].co)
        }
      })
      .catch(() => setSearchError('Failed to search Creditsafe. Please try again.'))
      .finally(() => setSearchLoading(false))
  }, [c.legalName])

  const handleSelectCompany = async (company: any) => {
    const connectId = company.connectId || company.id
    setSelectedCompany(company)
    setReportLoading(true)
    setQuotaError(null)
    try {
      const res = await api.carrierPulseCreditsafeReport(connectId)
      setFullReport(res.data)
    } catch (err: any) {
      if (err?.code === 'CREDIT_REPORT_QUOTA_EXHAUSTED') {
        setQuotaError(err?.message || "You've reached your monthly credit report limit.")
      } else {
        setSearchError('Failed to load credit report.')
      }
    } finally {
      setReportLoading(false)
    }
  }

  if (searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Searching Creditsafe for "{c.legalName}"...</p>
      </div>
    )
  }

  if (searchError && !companies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">Could not find credit data</p>
        <p className="text-gray-500 text-sm max-w-md">{searchError}</p>
      </div>
    )
  }


  if (!companies.length && hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-gray-400 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">No credit data found</p>
        <p className="text-gray-500 text-sm max-w-md">
          Creditsafe does not have a record for "{c.legalName}". This is common for smaller or newer carriers.
        </p>
      </div>
    )
  }

  if (quotaError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
        <p className="text-gray-700 font-semibold mb-2">Monthly credit report limit reached</p>
        <p className="text-gray-500 text-sm max-w-md">
          {quotaError} Your credit report allotment resets at the start of next month. Reports you've
          already pulled this month remain free to re-open.
        </p>
      </div>
    )
  }

  return <CreditReportView fullReport={fullReport} isLoading={reportLoading} />
}

// ============================================================
// TAB 8: CHAMELEON CHECK
// ============================================================
function ChameleonTab() {
  const { chameleonAnalysis, carrier, relatedCarriers, previewMode: pm } = useCarrierDataContext()
  return (
    <div className="space-y-6">
      <PreviewBlurValue variant="chart"><ChameleonAlert analysis={chameleonAnalysis} /></PreviewBlurValue>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-500" />
          What is a Chameleon Carrier?
        </h3>
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            A <strong>chameleon carrier</strong> is a motor carrier shut down by FMCSA for safety violations that reopens under a new name, MC, or DOT number to evade their prior safety record.
          </p>
          <p>
            FMCSA tracks chameleon carriers through their <strong>New Entrant Safety Audit</strong> program by cross-referencing shared addresses, officers, EINs, phone numbers, and vehicle VINs.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs font-semibold text-red-800 mb-1">Why it matters</p>
              <p className="text-xs text-red-700">Chameleon carriers carry hidden safety risks. Their prior violations, crashes, and OOS rates don't appear on the new authority.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-800 mb-1">How we detect it</p>
              <p className="text-xs text-blue-700">We analyze shared EINs, officers, addresses, phone numbers, vehicle VINs, authority timelines, and revocation history.</p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-500" />
          Carrier Identity
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Authority Age</span>
            <span className="font-medium text-gray-900">
              <PreviewBlurValue>{carrier.authorityAgeDays > 0
                ? carrier.authorityAgeDays >= 365
                  ? `${Math.round(carrier.authorityAgeDays / 365)} years`
                  : `${Math.round(carrier.authorityAgeDays / 30)} months`
                : 'Unknown'}</PreviewBlurValue>
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Revocations</span>
            <span className={`font-medium ${carrier.totalRevocations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <PreviewBlurValue>{carrier.totalRevocations}</PreviewBlurValue>
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">EIN</span>
            <span className="font-medium font-mono text-gray-900"><PreviewBlurValue>{carrier.ein || 'Not available'}</PreviewBlurValue></span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Related Carriers</span>
            <span className="font-medium text-gray-900"><PreviewBlurValue>{relatedCarriers.length}</PreviewBlurValue></span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Entity Type</span>
            <span className="font-medium text-gray-900"><PreviewBlurValue>{carrier.entityType}</PreviewBlurValue></span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Days Since Last Revocation</span>
            <span className="font-medium text-gray-900">
              <PreviewBlurValue>{carrier.daysSinceLastRevocation != null ? fmtNumber(carrier.daysSinceLastRevocation) : 'N/A'}</PreviewBlurValue>
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================
// SAFETY RECOMMENDATIONS ENGINE
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

// ============================================================
// TAB 8: SAFETY IMPROVEMENT REPORT
// ============================================================
function SafetyImprovementReportTab() {
  const {
    basicScores, basicAlerts, inspections, crashes, violationBreakdown,
    carrier, insurancePolicies, insuranceGaps, trucks, healthCategories,
    violationTrend, previewMode: pm,
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
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColors[overallGrade]} flex items-center justify-center ${pm ? 'blur-[6px] select-none' : ''}`}>
              <span className="text-2xl font-black text-white">{overallGrade}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium">Safety Grade</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
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
        <div className={`grid sm:grid-cols-3 gap-4 ${pm ? 'blur-[6px] select-none pointer-events-none' : ''}`}>
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
          <div className={`space-y-3 ${pm ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
            {basicScores.map((bs, i) => {
              const isScored = bs.score != null
              const pct = bs.percentile ?? 0
              const isAboveThreshold = isScored && pct > bs.threshold
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-40 text-sm font-medium text-gray-700 truncate">{bs.name}</div>
                  {isScored ? (
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct > bs.threshold ? 'bg-red-500' : pct >= bs.threshold * 0.85 ? 'bg-orange-400' : 'bg-emerald-400'
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
          <div className={`space-y-3 ${pm ? 'blur-[5px] select-none pointer-events-none' : ''}`}>
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
// MAIN PAGE COMPONENT
// ============================================================
export default function CarrierPulsePage({ previewMode = false }: { previewMode?: boolean } = {}) {
  const navigate = useNavigate()
  const { dotNumber: urlDotNumber } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [dotInput, setDotInput] = useState('')
  const [activeDot, setActiveDot] = useState<string | undefined>(urlDotNumber)
  const [activeTab, setActiveTab] = useState('overview')
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(getRecentSearches(user?.id))

  // Access gating
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Check access on mount
  useEffect(() => {
    // Preview mode — skip access gating, allow free search
    if (previewMode) {
      setHasAccess(true)
      setAccessChecked(true)
      return
    }

    // Admin and seller always have access (no buyer subscription check needed)
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
        // If API fails (e.g. seller/admin role), allow access
        setHasAccess(true)
      } finally {
        setAccessChecked(true)
      }
    }
    checkAccess()
  }, [user?.role, previewMode])

  // Handle purchase success return
  useEffect(() => {
    if (searchParams.get('purchase') === 'success') {
      setPurchaseSuccess(true)
      setHasAccess(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  const handleCarrierPulseCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await api.createCarrierPulseCheckout()
      if (res.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      console.error('CarrierPulse checkout error:', err)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const tabs = [...baseTabs]
  // Admin-only: Credit Report tab (Creditsafe pull, no charge to admins)
  if (user?.role === 'admin') {
    tabs.push({ id: 'credit-report', label: 'Credit Report', icon: DollarSign })
  }

  // Sync URL param
  useEffect(() => {
    if (urlDotNumber && urlDotNumber !== activeDot) {
      setActiveDot(urlDotNumber)
    }
  }, [urlDotNumber])

  // Fetch carrier data
  const { carrierReport, loading: carrierLoading, error: carrierError } = useCarrierData(activeDot)

  // FMCSA data (source of truth for BASICs, crashes, authority, cargo)
  const [smsData, setSmsData] = useState<FMCSASMSData | null>(null)
  const [fmcsaCargoTypes, setFmcsaCargoTypes] = useState<string[]>([])
  const [fmcsaAuthority, setFmcsaAuthority] = useState<FMCSAAuthorityHistory | null>(null)
  const [fmcsaInsurance, setFmcsaInsurance] = useState<FMCSAInsuranceHistory[] | null>(null)
  const fmcsaFetchedRef = useRef<string | null>(null)
  useEffect(() => {
    const dot = activeDot?.replace(/\D/g, '')
    if (!dot) return
    if (fmcsaFetchedRef.current === dot) return
    fmcsaFetchedRef.current = dot
    setSmsData(null); setFmcsaCargoTypes([]); setFmcsaAuthority(null); setFmcsaInsurance(null)
    api.fmcsaGetSMSData(dot).then(res => { if (res.success && res.data) setSmsData(res.data) }).catch(() => {})
    api.fmcsaGetCargoCarried(dot).then(res => { if (res.success && res.data) setFmcsaCargoTypes(res.data) }).catch(() => {})
    api.fmcsaGetAuthorityHistory(dot).then(res => { if (res.success && res.data) setFmcsaAuthority(res.data) }).catch(() => {})
    api.fmcsaGetInsuranceHistory(dot).then(res => { if (res.success && res.data) setFmcsaInsurance(res.data) }).catch(() => {})
  }, [activeDot])

  // Save to recent searches when data loads
  useEffect(() => {
    if (carrierReport && activeDot) {
      const name = carrierReport?.carrier?.legalName || 'Unknown Carrier'
      addRecentSearch(activeDot, name, user?.id)
      setRecentSearches(getRecentSearches(user?.id))
    }
  }, [carrierReport, activeDot])

  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'dot' | 'mc'>('dot')

  const handleSearch = async () => {
    const cleaned = dotInput.trim().replace(/\D/g, '')
    if (!cleaned) return

    if (searchMode === 'mc') {
      setSearchLoading(true)
      setSearchError(null)
      try {
        const response = await api.fmcsaLookupByMC(cleaned)
        const dotNumber = response.data?.dotNumber
        if (!dotNumber) {
          setSearchError(`No carrier found for MC# ${cleaned}. Try using a DOT number instead.`)
          setSearchLoading(false)
          return
        }
        const dot = String(dotNumber)
        setActiveDot(dot)
        setDotInput(dot)
        setActiveTab('overview')
        const basePath = window.location.pathname.replace(/\/carrier-pulse(-preview)?(\/.*)?$/, '/carrier-pulse$1')
        window.history.pushState(null, '', `${basePath}/${dot}`)
      } catch (err: any) {
        setSearchError(`Could not resolve MC# ${cleaned}. Try using a DOT number instead.`)
      } finally {
        setSearchLoading(false)
      }
    } else {
      setSearchError(null)
      setActiveDot(cleaned)
      setActiveTab('overview')
      const basePath = window.location.pathname.replace(/\/carrier-pulse(-preview)?(\/.*)?$/, '/carrier-pulse$1')
      window.history.pushState(null, '', `${basePath}/${cleaned}`)
    }
  }

  const handleSearchAnother = () => {
    setActiveDot(undefined)
    setDotInput('')
    const basePath = window.location.pathname.replace(/\/carrier-pulse(-preview)?(\/.*)?$/, '/carrier-pulse$1')
    window.history.pushState(null, '', basePath)
  }

  // Map API data
  const carrierDataCtx = useMemo<CarrierDataContextType>(() => {
    if (!carrierReport) {
      return {
        carrier: fallbackCarrier, authority: fallbackAuthority, authorityHistory: [],
        authorityPending: fallbackAuthorityPending,
        basicScores: smsData ? mapSMSToV2BasicScores(smsData) : [],
        basicAlerts: smsData ? mapToV2BasicAlerts(null, smsData) : fallbackBasicAlerts,
        violationBreakdown: fallbackViolationBreakdown, issData: fallbackISSData,
        inspections: fallbackInspections, inspectionRecords: [], operations: fallbackOperations,
        violationTrend: [], crashes: fallbackCrashes, crashRecords: [],
        insurancePolicies: [], renewalTimeline: [], policyHistory: [], insuranceGaps: [],
        trucks: [], trailers: [], sharedEquipment: fallbackSharedEquipment,
        cargoCapabilities: fallbackCargoCapabilities, documents: [], verificationChecks: [],
        availableDocuments: [], complianceFinancials: fallbackComplianceFinancials,
        relatedCarriers: [], percentiles: [], monitoringAlerts: [], riskScoreTrend: [],
        contactHistory: fallbackContactHistory, vinInspections: [], networkSignals: [],
        benchmarks: [], chameleonAnalysis: { riskScore: 0, riskLevel: 'none', flags: [], summary: '', relatedRevokedCarriers: [], linkedCarriers: [] },
        healthCategories: [], carrierLoading, carrierError, previewMode,
      }
    }

    const healthResult = calculateCarrierHealthScore(carrierReport, undefined, smsData)

    // FMCSA insurance override — detect pending cancellation that MorPro may miss
    const carrierData = mapToV2CarrierData(carrierReport)
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
      complianceFinancials: mapToV2ComplianceFinancials(undefined, carrierReport),
      relatedCarriers: mapToV2RelatedCarriers(carrierReport),
      percentiles: mapToV2Percentiles(carrierReport),
      monitoringAlerts: mapToV2MonitoringAlerts(carrierReport),
      riskScoreTrend: mapToV2RiskScoreTrend(carrierReport),
      contactHistory: mapToV2ContactHistory(carrierReport),
      vinInspections: mapToV2VinInspections(carrierReport),
      networkSignals: mapToV2NetworkSignals(carrierReport),
      benchmarks: mapToV2Benchmarks(carrierReport, smsData),
      chameleonAnalysis: detectChameleonCarrier(carrierReport),
      healthCategories: healthResult.categories,
      carrierLoading: false,
      carrierError: null,
      previewMode,
    }
  }, [carrierReport, carrierLoading, carrierError, smsData, fmcsaCargoTypes, fmcsaAuthority, fmcsaInsurance, previewMode])

  const showSkeleton = carrierLoading && !carrierReport

  // ==========================================
  // ACCESS CHECK — loading state
  // ==========================================
  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // ==========================================
  // PAYWALL — no access
  // ==========================================
  if (!hasAccess) {
    const isStarter = currentPlan === 'STARTER'
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">CarrierPulse</h1>
          <p className="text-gray-500 mt-2 mb-8">Instant carrier intelligence by DOT number</p>

          <Card padding="lg">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-4">
                <Zap className="w-4 h-4" />
                {isStarter ? 'Add to Your Plan' : 'Unlock CarrierPulse'}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isStarter ? 'Add CarrierPulse to your Starter plan' : 'Get CarrierPulse access'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Look up any carrier by DOT number. Get safety scores, authority history, insurance status, fleet details, and more — instantly.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl font-black text-gray-900">$12.99</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
              </div>

              <div className="space-y-2 text-left mb-6">
                {[
                  'Unlimited carrier lookups by DOT number',
                  'Full safety & inspection reports',
                  'Authority history & compliance data',
                  'Insurance coverage analysis',
                  'Fleet & equipment inventory',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button fullWidth size="lg" onClick={handleCarrierPulseCheckout} loading={checkoutLoading}>
                <Zap className="w-5 h-5 mr-2" />
                {isStarter ? 'Add CarrierPulse — $12.99/mo' : 'Get CarrierPulse — $12.99/mo'}
              </Button>

              {!currentPlan && (
                <p className="text-xs text-gray-400 mt-4">
                  Or <Link to="/buyer/subscription" className="text-indigo-600 hover:text-indigo-700 font-medium">upgrade to Professional</Link> to get CarrierPulse included
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
    const fmcsaComparison = [
      { feature: 'MC/DOT Lookup & Authority Status', fmcsa: true, pulse: true },
      { feature: 'Raw BASIC Safety Scores', fmcsa: true, pulse: true },
      { feature: 'Inspection & Crash Records', fmcsa: true, pulse: true },
      { feature: 'Insurance Filing Status', fmcsa: true, pulse: true },
      { feature: 'Carrier Health Score (0-100)', fmcsa: false, pulse: true },
      { feature: 'Industry Benchmarks & Comparison', fmcsa: false, pulse: true },
      { feature: 'Violation Trend Analysis (24 mo)', fmcsa: false, pulse: true },
      { feature: 'Insurance Gap Detection & Coverage Analysis', fmcsa: false, pulse: true },
      { feature: 'Fleet Age & VIN Inspection Data', fmcsa: false, pulse: true },
      { feature: 'Chameleon Carrier Detection', fmcsa: false, pulse: true },
      { feature: 'Safety Improvement Report (A+ to D)', fmcsa: false, pulse: true },
      { feature: 'Prioritized Action Plan', fmcsa: false, pulse: true },
    ]

    const pulseFeatures = [
      { icon: Activity, label: 'Health Score (0-100)', desc: 'Weighted composite score across safety, compliance, insurance, fleet & history — one number to assess any carrier' },
      { icon: ShieldAlert, label: 'Chameleon Detection', desc: 'Catch carriers hiding behind new MC numbers after shutdowns — analyzes shared EINs, officers, addresses & VINs' },
      { icon: Zap, label: 'Safety Improvement Report', desc: 'Prioritized action plan with grades A+ to D — know exactly what a carrier needs to fix and in what order' },
      { icon: BarChart3, label: 'Industry Benchmarks', desc: 'Compare OOS rates, clean inspection rates, and crash data vs national averages — instantly see who\'s above or below' },
      { icon: TrendingUp, label: 'Violation Trends', desc: '24-month trend analysis showing if safety is improving, stable, or worsening — don\'t just see a snapshot, see the direction' },
      { icon: Umbrella, label: 'Insurance Gap Analysis', desc: 'Find coverage gaps, pending cancellations & renewal timelines — know if a carrier\'s insurance is at risk before you do business' },
    ]

    return (
      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Purchase success banner */}
        {purchaseSuccess && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">CarrierPulse activated!</p>
              <p className="text-xs text-emerald-600">You now have unlimited carrier lookups. Start searching below.</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Carrier Intelligence Platform</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">CarrierPulse</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            FMCSA gives you raw data. CarrierPulse tells you what it means — health scores, risk detection, safety grades, and actionable recommendations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Search + Features */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            {/* Search Card */}
            <div className="rounded-2xl bg-white border-2 border-indigo-100 shadow-lg shadow-indigo-500/5 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Search Any Carrier</h3>
              <p className="text-sm text-gray-500 mb-4">Enter a DOT or MC number to get full carrier intelligence.</p>

              {/* Search Mode Toggle */}
              <div className="flex justify-start mb-3">
                <div className="inline-flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => { setSearchMode('dot'); setSearchError(null) }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${searchMode === 'dot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    DOT Number
                  </button>
                  <button
                    onClick={() => { setSearchMode('mc'); setSearchError(null) }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${searchMode === 'mc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    MC Number
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={dotInput}
                    onChange={e => setDotInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={searchMode === 'dot' ? 'Enter DOT number...' : 'Enter MC number...'}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-lg font-medium transition-all outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!dotInput.trim() || searchLoading}
                  className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {searchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {searchLoading ? 'Looking up...' : 'Search'}
                </button>
              </div>

              {searchError && (
                <p className="mt-3 text-sm text-red-600">{searchError}</p>
              )}
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="rounded-2xl bg-white border border-gray-200 p-5 mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Searches</p>
                <div className="space-y-1.5">
                  {recentSearches.map((s) => (
                    <button
                      key={s.dotNumber}
                      onClick={() => { setDotInput(s.dotNumber); setActiveDot(s.dotNumber); const basePath = window.location.pathname.replace(/\/carrier-pulse(-preview)?(\/.*)?$/, '/carrier-pulse$1'); window.history.pushState(null, '', `${basePath}/${s.dotNumber}`) }}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                          <Hash className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{s.carrierName}</p>
                          <p className="text-xs text-gray-400">DOT {s.dotNumber}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* What CarrierPulse gives you */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-indigo-50/30 border border-gray-200 p-5">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                What you get with CarrierPulse
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pulseFeatures.map((feature) => (
                  <div key={feature.label} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4.5 h-4.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: FMCSA vs CarrierPulse Comparison */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl bg-white border border-gray-200 shadow-lg shadow-gray-200/50 overflow-hidden sticky top-6">
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700">
                <h3 className="text-lg font-bold text-white">FMCSA Free Tools vs CarrierPulse</h3>
                <p className="text-sm text-indigo-200 mt-1">See what you're missing with free FMCSA data alone</p>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Header Row */}
                <div className="grid grid-cols-[1fr,72px,72px] px-5 py-3 bg-gray-50">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Feature</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">FMCSA</span>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider text-center">Pulse</span>
                </div>

                {fmcsaComparison.map((row, i) => (
                  <div key={i} className={`grid grid-cols-[1fr,72px,72px] px-5 py-3 items-center ${!row.fmcsa ? 'bg-indigo-50/30' : ''}`}>
                    <span className="text-sm text-gray-700">
                      {row.feature}
                    </span>
                    <span className="text-center">
                      {row.fmcsa
                        ? <CheckCircle className="w-4.5 h-4.5 text-gray-400 mx-auto" />
                        : <XCircle className="w-4.5 h-4.5 text-gray-300 mx-auto" />
                      }
                    </span>
                    <span className="text-center">
                      <CheckCircle className="w-4.5 h-4.5 text-indigo-600 mx-auto" />
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              <div className="px-5 py-5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-t border-indigo-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-gray-900">CarrierPulse</p>
                    <p className="text-xs text-gray-500">Unlimited lookups + all tools — <span className="text-indigo-600 font-bold">$14.99/mo</span></p>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20">
                      View Plans
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // ==========================================
  // REPORT VIEW — DOT entered, data loading/loaded
  // ==========================================
  const tabContent: Record<string, JSX.Element> = {
    overview: showSkeleton ? <CarrierLoadingSkeleton /> : <OverviewTab />,
    authority: showSkeleton ? <CarrierLoadingSkeleton /> : <AuthorityTab />,
    safety: showSkeleton ? <CarrierLoadingSkeleton /> : <SafetyTab />,
    insurance: showSkeleton ? <CarrierLoadingSkeleton /> : <InsuranceTab />,
    fleet: showSkeleton ? <CarrierLoadingSkeleton /> : <FleetTab />,
    chameleon: showSkeleton ? <CarrierLoadingSkeleton /> : <ChameleonTab />,
    'safety-improvement': showSkeleton ? <CarrierLoadingSkeleton /> : <SafetyImprovementReportTab />,
    'credit-report': showSkeleton ? <CarrierLoadingSkeleton /> : <CreditReportTab />,
  }

  return (
    <PreviewModeContext.Provider value={previewMode}>
    <CarrierDataContext.Provider value={carrierDataCtx}>
      <div className="space-y-6">
        {/* Error State */}
        {carrierError && !carrierReport && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Carrier Not Found</h2>
            <p className="text-gray-500 mb-6 max-w-md">
              {carrierError.includes('not available') ? `No carrier data found for DOT ${activeDot}. Please check the number and try again.` : carrierError}
            </p>
            <button onClick={handleSearchAnother}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Another
            </button>
          </div>
        )}

        {/* Loading + Hero + Tabs */}
        {(!carrierError || carrierReport) && (
          <>
            {/* Back to Search bar */}
            <button
              onClick={handleSearchAnother}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
              New Search
            </button>

            {/* Hero Header */}
            {carrierReport && <PulseHeroHeader onSearchAnother={handleSearchAnother} />}
            {showSkeleton && !carrierReport && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Loading carrier intelligence for DOT {activeDot}...</p>
                </div>
              </div>
            )}

            {/* Tabs + Content */}
            {carrierReport && (
              <>
                <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {previewMode && activeTab !== 'overview' ? (
                      <div className="relative">
                        {/* Sticky CTA Banner */}
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="sticky top-0 z-30 mb-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-lg shadow-indigo-500/25"
                        >
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm">Preview Mode</p>
                                <p className="text-indigo-100 text-xs">
                                  {activeTab === 'safety' ? 'Unlock full safety scores, BASIC analysis & inspection records'
                                    : activeTab === 'insurance' ? 'Unlock full insurance coverage, policy details & gap analysis'
                                    : activeTab === 'fleet' ? 'Unlock full fleet inventory, VIN details & driver data'
                                    : activeTab === 'authority' ? 'Unlock full authority details, cargo capabilities & compliance data'
                                    : activeTab === 'chameleon' ? 'Unlock chameleon carrier detection & related carrier analysis'
                                    : 'Unlock detailed safety recommendations & action plan'}
                                </p>
                              </div>
                            </div>
                            <Link to={!user ? '/register' : '/pricing'}>
                              <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm whitespace-nowrap">
                                {!user ? <Lock className="w-3.5 h-3.5 mr-1.5" /> : <Crown className="w-3.5 h-3.5 mr-1.5" />}
                                {!user ? 'Sign Up Free' : 'View Plans'}
                              </Button>
                            </Link>
                          </div>
                        </motion.div>

                        {/* Tab content with granular blurs applied inside each tab */}
                        {tabContent[activeTab]}

                        {/* Bottom CTA */}
                        <div className="mt-6 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-8 text-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
                            <Lock className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {!user ? 'Ready to see the full picture?' : 'Unlock complete carrier intelligence'}
                          </h3>
                          <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                            {!user
                              ? 'Create a free account to access detailed carrier data across all tabs — safety scores, insurance, fleet data, and more.'
                              : 'Subscribe to CarrierPulse for full access to unblurred carrier data, safety reports, and chameleon detection.'}
                          </p>
                          <Link to={!user ? '/register' : '/pricing'}>
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                              {!user ? 'Create Free Account' : 'View Plans & Pricing'}
                              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      tabContent[activeTab]
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </div>
    </CarrierDataContext.Provider>
    </PreviewModeContext.Provider>
  )
}
