// V2 Type Definitions + Mock/Fallback Data for MCDetailPageV2
// These types define the shape of carrier data used throughout the V2 page.
// Mock data is used as fallback when real API data is unavailable.

// ============================================================
// STATUS HELPERS
// ============================================================
export type StatusLevel = 'excellent' | 'good' | 'fair' | 'warning' | 'danger' | 'neutral'

export const statusColors: Record<StatusLevel, { text: string; bg: string; border: string; badge: string }> = {
  excellent: { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  good: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  fair: { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  warning: { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  danger: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  neutral: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' },
}

export function getStatusLevel(category: string, value: any): StatusLevel {
  if (category === 'insurance') {
    if (value === 'current' || value === 'active') return 'excellent'
    if (value === 'pending') return 'fair'
    return 'danger'
  }
  if (category === 'safety') {
    // Handle string safety ratings from FMCSA
    if (typeof value === 'string') {
      if (value === 'satisfactory') return 'excellent'
      if (value === 'conditional') return 'fair'
      if (value === 'unsatisfactory') return 'danger'
      if (value === 'not-rated') return 'good'
      return 'good'
    }
    // Handle numeric scores (BASIC percentiles — higher = worse)
    const v = typeof value === 'number' ? value : 0
    if (v >= 80) return 'danger'
    if (v >= 65) return 'warning'
    if (v >= 40) return 'good'
    return 'excellent'
  }
  if (category === 'authority') {
    if (value === 'active' || value === 'authorized') return 'excellent'
    if (value === 'pending') return 'fair'
    return 'danger'
  }
  if (category === 'trust') {
    if (typeof value === 'number') {
      if (value >= 80) return 'excellent'
      if (value >= 60) return 'good'
      if (value >= 40) return 'fair'
      if (value >= 20) return 'warning'
      return 'danger'
    }
    return 'neutral'
  }
  if (category === 'risk') {
    if (typeof value === 'number') {
      if (value <= 20) return 'excellent'
      if (value <= 40) return 'good'
      if (value <= 60) return 'fair'
      if (value <= 80) return 'warning'
      return 'danger'
    }
    return 'neutral'
  }
  if (category === 'basic') {
    const v = typeof value === 'number' ? value : 0
    if (v >= 80) return 'danger'
    if (v >= 65) return 'warning'
    if (v >= 40) return 'good'
    return 'excellent'
  }
  return 'neutral'
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface V2CarrierData {
  mcNumber: string
  dotNumber: string
  legalName: string
  dbaName: string
  location: string
  address: string
  phone: string
  yearsActive: number
  powerUnits: number
  drivers: number
  mcs150Date: string
  registrantDate: string
  trustScore: number
  riskScore: number
  safetyRating: 'satisfactory' | 'conditional' | 'unsatisfactory' | 'not-rated'
  insuranceStatus: 'current' | 'expired' | 'pending'
  listingPrice: number
  description: string
  operatingStatus: 'authorized' | 'not-authorized' | 'pending'
  entityType: string
  cargoTypes: string[]
  amazonRelayScore: string
  highwaySetup: boolean
  sellingWithEmail: boolean
  sellingWithPhone: boolean
  ein: string
  emailDomain: string
  fax: string
  cellphone: string
  primaryContact: string
  secondaryContact: string
  mcs150Mileage: number
  authorityAgeDays: number
  totalRevocations: number
  daysSinceLastRevocation: number | null
  ownedTractors: number
  termLeasedTractors: number
  totalDriversCDL: number
  driversInterstate100mi: number
  driversInterstateBeyond100mi: number
  smartwayFlag: boolean
  carbtruFlag: boolean
  phmsaFlag: boolean
  carrierHealthScore: number
}

export interface V2AuthorityData {
  common: { status: 'active' | 'inactive' | 'revoked'; grantedDate: string; effectiveDate: string }
  contract: { status: 'active' | 'inactive' | 'revoked'; grantedDate: string; effectiveDate: string }
  broker: { status: 'active' | 'inactive' | 'revoked'; grantedDate: string; effectiveDate: string }
}

export interface V2AuthorityEvent {
  date: string
  event: string
  type: 'filed' | 'approved' | 'granted' | 'renewed' | 'cancelled' | 'warning' | 'revoked' | 'new' | 'changed'
}

export interface V2AuthorityPending {
  commonPending: boolean
  commonReview: boolean
  contractPending: boolean
  contractReview: boolean
  brokerPending: boolean
  brokerReview: boolean
}

export interface V2BasicScore {
  name: string
  score: number | null
  threshold: number
  percentile: number | null
  description: string
  /** Ranked by us from FMCSA's published measures, not an official FMCSA percentile. */
  estimated?: boolean
  /** Why it isn't scored, or the range behind an estimate. */
  note?: string
}

export interface V2BasicAlerts {
  unsafeDrivingAlert: boolean
  hoursOfServiceAlert: boolean
  driverFitnessAlert: boolean
  controlledSubstanceAlert: boolean
  vehicleMaintenanceAlert: boolean
  hazmatAlert: boolean
  crashIndicatorAlert: boolean
  unsafeDrivingOOSAlert: boolean
  hoursOfServiceOOSAlert: boolean
  vehicleMaintenanceOOSAlert: boolean
}

export interface V2InspectionSummary {
  totalInspections: number
  driverInspections: number
  vehicleInspections: number
  hazmatInspections: number
  iepInspections: number
  driverOOS: number
  vehicleOOS: number
  hazmatOOS: number
  iepOOS: number
  driverOOSRate: number
  vehicleOOSRate: number
  hazmatOOSRate: number
  iepOOSRate: number
  nationalDriverOOSRate: number
  nationalVehicleOOSRate: number
  nationalHazmatOOSRate: number
}

export interface V2InspectionRecord {
  id: string
  date: string
  state: string
  type: string
  level: string
  violations: number
  oosViolations: number
  oos: boolean
  reportNumber: string
  fmcsaId: string
  violationDetails: {
    category: string
    group: string
    description: string
    severity: number
    oos: boolean
  }[]
}

export interface V2CrashData {
  fatal: number
  injury: number
  towaway: number
  total: number
}

export interface V2CrashRecord {
  id: string
  date: string
  state: string
  severity: string
  fatalities: number
  injuries: number
  hazmatRelease: boolean
  reportNumber: string
}

export interface V2InsurancePolicy {
  insurer: string
  policyNumber: string
  type: 'BIPD' | 'Cargo' | 'Bond' | 'General'
  coverage: number
  required: number
  status: 'active' | 'expired' | 'pending'
  effectiveDate: string
  expirationDate: string
}

export interface V2RenewalEvent {
  policyType: string
  date: string
  daysUntil: number
  urgency: 'ok' | 'warning' | 'critical' | 'expired' | 'low' | 'medium' | 'high'
}

export interface V2PolicyEvent {
  date: string
  event: string
  type: string
  policyType: string
}

export interface V2InsuranceGap {
  policyType: string
  gapStart: string
  gapEnd: string
  daysGap: number
  status: string
}

export interface V2TruckData {
  vin: string
  year: number
  make: string
  model: string
  bodyClass: string
  gvwr: string
  inspections: number
  oosCount: number
  vehicleType?: string
  inspectionCount?: number
  totalOOS?: number
  lastSeen?: string
  firstSeen?: string
}

export interface V2TrailerData {
  vin: string
  year: number
  make: string
  model: string
  type: string
  length: string
  inspectionCount?: number
  lastSeen?: string
  firstSeen?: string
}

export interface V2VinInspection {
  vin: string
  date: string
  location: string
  type: string
  result: 'pass' | 'fail' | 'oos' | 'warning'
  violations: number
  oosViolations: number
}

export interface V2ISSData {
  issScore: number
  riskLevel: string
  issStatus: string
  category: string
  recommendation: string
  highRisk: boolean
}

export interface V2OperationsSummary {
  totalInspections: number
  totalOOS: number
  overallOOSRate: number
  inspectionTrend: 'up' | 'down' | 'stable' | 'improving' | 'worsening'
  trendPct: number
  topViolations: { category: string; count: number; severity: 'critical' | 'major' | 'minor' }[]
  operatingStates: { state: string; stateCode: string; inspections: number; oosCount: number; oosRate: number }[]
  mileageEstimate: string
  inspectionsPer100k: number
  cleanInspectionRate: number
  lastInspectionDate: string
  averageViolationsPerInspection: number
}

export interface V2ViolationBreakdown {
  unsafeDriving: number
  hoursOfService: number
  vehicleMaintenance: number
  controlledSubstance: number
  driverFitness: number
  hazardousMaterials: number
}

export interface V2SharedEquipment {
  countSharedVins: number
  countSharedPowerUnits?: number
  countSharedTrailers?: number
  sharedVins: { vin: string; sharedWithDot?: string; sharedWithName?: string; sharedWithCount?: number; sharedWith?: { dotNumber: string; legalName: string }[] }[]
}

export interface V2ContactHistory {
  changes: { date: string; field: string; oldValue: string; newValue: string; changeType: string }[]
}

export interface V2CargoCapabilities {
  generalFreight: boolean
  householdGoods: boolean
  metalSheets: boolean
  motorVehicles: boolean
  drivewayTowaway: boolean
  logsPolesBeams: boolean
  buildingMaterials: boolean
  mobileHomes: boolean
  machineryLargeObjects: boolean
  freshProduce: boolean
  liquids: boolean
  grainFeedHay: boolean
  coalCoke: boolean
  meat: boolean
  garbageRefuse: boolean
  usMailSeparate: boolean
  chemicals: boolean
  commoditiesDryBulk: boolean
  refrigeratedFood: boolean
  beverages: boolean
  paperProducts: boolean
  utilities: boolean
  farmSupplies: boolean
  construction: boolean
  waterWell: boolean
  intermodalContainers: boolean
  oilFieldEquipment: boolean
  livestock: boolean
  grainfeedHay: boolean
  coalCoke2: boolean
  passengers: boolean
}

export interface V2ComplianceFinancials {
  entryAuditCompleted: boolean
  hasFactoring: boolean
  factoringCompany: string
  factoringRate: number
}

export interface V2AvailableDocument {
  name: string
  available: boolean
}

export interface V2DocumentItem {
  name: string
  status: 'verified' | 'pending' | 'missing' | 'active' | 'inactive' | 'on_file' | 'not_found' | 'current' | 'expired'
  description: string
}

export interface V2MonitoringAlert {
  date: string
  type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  detail: string
  resolved: boolean
}

export interface V2RiskScoreTrend {
  month: string
  trustScore: number
  riskScore: number
}

export interface V2ViolationTrend {
  month: string
  violations: number
  oosEvents: number
}

export interface V2RelatedCarrier {
  mcNumber: string
  dotNumber: string
  legalName: string
  sharedField: string
  status: string
  powerUnits: number
  location: string
}

export interface V2CarrierPercentile {
  metric: string
  carrierValue: number | null
  percentile: number | null
  category: 'excellent' | 'good' | 'average' | 'below_average' | 'poor' | 'unknown'
  unit: string
  lowerIsBetter: boolean
}

export interface V2NetworkSignal {
  name: string
  value: string | number
  status: 'positive' | 'neutral' | 'negative'
  detail: string
}

export interface V2BenchmarkData {
  metric: string
  carrierValue: number
  industryAvg: number
  unit: string
  lowerIsBetter: boolean
}

// ============================================================
// CHAMELEON CARRIER DETECTION
// ============================================================
export type ChameleonSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface V2ChameleonFlag {
  signal: string              // Short label: "Shared EIN with revoked carrier"
  severity: ChameleonSeverity
  points: number              // Weighted score contribution
  detail: string              // Human-readable explanation of WHY this is a red flag
  evidence: string            // Specific data that triggered this flag
}

export interface V2ChameleonLinkedCarrier {
  mcNumber: string            // MC number of the related carrier ('' if none assigned)
  dotNumber: string
  legalName: string
  dbaName: string
  status: 'active' | 'inactive' | 'revoked'
  sharedFields: string[]      // All fields shared with this carrier: address, phone, ein, officer, vin
  powerUnits: number
  location: string            // City, State
}

export interface V2ChameleonAnalysis {
  riskScore: number           // 0-100 composite score
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical'
  flags: V2ChameleonFlag[]
  summary: string             // One-sentence verdict
  relatedRevokedCarriers: Array<{
    mcNumber: string
    dotNumber: string
    legalName: string
    sharedField: string       // What they share: address, EIN, officer, phone, VIN
    status: string
    powerUnits: number
    location: string
  }>
  linkedCarriers: V2ChameleonLinkedCarrier[]   // All flagged related carriers grouped by DOT (active + inactive + revoked)
}

// ============================================================
// MOCK / FALLBACK DATA
// ============================================================

export const mockCarrier: V2CarrierData = {
  mcNumber: 'MC-845219',
  dotNumber: '3187270',
  legalName: 'Sample Freight LLC',
  dbaName: 'Sample Express',
  location: 'Dallas, TX',
  address: '4521 Commerce St, Dallas, TX 75226',
  phone: '(214) 555-0147',
  yearsActive: 8.4,
  powerUnits: 12,
  drivers: 14,
  mcs150Date: '2024-09-15',
  registrantDate: '2017-06-22',
  trustScore: 82,
  riskScore: 18,
  safetyRating: 'satisfactory',
  insuranceStatus: 'current',
  listingPrice: 85000,
  description: 'Well-established MC authority with clean safety record, active insurance, and strong operating history. Includes all documentation for seamless transfer.',
  operatingStatus: 'authorized',
  entityType: 'Carrier',
  cargoTypes: ['General Freight', 'Household Goods', 'Building Materials', 'Refrigerated Food'],
  amazonRelayScore: 'Excellent',
  highwaySetup: true,
  sellingWithEmail: true,
  sellingWithPhone: true,
  ein: '**-***4782',
  emailDomain: 'samplefreight.com',
  fax: '',
  cellphone: '(214) 555-0148',
  primaryContact: 'John S.',
  secondaryContact: '',
  mcs150Mileage: 2400000,
  authorityAgeDays: 3072,
  totalRevocations: 0,
  daysSinceLastRevocation: null,
  ownedTractors: 8,
  termLeasedTractors: 4,
  totalDriversCDL: 14,
  driversInterstate100mi: 6,
  driversInterstateBeyond100mi: 8,
  smartwayFlag: true,
  carbtruFlag: false,
  phmsaFlag: false,
  carrierHealthScore: 86,
}

export const mockAuthority: V2AuthorityData = {
  common: { status: 'active', grantedDate: '2017-06-22', effectiveDate: '2017-07-15' },
  contract: { status: 'active', grantedDate: '2017-06-22', effectiveDate: '2017-07-15' },
  broker: { status: 'inactive', grantedDate: '', effectiveDate: '' },
}

export const mockAuthorityHistory: V2AuthorityEvent[] = [
  { date: '2017-06-22', event: 'Common Authority application filed', type: 'filed' },
  { date: '2017-07-15', event: 'Common Authority granted', type: 'granted' },
  { date: '2017-07-15', event: 'Contract Authority granted', type: 'granted' },
  { date: '2020-03-10', event: 'Insurance renewed', type: 'renewed' },
  { date: '2023-11-01', event: 'MCS-150 updated', type: 'changed' },
]
export const mockAuthorityPending: V2AuthorityPending = {
  commonPending: false, commonReview: false,
  contractPending: false, contractReview: false,
  brokerPending: false, brokerReview: false,
}

export const mockBasicScores: V2BasicScore[] = [
  { name: 'Unsafe Driving', score: 22, threshold: 65, percentile: 22, description: 'Operations of CMVs in a dangerous or careless manner' },
  { name: 'Hours of Service', score: 38, threshold: 65, percentile: 38, description: 'Operating CMVs when ill, fatigued, or not complying with HOS' },
  { name: 'Driver Fitness', score: null, threshold: 80, percentile: null, description: 'Operating CMVs by drivers who are unfit' },
  { name: 'Controlled Substance', score: null, threshold: 80, percentile: null, description: 'Operation of CMVs by drivers impaired by drugs or alcohol' },
  { name: 'Vehicle Maintenance', score: 45, threshold: 80, percentile: 45, description: 'Failure to properly maintain CMVs and equipment' },
  { name: 'Hazardous Materials', score: null, threshold: 80, percentile: null, description: 'Unsafe handling of hazardous materials' },
  { name: 'Crash Indicator', score: 31, threshold: 65, percentile: 31, description: 'Histories or patterns of crash involvement' },
]
export const mockBasicAlerts: V2BasicAlerts = {
  unsafeDrivingAlert: false, hoursOfServiceAlert: false, driverFitnessAlert: false,
  controlledSubstanceAlert: false, vehicleMaintenanceAlert: false, hazmatAlert: false,
  crashIndicatorAlert: false, unsafeDrivingOOSAlert: false, hoursOfServiceOOSAlert: false,
  vehicleMaintenanceOOSAlert: false,
}

export const mockInspections: V2InspectionSummary = {
  totalInspections: 47,
  driverInspections: 38, vehicleInspections: 42, hazmatInspections: 0, iepInspections: 0,
  driverOOS: 2, vehicleOOS: 5, hazmatOOS: 0, iepOOS: 0,
  driverOOSRate: 5.26, vehicleOOSRate: 11.9, hazmatOOSRate: 0, iepOOSRate: 0,
  nationalDriverOOSRate: 6.67, nationalVehicleOOSRate: 22.26, nationalHazmatOOSRate: 4.44,
}

export const mockInspectionRecords: V2InspectionRecord[] = [
  { id: 'INS001', date: '2025-11-14', state: 'TX', type: 'Vehicle', level: 'Level 1', violations: 1, oosViolations: 0, oos: false, reportNumber: 'TX2025-44821', fmcsaId: 'F001', violationDetails: [{ category: 'Vehicle Maintenance', group: 'Brakes', description: 'Brake adjustment issue', severity: 4, oos: false }] },
  { id: 'INS002', date: '2025-09-03', state: 'OK', type: 'Driver', level: 'Level 3', violations: 0, oosViolations: 0, oos: false, reportNumber: 'OK2025-12093', fmcsaId: 'F002', violationDetails: [] },
  { id: 'INS003', date: '2025-06-18', state: 'AR', type: 'Vehicle', level: 'Level 2', violations: 2, oosViolations: 1, oos: true, reportNumber: 'AR2025-09471', fmcsaId: 'F003', violationDetails: [{ category: 'Vehicle Maintenance', group: 'Tires', description: 'Flat tire or fabric exposed', severity: 8, oos: true }, { category: 'Vehicle Maintenance', group: 'Lights', description: 'Inoperative turn signal', severity: 2, oos: false }] },
  { id: 'INS004', date: '2025-03-22', state: 'TX', type: 'Vehicle', level: 'Level 1', violations: 0, oosViolations: 0, oos: false, reportNumber: 'TX2025-07832', fmcsaId: 'F004', violationDetails: [] },
  { id: 'INS005', date: '2024-12-10', state: 'NM', type: 'Driver', level: 'Level 3', violations: 1, oosViolations: 1, oos: true, reportNumber: 'NM2024-31204', fmcsaId: 'F005', violationDetails: [{ category: 'Hours of Service', group: 'General', description: 'Driving beyond 11-hour limit', severity: 7, oos: true }] },
]

export const mockCrashes: V2CrashData = { fatal: 0, injury: 1, towaway: 2, total: 3 }
export const mockCrashRecords: V2CrashRecord[] = [
  { id: 'CR001', date: '2025-08-22', state: 'TX', severity: 'Towaway', fatalities: 0, injuries: 0, hazmatRelease: false, reportNumber: 'TX2025-CR-4412' },
  { id: 'CR002', date: '2024-11-05', state: 'OK', severity: 'Injury', fatalities: 0, injuries: 1, hazmatRelease: false, reportNumber: 'OK2024-CR-8831' },
  { id: 'CR003', date: '2024-03-17', state: 'TX', severity: 'Towaway', fatalities: 0, injuries: 0, hazmatRelease: false, reportNumber: 'TX2024-CR-1920' },
]

export const mockInsurancePolicies: V2InsurancePolicy[] = [
  { insurer: 'Progressive Commercial', policyNumber: 'PCL-8834521', type: 'BIPD', coverage: 1000000, required: 750000, status: 'active', effectiveDate: '2025-01-15', expirationDate: '2026-01-15' },
  { insurer: 'National Interstate', policyNumber: 'NIC-220198', type: 'Cargo', coverage: 250000, required: 100000, status: 'active', effectiveDate: '2025-02-01', expirationDate: '2026-02-01' },
  { insurer: 'Zurich Insurance', policyNumber: 'ZUR-5510032', type: 'General', coverage: 500000, required: 0, status: 'active', effectiveDate: '2025-03-01', expirationDate: '2026-03-01' },
]
export const mockRenewalTimeline: V2RenewalEvent[] = [
  { policyType: 'BIPD', date: '2026-01-15', daysUntil: 308, urgency: 'ok' },
  { policyType: 'Cargo', date: '2026-02-01', daysUntil: 325, urgency: 'ok' },
  { policyType: 'General', date: '2026-03-01', daysUntil: 353, urgency: 'ok' },
]
export const mockPolicyHistory: V2PolicyEvent[] = [
  { date: '2025-01-15', event: 'BIPD policy renewed', type: 'renewed', policyType: 'BIPD' },
  { date: '2025-02-01', event: 'Cargo policy renewed', type: 'renewed', policyType: 'Cargo' },
  { date: '2024-01-15', event: 'BIPD policy issued', type: 'new', policyType: 'BIPD' },
]
export const mockInsuranceGaps: V2InsuranceGap[] = []

export const mockTrucks: V2TruckData[] = [
  { vin: '1FUJG3DV9CLBP8274', year: 2021, make: 'Freightliner', model: 'Cascadia', bodyClass: 'Truck-Tractor', gvwr: '33,000 lbs', inspections: 8, oosCount: 1 },
  { vin: '3AKJHHDR5NSMP4891', year: 2020, make: 'Freightliner', model: 'Cascadia', bodyClass: 'Truck-Tractor', gvwr: '33,000 lbs', inspections: 6, oosCount: 0 },
  { vin: '1XKYD49X5MJ471023', year: 2022, make: 'Kenworth', model: 'T680', bodyClass: 'Truck-Tractor', gvwr: '33,000 lbs', inspections: 5, oosCount: 0 },
  { vin: '3HSDJAPR4NN618437', year: 2019, make: 'International', model: 'LT', bodyClass: 'Truck-Tractor', gvwr: '33,000 lbs', inspections: 12, oosCount: 2 },
]
export const mockTrailers: V2TrailerData[] = [
  { vin: '1JJV532D0ML539821', year: 2020, make: 'Great Dane', model: 'Everest', type: 'Reefer', length: '53 ft' },
  { vin: '3HSDTSJR9PN614920', year: 2021, make: 'Utility', model: 'VS2DX', type: 'Dry Van', length: '53 ft' },
  { vin: '1UYVS2538NU284710', year: 2018, make: 'Wabash', model: 'DuraPlate', type: 'Dry Van', length: '53 ft' },
]
export const mockVinInspections: V2VinInspection[] = [
  { vin: '1FUJG3DV9CLBP8274', date: '2025-11-14', location: 'Dallas, TX', type: 'Level 1', result: 'pass', violations: 1, oosViolations: 0 },
  { vin: '3HSDJAPR4NN618437', date: '2025-06-18', location: 'Little Rock, AR', type: 'Level 2', result: 'oos', violations: 2, oosViolations: 1 },
]
export const mockSharedEquipment: V2SharedEquipment = { countSharedVins: 0, sharedVins: [] }

export const mockOperations: V2OperationsSummary = {
  totalInspections: 47, totalOOS: 7, overallOOSRate: 14.89,
  inspectionTrend: 'stable', trendPct: 2.1,
  topViolations: [
    { category: 'Vehicle Maintenance', count: 12, severity: 'major' },
    { category: 'Hours of Service', count: 5, severity: 'major' },
    { category: 'Unsafe Driving', count: 3, severity: 'minor' },
  ],
  operatingStates: [
    { state: 'Texas', stateCode: 'TX', inspections: 22, oosCount: 3, oosRate: 13.6 },
    { state: 'Oklahoma', stateCode: 'OK', inspections: 10, oosCount: 1, oosRate: 10.0 },
    { state: 'Arkansas', stateCode: 'AR', inspections: 8, oosCount: 2, oosRate: 25.0 },
    { state: 'New Mexico', stateCode: 'NM', inspections: 4, oosCount: 1, oosRate: 25.0 },
    { state: 'Louisiana', stateCode: 'LA', inspections: 3, oosCount: 0, oosRate: 0 },
  ],
  mileageEstimate: '2.4M',
  inspectionsPer100k: 1.96,
  cleanInspectionRate: 72.3,
  lastInspectionDate: '2025-11-14',
  averageViolationsPerInspection: 0.85,
}

export const mockViolationBreakdown: V2ViolationBreakdown = {
  unsafeDriving: 3, hoursOfService: 5, vehicleMaintenance: 12,
  controlledSubstance: 0, driverFitness: 0, hazardousMaterials: 0,
}

export const mockViolationTrend: V2ViolationTrend[] = [
  { month: '2025-01', violations: 3, oosEvents: 1 },
  { month: '2025-03', violations: 2, oosEvents: 0 },
  { month: '2025-06', violations: 4, oosEvents: 2 },
  { month: '2025-09', violations: 1, oosEvents: 0 },
  { month: '2025-11', violations: 2, oosEvents: 1 },
]

export const mockISSData: V2ISSData = {
  issScore: 42, riskLevel: 'Low', issStatus: 'Pass', category: 'Carrier', recommendation: 'Standard inspection frequency', highRisk: false,
}

export const mockCargoCapabilities: V2CargoCapabilities = {
  generalFreight: true, householdGoods: false, metalSheets: true, motorVehicles: false,
  drivewayTowaway: false, logsPolesBeams: false, buildingMaterials: true, mobileHomes: false,
  machineryLargeObjects: false, freshProduce: true, liquids: false, grainFeedHay: false,
  coalCoke: false, meat: false, garbageRefuse: false, usMailSeparate: false,
  chemicals: false, commoditiesDryBulk: false, refrigeratedFood: true, beverages: true,
  paperProducts: true, utilities: false, farmSupplies: false, construction: false,
  waterWell: false, intermodalContainers: true, oilFieldEquipment: false, livestock: false,
  grainfeedHay: false, coalCoke2: false, passengers: false,
}

export const mockDocuments: V2DocumentItem[] = [
  { name: 'BOC-3 Process Agent', status: 'on_file', description: 'Blanket designation on file with FMCSA' },
  { name: 'MCS-150 Form', status: 'current', description: 'Last updated September 2024' },
  { name: 'BIPD Insurance', status: 'active', description: 'Progressive Commercial — $1M coverage' },
  { name: 'Cargo Insurance', status: 'active', description: 'National Interstate — $250K coverage' },
  { name: 'Safety Rating', status: 'active', description: 'Satisfactory rating from FMCSA' },
]
export const mockVerificationChecks: any[] = [
  { name: 'FMCSA Registration', passed: true },
  { name: 'Insurance on File', passed: true },
  { name: 'BOC-3 on File', passed: true },
  { name: 'Safety Rating', passed: true },
  { name: 'No Active Revocations', passed: true },
]
export const mockAvailableDocuments: V2AvailableDocument[] = [
  { name: 'Operating Authority Certificate', available: true },
  { name: 'Insurance Certificate', available: true },
  { name: 'BOC-3 Filing', available: true },
  { name: 'Safety Audit Report', available: false },
  { name: 'Drug & Alcohol Policy', available: true },
]

export const mockComplianceFinancials: V2ComplianceFinancials = {
  entryAuditCompleted: true, hasFactoring: false, factoringCompany: '', factoringRate: 0,
}

export const mockContactHistory: V2ContactHistory = {
  changes: [
    { date: '2024-09-15', field: 'Phone', oldValue: '(214) 555-0100', newValue: '(214) 555-0147', changeType: 'Updated' },
    { date: '2023-11-01', field: 'Address', oldValue: '1200 Main St, Dallas, TX', newValue: '4521 Commerce St, Dallas, TX 75226', changeType: 'Updated' },
  ],
}

export const mockMonitoringAlerts: V2MonitoringAlert[] = [
  { date: '2025-11-14', type: 'inspection', severity: 'info', title: 'New Inspection Recorded', detail: 'Level 1 inspection in TX — no OOS violations', resolved: true },
]
export const mockRiskScoreTrend: V2RiskScoreTrend[] = [
  { month: '2025-07', trustScore: 78, riskScore: 22 },
  { month: '2025-08', trustScore: 80, riskScore: 20 },
  { month: '2025-09', trustScore: 81, riskScore: 19 },
  { month: '2025-10', trustScore: 80, riskScore: 20 },
  { month: '2025-11', trustScore: 82, riskScore: 18 },
]
export const mockRelatedCarriers: V2RelatedCarrier[] = [
  { mcNumber: 'MC-912034', dotNumber: '2841920', legalName: 'Sample Transport Inc', sharedField: 'Address', status: 'active', powerUnits: 6, location: 'Dallas, TX' },
]
export const mockCarrierPercentiles: V2CarrierPercentile[] = [
  { metric: 'Fleet Size', carrierValue: 12, percentile: 68, category: 'good', unit: 'units', lowerIsBetter: false },
  { metric: 'Authority Age', carrierValue: 8.4, percentile: 72, category: 'good', unit: 'years', lowerIsBetter: false },
  { metric: 'OOS Rate', carrierValue: 14.89, percentile: 35, category: 'good', unit: '%', lowerIsBetter: true },
  { metric: 'Inspections per 100K mi', carrierValue: 1.96, percentile: 45, category: 'average', unit: '', lowerIsBetter: true },
  { metric: 'Insurance Coverage', carrierValue: 1000000, percentile: 78, category: 'good', unit: '$', lowerIsBetter: false },
]
export const mockNetworkSignals: V2NetworkSignal[] = [
  { name: 'SmartWay Certified', value: 'Yes', status: 'positive', detail: 'EPA SmartWay Transport partner' },
  { name: 'Authority Age', value: '8+ Years', status: 'positive', detail: 'Well-established operating history' },
  { name: 'Clean Record', value: '0 Revocations', status: 'positive', detail: 'No authority revocations on file' },
]
export const mockBenchmarks: V2BenchmarkData[] = [
  { metric: 'Vehicle OOS Rate', carrierValue: 11.9, industryAvg: 22.26, unit: '%', lowerIsBetter: true },
  { metric: 'Driver OOS Rate', carrierValue: 5.26, industryAvg: 6.67, unit: '%', lowerIsBetter: true },
  { metric: 'Clean Inspection Rate', carrierValue: 72.3, industryAvg: 55.0, unit: '%', lowerIsBetter: false },
]
