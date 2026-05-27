import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import complianceApi, { type ManagedCompany } from '../../services/complianceApi'

export default function CompCompaniesPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<ManagedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [dot, setDot] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await complianceApi.listCompanies()
      setCompanies(res.data)
    } finally { setLoading(false) }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = dot.trim()
    if (!trimmed) return
    setAdding(true)
    setAddError(null)
    try {
      await complianceApi.addCompany({ dotNumber: trimmed })
      setDot('')
      await load()
    } catch (err: any) {
      setAddError(err?.message || 'Could not add carrier')
    } finally {
      setAdding(false)
    }
  }

  async function remove(c: ManagedCompany) {
    if (!confirm(`Remove ${c.label || `DOT ${c.dotNumber}`} from your portfolio?`)) return
    setDeletingId(c.id)
    try {
      await complianceApi.deleteCompany(c.id)
      setCompanies(prev => prev.filter(x => x.id !== c.id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-sm text-gray-600 mt-1">Carriers you manage on Domilea.</p>
          </div>
          {companies.length > 0 && (
            <button
              onClick={() => navigate('/compliance/companies/new')}
              className="text-xs text-gray-500 hover:text-indigo-600 underline-offset-2 hover:underline"
            >
              Advanced add…
            </button>
          )}
        </div>

        {/* Inline add — DOT input + gradient Add button */}
        <form
          onSubmit={add}
          className="bg-white border border-gray-200 rounded-xl p-2 flex items-center gap-2 shadow-sm"
        >
          <div className="flex items-center flex-1 gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Plus className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter DOT number to add a carrier to your portfolio"
              value={dot}
              onChange={e => { setDot(e.target.value); setAddError(null) }}
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              disabled={adding}
            />
          </div>
          <button
            type="submit"
            disabled={adding || !dot.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-b from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center gap-2 min-w-[88px] justify-center"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
          </button>
        </form>
        {addError && (
          <p className="text-sm text-red-600 -mt-2">{addError}</p>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">No carriers yet</h2>
            <p className="text-sm text-gray-500">Add your first carrier above by DOT number.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  <th className="text-left px-6 py-4">Carrier</th>
                  <th className="text-left px-3 py-4">Status</th>
                  <th className="text-left px-3 py-4">MCS-150</th>
                  <th className="text-left px-3 py-4">Alerts</th>
                  <th className="text-left px-3 py-4">Health</th>
                  <th className="px-3 py-4 w-12" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {companies.map((c, idx) => (
                  <CompanyRow
                    key={c.id}
                    company={c}
                    isLast={idx === companies.length - 1}
                    deleting={deletingId === c.id}
                    onDelete={() => remove(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function CompanyRow({
  company, isLast, deleting, onDelete,
}: {
  company: ManagedCompany
  isLast: boolean
  deleting: boolean
  onDelete: () => void
}) {
  const snap = company.snapshot
  const status = snap?.operatingStatus ?? null
  const mcs150 = snap?.mcs150DaysAgo ?? null
  const alerts = company.alertsCount ?? 0
  const health = useMemo(() => deriveHealth(snap), [snap])
  const added = useMemo(
    () => new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    [company.createdAt]
  )

  return (
    <tr className={`group hover:bg-gray-50/60 ${isLast ? '' : 'border-b border-gray-100'}`}>
      <td className="px-6 py-4">
        <Link to={`/compliance/companies/${company.id}`} className="block">
          <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
            {company.label || `DOT ${company.dotNumber}`}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono">
            DOT {company.dotNumber}
            {company.mcDocket ? <> · {company.mcDocket}</> : null}
            <> · added {added}</>
          </div>
        </Link>
      </td>
      <td className="px-3 py-4">
        <StatusPill status={status} />
      </td>
      <td className="px-3 py-4">
        <Mcs150Pill daysAgo={mcs150} />
      </td>
      <td className="px-3 py-4">
        <AlertsPill count={alerts} />
      </td>
      <td className="px-3 py-4">
        <HealthCell health={health} />
      </td>
      <td className="px-3 py-4 text-right">
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label="Remove carrier"
          className="text-gray-300 hover:text-red-500 disabled:opacity-50 p-1"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  )
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) return <Pill tone="gray">—</Pill>
  const norm = status.toUpperCase()
  const isActive = norm === 'ACTIVE' || norm === 'AUTHORIZED'
  const isInactive = norm === 'INACTIVE' || norm === 'OUT_OF_SERVICE' || norm === 'OUT-OF-SERVICE'
  return (
    <Pill tone={isActive ? 'green' : isInactive ? 'red' : 'amber'}>
      {norm}
    </Pill>
  )
}

function Mcs150Pill({ daysAgo }: { daysAgo: number | null }) {
  if (daysAgo == null) return <Pill tone="gray">—</Pill>
  // FMCSA requires MCS-150 every 24 months (730 days). Older filings get warmer colors.
  const tone: PillTone = daysAgo < 365 ? 'green' : daysAgo < 600 ? 'amber' : 'red'
  return <Pill tone={tone}>{daysAgo}D</Pill>
}

function AlertsPill({ count }: { count: number }) {
  if (!count) return <Pill tone="gray">0 ALERTS</Pill>
  return <Pill tone="red">{count} {count === 1 ? 'ALERT' : 'ALERTS'}</Pill>
}

function HealthCell({ health }: { health: { score: number | null; grade: string; color: string } }) {
  if (health.score == null) {
    return <span className="text-gray-300 text-sm">—</span>
  }
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-bold ${health.color}`}>{health.score}</span>
      <span className={`text-xs font-semibold ${health.color}`}>{health.grade}</span>
    </div>
  )
}

type PillTone = 'green' | 'red' | 'amber' | 'gray'
function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  const styles: Record<PillTone, string> = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    gray: 'bg-gray-50 text-gray-500 ring-gray-200',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset ${styles[tone]}`}>
      {children}
    </span>
  )
}

// Derive a 0–100 health score + letter grade from whatever safety signals the
// snapshot exposes. Order of preference: chameleon score (already 0–100ish),
// then a coarse mapping from safetyRating. Returns null score when we have nothing.
function deriveHealth(snap: ManagedCompany['snapshot']): { score: number | null; grade: string; color: string } {
  if (!snap) return { score: null, grade: '', color: 'text-gray-400' }

  let score: number | null = null
  if (typeof snap.chameleonScore === 'number') {
    score = Math.max(0, Math.min(100, Math.round(snap.chameleonScore)))
  } else if (snap.safetyRating) {
    const m = snap.safetyRating.toUpperCase()
    if (m === 'SATISFACTORY') score = 90
    else if (m === 'CONDITIONAL') score = 55
    else if (m === 'UNSATISFACTORY') score = 25
    else if (m === 'UNRATED' || m === 'NONE') score = null
  }

  if (score == null) return { score: null, grade: '', color: 'text-gray-400' }

  let grade: string, color: string
  if (score >= 90) { grade = 'A'; color = 'text-emerald-600' }
  else if (score >= 80) { grade = 'B'; color = 'text-emerald-600' }
  else if (score >= 70) { grade = 'C'; color = 'text-amber-600' }
  else if (score >= 60) { grade = 'D'; color = 'text-orange-600' }
  else { grade = 'F'; color = 'text-red-600' }

  return { score, grade, color }
}
