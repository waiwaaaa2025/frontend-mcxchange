// Maps MorPro Carrier API response → V2 TypeScript interfaces
// Handles null/missing data gracefully with sensible defaults

import type { MCListingExtended, FMCSASMSData, FMCSASMSBasic } from '../types'
import type {
  V2CarrierData, V2AuthorityData, V2AuthorityEvent, V2BasicScore,
  V2InspectionSummary, V2CrashData, V2InsurancePolicy, V2RenewalEvent,
  V2PolicyEvent, V2TruckData, V2TrailerData, V2InspectionRecord,
  V2CrashRecord, V2ISSData, V2OperationsSummary, V2ViolationBreakdown,
  V2SharedEquipment, V2AuthorityPending, V2BasicAlerts, V2ContactHistory,
  V2CargoCapabilities, V2ComplianceFinancials, V2AvailableDocument,
  V2MonitoringAlert, V2RiskScoreTrend, V2InsuranceGap, V2ViolationTrend,
  V2RelatedCarrier, V2CarrierPercentile, V2DocumentItem,
  V2VinInspection, V2NetworkSignal, V2BenchmarkData,
  V2ChameleonAnalysis, V2ChameleonFlag, ChameleonSeverity, V2ChameleonLinkedCarrier,
} from '../components/v2/mockData'

// ============================================================
// INSURANCE SANITIZER — stopgap for upstream MorPro bug
// ============================================================
// MorPro /api/carriers/:dot/insurance joins cancel events to active filings
// by policyNumber alone. When a carrier re-files the same policy number, the
// cancellation of the predecessor filing bleeds into the active filing's
// status, producing status:"cancelled" + a bogus gap between predecessor and
// successor. Strip both out when the cancel pre-dates the active filing.
// TODO: remove once MorPro API ships the effective-date guard on the join.
function sanitizeMorProInsurance(insurance: any): any {
  if (!insurance) return {}
  const activePolicies = insurance.activePolicies || []
  if (activePolicies.length === 0) return insurance
  const history = insurance.history || []

  const ts = (s: any): number => {
    if (!s) return NaN
    const d = new Date(s)
    return isNaN(d.getTime()) ? NaN : d.getTime()
  }

  const cleaned = activePolicies.map((p: any) => {
    const eff = ts(p.effectiveDate)
    if (isNaN(eff)) return p
    const realCancel = history.some((h: any) =>
      String(h.policyNumber) === String(p.policyNumber) && ts(h.cancelDate) > eff,
    )
    if (!realCancel && (String(p.status || '').toLowerCase() === 'cancelled' || p.cancelDate || p.cancelMethod)) {
      return { ...p, status: 'active', cancelDate: null, cancelMethod: null }
    }
    return p
  })

  const maxEff = Math.max(
    ...cleaned.map((p: any) => ts(p.effectiveDate)).filter((n: number) => !isNaN(n)),
    -Infinity,
  )
  const gaps = (insurance.gaps || []).filter((g: any) => {
    const end = ts(g.gapEnd)
    return isNaN(end) || end > maxEff
  })

  return { ...insurance, activePolicies: cleaned, gaps }
}

// ============================================================
// INSPECTION RECORD FILTERING — 24-month window + dedup
// ============================================================

/**
 * Filters and deduplicates inspection records to match FMCSA SAFER Snapshot.
 * 1. Date filter: only records within 24 months of today
 * 2. Dedup: MCMIS can send both original + amended — keep latest by unique_id
 * 3. Returns filtered records sorted newest-first
 */
function filterInspectionRecords(records: any[]): any[] {
  if (!records || records.length === 0) return []

  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - 24)

  // Dedup by unique_id — keep the record that appears later in the array (amended)
  const byId = new Map<string, any>()
  for (const r of records) {
    const id = r.unique_id || r.id
    if (id) byId.set(String(id), r) // last write wins = amended record
  }
  const deduped = byId.size > 0 ? Array.from(byId.values()) : records

  // Date filter: only keep records within 24-month window
  const filtered = deduped.filter((r: any) => {
    const dateStr = r.date || r.inspection_date
    if (!dateStr) return true // include records with no date (let API handle)
    try {
      const d = new Date(dateStr)
      return !isNaN(d.getTime()) && d >= cutoffDate
    } catch {
      return true
    }
  })

  // Sort newest first
  filtered.sort((a: any, b: any) => {
    const da = new Date(a.date || a.inspection_date || 0).getTime()
    const db = new Date(b.date || b.inspection_date || 0).getTime()
    return db - da
  })

  return filtered
}

/**
 * Counts inspections by type based on FMCSA inspection levels:
 * - Level 1 (Full): counts as both vehicle + driver
 * - Level 2 (Walk-Around): counts as vehicle + driver
 * - Level 3 (Driver-Only): counts as driver only
 * - Level 4 (Special): counts as vehicle only
 * - Level 5 (Terminal): counts as vehicle only
 * - Level 6 (Enhanced NAS): counts as vehicle + driver
 */
function countInspectionsByType(records: any[]): {
  vehicleInsp: number; driverInsp: number; hazmatInsp: number; iepInsp: number
  vehicleOOS: number; driverOOS: number; hazmatOOS: number; iepOOS: number
} {
  let vehicleInsp = 0, driverInsp = 0, hazmatInsp = 0, iepInsp = 0
  let vehicleOOS = 0, driverOOS = 0, hazmatOOS = 0, iepOOS = 0

  for (const r of records) {
    const level = String(r.level || '').trim()
    const p = (v: any) => parseInt(v) || 0

    // Vehicle inspections: Levels 1, 2, 4, 5, 6
    if (['1', '2', '4', '5', '6'].includes(level)) {
      vehicleInsp++
      vehicleOOS += p(r.vehicle_oos_total) > 0 ? 1 : 0
    }

    // Driver inspections: Levels 1, 2, 3, 6
    if (['1', '2', '3', '6'].includes(level)) {
      driverInsp++
      driverOOS += p(r.driver_oos_total) > 0 ? 1 : 0
    }

    // Hazmat: only if hazmat OOS field present and > 0, or marked as hazmat inspection
    if (p(r.hazmat_oos_total) > 0) {
      hazmatInsp++
      hazmatOOS++
    }

    // IEP: no standard level indicator from API, skip for now
  }

  return { vehicleInsp, driverInsp, hazmatInsp, iepInsp, vehicleOOS, driverOOS, hazmatOOS, iepOOS }
}

// ============================================================
// CARRIER HEALTH SCORE — Computed from real data
// ============================================================
export interface HealthCategory {
  name: string
  weight: number
  score: number
  color: string
}

export function calculateCarrierHealthScore(
  report: any,
  listing?: MCListingExtended,
  smsData?: FMCSASMSData | null,
): {
  score: number
  categories: HealthCategory[]
} {
  const carrier = report?.carrier || {}
  const safety = report?.safety || {}
  const inspections = report?.inspections || {}
  const insurance = sanitizeMorProInsurance(report?.insurance)
  const fleet = report?.fleet || {}
  const authority = report?.authority || {}
  const crashes = report?.crashes || {}

  // === 1. SAFETY SCORE (25% weight) ===
  // Based on BASIC scores, OOS rates, and crash history
  let safetyScore = 100

  // Use FMCSA SMS basics (source of truth) when available, fall back to MorPro
  const smsBasics = (smsData && smsData.basics.length > 0) ? smsData.basics : null
  if (smsBasics) {
    // Only scored BASICs count — FMCSA only returns BASICs with enough data
    const scoredBasics = smsBasics.filter(b => b.percentile > 0)
    if (scoredBasics.length > 0) {
      const avgPercentile = scoredBasics.reduce((s, b) => s + b.percentile, 0) / scoredBasics.length
      safetyScore -= Math.min(avgPercentile * 0.6, 50)
    }
    // Penalize for BASICs exceeding threshold
    const exceedCount = smsBasics.filter(b => b.exceedsThreshold).length
    safetyScore -= exceedCount * 5
  } else {
    // Fall back to MorPro
    const basicScores = safety.basicScores || []
    if (basicScores.length > 0) {
      // Only count non-zero scores (0 likely means not scored)
      const scored = basicScores.filter((b: any) => (b.percentile ?? b.measure ?? 0) > 0)
      if (scored.length > 0) {
        const avgPercentile = scored.reduce((s: number, b: any) => s + (b.percentile ?? b.measure ?? 0), 0) / scored.length
        safetyScore -= Math.min(avgPercentile * 0.6, 50)
      }
    }
    const alerts = safety.basicAlerts || {}
    const alertCount = Object.values(alerts).filter(Boolean).length
    safetyScore -= alertCount * 5
  }

  // Penalize for crashes
  const crashSummary = crashes.summary || {}
  const totalCrashes = crashSummary.total || crashSummary.totalCrashes || 0
  const fatalCrashes = crashSummary.fatal || crashSummary.fatalCrashes || 0
  safetyScore -= totalCrashes * 3
  safetyScore -= fatalCrashes * 10

  // Use SMS crash data as alternative source
  if (totalCrashes === 0 && smsData) {
    safetyScore -= (smsData.totalCrashes || 0) * 3
    safetyScore -= (smsData.fatalCrashes || 0) * 10
  }

  // Safety rating bonus
  const rawRating = carrier.safetyRating || safety?.safetyRating?.rating
  if (rawRating) {
    const lower = String(rawRating).toLowerCase()
    if (lower === 'satisfactory' || lower === 's') safetyScore += 5
    else if (lower === 'conditional' || lower === 'c') safetyScore -= 15
    else if (lower === 'unsatisfactory' || lower === 'u') safetyScore -= 30
  }

  safetyScore = Math.max(0, Math.min(100, Math.round(safetyScore)))

  // === 2. COMPLIANCE SCORE (25% weight) ===
  let complianceScore = 50

  // Active operating authority
  const opStatus = carrier.operatingStatus || carrier.allowedToOperate
  if (opStatus === 'A' || opStatus === 'Y' || opStatus === 'authorized' || opStatus === 'AUTHORIZED') {
    complianceScore += 20
  }

  // Authority types active
  const statuses = authority.statuses || {}
  const commonActive = String(statuses.commonAuthorityStatus || statuses.common || '').toLowerCase()
  const contractActive = String(statuses.contractAuthorityStatus || statuses.contract || '').toLowerCase()
  if (commonActive === 'active' || commonActive === 'a') complianceScore += 10
  if (contractActive === 'active' || contractActive === 'a') complianceScore += 5

  // MCS-150 filing recency
  const mcs150Date = carrier.mcs150Date || carrier.mcs150FormDate
  if (mcs150Date) {
    const mcsDate = new Date(mcs150Date)
    const daysSinceMcs = (Date.now() - mcsDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceMcs <= 730) complianceScore += 10
    else complianceScore -= 10
  } else {
    complianceScore -= 5
  }

  // Revocations
  const totalRevocations = carrier.totalRevocations || 0
  complianceScore -= totalRevocations * 10

  // BOC-3 on file
  const docs = report?.documents || {}
  if (docs.boc3?.onFile) complianceScore += 5

  complianceScore = Math.max(0, Math.min(100, Math.round(complianceScore)))

  // === 3. INSURANCE SCORE (20% weight) ===
  let insuranceScore = 30

  const activePolicies = insurance.activePolicies || []
  if (activePolicies.length > 0) {
    insuranceScore += 30
    const bipdPolicy = activePolicies.find((p: any) => {
      const t = String(p.insuranceType || p.type || '').toLowerCase()
      return t.includes('bipd') || t.includes('liability') || t.includes('bodily')
    })
    if (bipdPolicy) {
      const coverage = bipdPolicy.coverageAmount || bipdPolicy.coverage || 0
      if (coverage >= 1000000) insuranceScore += 20
      else if (coverage >= 750000) insuranceScore += 15
      else if (coverage >= 300000) insuranceScore += 10
    }
    const cargoPolicy = activePolicies.find((p: any) => {
      const t = String(p.insuranceType || p.type || '').toLowerCase()
      return t.includes('cargo')
    })
    if (cargoPolicy) insuranceScore += 10
    if (activePolicies.length >= 3) insuranceScore += 10
  } else {
    // Fall back to FMCSA/listing data when MorPro has no policy details
    const hasInsurance = listing?.insuranceOnFile || carrier.insuranceOnFile
    if (hasInsurance) {
      insuranceScore += 30 // Insurance is on file with FMCSA
      const bipdOnFile = carrier.bipdOnFile || listing?.bipdCoverage || 0
      const bipdAmount = typeof bipdOnFile === 'string' ? parseFloat(bipdOnFile) : bipdOnFile
      if (bipdAmount >= 1000000) insuranceScore += 20
      else if (bipdAmount >= 750000) insuranceScore += 15
      else if (bipdAmount >= 300000) insuranceScore += 10
      const cargoOnFile = carrier.cargoOnFile || listing?.cargoCoverage || 0
      const cargoAmount = typeof cargoOnFile === 'string' ? parseFloat(cargoOnFile) : cargoOnFile
      if (cargoAmount > 0) insuranceScore += 10
    }
  }

  // Penalize for gaps
  const gaps = insurance.gaps || []
  const activeGaps = gaps.filter((g: any) => g.status === 'active')
  insuranceScore -= activeGaps.length * 15

  insuranceScore = Math.max(0, Math.min(100, Math.round(insuranceScore)))

  // === 4. FLEET SCORE (15% weight) ===
  let fleetScore = 60

  const trucks = fleet.trucks || []
  const powerUnits = carrier.totalPowerUnits || carrier.powerUnits || listing?.fleetSize || trucks.length || 0

  if (powerUnits > 0) {
    fleetScore += 10
    if (trucks.length > 0) {
      const avgYear = trucks.reduce((s: number, t: any) => s + (t.year || t.model_year || 0), 0) / trucks.length
      const currentYear = new Date().getFullYear()
      if (avgYear > 0) {
        const age = currentYear - avgYear
        if (age <= 3) fleetScore += 15
        else if (age <= 5) fleetScore += 10
        else if (age <= 8) fleetScore += 5
        else if (age > 12) fleetScore -= 10
      }
    }

    // Vehicle OOS rate — use SMS data, inspectionTotals, or records
    let vehicleOOSRate = 0
    if (smsData && smsData.totalVehicleInspections > 0) {
      vehicleOOSRate = (smsData.vehicleOosInspections / smsData.totalVehicleInspections) * 100
    } else {
      const inspTotals = safety.inspectionTotals || {}
      if (parseFloat(inspTotals.vehicle) > 0) {
        vehicleOOSRate = (parseFloat(inspTotals.vehicleOOS) || 0) / parseFloat(inspTotals.vehicle) * 100
      } else {
        const filteredRecs = filterInspectionRecords(inspections.records || [])
        const typeCounts = countInspectionsByType(filteredRecs)
        if (typeCounts.vehicleInsp > 0) {
          vehicleOOSRate = (typeCounts.vehicleOOS / typeCounts.vehicleInsp) * 100
        }
      }
    }
    if (vehicleOOSRate > 30) fleetScore -= 20
    else if (vehicleOOSRate > 20) fleetScore -= 10
    else if (vehicleOOSRate < 10) fleetScore += 10
  }

  // Shared equipment risk
  const sharedEquipment = fleet.sharedEquipment || {}
  const sharedCount = sharedEquipment.countSharedVins || sharedEquipment.totalShared || 0
  if (sharedCount > 5) fleetScore -= 15
  else if (sharedCount > 0) fleetScore -= 5

  fleetScore = Math.max(0, Math.min(100, Math.round(fleetScore)))

  // === 5. HISTORY SCORE (15% weight) ===
  let historyScore = 50

  const yearsActive = parseFloat(carrier.yearsActive) || listing?.yearsActive || 0
  if (yearsActive >= 10) historyScore += 25
  else if (yearsActive >= 5) historyScore += 20
  else if (yearsActive >= 3) historyScore += 15
  else if (yearsActive >= 1) historyScore += 5
  else historyScore -= 10

  // Clean inspection rate — use SMS totals or records
  const totalInsp = smsData?.totalInspections || 0
  if (totalInsp > 0 && smsData) {
    // SMS gives us total inspections and OOS counts but not clean count directly
    // Use records if available for clean rate
    const records = filterInspectionRecords(inspections.records || [])
    if (records.length > 0) {
      const cleanCount = records.filter((r: any) => (r.viol_total || r.violations || 0) === 0).length
      const cleanRate = cleanCount / records.length
      if (cleanRate >= 0.8) historyScore += 15
      else if (cleanRate >= 0.6) historyScore += 10
      else if (cleanRate >= 0.4) historyScore += 5
      else if (cleanRate < 0.2) historyScore -= 10
    }
  } else {
    const records = inspections.records || []
    if (records.length > 0) {
      const cleanCount = records.filter((r: any) => (r.viol_total || r.violations || 0) === 0).length
      const cleanRate = cleanCount / records.length
      if (cleanRate >= 0.8) historyScore += 15
      else if (cleanRate >= 0.6) historyScore += 10
      else if (cleanRate >= 0.4) historyScore += 5
      else if (cleanRate < 0.2) historyScore -= 10
    }
  }

  // Authority age
  const authorityAgeDays = carrier.authorityAgeDays || 0
  if (authorityAgeDays > 1825) historyScore += 10
  else if (authorityAgeDays < 365) historyScore -= 5

  historyScore = Math.max(0, Math.min(100, Math.round(historyScore)))

  // === WEIGHTED COMPOSITE ===
  const categories: HealthCategory[] = [
    { name: 'Safety', weight: 25, score: safetyScore, color: '#10b981' },
    { name: 'Compliance', weight: 25, score: complianceScore, color: '#6366f1' },
    { name: 'Insurance', weight: 20, score: insuranceScore, color: '#06b6d4' },
    { name: 'Fleet', weight: 15, score: fleetScore, color: '#f59e0b' },
    { name: 'History', weight: 15, score: historyScore, color: '#8b5cf6' },
  ]

  const compositeScore = Math.round(
    categories.reduce((sum, cat) => sum + (cat.score * cat.weight / 100), 0)
  )

  return { score: compositeScore, categories }
}

// Extract MC number from documents (BOC-3 docket or dockets array)
function extractMCFromDocs(docs: any): string {
  if (!docs) return ''
  // Check dockets array first
  if (Array.isArray(docs.dockets)) {
    const mc = docs.dockets.find((d: any) => d.prefix === 'MC' || (d.docket_number || '').startsWith('MC'))
    if (mc) return String(mc.docket_number || mc.number || '').replace(/^MC/, '')
  }
  // Fall back to BOC-3 docket_number
  const boc3Docket = docs.boc3?.data?.docket_number || ''
  if (boc3Docket.startsWith('MC')) return boc3Docket.replace(/^MC/, '')
  return ''
}

// ============================================================
// CORE: Merge API + Listing → V2CarrierData
// ============================================================
export function mapToV2CarrierData(report: any, listing?: MCListingExtended): V2CarrierData {
  const carrier = report?.carrier || {}
  const safety = report?.safety || {}
  const fleet = report?.fleet || {}

  const location = carrier.location
    ? `${carrier.location.city || ''}, ${carrier.location.state || ''}`.replace(/^, |, $/, '')
    : `${listing?.city || ''}, ${listing?.state || ''}`.replace(/^, |, $/, '')

  const address = carrier.location
    ? `${carrier.location.street || ''}, ${carrier.location.city || ''}, ${carrier.location.state || ''} ${carrier.location.zip || ''}`.trim()
    : listing?.address || ''

  // Derive operatingStatus — check allowedToOperate first (clear Y/N from FMCSA),
  // then authorizedForHire, then operatingStatus which may be an authority type code (A/C/B/E).
  const allowed = carrier.allowedToOperate
  const opStatus = carrier.operatingStatus
  const authForHire = carrier.authorizedForHire
  let operatingStatus: 'authorized' | 'not-authorized' | 'pending' = 'not-authorized'
  if (allowed === 'Y' || allowed === 'A' || allowed === 'authorized' || allowed === 'AUTHORIZED') {
    operatingStatus = 'authorized'
  } else if (allowed === 'N') {
    operatingStatus = 'not-authorized'
  } else if (authForHire === true || authForHire === 'Y' || authForHire === 'True' || authForHire === 'TRUE') {
    operatingStatus = 'authorized'
  } else if (opStatus === 'A' || opStatus === 'Y' || opStatus === 'authorized' || opStatus === 'AUTHORIZED') {
    operatingStatus = 'authorized'
  } else if (opStatus === 'C' || opStatus === 'B' || opStatus === 'E') {
    // Authority type codes (C=Common, B=Broker, E=Contract) indicate active authority
    operatingStatus = 'authorized'
  } else if (opStatus === 'pending') {
    operatingStatus = 'pending'
  } else if (opStatus === 'N' || opStatus === 'not-authorized' || opStatus === 'NOT AUTHORIZED' || opStatus === 'revoked' || opStatus === 'REVOKED') {
    operatingStatus = 'not-authorized'
  } else if (listing?.status?.toUpperCase() === 'ACTIVE') {
    // Fallback: if the listing is active, default to authorized
    operatingStatus = 'authorized'
  }

  // Safety rating normalization
  const rawSafety = carrier.safetyRating || safety?.safetyRating?.rating
  let safetyRating: 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not-rated' = 'not-rated'
  if (rawSafety) {
    const lower = String(rawSafety).toLowerCase()
    if (lower === 'satisfactory' || lower === 's') safetyRating = 'satisfactory'
    else if (lower === 'conditional' || lower === 'c') safetyRating = 'conditional'
    else if (lower === 'unsatisfactory' || lower === 'u') safetyRating = 'unsatisfactory'
  }

  // Insurance status: derived from insurance data
  // Check active policies, renewal urgency, and cancellation status
  const insurance = sanitizeMorProInsurance(report?.insurance)
  const activePolicies = insurance.activePolicies || []
  const renewalTimeline = insurance.renewalTimeline || []
  let insuranceStatus: 'current' | 'expired' | 'pending' = 'expired'
  if (activePolicies.length > 0) {
    // Check if any policy has a pending cancellation
    const hasCancelPending = activePolicies.some((p: any) =>
      p.cancelDate || p.cancelMethod || String(p.status || '').toLowerCase() === 'cancelled'
    )
    // Check renewal urgency
    const hasExpiredRenewal = renewalTimeline.some((r: any) => r.urgency === 'expired')
    const hasCriticalRenewal = renewalTimeline.some((r: any) => r.urgency === 'critical')
    if (hasCancelPending || hasExpiredRenewal) insuranceStatus = 'pending'
    else if (hasCriticalRenewal) insuranceStatus = 'pending'
    else insuranceStatus = 'current'
  } else if (listing?.insuranceOnFile) {
    insuranceStatus = 'current'
  }

  return {
    mcNumber: listing?.mcNumber || carrier.mcNumber || extractMCFromDocs(report?.documents) || '',
    dotNumber: listing?.dotNumber || String(carrier.dotNumber || ''),
    legalName: carrier.legalName || listing?.legalName || '',
    dbaName: carrier.dbaName || listing?.dbaName || '',
    location,
    address,
    phone: carrier.phone || listing?.contactPhone || '',
    yearsActive: parseFloat(carrier.yearsActive) || listing?.yearsActive || 0,
    powerUnits: carrier.totalPowerUnits || carrier.powerUnits || listing?.fleetSize || 0,
    drivers: carrier.totalDrivers || listing?.totalDrivers || 0,
    mcs150Date: normalizeDate(carrier.mcs150Date || carrier.mcs150FormDate || ''),
    registrantDate: normalizeDate(carrier.registrantDate || carrier.applicationDate || ''),
    trustScore: 0,          // Not available yet from API
    riskScore: 0,           // Not available yet from API
    safetyRating,
    insuranceStatus,
    listingPrice: listing?.listingPrice || listing?.askingPrice || listing?.price || 0,
    description: listing?.description || '',
    operatingStatus,
    entityType: carrier.entityType || carrier.carrierOperation || 'Carrier',
    cargoTypes: listing?.operationType || [],
    amazonRelayScore: listing?.amazonRelayScore || '',
    highwaySetup: listing?.highwaySetup || false,
    sellingWithEmail: listing?.sellingWithEmail || false,
    sellingWithPhone: listing?.sellingWithPhone || false,
    ein: carrier.ein ? String(carrier.ein) : '',
    emailDomain: carrier.emailDomain || '',
    fax: carrier.fax || '',
    cellphone: carrier.cellphone || '',
    primaryContact: carrier.primaryContact || '',
    secondaryContact: carrier.secondaryContact || '',
    mcs150Mileage: parseInt(carrier.mcs150Mileage) || 0,
    authorityAgeDays: carrier.authorityAgeDays || 0,
    totalRevocations: carrier.totalRevocations || 0,
    daysSinceLastRevocation: carrier.daysSinceLastRevocation ?? null,
    ownedTractors: carrier.ownedTractors || fleet?.ownedTractors || 0,
    termLeasedTractors: carrier.termLeasedTractors || fleet?.termLeasedTractors || 0,
    totalDriversCDL: carrier.totalDriversCDL || carrier.totalDrivers || 0,
    driversInterstate100mi: carrier.driversInterstate100mi || 0,
    driversInterstateBeyond100mi: carrier.driversInterstateBeyond100mi || 0,
    smartwayFlag: false,    // Not available yet
    carbtruFlag: false,     // Not available yet
    phmsaFlag: carrier.phmsaFlag || false,
    carrierHealthScore: calculateCarrierHealthScore(report, listing).score,
  }
}

// ============================================================
// AUTHORITY
// ============================================================
export function mapToV2AuthorityData(report: any, fmcsaAuth?: any): V2AuthorityData {
  const auth = report?.authority || {}
  const statuses = auth.statuses || auth || {}
  const timeline = auth.timeline || []



  function mapStatus(s: string | undefined | null): 'active' | 'inactive' | 'revoked' {
    if (!s) return 'inactive'
    const lower = String(s).toLowerCase().trim()
    // FMCSA returns: 'ACTIVE', 'A', 'ACTIVE - PENDING' etc.
    if (lower === 'active' || lower === 'a' || lower.startsWith('active') || lower === 'y' || lower === 'yes' || lower === 'grant' || lower === 'granted') return 'active'
    if (lower === 'revoked' || lower === 'r' || lower.startsWith('revok')) return 'revoked'
    // 'NONE', 'N/A', 'INACTIVE', 'I', 'PENDING', 'NOT AUTHORIZED', etc.
    return 'inactive'
  }

  // If we have FMCSA authority data (source of truth), use it directly
  if (fmcsaAuth) {
    // FMCSA may return an array of authority entries (one per type: C=Common, E=Contract, B=Broker)
    if (Array.isArray(fmcsaAuth)) {
      const result: V2AuthorityData = {
        common: { status: 'inactive', grantedDate: '', effectiveDate: '' },
        contract: { status: 'inactive', grantedDate: '', effectiveDate: '' },
        broker: { status: 'inactive', grantedDate: '', effectiveDate: '' },
      }
      for (const item of fmcsaAuth) {
        const type = String(item.authTypeCd || item.authorityType || '').toUpperCase()
        const status = mapStatus(item.authActCd || item.authStatus || item.status)
        const grantDate = normalizeDate(item.authGrantDt || item.grantDate || item.grantDt || '')
        const effDate = normalizeDate(item.effectiveDt || item.effDt || item.authGrantDt || '')

        if (type === 'C' || type === 'COMMON') {
          result.common = { status, grantedDate: grantDate, effectiveDate: effDate }
        } else if (type === 'E' || type === 'CONTRACT') {
          result.contract = { status, grantedDate: grantDate, effectiveDate: effDate }
        } else if (type === 'B' || type === 'BROKER') {
          result.broker = { status, grantedDate: grantDate, effectiveDate: effDate }
        }
      }
      return result
    }

    // Single object format — check if it has real data (not all N/A)
    const hasRealData = (fmcsaAuth.commonAuthorityStatus && fmcsaAuth.commonAuthorityStatus !== 'N/A')
      || (fmcsaAuth.contractAuthorityStatus && fmcsaAuth.contractAuthorityStatus !== 'N/A')
      || (fmcsaAuth.brokerAuthorityStatus && fmcsaAuth.brokerAuthorityStatus !== 'N/A')
    if (hasRealData) {
      return {
        common: {
          status: mapStatus(fmcsaAuth.commonAuthorityStatus),
          grantedDate: normalizeDate(fmcsaAuth.commonAuthorityGrantDate || fmcsaAuth.grantDate || ''),
          effectiveDate: normalizeDate(fmcsaAuth.effectiveDate || fmcsaAuth.commonAuthorityGrantDate || ''),
        },
        contract: {
          status: mapStatus(fmcsaAuth.contractAuthorityStatus),
          grantedDate: normalizeDate(fmcsaAuth.contractAuthorityGrantDate || ''),
          effectiveDate: normalizeDate(fmcsaAuth.contractAuthorityGrantDate || ''),
        },
        broker: {
          status: mapStatus(fmcsaAuth.brokerAuthorityStatus),
          grantedDate: normalizeDate(fmcsaAuth.brokerAuthorityGrantDate || ''),
          effectiveDate: normalizeDate(fmcsaAuth.brokerAuthorityGrantDate || ''),
        },
      }
    }
    // All N/A — fall through to MorPro data below
  }

  // Also check carrier-level fields (some APIs put authority status on the carrier object)
  const carrier = report?.carrier || {}

  // The API returns statuses as nested objects: statuses.common.status
  // OR as flat fields: statuses.commonAuthorityStatus
  // OR at the carrier level: carrier.commonAuthorityStatus
  function getStatus(key: string): string | undefined {
    // Nested: statuses.common.status
    if (statuses[key]?.status) return statuses[key].status
    // Flat on statuses: statuses.commonAuthorityStatus
    if (statuses[`${key}AuthorityStatus`]) return statuses[`${key}AuthorityStatus`]
    // Flat on auth root: auth.commonAuthorityStatus
    if (auth[`${key}AuthorityStatus`]) return auth[`${key}AuthorityStatus`]
    // On carrier object: carrier.commonAuthorityStatus
    if (carrier[`${key}AuthorityStatus`]) return carrier[`${key}AuthorityStatus`]
    // Simple key on statuses: statuses.common (as a string value)
    if (typeof statuses[key] === 'string') return statuses[key]
    return undefined
  }

  function getDate(key: string, dateField: string): string {
    // Nested: statuses.common.grantedDate
    if (statuses[key]?.[dateField]) return normalizeDate(statuses[key][dateField])
    // Flat key pattern: commonAuthorityGrantDate / commonAuthorityGrantedDate
    const flatKey = `${key}Authority${dateField.charAt(0).toUpperCase() + dateField.slice(1)}`
    return normalizeDate(statuses[flatKey] || auth[flatKey] || carrier[flatKey] || '')
  }

  // Derive authority statuses from timeline if direct statuses are null
  // Look for the most recent GRANTED/DISMISSED event per docket type
  function deriveStatusFromTimeline(docketKeyword: string): { status: 'active' | 'inactive' | 'revoked'; grantedDate: string } {
    const relevant = timeline
      .filter((e: any) => (e.docket || '').toLowerCase().includes(docketKeyword))
      .sort((a: any, b: any) => {
        const da = new Date(normalizeDate(a.date || ''))
        const db = new Date(normalizeDate(b.date || ''))
        return db.getTime() - da.getTime()
      })

    if (relevant.length === 0) return { status: 'inactive', grantedDate: '' }

    const latest = relevant[0]
    const event = String(latest.event || '').toLowerCase()
    if (event.includes('granted')) return { status: 'active', grantedDate: normalizeDate(latest.date || '') }
    if (event.includes('revoked')) return { status: 'revoked', grantedDate: normalizeDate(latest.date || '') }
    // DISMISSED = authority was denied/removed
    if (event.includes('dismissed')) return { status: 'inactive', grantedDate: normalizeDate(latest.date || '') }

    return { status: 'inactive', grantedDate: normalizeDate(latest.date || '') }
  }

  // Try direct statuses first, fall back to timeline derivation
  const commonStatus = getStatus('common')
  const contractStatus = getStatus('contract')
  const brokerStatus = getStatus('broker')

  const commonDerived = !commonStatus ? deriveStatusFromTimeline('common') : null
  const contractDerived = !contractStatus ? deriveStatusFromTimeline('contract') : null
  const brokerDerived = !brokerStatus ? deriveStatusFromTimeline('broker') : null

  return {
    common: {
      status: commonDerived ? commonDerived.status : mapStatus(commonStatus),
      grantedDate: commonDerived ? commonDerived.grantedDate : getDate('common', 'grantedDate'),
      effectiveDate: commonDerived ? commonDerived.grantedDate : getDate('common', 'effectiveDate'),
    },
    contract: {
      status: contractDerived ? contractDerived.status : mapStatus(contractStatus),
      grantedDate: contractDerived ? contractDerived.grantedDate : getDate('contract', 'grantedDate'),
      effectiveDate: contractDerived ? contractDerived.grantedDate : getDate('contract', 'effectiveDate'),
    },
    broker: {
      status: brokerDerived ? brokerDerived.status : mapStatus(brokerStatus),
      grantedDate: brokerDerived ? brokerDerived.grantedDate : getDate('broker', 'grantedDate'),
      effectiveDate: brokerDerived ? brokerDerived.grantedDate : getDate('broker', 'effectiveDate'),
    },
  }
}

export function mapToV2AuthorityHistory(report: any): V2AuthorityEvent[] {
  const timeline = report?.authority?.timeline || []
  return timeline.map((e: any) => {
    // Build a descriptive event string including the docket if available
    const eventAction = e.event || e.description || ''
    const docket = e.docket || ''
    const eventText = docket ? `${eventAction} — ${docket}` : eventAction

    return {
      date: normalizeDate(e.date || e.eventDate || ''),
      event: eventText,
      // The API puts the action in `event` (GRANTED, DISMISSED, etc.)
      // and `type` is always "authority" — so map from `event` field
      type: mapEventType(e.event || e.type || e.eventType || ''),
    }
  })
}

/**
 * Normalize dates from various formats to ISO (YYYY-MM-DD).
 * Handles: "MM/DD/YYYY", "MM-DD-YYYY", "15-JUL-19", ISO strings, etc.
 */
const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  // Already ISO format (YYYY-MM-DD or full ISO timestamp)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10)
  // MM/DD/YYYY or MM-DD-YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slashMatch) {
    const [, month, day, year] = slashMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  // DD-MON-YY format (e.g., "15-JUL-19")
  const monMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/)
  if (monMatch) {
    const [, day, mon, yy] = monMatch
    const month = MONTH_MAP[mon.toLowerCase()] || '01'
    const year = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`
    return `${year}-${month}-${day.padStart(2, '0')}`
  }
  // Try native Date parse as last resort
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }
  return dateStr
}

function mapEventType(type: string): V2AuthorityEvent['type'] {
  const lower = String(type).toLowerCase()
  if (lower.includes('filed') || lower.includes('application')) return 'filed'
  if (lower.includes('approved')) return 'approved'
  if (lower.includes('granted')) return 'granted'
  if (lower.includes('renewed') || lower.includes('update')) return 'renewed'
  if (lower.includes('dismissed') || lower.includes('cancelled') || lower.includes('expired')) return 'cancelled'
  if (lower.includes('warning')) return 'warning'
  if (lower.includes('revoked') || lower.includes('revocation')) return 'revoked'
  if (lower.includes('new') || lower.includes('created')) return 'new'
  if (lower.includes('changed') || lower.includes('transfer')) return 'changed'
  return 'filed'
}

export function mapToV2AuthorityPending(report: any): V2AuthorityPending {
  const pending = report?.authority?.pendingFlags || {}
  // API may return string "Y"/"N" instead of boolean — treat only "Y"/true as pending
  function isTruthy(v: any): boolean {
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return v.toUpperCase() === 'Y' || v.toUpperCase() === 'YES' || v.toUpperCase() === 'TRUE'
    return false
  }
  return {
    commonPending: isTruthy(pending.commonPending),
    commonReview: isTruthy(pending.commonReview),
    contractPending: isTruthy(pending.contractPending),
    contractReview: isTruthy(pending.contractReview),
    brokerPending: isTruthy(pending.brokerPending),
    brokerReview: isTruthy(pending.brokerReview),
  }
}

// ============================================================
// SAFETY
// ============================================================
export function mapToV2BasicScores(report: any): V2BasicScore[] {
  const scores = report?.safety?.basicScores || []

  // When MorPro has no BASIC scores, return all 7 categories as "Not Scored"
  // so the UI always renders the BASIC section (matches SMS-path behavior).
  if (scores.length === 0) {
    return ALL_BASICS.map(def => ({
      name: def.name,
      score: null,
      threshold: def.threshold,
      percentile: null,
      description: BASIC_DESCRIPTIONS[def.name] || '',
    }))
  }

  return scores.map((b: any) => {
    const rawScore = b.score ?? b.percentile ?? b.measure;
    return {
      name: b.basicName || b.name || 'Unknown',
      // Preserve null — means FMCSA doesn't have enough data to score this BASIC
      score: rawScore != null ? Number(rawScore) : null,
      threshold: b.threshold ?? b.thresholdPercent ?? 65,
      percentile: rawScore != null ? Number(rawScore) : null,
      description: b.description || b.basicCode || '',
    }
  })
}

// FMCSA BASIC description lookup
const BASIC_DESCRIPTIONS: Record<string, string> = {
  'Unsafe Driving': 'Operations of CMVs in a dangerous or careless manner',
  'Hours-of-Service Compliance': 'Operating CMVs when ill, fatigued, or not complying with HOS',
  'Driver Fitness': 'Operating CMVs by drivers who are unfit due to lack of training, experience, or medical qualifications',
  'Controlled Substances/Alcohol': 'Operation of CMVs by drivers impaired by alcohol or controlled substances',
  'Vehicle Maintenance': 'Failure to properly maintain CMVs and required equipment',
  'Hazardous Materials Compliance': 'Unsafe handling of hazardous materials on a CMV',
  'Crash Indicator': 'Histories or patterns of high crash involvement',
}

// All 7 FMCSA BASIC categories — displayed even when not scored
const ALL_BASICS = [
  { name: 'Unsafe Driving', threshold: 65 },
  { name: 'Hours-of-Service Compliance', threshold: 65 },
  { name: 'Driver Fitness', threshold: 80 },
  { name: 'Controlled Substances/Alcohol', threshold: 80 },
  { name: 'Vehicle Maintenance', threshold: 80 },
  { name: 'Hazardous Materials Compliance', threshold: 80 },
  { name: 'Crash Indicator', threshold: 65 },
]

// Normalize BASIC names for cross-source matching
// FMCSA uses "Hours-of-Service Compliance", MorPro might use "Hours of Service", etc.
function normalizeBasicName(name: string): string {
  return name.toLowerCase()
    .replace(/[-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*compliance\s*/g, '')
    .replace(/\s*alcohol\s*/g, '')
    .replace(/\s*substance\s*/g, ' substance')
    .trim()
}

/**
 * Map BASIC scores using FMCSA SMS as the gate (which BASICs are scored)
 * and MorPro for fresher values when available.
 *
 * FMCSA SMS updates monthly — it decides WHICH BASICs a carrier is scored on.
 * MorPro updates daily — it may have fresher percentile values.
 * If a BASIC isn't in the FMCSA SMS response, it's not scored — period.
 */
export function mapSMSToV2BasicScores(smsData: FMCSASMSData, morProReport?: any): V2BasicScore[] {
  // Priority: MorPro first, FMCSA SMS fills gaps where MorPro has no score.
  const morProScores = morProReport?.safety?.basicScores || []
  const morProLookup = new Map<string, any>()
  for (const b of morProScores) {
    const name = b.basicName || b.name || ''
    if (name) morProLookup.set(normalizeBasicName(name), b)
  }

  // Build FMCSA SMS lookup as fallback
  const smsLookup = new Map<string, FMCSASMSBasic>()
  for (const b of smsData.basics) {
    smsLookup.set(normalizeBasicName(b.basicName), b)
  }

  return ALL_BASICS.map(def => {
    const normalized = normalizeBasicName(def.name)
    const morPro = morProLookup.get(normalized)
    const morProScore = morPro ? (morPro.score ?? morPro.percentile ?? morPro.measure) : null

    // Use MorPro score if available
    if (morProScore != null && morProScore > 0) {
      return {
        name: def.name,
        score: Number(morProScore),
        threshold: morPro.threshold ?? morPro.thresholdPercent ?? def.threshold,
        percentile: Number(morProScore),
        description: BASIC_DESCRIPTIONS[def.name] || morPro.description || '',
      }
    }

    // Fall back to FMCSA SMS data
    const sms = smsLookup.get(normalized)
    if (sms && sms.percentile > 0) {
      return {
        name: def.name,
        score: sms.percentile,
        threshold: sms.thresholdPercent || def.threshold,
        percentile: sms.percentile,
        description: BASIC_DESCRIPTIONS[def.name] || sms.basicCode || '',
      }
    }

    // Neither source has a score
    return {
      name: def.name,
      score: null,
      threshold: def.threshold,
      percentile: null,
      description: BASIC_DESCRIPTIONS[def.name] || '',
    }
  })
}

/**
 * Build BASIC alerts from FMCSA SMS data (source of truth).
 * Only flag alerts for BASICs that FMCSA actually says exceed threshold.
 */
export function mapSMSToV2BasicAlerts(smsData: FMCSASMSData): V2BasicAlerts {
  const lookup = new Map<string, FMCSASMSBasic>()
  for (const b of smsData.basics) {
    lookup.set(normalizeBasicName(b.basicName), b)
  }
  // Trust FMCSA's exceedsThreshold flag directly
  const find = (name: string) => lookup.get(normalizeBasicName(name))
  return {
    unsafeDrivingAlert: find('Unsafe Driving')?.exceedsThreshold || false,
    hoursOfServiceAlert: find('Hours-of-Service Compliance')?.exceedsThreshold || false,
    driverFitnessAlert: find('Driver Fitness')?.exceedsThreshold || false,
    controlledSubstanceAlert: find('Controlled Substances/Alcohol')?.exceedsThreshold || false,
    vehicleMaintenanceAlert: find('Vehicle Maintenance')?.exceedsThreshold || false,
    hazmatAlert: find('Hazardous Materials Compliance')?.exceedsThreshold || false,
    crashIndicatorAlert: find('Crash Indicator')?.exceedsThreshold || false,
    unsafeDrivingOOSAlert: false,
    hoursOfServiceOOSAlert: false,
    vehicleMaintenanceOOSAlert: false,
  }
}

export function mapToV2BasicAlerts(report: any, smsData?: FMCSASMSData | null): V2BasicAlerts {
  const alerts = report?.safety?.basicAlerts || {}
  const morPro: V2BasicAlerts = {
    unsafeDrivingAlert: alerts.unsafeDriving || alerts.unsafeDrivingAlert || false,
    hoursOfServiceAlert: alerts.hoursOfService || alerts.hosCompliance || alerts.hoursOfServiceAlert || false,
    driverFitnessAlert: alerts.driverFitness || alerts.driverFitnessAlert || false,
    controlledSubstanceAlert: alerts.controlledSubstance || alerts.controlledSubstances || alerts.controlledSubstanceAlert || false,
    vehicleMaintenanceAlert: alerts.vehicleMaintenance || alerts.vehicleMaintenanceAlert || false,
    hazmatAlert: alerts.hazmat || alerts.hazmatCompliance || alerts.hazmatAlert || false,
    crashIndicatorAlert: alerts.crashIndicator || alerts.crashIndicatorAlert || false,
    unsafeDrivingOOSAlert: alerts.unsafeDrivingOOS || alerts.unsafeDrivingOOSAlert || false,
    hoursOfServiceOOSAlert: alerts.hoursOfServiceOOS || alerts.hoursOfServiceOOSAlert || false,
    vehicleMaintenanceOOSAlert: alerts.vehicleMaintenanceOOS || alerts.vehicleMaintenanceOOSAlert || false,
  }
  // MorPro first — only merge FMCSA SMS alerts for fields MorPro doesn't flag
  if (smsData && smsData.basics.length > 0) {
    const smsAlerts = mapSMSToV2BasicAlerts(smsData)
    for (const key of Object.keys(morPro) as (keyof V2BasicAlerts)[]) {
      if (!morPro[key] && smsAlerts[key]) {
        morPro[key] = true
      }
    }
  }
  return morPro
}

export function mapToV2ViolationBreakdown(report: any): V2ViolationBreakdown {
  const breakdown = report?.safety?.violationBreakdown || {}
  return {
    unsafeDriving: breakdown.unsafeDriving || 0,
    hoursOfService: breakdown.hoursOfService || breakdown.hosCompliance || 0,
    vehicleMaintenance: breakdown.vehicleMaintenance || 0,
    controlledSubstance: breakdown.controlledSubstance || breakdown.controlledSubstances || 0,
    driverFitness: breakdown.driverFitness || 0,
    hazardousMaterials: breakdown.hazardousMaterials || breakdown.hazmat || breakdown.hazmatCompliance || 0,
  }
}

export function mapToV2ISSData(_report: any): V2ISSData {
  // ISS data is not publicly available — return defaults
  return {
    issScore: 0,
    riskLevel: 'Low',
    issStatus: 'N/A',
    category: 'Carrier',
    recommendation: 'N/A',
    highRisk: false,
  }
}

// ============================================================
// INSPECTIONS
// ============================================================
export function mapToV2InspectionSummary(report: any, smsData?: FMCSASMSData | null): V2InspectionSummary {
  const inspSummary = report?.inspections?.summary || {}
  const safetyTotals = report?.safety?.inspectionTotals || {}
  const rawRecords: any[] = report?.inspections?.records || []

  // Filter to 24-month window + dedup by unique_id
  const records = filterInspectionRecords(rawRecords)

  const p = (v: any) => parseFloat(v) || 0

  let driverInsp: number, vehicleInsp: number, hazmatInsp: number, iepInsp: number
  let driverOOS: number, vehicleOOS: number, hazmatOOS: number, iepOOS: number
  let totalInsp: number

  // Priority: FMCSA SMS → inspectionTotals → records
  if (smsData && smsData.totalInspections > 0) {
    totalInsp = smsData.totalInspections
    driverInsp = smsData.totalDriverInspections
    vehicleInsp = smsData.totalVehicleInspections
    hazmatInsp = smsData.totalHazmatInspections
    iepInsp = smsData.totalIepInspections || 0
    driverOOS = smsData.driverOosInspections
    vehicleOOS = smsData.vehicleOosInspections
    hazmatOOS = 0 // SMS doesn't break out hazmat OOS
    iepOOS = 0
  } else if (p(safetyTotals.total) > 0 || p(safetyTotals.driver) > 0 || p(safetyTotals.vehicle) > 0) {
    totalInsp = p(safetyTotals.total) || p(safetyTotals.last24Months) || 0
    driverInsp = p(safetyTotals.driver)
    vehicleInsp = p(safetyTotals.vehicle)
    hazmatInsp = p(safetyTotals.hazmat)
    iepInsp = p(safetyTotals.iep)
    driverOOS = p(safetyTotals.driverOOS)
    vehicleOOS = p(safetyTotals.vehicleOOS)
    hazmatOOS = p(safetyTotals.hazmatOOS)
    iepOOS = p(safetyTotals.iepOOS)
  } else if (records.length > 0) {
    const counts = countInspectionsByType(records)
    totalInsp = records.length
    driverInsp = counts.driverInsp
    vehicleInsp = counts.vehicleInsp
    hazmatInsp = counts.hazmatInsp
    iepInsp = counts.iepInsp
    driverOOS = counts.driverOOS
    vehicleOOS = counts.vehicleOOS
    hazmatOOS = counts.hazmatOOS
    iepOOS = counts.iepOOS
  } else {
    totalInsp = 0
    driverInsp = 0; vehicleInsp = 0; hazmatInsp = 0; iepInsp = 0
    driverOOS = 0; vehicleOOS = 0; hazmatOOS = 0; iepOOS = 0
  }

  // --- OOS RATES (percentages) ---
  // FMCSA formula: OOS Rate % = (OOS Count / Inspection Count) * 100
  const computeRate = (oos: number, insp: number): number => {
    if (insp > 0) return Math.round((oos / insp) * 10000) / 100
    return 0
  }

  return {
    totalInspections: totalInsp,
    driverInspections: driverInsp,
    vehicleInspections: vehicleInsp,
    hazmatInspections: hazmatInsp,
    iepInspections: iepInsp,
    driverOOS,
    vehicleOOS,
    hazmatOOS,
    iepOOS,
    driverOOSRate: computeRate(driverOOS, driverInsp),
    vehicleOOSRate: computeRate(vehicleOOS, vehicleInsp),
    hazmatOOSRate: computeRate(hazmatOOS, hazmatInsp),
    iepOOSRate: computeRate(iepOOS, iepInsp),
    // FMCSA national averages as of 02/27/2026
    nationalDriverOOSRate: 6.67,
    nationalVehicleOOSRate: 22.26,
    nationalHazmatOOSRate: 4.44,
  }
}

export function mapToV2InspectionRecords(report: any): V2InspectionRecord[] {
  const records = filterInspectionRecords(report?.inspections?.records || [])
  const pInt = (v: any): number => { const n = parseInt(v); return isNaN(n) ? 0 : n }
  return records.map((r: any) => {
    const violations = pInt(r.viol_total ?? r.violations)
    const oosViolations = pInt(r.oos_total ?? r.oosViolations)
    return {
      id: r.unique_id || r.id || '',
      date: normalizeDate(r.inspection_date || r.date || ''),
      state: r.report_state || r.state || '',
      type: r.inspection_type || r.type || 'Vehicle',
      level: r.level || r.inspection_level || '',
      violations,
      oosViolations,
      oos: oosViolations > 0,
      reportNumber: r.report_number || r.reportNumber || '',
      fmcsaId: r.unique_id || r.fmcsaId || '',
      violationDetails: (r.violations_list || r.violationDetails || []).map((v: any) => ({
        category: v.basic_desc || v.category || '',
        group: v.group_desc || v.group || '',
        description: v.description || v.violation_description || '',
        severity: v.severity_weight || v.severity || 0,
        oos: v.oos === true || v.oos === 'Y',
      })),
    }
  })
}

export function mapToV2Operations(report: any): V2OperationsSummary {
  const summary = report?.inspections?.summary || {}
  const safetyTotals = report?.safety?.inspectionTotals || {}
  const topViolations = report?.inspections?.topViolations || []
  const records = filterInspectionRecords(report?.inspections?.records || [])

  const p = (v: any) => parseFloat(v) || 0

  // Use inspectionTotals (preferred), fall back to records
  const hasApiTotals = p(safetyTotals.total) > 0
  const totalInspections = hasApiTotals ? p(safetyTotals.total) : (records.length || p(summary.total_inspections) || 0)
  const totalOOS = hasApiTotals
    ? (p(safetyTotals.driverOOS) + p(safetyTotals.vehicleOOS) + p(safetyTotals.hazmatOOS))
    : records.length > 0
      ? records.filter((r: any) => p(r.oos_total) > 0).length
      : 0
  const overallOOSRate = totalInspections > 0
    ? Math.round((totalOOS / totalInspections) * 10000) / 100
    : 0

  // Build operating states from records (preferred), fall back to API summary
  const apiStates = summary.operating_states || []
  let operatingStates: any[] = []

  if (records.length > 0) {
    const stateMap: Record<string, { inspections: number; oosCount: number }> = {}
    records.forEach((r: any) => {
      const state = r.report_state || r.state || 'Unknown'
      if (!stateMap[state]) stateMap[state] = { inspections: 0, oosCount: 0 }
      stateMap[state].inspections++
      if (p(r.oos_total) > 0) stateMap[state].oosCount++
    })
    operatingStates = Object.entries(stateMap)
      .sort((a, b) => b[1].inspections - a[1].inspections)
      .map(([stateCode, data]) => ({
        state: stateCode, stateCode,
        inspections: data.inspections, oosCount: data.oosCount,
        oosRate: data.inspections > 0 ? Math.round((data.oosCount / data.inspections) * 1000) / 10 : 0,
      }))
  } else if (apiStates.length > 0) {
    operatingStates = apiStates.map((s: string) => ({
      state: s, stateCode: s, inspections: 0, oosCount: 0, oosRate: 0,
    }))
  }

  // Parse violation count from a record — use ?? to handle 0 correctly (|| treats 0 as falsy)
  const getViolCount = (r: any): number => {
    const raw = r.total_violations ?? r.viol_total ?? r.violations
    return raw != null ? (parseFloat(raw) || 0) : 0
  }

  // Clean inspection rate — compute from records
  const cleanInspectionRate = records.length > 0
    ? Math.round(records.filter((r: any) => getViolCount(r) === 0).length / records.length * 1000) / 10
    : p(summary.clean_inspection_rate) || 0

  const lastRecord = records.length > 0 ? records[0] : null
  const lastInspectionDate = normalizeDate(lastRecord?.inspection_date || lastRecord?.date || '')

  const totalViolations = records.reduce((s: number, r: any) => s + getViolCount(r), 0)

  return {
    totalInspections,
    totalOOS,
    overallOOSRate,
    inspectionTrend: 'stable',
    trendPct: 0,
    topViolations: topViolations.map((v: any) => ({
      category: v.category || v.group_desc || '',
      count: p(v.count) || p(v.total) || 0,
      severity: (v.severity || (p(v.oos_count) > 0 ? 'major' : 'minor')) as 'critical' | 'major' | 'minor',
    })),
    operatingStates,
    mileageEstimate: '',
    inspectionsPer100k: 0,
    cleanInspectionRate,
    lastInspectionDate,
    averageViolationsPerInspection: totalInspections > 0 ? Math.round((totalViolations / totalInspections) * 100) / 100 : 0,
  }
}

export function mapToV2ViolationTrend(report: any): V2ViolationTrend[] {
  const trend = report?.violations?.trend || []
  return trend.map((t: any) => ({
    month: t.month || t.period || '',
    violations: t.violations || t.count || 0,
    oosEvents: t.oosEvents || t.oos || 0,
  }))
}

// ============================================================
// CRASHES
// ============================================================
export function mapToV2CrashData(report: any, smsData?: FMCSASMSData | null): V2CrashData {
  // MorPro may return crashes as: report.crashes.summary.{field}, report.crashes.{field}, or report.carrier.{field}
  const summary = report?.crashes?.summary || {}
  const crashes = report?.crashes || {}
  const carrier = report?.carrier || {}
  const pi = (v: any): number => { const n = parseInt(v); return isNaN(n) ? 0 : n }

  // Check multiple MorPro paths for each field
  const morProFatal = pi(summary.fatal ?? summary.fatalCrashes ?? crashes.fatal ?? crashes.fatalCrashes ?? carrier.fatalCrash)
  const morProInjury = pi(summary.injury ?? summary.injuryCrashes ?? crashes.injury ?? crashes.injuryCrashes ?? carrier.injuryCrash)
  const morProTow = pi(summary.towaway ?? summary.towCrashes ?? crashes.towaway ?? crashes.towCrashes ?? carrier.towCrash)
  const morProTotal = pi(summary.total ?? summary.totalCrashes ?? crashes.total ?? crashes.totalCrashes ?? carrier.crashTotal)

  // FMCSA SMS is source of truth — use ?? (not ||) so 0 is preserved correctly
  if (smsData && smsData.totalInspections > 0) {
    return {
      fatal: smsData.fatalCrashes ?? morProFatal,
      injury: smsData.injuryCrashes ?? morProInjury,
      towaway: smsData.towCrashes ?? morProTow,
      total: smsData.totalCrashes ?? morProTotal,
    }
  }

  return {
    fatal: morProFatal,
    injury: morProInjury,
    towaway: morProTow,
    total: morProTotal,
  }
}

export function mapToV2CrashRecords(report: any): V2CrashRecord[] {
  const records = report?.crashes?.records || []
  return records.map((r: any) => {
    // Derive severity from fatalities/injuries/tow
    const fatalities = parseInt(r.fatalities || r.fatal_count || 0) || 0
    const injuries = parseInt(r.injuries || r.injury_count || 0) || 0
    const towAway = r.tow_away === true || r.tow_away === 'true' || r.towAway === true
    let severity = r.severity || r.crash_severity || ''
    if (!severity) {
      if (fatalities > 0) severity = 'Fatal'
      else if (injuries > 0) severity = 'Injury'
      else if (towAway) severity = 'Tow-Away'
      else severity = 'Property Damage'
    }

    return {
      id: r.id || r.report_number || '',
      date: normalizeDate(r.crash_date || r.date || ''),
      state: r.report_state || r.state || '',
      severity,
      fatalities,
      injuries,
      hazmatRelease: r.hazmat_released === true || r.hazmat_release === true || r.hazmat_release === 'Y' || false,
      reportNumber: r.report_number || r.reportNumber || '',
    }
  })
}

// ============================================================
// INSURANCE
// ============================================================
export function mapToV2InsurancePolicies(report: any): V2InsurancePolicy[] {
  const policies = sanitizeMorProInsurance(report?.insurance).activePolicies || []
  return policies.map((p: any) => ({
    insurer: p.insurerName || p.insurer || '',
    policyNumber: p.policyNumber || '',
    type: mapInsuranceType(p.insuranceType || p.type || ''),
    coverage: p.coverageAmount || p.coverage || 0,
    required: p.requiredAmount || p.required || 0,
    status: mapInsuranceStatus(p.status),
    effectiveDate: normalizeDate(p.effectiveDate || ''),
    expirationDate: normalizeDate(p.expirationDate || p.cancellationDate || ''),
  }))
}

function mapInsuranceType(type: string): 'BIPD' | 'Cargo' | 'Bond' | 'General' {
  const lower = String(type).toLowerCase()
  if (lower.includes('bipd') || lower.includes('liability') || lower.includes('bodily')) return 'BIPD'
  if (lower.includes('cargo')) return 'Cargo'
  if (lower.includes('bond') || lower.includes('surety')) return 'Bond'
  return 'General'
}

function mapInsuranceStatus(status: string | undefined): 'active' | 'expired' | 'pending' {
  if (!status) return 'active'
  const lower = String(status).toLowerCase()
  if (lower === 'active' || lower === 'a') return 'active'
  if (lower === 'expired' || lower === 'cancelled' || lower === 'e') return 'expired'
  return 'pending'
}

export function mapToV2RenewalTimeline(report: any): V2RenewalEvent[] {
  const timeline = report?.insurance?.renewalTimeline || []
  return timeline.map((r: any) => ({
    policyType: r.policyType || r.type || '',
    date: normalizeDate(r.date || r.renewalDate || ''),
    daysUntil: r.daysUntil || 0,
    urgency: mapUrgency(r.daysUntil || r.urgency),
  }))
}

function mapUrgency(val: number | string): 'low' | 'medium' | 'high' | 'critical' {
  if (typeof val === 'string') {
    if (['low', 'medium', 'high', 'critical'].includes(val)) return val as any
    return 'low'
  }
  if (val <= 30) return 'critical'
  if (val <= 60) return 'high'
  if (val <= 90) return 'medium'
  return 'low'
}

export function mapToV2PolicyHistory(report: any): V2PolicyEvent[] {
  const history = report?.insurance?.history || []
  return history.map((h: any) => ({
    date: normalizeDate(h.date || h.effectiveDate || ''),
    event: h.event || h.description || '',
    type: (h.type || 'renewed') as V2PolicyEvent['type'],
    policyType: h.policyType || h.insuranceType || '',
  }))
}

export function mapToV2InsuranceGaps(report: any): V2InsuranceGap[] {
  const gaps = sanitizeMorProInsurance(report?.insurance).gaps || []
  return gaps.map((g: any) => ({
    policyType: g.policyType || g.type || '',
    gapStart: g.gapStart || g.startDate || '',
    gapEnd: g.gapEnd || g.endDate || null,
    daysGap: g.daysGap || g.days || 0,
    status: g.status === 'active' ? 'active' : 'resolved',
  }))
}

// ============================================================
// FLEET
// ============================================================
export function mapToV2Trucks(report: any): V2TruckData[] {
  const trucks = report?.fleet?.trucks || []
  return trucks.map((t: any) => ({
    vin: t.vin || '',
    year: (() => { const y = Number(t.year || t.model_year || 0); return y >= 1900 && y <= 2100 ? y : 0 })(),
    make: t.make || '',
    model: t.model || '',
    bodyClass: t.bodyClass || t.body_class || '',
    gvwr: t.gvwr || '',
    inspections: t.inspectionCount || t.inspections || 0,
    oosCount: t.totalOOS || t.oosCount || 0,
  }))
}

export function mapToV2Trailers(report: any): V2TrailerData[] {
  const trailers = report?.fleet?.trailers || []
  return trailers.map((t: any) => ({
    vin: t.vin || '',
    year: (() => { const y = Number(t.year || t.model_year || 0); return y >= 1900 && y <= 2100 ? y : 0 })(),
    make: t.make || '',
    model: t.model || '',
    type: t.type || t.body_class || '',
    length: t.length || '',
  }))
}

export function mapToV2SharedEquipment(report: any): V2SharedEquipment {
  const shared = report?.fleet?.sharedEquipment || {}
  return {
    countSharedVins: shared.countSharedVins || shared.totalShared || 0,
    countSharedPowerUnits: shared.countSharedPowerUnits || 0,
    countSharedTrailers: shared.countSharedTrailers || 0,
    sharedVins: (shared.sharedVins || shared.details || []).map((s: any) => ({
      vin: s.vin || '',
      sharedWithDot: s.sharedWithDot || String(s.otherDotNumber || ''),
      sharedWithName: s.sharedWithName || s.otherLegalName || '',
    })),
  }
}

// ============================================================
// CARGO
// ============================================================
// Map FMCSA cargo-carried descriptions to V2CargoCapabilities boolean keys
const CARGO_DESC_MAP: Record<string, keyof V2CargoCapabilities> = {
  'general freight': 'generalFreight',
  'household goods': 'householdGoods',
  'metal: sheets, coils, rolls': 'metalSheets',
  'motor vehicles': 'motorVehicles',
  'drive/tow away': 'drivewayTowaway',
  'driveaway/towaway': 'drivewayTowaway',
  'logs, poles, beams, lumber': 'logsPolesBeams',
  'building materials': 'buildingMaterials',
  'mobile homes': 'mobileHomes',
  'machinery, large objects': 'machineryLargeObjects',
  'fresh produce': 'freshProduce',
  'liquids/gases': 'liquids',
  'grain, feed, hay': 'grainFeedHay',
  'coal/coke': 'coalCoke',
  'meat': 'meat',
  'garbage/refuse': 'garbageRefuse',
  'us mail': 'usMailSeparate',
  'chemicals': 'chemicals',
  'commodities dry bulk': 'commoditiesDryBulk',
  'dry bulk': 'commoditiesDryBulk',
  'refrigerated food': 'refrigeratedFood',
  'beverages': 'beverages',
  'paper products': 'paperProducts',
  'utilities': 'utilities',
  'agricultural/farm supplies': 'farmSupplies',
  'farm supplies': 'farmSupplies',
  'construction': 'construction',
  'water well': 'waterWell',
  'intermodal cont.': 'intermodalContainers',
  'intermodal containers': 'intermodalContainers',
  'oilfield equipment': 'oilFieldEquipment',
  'oil field equipment': 'oilFieldEquipment',
  'livestock': 'livestock',
  'passengers': 'passengers',
}

export function mapToV2CargoCapabilities(report: any, fmcsaCargoTypes?: string[]): V2CargoCapabilities {
  const cargo = report?.cargo || {}
  const carrier = report?.carrier || {}

  // Start with MorPro data
  const result: V2CargoCapabilities = {
    generalFreight: cargo.generalFreight || cargo.general_freight || carrier.general_freight || false,
    householdGoods: cargo.householdGoods || cargo.household_goods || carrier.household || false,
    metalSheets: cargo.metalSheets || cargo.metal_sheets || carrier.metal_sheet_coils_rolls || false,
    motorVehicles: cargo.motorVehicles || cargo.motor_vehicles || carrier.motor_vehicles || false,
    drivewayTowaway: cargo.drivewayTowaway || cargo.driveway_towaway || carrier.driveaway_towaway || false,
    logsPolesBeams: cargo.logsPolesBeams || cargo.logs_poles_beams || carrier.logs_poles_beams_lumber || false,
    buildingMaterials: cargo.buildingMaterials || cargo.building_materials || carrier.building_materials || false,
    mobileHomes: cargo.mobileHomes || cargo.mobile_homes || carrier.mobile_homes || false,
    machineryLargeObjects: cargo.machineryLargeObjects || cargo.machinery_large_objects || carrier.machinery_large_objects || false,
    freshProduce: cargo.freshProduce || cargo.fresh_produce || carrier.fresh_produce || false,
    liquids: cargo.liquids || cargo.liquids_gases || carrier.liquids_gases || false,
    grainFeedHay: cargo.grainFeedHay || cargo.grain_feed_hay || carrier.grain_feed_hay || false,
    coalCoke: cargo.coalCoke || cargo.coal_coke || carrier.coal_coke || false,
    meat: cargo.meat || carrier.meat || false,
    garbageRefuse: cargo.garbageRefuse || cargo.garbage_refuse || carrier.garbage_refuse_trash || false,
    usMailSeparate: cargo.usMailSeparate || cargo.us_mail || carrier.us_mail || false,
    chemicals: cargo.chemicals || carrier.chemicals || false,
    commoditiesDryBulk: cargo.commoditiesDryBulk || cargo.commodities_dry_bulk || carrier.dry_bulk_commodities || false,
    refrigeratedFood: cargo.refrigeratedFood || cargo.refrigerated_food || carrier.refrigerated_foods || false,
    beverages: cargo.beverages || carrier.beverages || false,
    paperProducts: cargo.paperProducts || cargo.paper_products || carrier.paper_products || false,
    utilities: cargo.utilities || carrier.utility || false,
    farmSupplies: cargo.farmSupplies || cargo.farm_supplies || carrier.farm_supplies || false,
    construction: cargo.construction || carrier.construction || false,
    waterWell: cargo.waterWell || cargo.water_well || carrier.water_well || false,
    intermodalContainers: cargo.intermodalContainers || cargo.intermodal_containers || carrier.intermodal_containers || false,
    oilFieldEquipment: cargo.oilFieldEquipment || cargo.oilfield_equipment || carrier.oilfield_equipment || false,
    livestock: cargo.livestock || carrier.livestock || false,
    grainfeedHay: cargo.grainfeedHay || cargo.grain_feed_hay || carrier.grain_feed_hay || false,
    coalCoke2: cargo.coalCoke2 || carrier.coal_coke || false,
    passengers: cargo.passengers || carrier.passengers || false,
  }

  // Overlay FMCSA cargo-carried data (source of truth)
  if (fmcsaCargoTypes && fmcsaCargoTypes.length > 0) {
    for (const desc of fmcsaCargoTypes) {
      const key = CARGO_DESC_MAP[desc.toLowerCase().trim()]
      if (key) {
        result[key] = true
      }
    }
  }

  return result
}

// ============================================================
// DOCUMENTS
// ============================================================
export function mapToV2Documents(report: any): V2DocumentItem[] {
  const docs = report?.documents || {}
  const checks = docs.verificationChecks || []
  const boc3 = docs.boc3 || {}
  const safetyRating = docs.safetyRating || {}
  const mcs150 = docs.mcs150 || {}

  const items: V2DocumentItem[] = []

  // Build document items from verification data
  items.push({
    name: 'Operating Authority (MC)',
    status: 'verified',
    description: 'FMCSA active MC authority confirmed',
  })
  items.push({
    name: 'DOT Registration',
    status: 'verified',
    description: 'DOT number active and current',
  })

  // Insurance
  const hasInsurance = (report?.insurance?.activePolicies || []).length > 0
  items.push({
    name: 'Insurance Certificate',
    status: hasInsurance ? 'verified' : 'pending',
    description: hasInsurance ? 'Active insurance policies on file' : 'Insurance verification pending',
  })

  // Safety Rating
  items.push({
    name: 'Safety Rating',
    status: safetyRating.rating ? 'verified' : 'pending',
    description: safetyRating.rating ? `${safetyRating.rating} rating confirmed` : 'No safety rating on file',
  })

  // MCS-150
  items.push({
    name: 'MCS-150 Filing',
    status: mcs150.date ? 'verified' : 'missing',
    description: mcs150.date ? `Biennial update filed ${mcs150.date}` : 'MCS-150 not current',
  })

  // BOC-3
  items.push({
    name: 'BOC-3 (Process Agent)',
    status: boc3.onFile ? 'verified' : 'missing',
    description: boc3.onFile ? 'Process agent designation on file' : 'BOC-3 not on file',
  })

  // Incorporate verification checks from API
  checks.forEach((c: any) => {
    items.push({
      name: c.name || c.check || '',
      status: c.status === 'clean' || c.status === 'verified' ? 'verified' : c.status === 'pending' ? 'pending' : 'missing',
      description: c.detail || c.description || '',
    })
  })

  return items
}

export function mapToV2VerificationChecks(report: any): any[] {
  const checks = report?.documents?.verificationChecks || []
  return checks.map((c: any) => ({
    name: c.name || c.check || '',
    status: c.status || 'clean',
    detail: c.detail || c.description || '',
  }))
}

export function mapToV2AvailableDocuments(_report: any): V2AvailableDocument[] {
  // These are platform-side documents, not from API
  return [
    { name: 'Articles of Incorporation', available: false },
    { name: 'EIN Letter', available: false },
    { name: 'Driver License (Owner)', available: false },
    { name: 'Certificate of Insurance (COI)', available: false },
    { name: 'Loss Run Report', available: false },
    { name: 'Letter of Release (LOR)', available: false },
  ]
}

// ============================================================
// FULL REPORT
// ============================================================
export function mapToV2RelatedCarriers(report: any): V2RelatedCarrier[] {
  const related = report?.related?.relatedCarriers || report?.related || []
  if (!Array.isArray(related)) return []
  return related.map((r: any) => ({
    mcNumber: r.mcNumber || r.mc_number || '',
    dotNumber: String(r.dotNumber || r.dot_number || ''),
    legalName: r.legalName || r.legal_name || '',
    sharedField: (r.sharedField || r.shared_field || 'address') as V2RelatedCarrier['sharedField'],
    status: mapRelatedStatus(r.operatingStatus || r.status),
    powerUnits: r.powerUnits || r.total_power_units || 0,
    location: r.location || r.city_state || '',
  }))
}

function mapRelatedStatus(status: string | undefined): 'active' | 'inactive' | 'revoked' {
  if (!status) return 'inactive'
  const lower = String(status).toLowerCase()
  if (lower === 'a' || lower === 'active' || lower === 'y') return 'active'
  if (lower === 'revoked') return 'revoked'
  return 'inactive'
}

export function mapToV2Percentiles(report: any): V2CarrierPercentile[] {
  const percentiles = report?.percentiles?.percentiles || report?.percentiles || []
  if (!Array.isArray(percentiles)) return []
  return percentiles.map((p: any) => ({
    metric: p.metric || p.name || '',
    carrierValue: p.carrierValue || p.value || 0,
    percentile: p.percentile || p.rank || 0,
    category: (p.category || 'unknown') as V2CarrierPercentile['category'],
    unit: p.unit || '',
    lowerIsBetter: p.lowerIsBetter ?? false,
  }))
}

// ============================================================
// VIN INSPECTIONS — cross-reference fleet VINs with inspection records
// ============================================================
export function mapToV2VinInspections(report: any): V2VinInspection[] {
  const records = filterInspectionRecords(report?.inspections?.records || [])
  const trucks = report?.fleet?.trucks || []
  const trailers = report?.fleet?.trailers || []

  // Build a set of known fleet VINs for fast lookup
  const fleetVins = new Set<string>()
  for (const t of [...trucks, ...trailers]) {
    if (t.vin) fleetVins.add(String(t.vin).toUpperCase())
  }

  // Extract VIN-level inspection data from inspection records
  // MorPro records may have: vin, vehicle_id_number, vehicles[], unit_vin
  const vinInspections: V2VinInspection[] = []

  for (const r of records) {
    const vins: string[] = []

    // Direct VIN field
    if (r.vin) vins.push(String(r.vin))
    if (r.vehicle_id_number) vins.push(String(r.vehicle_id_number))
    if (r.unit_vin) vins.push(String(r.unit_vin))

    // Nested vehicles array (common FMCSA format)
    if (Array.isArray(r.vehicles)) {
      for (const v of r.vehicles) {
        if (v.vin) vins.push(String(v.vin))
        if (v.vehicle_id_number) vins.push(String(v.vehicle_id_number))
      }
    }

    const oosTotal = parseInt(r.oos_total || r.oosViolations) || 0
    const violTotal = parseInt(r.viol_total || r.violations) || 0
    const date = normalizeDate(r.inspection_date || r.date || '')
    const state = r.report_state || r.state || ''
    const level = r.level || r.inspection_level || ''

    // Determine result
    let result: 'pass' | 'fail' | 'oos' | 'warning' = 'pass'
    if (oosTotal > 0) result = 'oos'
    else if (violTotal > 0) result = 'warning'

    for (const rawVin of vins) {
      const vin = rawVin.toUpperCase().trim()
      if (!vin || vin.length < 5) continue
      // Only include VINs that belong to this carrier's fleet
      if (fleetVins.size > 0 && !fleetVins.has(vin)) continue

      vinInspections.push({
        vin,
        date,
        location: state,
        type: level ? `Level ${level}` : 'Vehicle',
        result,
        violations: violTotal,
        oosViolations: oosTotal,
      })
    }
  }

  // If no VIN data in inspection records, build from fleet data with inspection counts
  if (vinInspections.length === 0) {
    for (const t of trucks) {
      if (!t.vin) continue
      const inspCount = t.inspectionCount || t.inspections || 0
      const oosCount = t.totalOOS || t.oosCount || 0
      if (inspCount > 0) {
        vinInspections.push({
          vin: String(t.vin).toUpperCase(),
          date: t.lastSeen || t.last_inspection_date || '',
          location: '',
          type: 'Vehicle',
          result: oosCount > 0 ? 'oos' : 'pass',
          violations: oosCount,
          oosViolations: oosCount,
        })
      }
    }
  }

  // Sort by date descending
  vinInspections.sort((a, b) => {
    const da = new Date(a.date || 0).getTime()
    const db = new Date(b.date || 0).getTime()
    return db - da
  })

  return vinInspections
}

// ============================================================
// NETWORK SIGNALS — derived from carrier + authority data
// ============================================================
export function mapToV2NetworkSignals(report: any, listing?: MCListingExtended): V2NetworkSignal[] {
  const carrier = report?.carrier || {}
  const authority = report?.authority || {}
  const insurance = report?.insurance || {}
  const signals: V2NetworkSignal[] = []

  // Authority age
  const yearsActive = parseFloat(carrier.yearsActive) || listing?.yearsActive || 0
  if (yearsActive > 0) {
    signals.push({
      name: 'Authority Age',
      value: yearsActive >= 1 ? `${Math.round(yearsActive)}+ Years` : `${Math.round(yearsActive * 12)} Months`,
      status: yearsActive >= 5 ? 'positive' : yearsActive >= 2 ? 'neutral' : 'negative',
      detail: yearsActive >= 5
        ? 'Well-established operating history'
        : yearsActive >= 2
          ? 'Moderate operating history'
          : 'Relatively new authority',
    })
  }

  // Revocation history
  const totalRevocations = carrier.totalRevocations || 0
  signals.push({
    name: 'Clean Record',
    value: `${totalRevocations} Revocations`,
    status: totalRevocations === 0 ? 'positive' : 'negative',
    detail: totalRevocations === 0
      ? 'No authority revocations on file'
      : `${totalRevocations} revocation(s) found on record`,
  })

  // Operating status — check clear deny signals, otherwise assume authorized
  const allowed2 = carrier.allowedToOperate
  const opStatus2 = carrier.operatingStatus
  const isDenied = allowed2 === 'N' || opStatus2 === 'N' || opStatus2 === 'not-authorized' || opStatus2 === 'NOT AUTHORIZED' || opStatus2 === 'revoked' || opStatus2 === 'REVOKED'
  const isAuthorized = !isDenied
  signals.push({
    name: 'Operating Status',
    value: isAuthorized ? 'Authorized' : 'Not Authorized',
    status: isAuthorized ? 'positive' : 'negative',
    detail: isAuthorized ? 'Carrier is authorized to operate' : 'Carrier is not currently authorized',
  })

  // Insurance coverage
  const activePolicies = insurance.activePolicies || []
  if (activePolicies.length > 0) {
    signals.push({
      name: 'Insurance Status',
      value: `${activePolicies.length} Active`,
      status: 'positive',
      detail: `${activePolicies.length} active insurance ${activePolicies.length === 1 ? 'policy' : 'policies'} on file`,
    })
  } else {
    signals.push({
      name: 'Insurance Status',
      value: 'None Found',
      status: 'negative',
      detail: 'No active insurance policies on file',
    })
  }

  // Amazon Relay
  const amazonStatus = listing?.amazonStatus
  if (amazonStatus && amazonStatus !== 'none') {
    signals.push({
      name: 'Amazon Relay',
      value: amazonStatus === 'active' ? 'Active' : 'Pending',
      status: amazonStatus === 'active' ? 'positive' : 'neutral',
      detail: amazonStatus === 'active' ? 'Active on Amazon Relay platform' : 'Amazon Relay setup pending',
    })
  }

  // Highway setup
  if (listing?.highwaySetup) {
    signals.push({
      name: 'Highway Setup',
      value: 'Complete',
      status: 'positive',
      detail: 'Highway platform setup is complete',
    })
  }

  return signals
}

// ============================================================
// BENCHMARKS — carrier OOS rates vs national averages
// ============================================================
export function mapToV2Benchmarks(report: any, smsData?: FMCSASMSData | null): V2BenchmarkData[] {
  const records = filterInspectionRecords(report?.inspections?.records || [])
  const safetyTotals = report?.safety?.inspectionTotals || {}
  const benchmarks: V2BenchmarkData[] = []

  const p = (v: any) => parseFloat(v) || 0

  // Priority: FMCSA SMS → inspectionTotals → records
  let vehicleInsp = 0, driverInsp = 0, hazmatInsp = 0
  let vehicleOOS = 0, driverOOS = 0, hazmatOOS = 0

  if (smsData && smsData.totalInspections > 0) {
    // FMCSA SMS is source of truth
    vehicleInsp = smsData.totalVehicleInspections
    driverInsp = smsData.totalDriverInspections
    hazmatInsp = smsData.totalHazmatInspections
    vehicleOOS = smsData.vehicleOosInspections
    driverOOS = smsData.driverOosInspections
    hazmatOOS = 0 // SMS doesn't break out hazmat OOS separately
  } else if (p(safetyTotals.total) > 0) {
    vehicleInsp = p(safetyTotals.vehicleInspections) || p(safetyTotals.vehicle)
    driverInsp = p(safetyTotals.driverInspections) || p(safetyTotals.driver)
    hazmatInsp = p(safetyTotals.hazmatInspections) || p(safetyTotals.hazmat)
    vehicleOOS = p(safetyTotals.vehicleOOS)
    driverOOS = p(safetyTotals.driverOOS)
    hazmatOOS = p(safetyTotals.hazmatOOS)
  } else if (records.length > 0) {
    const counts = countInspectionsByType(records)
    vehicleInsp = counts.vehicleInsp
    driverInsp = counts.driverInsp
    hazmatInsp = counts.hazmatInsp
    vehicleOOS = counts.vehicleOOS
    driverOOS = counts.driverOOS
    hazmatOOS = counts.hazmatOOS
  }

  const rate = (oos: number, insp: number): number =>
    insp > 0 ? Math.round((oos / insp) * 10000) / 100 : 0

  // Vehicle OOS Rate
  if (vehicleInsp > 0) {
    benchmarks.push({
      metric: 'Vehicle OOS Rate',
      carrierValue: rate(vehicleOOS, vehicleInsp),
      industryAvg: 22.26,
      unit: '%',
      lowerIsBetter: true,
    })
  }

  // Driver OOS Rate
  if (driverInsp > 0) {
    benchmarks.push({
      metric: 'Driver OOS Rate',
      carrierValue: rate(driverOOS, driverInsp),
      industryAvg: 6.67,
      unit: '%',
      lowerIsBetter: true,
    })
  }

  // Hazmat OOS Rate
  if (hazmatInsp > 0 && hazmatOOS >= 0) {
    benchmarks.push({
      metric: 'Hazmat OOS Rate',
      carrierValue: rate(hazmatOOS, hazmatInsp),
      industryAvg: 4.44,
      unit: '%',
      lowerIsBetter: true,
    })
  }

  // Clean Inspection Rate — from records (need individual violation counts)
  if (records.length > 0) {
    const cleanCount = records.filter((r: any) => {
      const v = r.viol_total ?? r.violations
      return v === 0 || v === '0' || v === null || v === undefined
    }).length
    // Only count as clean if viol_total is explicitly 0, not just missing
    const hasViolData = records.some((r: any) => r.viol_total != null || r.violations != null)
    if (hasViolData) {
      const cleanRate = Math.round((cleanCount / records.length) * 10000) / 100
      benchmarks.push({
        metric: 'Clean Inspection Rate',
        carrierValue: cleanRate,
        industryAvg: 55.0,
        unit: '%',
        lowerIsBetter: false,
      })
    }
  }

  return benchmarks
}

// Future — return empty arrays/objects
export function mapToV2MonitoringAlerts(_report: any): V2MonitoringAlert[] {
  return []
}

export function mapToV2RiskScoreTrend(_report: any): V2RiskScoreTrend[] {
  return []
}

export function mapToV2ContactHistory(_report: any): V2ContactHistory {
  return { changes: [] }
}

// ============================================================
// COMPLIANCE (from Listing model, not API)
// ============================================================
export function mapToV2ComplianceFinancials(listing?: MCListingExtended, carrierReport?: any): V2ComplianceFinancials {
  // Determine entry audit status from multiple sources (priority order):
  // 1. Listing field (admin/seller-set): 'yes', 'no', 'scheduled', 'not-required'
  // 2. Authority statuses: common.status === 'A' or 'ACTIVE'
  // 3. Authority timeline: has a 'GRANTED' event
  // 4. Documents verificationChecks: Operating Authority status === 'active'
  // 5. Carrier allowedToOperate === 'Y'
  const listingAudit = (listing as any)?.entryAuditCompleted
  let entryAuditCompleted = false

  if (listingAudit) {
    entryAuditCompleted = listingAudit === 'yes'
  } else if (carrierReport) {
    const authority = carrierReport.authority || carrierReport.authorityHistory || {}
    const statuses = authority.statuses || authority
    const commonStatus = String(statuses.commonAuthorityStatus || statuses.common?.status || '').toUpperCase()

    if (commonStatus === 'A' || commonStatus === 'ACTIVE') {
      entryAuditCompleted = true
    }
    // Fallback: check timeline for GRANTED events
    else if (Array.isArray(authority.timeline) && authority.timeline.some((t: any) => t.event === 'GRANTED')) {
      entryAuditCompleted = true
    }
    // Fallback: check documents verificationChecks
    else if (Array.isArray(carrierReport.documents?.verificationChecks)) {
      const authCheck = carrierReport.documents.verificationChecks.find((c: any) => c.name === 'Operating Authority')
      if (authCheck?.status === 'active') entryAuditCompleted = true
    }
    // Fallback: carrier allowedToOperate
    else if (carrierReport.carrier?.allowedToOperate === 'Y') {
      entryAuditCompleted = true
    }
  }

  return {
    entryAuditCompleted,
    hasFactoring: (listing as any)?.hasFactoring || false,
    factoringCompany: (listing as any)?.factoringCompany || '',
    factoringRate: parseFloat((listing as any)?.factoringRate) || 0,
  }
}

// ============================================================
// CHAMELEON CARRIER DETECTION
// ============================================================

/**
 * Analyzes carrier data for chameleon carrier indicators.
 *
 * A chameleon carrier is a motor carrier that has been shut down by FMCSA
 * for safety violations and reopens under a new name, MC, or DOT number
 * to evade their prior safety record. FMCSA specifically tracks these
 * through shared addresses, officers, EINs, phone numbers, and equipment.
 *
 * This function scores multiple weighted signals and returns a composite
 * risk assessment with detailed explanations for each flag.
 */
export function detectChameleonCarrier(report: any, listing?: MCListingExtended): V2ChameleonAnalysis {
  const carrier = report?.carrier || {}
  const authority = report?.authority || {}
  const fleet = report?.fleet || {}
  const related = report?.related?.relatedCarriers || report?.related || []
  const timeline = authority.timeline || []
  const sharedEquipment = fleet.sharedEquipment || {}

  const flags: V2ChameleonFlag[] = []
  const relatedRevokedCarriers: V2ChameleonAnalysis['relatedRevokedCarriers'] = []

  // Normalize related carriers array
  const relatedList: any[] = Array.isArray(related) ? related : []

  // ------------------------------------------------------------------
  // 1. RELATED CARRIERS — group by DOT, dedupe shared fields per carrier.
  //    MorPro returns one row per (carrier × sharedField), so the same
  //    DOT appears multiple times if it shares more than one identity
  //    marker. We collapse to one entry per DOT with sharedFields[].
  // ------------------------------------------------------------------
  type LinkedAccum = V2ChameleonLinkedCarrier & { rawStatus: string }
  const linkedByDot = new Map<string, LinkedAccum>()

  for (const r of relatedList) {
    const otherDot = String(r.dotNumber || r.dot_number || '')
    if (!otherDot) continue
    const rawStatus = String(r.operatingStatus || r.status || '').toLowerCase()
    const status: 'active' | 'inactive' | 'revoked' =
      rawStatus === 'revoked' || rawStatus === 'r' || rawStatus === 'inactive-revoked' ? 'revoked'
      : rawStatus === 'a' || rawStatus === 'active' || rawStatus === 'y' ? 'active'
      : 'inactive'
    const sharedField = String(r.sharedField || r.shared_field || 'unknown').toLowerCase()

    const existing = linkedByDot.get(otherDot)
    if (existing) {
      if (!existing.sharedFields.includes(sharedField)) existing.sharedFields.push(sharedField)
    } else {
      linkedByDot.set(otherDot, {
        mcNumber: r.mcNumber || r.mc_number || '',
        dotNumber: otherDot,
        legalName: r.legalName || r.legal_name || 'Unknown carrier',
        dbaName: r.dbaName || r.dba_name || '',
        status,
        sharedFields: [sharedField],
        powerUnits: parseInt(r.powerUnits ?? r.total_power_units ?? 0) || 0,
        location: r.location || r.city_state || '',
        rawStatus,
      })
    }
  }

  const linkedCarriers: V2ChameleonLinkedCarrier[] = Array.from(linkedByDot.values()).map(
    ({ rawStatus: _r, ...rest }) => rest
  )

  // Identifier helper for evidence/labels — prefer MC#, fall back to DOT#
  const idOf = (lc: { mcNumber: string; dotNumber: string }): string =>
    lc.mcNumber ? `MC-${String(lc.mcNumber).replace(/^MC-?/i, '')} (DOT ${lc.dotNumber})` : `DOT ${lc.dotNumber}`

  // Severity-to-points mapping for active-sharing flags. Lower than revoked
  // counterparts because corporate sister entities legitimately share these.
  // Active-sharing total contribution is capped below to avoid false positives.
  const activeWeights: Record<string, { signal: string; severity: ChameleonSeverity; points: number; detail: string }> = {
    ein: {
      signal: 'Same EIN as another active MC',
      severity: 'high',
      points: 25,
      detail: 'This carrier shares an Employer Identification Number (EIN) with another currently active MC. A shared EIN means the same legal entity is operating under multiple authorities simultaneously — review whether this is a legitimate corporate structure or an attempt to spread safety risk across MC numbers.',
    },
    vin: {
      signal: 'Same vehicle VIN registered under another active MC',
      severity: 'high',
      points: 18,
      detail: 'One or more vehicle VINs registered to this carrier are also registered under another active MC number. VINs should not appear under two carriers at once without proper transfer paperwork — this can indicate double-bookkeeping, equipment leasing without disclosure, or two operations sharing the same fleet under different authorities.',
    },
    vehicle: {
      signal: 'Same vehicle VIN registered under another active MC',
      severity: 'high',
      points: 18,
      detail: 'One or more vehicle VINs registered to this carrier are also registered under another active MC number. VINs should not appear under two carriers at once without proper transfer paperwork — this can indicate double-bookkeeping, equipment leasing without disclosure, or two operations sharing the same fleet under different authorities.',
    },
    officer: {
      signal: 'Same owner/officer as another active MC',
      severity: 'medium',
      points: 12,
      detail: 'An officer or principal of this carrier is also listed on another currently active MC. Common in family businesses and corporate groups, but worth verifying — the same person controlling multiple authorities can be a way to keep operating after one MC accumulates safety violations.',
    },
    principal: {
      signal: 'Same owner/officer as another active MC',
      severity: 'medium',
      points: 12,
      detail: 'An officer or principal of this carrier is also listed on another currently active MC. Common in family businesses and corporate groups, but worth verifying — the same person controlling multiple authorities can be a way to keep operating after one MC accumulates safety violations.',
    },
    phone: {
      signal: 'Same phone number as another active MC',
      severity: 'medium',
      points: 10,
      detail: 'This carrier uses the same phone number as another active MC. Shared phone numbers across separate authorities can indicate a single dispatch operating multiple MCs in parallel — a pattern that may surface under enforcement scrutiny.',
    },
    address: {
      signal: 'Same physical address as another active MC',
      severity: 'low',
      points: 8,
      detail: 'This carrier operates from the same physical address as another active MC. Shared addresses are common (warehouses, registered agents, corporate parks), so this is a low-weight signal on its own — but it amplifies other chameleon indicators.',
    },
  }

  // Cap on cumulative active-sharing points across all linked carriers, so a
  // legitimate corporate group with many sister MCs does not score "high".
  const ACTIVE_SHARING_CAP = 30

  // For active sharing we aggregate ONE flag per signal type (not per carrier),
  // listing all matched MCs in the evidence. Without this, Schneider's 4 sister
  // MCs each produce a duplicate "Same phone" flag.
  const activeMatchesBySignal = new Map<string, V2ChameleonLinkedCarrier[]>()

  for (const lc of linkedCarriers) {
    const otherLabel = `${lc.legalName}${lc.dbaName ? ` (DBA ${lc.dbaName})` : ''}`
    const idLabel = idOf(lc)

    // Maintain legacy relatedRevokedCarriers list (one row per shared field, as before)
    if (lc.status === 'revoked' || lc.status === 'inactive') {
      for (const sf of lc.sharedFields) {
        relatedRevokedCarriers.push({
          mcNumber: lc.mcNumber,
          dotNumber: lc.dotNumber,
          legalName: lc.legalName,
          sharedField: sf,
          status: lc.status,
          powerUnits: lc.powerUnits,
          location: lc.location,
        })
      }
    }

    if (lc.status === 'revoked') {
      // Revoked-sharing rules — strongest chameleon signal. Emit one flag
      // per unique sharedField on this carrier (preserves prior behavior).
      for (const sf of lc.sharedFields) {
        if (sf === 'ein') {
          flags.push({
            signal: 'Shared EIN with revoked carrier',
            severity: 'critical',
            points: 35,
            detail: 'This carrier shares an Employer Identification Number (EIN) with a carrier whose authority was revoked by FMCSA. A shared EIN means the same legal entity is operating under a different MC number — a primary indicator of chameleon carrier behavior.',
            evidence: `Shares EIN with ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        } else if (sf === 'officer' || sf === 'principal') {
          flags.push({
            signal: 'Shared officer with revoked carrier',
            severity: 'critical',
            points: 30,
            detail: 'An officer or principal of this carrier is also listed on a carrier whose authority was revoked. FMCSA tracks beneficial ownership to prevent individuals from circumventing safety enforcement by opening new companies.',
            evidence: `Shares officer/principal with ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        } else if (sf === 'address') {
          flags.push({
            signal: 'Shared address with revoked carrier',
            severity: 'high',
            points: 20,
            detail: 'This carrier operates from the same physical address as a carrier whose authority was revoked. While shared addresses can occur legitimately (e.g., shared warehouses), combined with other signals this is a strong chameleon indicator.',
            evidence: `Shares address with ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        } else if (sf === 'phone') {
          flags.push({
            signal: 'Shared phone with revoked carrier',
            severity: 'high',
            points: 15,
            detail: 'This carrier uses the same phone number as a carrier whose authority was revoked. Reuse of contact information across entities is a common chameleon carrier pattern tracked by FMCSA.',
            evidence: `Shares phone number with ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        } else if (sf === 'vin' || sf === 'vehicle') {
          flags.push({
            signal: 'Shared vehicles with revoked carrier',
            severity: 'high',
            points: 20,
            detail: 'Vehicles (VINs) registered to this carrier were also registered to a revoked carrier. Equipment transfers from a shut-down operation to a new MC number is a hallmark of chameleon carriers trying to continue operating the same fleet.',
            evidence: `Shares vehicle VINs with ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        } else {
          flags.push({
            signal: `Related to revoked carrier (${sf})`,
            severity: 'medium',
            points: 10,
            detail: `This carrier shares a "${sf}" connection with a carrier whose authority was revoked. FMCSA flags related entities to identify carriers attempting to evade safety enforcement.`,
            evidence: `Related via "${sf}" to ${otherLabel} — ${idLabel}, status: REVOKED`,
          })
        }
      }
    } else if (lc.status === 'inactive') {
      // Inactive-sharing — only weight identity-level matches.
      const hasIdentityShare = lc.sharedFields.some(sf => ['ein', 'officer', 'principal'].includes(sf))
      if (hasIdentityShare) {
        const sf = lc.sharedFields.find(s => ['ein', 'officer', 'principal'].includes(s)) || 'identity'
        flags.push({
          signal: `Shared ${sf} with inactive carrier`,
          severity: 'low',
          points: 5,
          detail: 'This carrier shares an identity marker with an inactive carrier. While inactive status alone is not evidence of chameleon behavior, it warrants review if combined with other signals.',
          evidence: `Shares ${lc.sharedFields.join(', ')} with ${otherLabel} — ${idLabel}, status: INACTIVE`,
        })
      }
    } else {
      // Active-sharing — bucket this carrier under each signal type it
      // matches. We emit ONE aggregated flag per signal below (not per
      // carrier), to avoid duplicate flags when many sisters share the
      // same field. Suppress evidence-tracking for unrecognized fields.
      void otherLabel; void idLabel
      for (const sf of lc.sharedFields) {
        if (!activeWeights[sf]) continue
        const list = activeMatchesBySignal.get(sf) || []
        list.push(lc)
        activeMatchesBySignal.set(sf, list)
      }
    }
  }

  // Emit one aggregated flag per active-sharing signal type, ordered by
  // severity. Apply the cumulative cap so corporate groups don't ladder up.
  const severityRank: Record<ChameleonSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const aggregatedActive: V2ChameleonFlag[] = []
  for (const [sf, matches] of activeMatchesBySignal.entries()) {
    const cfg = activeWeights[sf]
    if (!cfg || matches.length === 0) continue
    const sample = matches.slice(0, 5).map(m => `${m.legalName} — ${idOf(m)}`).join('; ')
    const more = matches.length > 5 ? ` (+${matches.length - 5} more)` : ''
    aggregatedActive.push({
      signal: cfg.signal,
      severity: cfg.severity,
      points: cfg.points,
      detail: cfg.detail,
      evidence: `${matches.length} active MC${matches.length > 1 ? 's' : ''} ${matches.length === 1 ? 'shares' : 'share'} the same ${sf === 'vin' || sf === 'ein' ? sf.toUpperCase() : sf}: ${sample}${more}`,
    })
  }
  aggregatedActive.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.points - a.points)

  let activeSharingPoints = 0
  for (const f of aggregatedActive) {
    if (activeSharingPoints + f.points <= ACTIVE_SHARING_CAP) {
      flags.push(f)
      activeSharingPoints += f.points
    } else if (activeSharingPoints < ACTIVE_SHARING_CAP) {
      flags.push({ ...f, points: ACTIVE_SHARING_CAP - activeSharingPoints })
      activeSharingPoints = ACTIVE_SHARING_CAP
      break
    } else {
      break
    }
  }

  // ------------------------------------------------------------------
  // 2. SHARED EQUIPMENT — VINs shared with ANY other carrier
  //    Even without knowing the other carrier's status, shared VINs
  //    between distinct DOT numbers are a red flag.
  // ------------------------------------------------------------------
  const sharedVinCount = sharedEquipment.countSharedVins || sharedEquipment.totalShared || 0
  const sharedPowerUnits = sharedEquipment.countSharedPowerUnits || 0
  const sharedTrailers = sharedEquipment.countSharedTrailers || 0
  const sharedVinDetails = sharedEquipment.sharedVins || sharedEquipment.details || []

  if (sharedVinCount > 0) {
    let severity: ChameleonSeverity = 'medium'
    let points = 10
    if (sharedVinCount > 10) { severity = 'high'; points = 20 }
    else if (sharedVinCount > 5) { severity = 'high'; points = 15 }

    const otherCarriers = Array.isArray(sharedVinDetails)
      ? sharedVinDetails.slice(0, 3).map((s: any) => {
          const sharedDot = String(s.sharedWithDot || s.otherDotNumber || '')
          const linked = sharedDot ? linkedByDot.get(sharedDot) : undefined
          const id = linked ? idOf(linked) : `DOT ${sharedDot || '?'}`
          const name = s.sharedWithName || s.otherLegalName || linked?.legalName || 'Unknown'
          return `${name} — ${id}`
        }).join('; ')
      : ''

    // Sample VIN list (first 3) so the evidence shows the actual VIN strings.
    const vinSamples = Array.isArray(sharedVinDetails)
      ? sharedVinDetails.slice(0, 3).map((s: any) => s.vin).filter(Boolean)
      : []
    const vinPreview = vinSamples.length > 0
      ? ` Sample VIN${vinSamples.length > 1 ? 's' : ''}: ${vinSamples.join(', ')}${sharedVinCount > vinSamples.length ? ` (+${sharedVinCount - vinSamples.length} more)` : ''}.`
      : ''

    flags.push({
      signal: `${sharedVinCount} vehicle${sharedVinCount > 1 ? 's' : ''} shared with other carriers`,
      severity,
      points,
      detail: `${sharedPowerUnits > 0 ? sharedPowerUnits + ' power units' : ''}${sharedPowerUnits > 0 && sharedTrailers > 0 ? ' and ' : ''}${sharedTrailers > 0 ? sharedTrailers + ' trailers' : ''} registered to this carrier are also registered under other MC numbers. Shared equipment between carriers can indicate the same operation running under multiple authorities to distribute safety risk or evade enforcement.${vinPreview}`,
      evidence: otherCarriers ? `Shared with: ${otherCarriers}` : `${sharedVinCount} VINs shared across carriers`,
    })
  }

  // ------------------------------------------------------------------
  // 3. REVOCATION HISTORY — this carrier's own past revocations
  //    A carrier that has been revoked and then re-granted authority
  //    may be operating as its own chameleon.
  // ------------------------------------------------------------------
  const totalRevocations = parseInt(carrier.totalRevocations) || 0
  const daysSinceLastRevocation = carrier.daysSinceLastRevocation != null
    ? parseInt(carrier.daysSinceLastRevocation)
    : null

  if (totalRevocations > 0) {
    let severity: ChameleonSeverity = 'medium'
    let points = 10
    if (totalRevocations > 2) { severity = 'high'; points = 20 }
    else if (totalRevocations > 1) { severity = 'high'; points = 15 }

    const recentText = daysSinceLastRevocation != null && daysSinceLastRevocation < 730
      ? ` Most recent revocation was ${daysSinceLastRevocation} days ago.`
      : daysSinceLastRevocation != null
        ? ` Last revocation was ${Math.round(daysSinceLastRevocation / 365)} years ago.`
        : ''

    flags.push({
      signal: `${totalRevocations} prior authority revocation${totalRevocations > 1 ? 's' : ''}`,
      severity,
      points,
      detail: `This carrier has had its operating authority revoked ${totalRevocations} time${totalRevocations > 1 ? 's' : ''} by FMCSA.${recentText} Carriers with revocation history may have been forced to cease operations due to safety violations, insurance lapses, or compliance failures.`,
      evidence: `${totalRevocations} revocation${totalRevocations > 1 ? 's' : ''} on record${daysSinceLastRevocation != null ? `, last ${daysSinceLastRevocation} days ago` : ''}`,
    })
  }

  // ------------------------------------------------------------------
  // 4. YOUNG AUTHORITY + REVOCATION SIGNALS
  //    A very new authority combined with revocation-related signals
  //    is the classic chameleon pattern: shut down, then reopen quickly.
  // ------------------------------------------------------------------
  const authorityAgeDays = parseInt(carrier.authorityAgeDays) || 0
  const isYoungAuthority = authorityAgeDays > 0 && authorityAgeDays < 730 // < 2 years

  if (isYoungAuthority && (relatedRevokedCarriers.length > 0 || totalRevocations > 0)) {
    flags.push({
      signal: 'New authority with revocation connections',
      severity: 'high',
      points: 15,
      detail: `This carrier's authority is only ${authorityAgeDays < 365 ? 'less than a year' : 'less than 2 years'} old and has connections to revoked carriers or its own revocation history. New authorities established shortly after revocations are a primary pattern FMCSA uses to identify chameleon carriers.`,
      evidence: `Authority age: ${authorityAgeDays} days (~${Math.round(authorityAgeDays / 30)} months), ${relatedRevokedCarriers.length} revoked related carrier${relatedRevokedCarriers.length !== 1 ? 's' : ''}`,
    })
  }

  // ------------------------------------------------------------------
  // 5. QUICK RESTART — revoked then re-granted in short time
  //    Check the authority timeline for revocation → grant patterns.
  // ------------------------------------------------------------------
  if (Array.isArray(timeline) && timeline.length > 0) {
    const sorted = [...timeline].sort((a: any, b: any) => {
      const da = new Date(a.date || 0).getTime()
      const db = new Date(b.date || 0).getTime()
      return da - db
    })

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i]
      const next = sorted[i + 1]
      const currEvent = String(curr.event || '').toLowerCase()
      const nextEvent = String(next.event || '').toLowerCase()

      if ((currEvent.includes('revok') || currEvent.includes('cancel')) &&
          (nextEvent.includes('grant') || nextEvent.includes('approv') || nextEvent.includes('filed'))) {
        const revokeDate = new Date(curr.date || 0)
        const grantDate = new Date(next.date || 0)
        const daysBetween = Math.round((grantDate.getTime() - revokeDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysBetween >= 0 && daysBetween < 365) {
          flags.push({
            signal: 'Quick restart after revocation',
            severity: daysBetween < 90 ? 'critical' : 'high',
            points: daysBetween < 90 ? 25 : 15,
            detail: `Authority was revoked and then re-established ${daysBetween} days later. FMCSA considers a quick turnaround between revocation and new authority as a strong indicator that the carrier is attempting to circumvent safety enforcement. Legitimate carriers typically take longer to resolve the underlying issues.`,
            evidence: `Revoked ${normalizeDate(curr.date)}, re-granted ${normalizeDate(next.date)} (${daysBetween} days gap)`,
          })
          break // Only flag the most recent instance
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // 6. MULTIPLE RELATED CARRIERS (volume signal)
  //    Having many related carriers in itself isn't conclusive, but
  //    a high count amplifies other signals.
  // ------------------------------------------------------------------
  const relatedCount = relatedList.length
  if (relatedCount > 5) {
    flags.push({
      signal: `${relatedCount} related carrier entities`,
      severity: relatedCount > 10 ? 'medium' : 'low',
      points: relatedCount > 10 ? 10 : 5,
      detail: `This carrier is linked to ${relatedCount} other carrier entities through shared addresses, officers, equipment, or contact information. A high number of related entities can indicate a network of carriers under common control, which FMCSA monitors for chameleon activity and safety evasion patterns.`,
      evidence: `${relatedCount} related carriers found; ${relatedRevokedCarriers.length} with revoked/inactive status`,
    })
  }

  // ------------------------------------------------------------------
  // SCORE CALCULATION
  // ------------------------------------------------------------------
  // Sort flags by severity (critical first) then by points (highest first)
  const severityOrder: Record<ChameleonSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.points - a.points)

  // Cap at 100
  const rawScore = flags.reduce((sum, f) => sum + f.points, 0)
  const riskScore = Math.min(rawScore, 100)

  // Determine risk level
  let riskLevel: V2ChameleonAnalysis['riskLevel'] = 'none'
  if (riskScore >= 70) riskLevel = 'critical'
  else if (riskScore >= 45) riskLevel = 'high'
  else if (riskScore >= 25) riskLevel = 'moderate'
  else if (riskScore > 0) riskLevel = 'low'

  // Build summary
  const hasCritical = flags.some(f => f.severity === 'critical')
  let summary = ''
  if (riskLevel === 'none') {
    summary = 'No chameleon carrier indicators detected. This carrier shows no signs of reincarnated authority or evasion patterns.'
  } else if (riskLevel === 'critical') {
    summary = `Critical chameleon carrier risk detected. ${flags.length} red flag${flags.length > 1 ? 's' : ''} found including ${hasCritical ? 'direct identity links to revoked carriers' : 'multiple high-severity indicators'}. This carrier requires thorough due diligence before any transaction.`
  } else if (riskLevel === 'high') {
    summary = `High chameleon carrier risk. ${flags.length} indicator${flags.length > 1 ? 's' : ''} found linking this carrier to revoked or inactive entities. Additional investigation is strongly recommended.`
  } else if (riskLevel === 'moderate') {
    summary = `Moderate chameleon carrier indicators present. ${flags.length} signal${flags.length > 1 ? 's' : ''} detected that may warrant further review before proceeding.`
  } else {
    summary = `Low-level chameleon indicators detected. ${flags.length} minor signal${flags.length > 1 ? 's' : ''} found — likely benign but noted for awareness.`
  }

  return {
    riskScore,
    riskLevel,
    flags,
    summary,
    relatedRevokedCarriers,
    linkedCarriers,
  }
}
