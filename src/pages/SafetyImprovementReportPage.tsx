import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Search, Loader2, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Minus, BarChart3, Truck,
  FileText, AlertCircle, Activity, Hash, ArrowRight,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { api } from '../services/api'

interface BASICScore {
  category: string
  measure: number | null
  threshold: number
  percentile: number | null
  alert: boolean
}

interface SIRData {
  carrier: {
    legalName: string
    dbaName?: string
    dotNumber: string
    mcNumber?: string
    totalDrivers: number
    totalPowerUnits: number
    operatingStatus: string
    safetyRating?: string
  }
  basics: BASICScore[]
  inspections: {
    total: number
    vehicleOOS: number
    driverOOS: number
    vehicleOOSRate: number
    driverOOSRate: number
  }
  snapshotDate?: string
  recommendations: string[]
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
}

function getRiskColor(risk: string) {
  switch (risk) {
    case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'critical': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getScoreColor(measure: number | null, threshold: number) {
  if (measure === null) return 'text-gray-400'
  if (measure > threshold) return 'text-red-600'
  if (measure >= threshold * 0.75) return 'text-amber-600'
  return 'text-emerald-600'
}

function buildSIR(smsData: any, carrierData: any): SIRData {
  const basics: BASICScore[] = []
  const thresholds: Record<string, number> = {
    'Unsafe Driving': 65,
    'Crash Indicator': 65,
    'HOS Compliance': 65,
    'Vehicle Maintenance': 80,
    'Controlled Substances': 80,
    'Hazmat Compliance': 80,
    'Driver Fitness': 80,
  }

  if (smsData?.basicsData) {
    for (const [category, data] of Object.entries(smsData.basicsData) as any[]) {
      const name = category.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim()
      const friendlyName = name === 'Hos Compliance' ? 'HOS Compliance' : name
      const threshold = thresholds[friendlyName] || 65
      basics.push({
        category: friendlyName,
        measure: data?.measure ?? data?.percentile ?? null,
        threshold,
        percentile: data?.percentile ?? null,
        alert: (data?.measure ?? 0) > threshold || (data?.alert === true),
      })
    }
  }

  // If no BASIC data from SMS, try carrier report
  if (basics.length === 0 && carrierData?.basics) {
    for (const b of carrierData.basics) {
      const threshold = thresholds[b.name] || 65
      basics.push({
        category: b.name,
        measure: b.measure ?? b.percentile ?? null,
        threshold,
        percentile: b.percentile ?? null,
        alert: (b.measure ?? 0) > threshold,
      })
    }
  }

  const alertCount = basics.filter(b => b.alert).length
  const overallRisk: SIRData['overallRisk'] =
    alertCount >= 3 ? 'critical' :
    alertCount >= 2 ? 'high' :
    alertCount >= 1 ? 'medium' : 'low'

  const recommendations: string[] = []
  for (const b of basics) {
    if (b.alert) {
      recommendations.push(`${b.category} score (${b.measure}) exceeds the intervention threshold (${b.threshold}%). Immediate corrective action recommended.`)
    } else if (b.measure !== null && b.measure >= b.threshold * 0.75) {
      recommendations.push(`${b.category} score (${b.measure}) is approaching the threshold (${b.threshold}). Proactive monitoring advised.`)
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All BASIC scores are within acceptable thresholds. Continue maintaining current safety practices.')
  }

  const inspData = carrierData?.inspections || smsData?.inspections || {}

  return {
    carrier: {
      legalName: carrierData?.legalName || smsData?.legalName || 'Unknown',
      dbaName: carrierData?.dbaName || smsData?.dbaName,
      dotNumber: carrierData?.dotNumber || smsData?.dotNumber || '',
      mcNumber: carrierData?.mcNumber || smsData?.mcNumber,
      totalDrivers: carrierData?.totalDrivers || smsData?.totalDrivers || 0,
      totalPowerUnits: carrierData?.totalPowerUnits || smsData?.totalPowerUnits || 0,
      operatingStatus: carrierData?.operatingStatus || smsData?.operatingStatus || 'Unknown',
      safetyRating: carrierData?.safetyRating || smsData?.safetyRating,
    },
    basics,
    inspections: {
      total: inspData.total || inspData.totalInspections || 0,
      vehicleOOS: inspData.vehicleOOS || inspData.vehicleOutOfService || 0,
      driverOOS: inspData.driverOOS || inspData.driverOutOfService || 0,
      vehicleOOSRate: inspData.vehicleOOSRate || inspData.vehicleOOSPercent || 0,
      driverOOSRate: inspData.driverOOSRate || inspData.driverOOSPercent || 0,
    },
    snapshotDate: smsData?.snapshotDate || null,
    recommendations,
    overallRisk,
  }
}

export default function SafetyImprovementReportPage() {
  const [dotInput, setDotInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sir, setSir] = useState<SIRData | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const dot = dotInput.replace(/\D/g, '')
    if (!dot) { setError('Please enter a DOT number'); return }

    setLoading(true)
    setError(null)
    setSir(null)

    try {
      // Fetch SMS data and carrier report in parallel
      const [smsRes, carrierRes] = await Promise.allSettled([
        api.fmcsaGetSMSData(dot),
        api.getCarrierReport(dot),
      ])

      const smsData = smsRes.status === 'fulfilled' && smsRes.value?.success ? smsRes.value.data : null
      const carrierData = carrierRes.status === 'fulfilled' && carrierRes.value?.success ? carrierRes.value.data : null

      if (!smsData && !carrierData) {
        setError('No data found for this DOT number. Please verify and try again.')
        return
      }

      setSir(buildSIR(smsData, carrierData))
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Safety Improvement Report</h1>
              <p className="text-sm text-gray-500">Analyze BASIC scores, inspection data, and get actionable safety recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter DOT number..."
                value={dotInput}
                onChange={(e) => setDotInput(e.target.value)}
                icon={<Hash className="w-4 h-4" />}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Generate Report
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </Card>

        {/* Report */}
        {sir && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Carrier Info + Overall Risk */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gray-400" />
                  Carrier Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Legal Name</p>
                    <p className="font-semibold text-gray-900">{sir.carrier.legalName}</p>
                  </div>
                  {sir.carrier.dbaName && (
                    <div>
                      <p className="text-gray-500">DBA Name</p>
                      <p className="font-semibold text-gray-900">{sir.carrier.dbaName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">DOT Number</p>
                    <p className="font-semibold text-gray-900">{sir.carrier.dotNumber}</p>
                  </div>
                  {sir.carrier.mcNumber && (
                    <div>
                      <p className="text-gray-500">MC Number</p>
                      <p className="font-semibold text-gray-900">{sir.carrier.mcNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Operating Status</p>
                    <p className={`font-semibold ${sir.carrier.operatingStatus === 'AUTHORIZED' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {sir.carrier.operatingStatus}
                    </p>
                  </div>
                  {sir.carrier.safetyRating && (
                    <div>
                      <p className="text-gray-500">Safety Rating</p>
                      <p className="font-semibold text-gray-900">{sir.carrier.safetyRating}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Drivers</p>
                    <p className="font-semibold text-gray-900">{sir.carrier.totalDrivers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Power Units</p>
                    <p className="font-semibold text-gray-900">{sir.carrier.totalPowerUnits}</p>
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mb-3 ${getRiskColor(sir.overallRisk)}`}>
                  {sir.overallRisk === 'low' ? <CheckCircle className="w-10 h-10" /> :
                   sir.overallRisk === 'critical' ? <AlertTriangle className="w-10 h-10" /> :
                   <AlertCircle className="w-10 h-10" />}
                </div>
                <p className="text-sm text-gray-500 mb-1">Overall Risk Level</p>
                <p className={`text-2xl font-bold capitalize ${getRiskColor(sir.overallRisk).split(' ')[0]}`}>
                  {sir.overallRisk}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {sir.basics.filter(b => b.alert).length} of {sir.basics.length} BASICs flagged
                </p>
              </Card>
            </div>

            {/* BASIC Scores */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                BASIC Scores
                {sir.snapshotDate && (
                  <span className="text-xs text-gray-400 font-normal ml-auto">
                    Snapshot: {new Date(sir.snapshotDate).toLocaleDateString()}
                  </span>
                )}
              </h3>
              {sir.basics.length > 0 ? (
                <div className="space-y-4">
                  {sir.basics.map((basic) => {
                    const pct = basic.measure !== null ? Math.min((basic.measure / 100) * 100, 100) : 0
                    const barColor = basic.alert ? 'bg-red-500' :
                      basic.measure !== null && basic.measure >= basic.threshold * 0.75 ? 'bg-amber-500' : 'bg-emerald-500'

                    return (
                      <div key={basic.category}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {basic.alert ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{basic.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`font-bold ${getScoreColor(basic.measure, basic.threshold)}`}>
                              {basic.measure !== null ? basic.measure.toFixed(1) : 'N/A'}
                            </span>
                            <span className="text-gray-400">/ {basic.threshold}</span>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${barColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        {/* Threshold marker */}
                        <div className="relative h-0">
                          <div
                            className="absolute -top-3 w-0.5 h-3 bg-gray-900"
                            style={{ left: `${basic.threshold}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No BASIC score data available for this carrier.</p>
              )}
            </Card>

            {/* Inspection Summary */}
            {sir.inspections.total > 0 && (
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Inspection Summary
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{sir.inspections.total}</p>
                    <p className="text-sm text-gray-500">Total Inspections</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{sir.inspections.vehicleOOS}</p>
                    <p className="text-sm text-gray-500">Vehicle OOS</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-bold ${sir.inspections.vehicleOOSRate > 25 ? 'text-red-600' : 'text-gray-900'}`}>
                      {sir.inspections.vehicleOOSRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Vehicle OOS Rate</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{sir.inspections.driverOOS}</p>
                    <p className="text-sm text-gray-500">Driver OOS</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-bold ${sir.inspections.driverOOSRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {sir.inspections.driverOOSRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Driver OOS Rate</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {sir.recommendations.map((rec, i) => {
                  const isWarning = rec.includes('exceeds') || rec.includes('Immediate')
                  const isCaution = rec.includes('approaching')
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${
                        isWarning ? 'bg-red-50 border-red-200' :
                        isCaution ? 'bg-amber-50 border-amber-200' :
                        'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isWarning ? <AlertTriangle className="w-5 h-5 text-red-500" /> :
                         isCaution ? <AlertCircle className="w-5 h-5 text-amber-500" /> :
                         <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <p className={`text-sm ${
                        isWarning ? 'text-red-800' :
                        isCaution ? 'text-amber-800' :
                        'text-emerald-800'
                      }`}>
                        {rec}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Footer */}
            <div className="text-center text-sm text-gray-400 py-4">
              Report generated {new Date().toLocaleString()} via FMCSA SMS data
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
