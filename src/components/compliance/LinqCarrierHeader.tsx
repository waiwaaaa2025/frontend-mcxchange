import { Loader2, AlertTriangle, ShieldCheck, ShieldAlert, Truck, Users, MapPin, FileText } from 'lucide-react'

interface Props {
  loading: boolean
  carrier: any | null
  insurance: any | null
  report: any | null
}

// Renders the live LINQ snapshot for a managed company. Pulls from the response
// shape of /v1/carriers/{dot} + /v1/carriers/{dot}/insurance + /v1/carriers/{dot}/report.
// Designed to be resilient to missing fields — every block falls back to "—".
export default function LinqCarrierHeader({ loading, carrier, insurance, report }: Props) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6 flex items-center justify-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading live FMCSA snapshot…
      </div>
    )
  }
  if (!carrier && !report) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> No live data returned from LINQ. The DOT may be inactive or recently changed.
      </div>
    )
  }

  const safetyRating = carrier?.safety_rating || report?.safety?.rating || null
  const status = carrier?.operating_status || report?.census?.operating_status || null
  const fleetSize = carrier?.power_units ?? report?.census?.power_units ?? null
  const drivers = carrier?.total_drivers ?? report?.census?.total_drivers ?? null
  const city = carrier?.physical_address?.city || carrier?.city || null
  const state = carrier?.physical_address?.state || carrier?.state || null
  const earliestCancel = insurance?.summary?.earliest_cancellation_date || null
  const totalCoverage = insurance?.summary?.total_active_coverage ?? null

  // SMS BASIC scores — LINQ /report.sms structure (best-effort field probing).
  const sms = (report as any)?.sms || (report as any)?.basic_scores || null
  const basics = sms ? extractBasics(sms) : []

  const isActive = String(status || '').toUpperCase() === 'ACTIVE'

  return (
    <div className="space-y-3">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={isActive ? ShieldCheck : ShieldAlert}
          color={isActive ? 'green' : 'red'}
          label="Authority"
          value={status || '—'}
        />
        <StatTile
          icon={Truck}
          color="blue"
          label="Power units"
          value={fleetSize ?? '—'}
          sub={`${drivers ?? '—'} drivers`}
        />
        <StatTile
          icon={MapPin}
          color="indigo"
          label="Based in"
          value={state || '—'}
          sub={city || ''}
        />
        <StatTile
          icon={FileText}
          color={earliestCancel ? expiryColor(earliestCancel) : 'gray'}
          label="Insurance cancels"
          value={earliestCancel ? new Date(earliestCancel).toLocaleDateString() : '—'}
          sub={totalCoverage ? `$${Number(totalCoverage).toLocaleString()} coverage` : ''}
        />
      </div>

      {/* SMS BASIC scores */}
      {basics.length > 0 ? (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">SMS BASIC scores</h3>
            <span className="text-xs text-gray-400">(higher = more risk; alert thresholds vary by BASIC)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {basics.map(b => <BasicCell key={b.label} {...b} />)}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            Safety rating: <strong>{safetyRating || 'NOT RATED'}</strong>. Scores update monthly from FMCSA.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-4 text-xs text-gray-500">
          SMS BASIC scores: <span className="text-gray-400">not available in LINQ payload</span>.
          Safety rating: <strong>{safetyRating || 'NOT RATED'}</strong>.
        </div>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: any; sub?: string }) {
  const palette: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700' },
    red: { bg: 'bg-red-50', text: 'text-red-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
  }
  const c = palette[color] || palette.gray
  return (
    <div className="bg-white border rounded-xl p-3 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-base font-semibold text-gray-900 truncate">{String(value)}</div>
        {sub ? <div className="text-[10px] text-gray-500 truncate">{sub}</div> : null}
      </div>
    </div>
  )
}

interface Basic { label: string; percentile: number | null; alert: boolean }

function BasicCell({ label, percentile, alert }: Basic) {
  const cls = alert ? 'bg-red-50 border-red-200 text-red-700'
    : percentile !== null && percentile > 65 ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-gray-50 border-gray-200 text-gray-700'
  return (
    <div className={`border rounded-lg px-3 py-2 text-xs ${cls} flex items-center justify-between`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">{percentile !== null ? `${percentile}` : '—'}</span>
    </div>
  )
}

function extractBasics(sms: any): Basic[] {
  // Best-effort extraction — LINQ /report may serialize SMS as nested object,
  // array of objects, or flat key map. Try each shape and bail gracefully.
  if (Array.isArray(sms)) {
    return sms.slice(0, 7).map((row: any) => ({
      label: String(row?.basic || row?.name || row?.label || 'BASIC'),
      percentile: typeof row?.percentile === 'number' ? row.percentile : (typeof row?.value === 'number' ? row.value : null),
      alert: !!(row?.alert || row?.over_threshold),
    }))
  }
  if (typeof sms === 'object' && sms !== null) {
    return Object.entries(sms).slice(0, 7).map(([k, v]: any) => ({
      label: humanizeBasicKey(k),
      percentile: typeof v === 'number' ? v : (typeof v?.percentile === 'number' ? v.percentile : null),
      alert: !!(v?.alert || v?.over_threshold),
    }))
  }
  return []
}

function humanizeBasicKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function expiryColor(iso: string): 'green' | 'amber' | 'red' | 'gray' {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'red'
  if (days <= 30) return 'red'
  if (days <= 60) return 'amber'
  return 'green'
}
