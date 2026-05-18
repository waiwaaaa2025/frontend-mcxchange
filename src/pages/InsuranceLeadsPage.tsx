import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Umbrella, Search, AlertTriangle, Phone, ChevronLeft, ChevronRight, Loader2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'

const US_STATES = [
  { value: '', label: 'All States' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending cancellation' },
  { value: 'expiring', label: 'Expiring soon' },
]

const WINDOW_OPTIONS = [
  { value: '7', label: 'Within 7 days' },
  { value: '14', label: 'Within 14 days' },
  { value: '30', label: 'Within 30 days' },
  { value: '60', label: 'Within 60 days' },
  { value: '90', label: 'Within 90 days' },
]

const SAFETY_OPTIONS = [
  { value: '', label: 'Any safety rating' },
  { value: 'SATISFACTORY', label: 'Satisfactory' },
  { value: 'CONDITIONAL', label: 'Conditional' },
  { value: 'UNSATISFACTORY', label: 'Unsatisfactory' },
]

interface Lead {
  dotNumber: string
  mcNumber: string | null
  legalName: string
  state: string | null
  powerUnits: number | null
  safetyRating: string | null
  insuranceStatus: 'pending' | 'expiring'
  insuranceExpiryDate: string | null
  daysUntilExpiry: number | null
  pendingReason: string | null
}

export default function InsuranceLeadsPage({ previewMode = false }: { previewMode?: boolean } = {}) {
  const { user } = useAuth()

  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  const [insuranceStatus, setInsuranceStatus] = useState<'pending' | 'expiring'>('pending')
  const [expiringWithinDays, setExpiringWithinDays] = useState('30')
  const [state, setState] = useState('')
  const [minUnits, setMinUnits] = useState('')
  const [maxUnits, setMaxUnits] = useState('')
  const [minSafety, setMinSafety] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const limit = 25

  const [outreachFor, setOutreachFor] = useState<Lead | null>(null)
  const [outreachMessage, setOutreachMessage] = useState('')
  const [outreachSubmitting, setOutreachSubmitting] = useState(false)
  const [outreachDone, setOutreachDone] = useState<Set<string>>(new Set())

  // carrier-pulse detail base path is role-aware (Carrier Pulse itself is unchanged)
  const pulseBase = previewMode
    ? '/carrier-pulse-preview'
    : user?.role === 'seller'
      ? '/seller/carrier-pulse'
      : user?.role === 'admin'
        ? '/admin/carrier-pulse'
        : '/buyer/carrier-pulse'

  useEffect(() => {
    if (previewMode || user?.role === 'admin' || user?.role === 'seller') {
      setHasAccess(true)
      setAccessChecked(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.getCarrierPulseAccess()
        if (!cancelled && res.success && res.data) setHasAccess(res.data.hasAccess)
      } catch {
        if (!cancelled) setHasAccess(true)
      } finally {
        if (!cancelled) setAccessChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [user?.role, previewMode])

  const fetchLeads = useCallback(async () => {
    if (!hasAccess || previewMode) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.getInsuranceLeads({
        insuranceStatus,
        expiringWithinDays: Number(expiringWithinDays),
        state: state || undefined,
        minUnits: minUnits ? Number(minUnits) : undefined,
        maxUnits: maxUnits ? Number(maxUnits) : undefined,
        minSafety: minSafety || undefined,
        sort: 'daysUntilExpiry',
        page,
        limit,
      })
      if (res.success && res.data) {
        setLeads(res.data.results)
        setTotal(res.data.total)
      } else {
        setError('Could not load leads.')
      }
    } catch (e: any) {
      setError(e?.message || 'Lead search is temporarily unavailable. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }, [hasAccess, previewMode, insuranceStatus, expiringWithinDays, state, minUnits, maxUnits, minSafety, page])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const submitOutreach = async () => {
    if (!outreachFor) return
    setOutreachSubmitting(true)
    try {
      const res = await api.requestBrokerOutreach(outreachFor.dotNumber, {
        mcNumber: outreachFor.mcNumber || undefined,
        carrierName: outreachFor.legalName,
        message: outreachMessage || undefined,
      })
      if (res.success) {
        setOutreachDone((prev) => new Set(prev).add(outreachFor.dotNumber))
        setOutreachFor(null)
        setOutreachMessage('')
      }
    } catch {
      /* surfaced via disabled state; keep modal open */
    } finally {
      setOutreachSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Insurance Leads</h1>
        <p className="text-gray-600 mb-6">
          Find motor carriers whose insurance is lapsing — strong acquisition signals.
          Included with any active subscription.
        </p>
        <Link to="/buyer/subscription">
          <Button>Upgrade to unlock</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Umbrella className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Insurance Leads</h1>
          <p className="text-sm text-gray-500">Carriers with lapsing insurance — potential acquisition targets</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Select
          label="Insurance status"
          options={STATUS_OPTIONS}
          value={insuranceStatus}
          onChange={(e) => { setPage(1); setInsuranceStatus(e.target.value as 'pending' | 'expiring') }}
        />
        <Select
          label="Expiring within"
          options={WINDOW_OPTIONS}
          value={expiringWithinDays}
          onChange={(e) => { setPage(1); setExpiringWithinDays(e.target.value) }}
        />
        <Select
          label="State"
          options={US_STATES}
          value={state}
          onChange={(e) => { setPage(1); setState(e.target.value) }}
        />
        <Input
          label="Min power units"
          type="number"
          min={0}
          value={minUnits}
          onChange={(e) => { setPage(1); setMinUnits(e.target.value) }}
        />
        <Input
          label="Max power units"
          type="number"
          min={0}
          value={maxUnits}
          onChange={(e) => { setPage(1); setMaxUnits(e.target.value) }}
        />
        <Select
          label="Safety rating"
          options={SAFETY_OPTIONS}
          value={minSafety}
          onChange={(e) => { setPage(1); setMinSafety(e.target.value) }}
        />
      </div>

      {previewMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm">
          This is a preview. Subscribe to run live searches and see carrier owner contact details.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && !previewMode && leads.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          No carriers match these filters. Try widening the date window or clearing the state.
        </div>
      )}

      {!loading && !error && leads.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">{total.toLocaleString()} carriers found</p>
          <div className="space-y-3">
            {leads.map((lead) => {
              const done = outreachDone.has(lead.dotNumber)
              return (
                <motion.div
                  key={lead.dotNumber}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`${pulseBase}/${lead.dotNumber}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600 truncate"
                      >
                        {lead.legalName}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${lead.insuranceStatus === 'pending' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        {lead.insuranceStatus === 'pending' ? 'Pending cancellation' : 'Expiring soon'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      <span>DOT {lead.dotNumber}{lead.mcNumber ? ` · ${lead.mcNumber}` : ''}</span>
                      {lead.state && <span>{lead.state}</span>}
                      {lead.powerUnits != null && <span>{lead.powerUnits} units</span>}
                      {lead.safetyRating && <span>{lead.safetyRating}</span>}
                      {lead.daysUntilExpiry != null && (
                        <span className="text-red-600 font-medium">
                          {lead.daysUntilExpiry <= 0 ? 'Lapsed' : `${lead.daysUntilExpiry} days left`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`${pulseBase}/${lead.dotNumber}`}>
                      <Button variant="outline" size="sm">View details</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={done ? 'ghost' : 'primary'}
                      disabled={done}
                      onClick={() => { setOutreachFor(lead); setOutreachMessage('') }}
                    >
                      <Phone className="w-4 h-4 mr-1.5" />
                      {done ? 'Requested' : 'Ask Domilea to contact'}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      )}

      {/* Brokered outreach modal */}
      {outreachFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ask Domilea to contact the seller</h3>
            <p className="text-sm text-gray-500 mb-4">
              We'll discreetly reach out to the owner of <strong>{outreachFor.legalName}</strong> (DOT {outreachFor.dotNumber})
              on your behalf to see if they'd consider selling.
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              rows={4}
              placeholder="Optional: anything you'd like us to mention (budget range, timeline, etc.)"
              value={outreachMessage}
              onChange={(e) => setOutreachMessage(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setOutreachFor(null)} disabled={outreachSubmitting}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitOutreach} disabled={outreachSubmitting}>
                {outreachSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
