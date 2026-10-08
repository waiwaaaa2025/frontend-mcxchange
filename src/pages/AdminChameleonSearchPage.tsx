import { Fragment, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Download, Loader2, ExternalLink, Info, ShieldAlert, RefreshCw, ChevronDown, ChevronRight, Truck, Repeat, Users } from 'lucide-react'
import api, {
  type ChameleonLinkReason,
  type ChameleonScanCandidate,
  type ChameleonScanLink,
  type ChameleonScanResponse,
  type VinTransfer,
  type VinTransferResponse,
} from '../services/api'

/**
 * Admin → Chameleon Search, three bulk views over FMCSA data:
 *  - Shared identity: new active carriers sharing a phone, email, officer or an
 *    FMCSA revocation link with a carrier that has shut down.
 *  - Re-registered: the same company back under a new DOT/MC, with when and why
 *    the old MC went inactive.
 *  - Truck transfers: trucks (by VIN) that moved from a carrier — often one that
 *    lost its authority, insurance or a satisfactory rating — to a new MC, even
 *    when the name, address and owner on paper are all different.
 * Each view is one background scan on the server (30s–2min), then filtered here.
 */

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const PAGE_SIZE = 50
const POLL_MS = 4000

const REASON_LABEL: Record<ChameleonLinkReason, string> = {
  prior_revoke: 'FMCSA revoke link',
  phone: 'Same phone',
  email: 'Same email',
  name: 'Same name',
  officer: 'Same officer',
  address: 'Same address',
}

const IDENTITY_LABEL: Record<string, string> = {
  name: 'name', phone: 'phone', email: 'email', officer: 'officer', address: 'address',
}

type Risk = 'critical' | 'high' | 'moderate' | 'low'
const RISK_STYLE: Record<Risk, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
}

const MIN_SCORE_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '25', label: 'Moderate and up' },
  { value: '45', label: 'High and up' },
  { value: '70', label: 'Critical only' },
]

type Tab = 'identity' | 'reregistered' | 'transfers'

// Tab, filters, page, open row and scroll survive opening a carrier and coming
// back (the carrier page gets a "Back to Chameleon Search" button via BACK_STATE).
const STORE = 'chameleonSearch:'
const BACK_STATE = { backTo: { path: '/admin/chameleon-search', label: 'Chameleon Search' } }
const currentView = (): string => {
  try { return JSON.parse(sessionStorage.getItem(STORE + 'tab') || '"reregistered"') } catch { return 'reregistered' }
}

function usePersisted<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(STORE + key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { sessionStorage.setItem(STORE + key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  }, [key, value])
  return [value, setValue]
}

function rememberScroll(view: string) {
  try { sessionStorage.setItem(`${STORE}${view}:scroll`, String(window.scrollY)) } catch { /* storage unavailable */ }
}

/** Puts the page back where it was once the remembered results have rendered. */
function useRestoreScroll(view: string, ready: boolean) {
  const done = useRef(false)
  useEffect(() => {
    if (!ready || done.current) return
    done.current = true
    try {
      const key = `${STORE}${view}:scroll`
      const y = Number(sessionStorage.getItem(key))
      sessionStorage.removeItem(key)
      if (y > 0) requestAnimationFrame(() => window.scrollTo(0, y))
    } catch { /* storage unavailable */ }
  }, [view, ready])
}

// "3 months ago", "2.4 years ago"
function ago(date: string | null | undefined): string {
  if (!date) return ''
  const days = Math.round((Date.now() - new Date(date).getTime()) / 86_400_000)
  if (days < 0) return 'upcoming'
  if (days < 45) return `${days} day${days === 1 ? '' : 's'} ago`
  if (days < 365) return `${Math.round(days / 30.4)} months ago`
  return `${(days / 365).toFixed(1)} years ago`
}

function between(from: string | null | undefined, to: string | null | undefined): string {
  if (!from || !to) return ''
  const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
  if (days < 0) return 'before the old one stopped'
  if (days < 45) return `${days} day${days === 1 ? '' : 's'} later`
  if (days < 365) return `${Math.round(days / 30.4)} months later`
  return `${(days / 365).toFixed(1)} years later`
}

export default function AdminChameleonSearchPage() {
  const [tab, setTab] = usePersisted<Tab>('tab', 'reregistered')
  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'reregistered', label: 'Re-registered', icon: <Repeat className="w-4 h-4" /> },
    { key: 'transfers', label: 'Truck transfers', icon: <Truck className="w-4 h-4" /> },
    { key: 'identity', label: 'Shared identity', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" /> Chameleon Search
            </h1>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">
              {tab === 'reregistered' && 'Companies that came back under a new DOT/MC after their old MC went inactive — same name, FMCSA revocation link, or same officer and contact — with when and why the old one stopped.'}
              {tab === 'transfers' && 'New MCs running trucks (matched by VIN on roadside inspections) that another carrier ran just before. The owners can change the name, address and person on file — the trucks stay the same.'}
              {tab === 'identity' && 'New, active carriers sharing a phone, email, officer or FMCSA revocation link with an older carrier that has shut down or lost its authority.'}
            </p>
          </div>
          <div className="flex gap-2">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'transfers' ? <TransfersPanel /> : <IdentityPanel key={tab} view={tab} />}
      </div>
    </div>
  )
}

// ==================== shared scan polling ====================

type ScanState<R> = { data: R | null; building: boolean; progress: string | null; loading: boolean; error: string | null }

/** Fetches a page of a background scan, polling while the server is still building it. */
function useScan<R extends { status: 'ready' }>(
  fetcher: (refresh: boolean) => Promise<{ data: R | { status: 'building'; progress?: string } | { status: 'failed'; error: string } }>,
  deps: unknown[],
  refreshNonce: number,
): ScanState<R> {
  const [state, setState] = useState<ScanState<R>>({ data: null, building: false, progress: null, loading: false, error: null })
  const lastRefresh = useRef(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    // Only the first request after "Rescan" forces a rebuild; the polls just wait for it.
    let refresh = refreshNonce !== lastRefresh.current
    lastRefresh.current = refreshNonce

    const load = () => {
      setState(s => ({ ...s, loading: true, error: null }))
      fetcher(refresh)
        .then(res => {
          if (cancelled) return
          refresh = false
          const d = res.data
          if (d.status === 'ready') {
            setState({ data: d as R, building: false, progress: null, loading: false, error: null })
          } else if (d.status === 'building') {
            setState(s => ({ ...s, building: true, progress: (d as any).progress || null }))
            timer = setTimeout(load, POLL_MS)
          } else {
            setState(s => ({ ...s, building: false, loading: false, error: (d as any).error }))
          }
        })
        .catch((e: any) => {
          if (!cancelled) setState(s => ({ ...s, building: false, loading: false, error: e.message || 'Search failed' }))
        })
    }
    load()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshNonce])

  return state
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('mcx_token')}` } })
  if (!res.ok) throw new Error('Export failed — run the search again and retry')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(await res.blob())
  a.download = filename
  a.click()
}

// ==================== shared identity / re-registered ====================

interface IdentityFilters {
  days: string
  minScore: string
  state: string
  q: string
  reason: string
  forHireOnly: boolean
  withMcOnly: boolean
  multiSignalOnly: boolean
  authorizedOnly: boolean
}

type IdentityReady = Extract<ChameleonScanResponse, { status: 'ready' }>

function IdentityPanel({ view }: { view: 'identity' | 'reregistered' }) {
  const reReg = view === 'reregistered'
  const defaults: IdentityFilters = {
    days: '180', minScore: reReg ? '0' : '45', state: '', q: '', reason: '',
    forHireOnly: !reReg, withMcOnly: true, multiSignalOnly: false, authorizedOnly: true,
  }
  const [filters, setFilters] = usePersisted<IdentityFilters>(`${view}:filters`, defaults)
  const [applied, setApplied] = usePersisted<IdentityFilters>(`${view}:applied`, defaults)
  const [offset, setOffset] = usePersisted(`${view}:offset`, 0)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [expanded, setExpanded] = usePersisted<string | null>(`${view}:expanded`, null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const params = () => ({
    ...applied,
    reRegisteredOnly: reReg,
    authorizedOnly: reReg && applied.authorizedOnly,
  })
  const { data, building, loading, error } = useScan<IdentityReady>(
    refresh => api.chameleonScan({ ...params(), offset, limit: PAGE_SIZE, refresh: refresh ? '1' : undefined }),
    [applied, offset],
    refreshNonce,
  )
  useRestoreScroll(view, !!data && !building)

  function search() {
    setOffset(0)
    setExpanded(null)
    setApplied({ ...filters })
  }

  async function downloadCsv() {
    setExporting(true)
    setExportError(null)
    try {
      await downloadFile(api.chameleonScanExportUrl(params()), `${reReg ? 're-registered' : 'chameleon-search'}-${applied.days}d-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (e: any) {
      setExportError(e.message)
    } finally {
      setExporting(false)
    }
  }

  const results = data?.results ?? []
  const total = data?.total ?? 0

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 bg-white rounded-lg border p-4 space-y-3 h-fit md:sticky md:top-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Filters</h3>

        <Field label="New DOT registered within">
          <select value={filters.days} onChange={e => setFilters(f => ({ ...f, days: e.target.value }))} className="input">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last 12 months</option>
          </select>
        </Field>

        <Field label="Risk">
          <select value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} className="input">
            {MIN_SCORE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        {!reReg && (
          <Field label="Signal">
            <select value={filters.reason} onChange={e => setFilters(f => ({ ...f, reason: e.target.value }))} className="input">
              <option value="">Any</option>
              {(Object.keys(REASON_LABEL) as ChameleonLinkReason[]).map(r => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
            </select>
          </Field>
        )}

        <Field label="State">
          <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))} className="input">
            <option value="">Any</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Name, DOT or MC">
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') search() }}
            placeholder="ACME or 1234567"
            className="input"
          />
        </Field>

        {reReg && (
          <Check
            label="Old MC actually had authority"
            hint="Hides old DOTs whose applications were only dismissed or withdrawn"
            checked={filters.authorizedOnly}
            onChange={v => setFilters(f => ({ ...f, authorizedOnly: v }))}
          />
        )}
        <Check label="New carrier has an MC" checked={filters.withMcOnly} onChange={v => setFilters(f => ({ ...f, withMcOnly: v }))} />
        <Check label="For-hire carriers only" checked={filters.forHireOnly} onChange={v => setFilters(f => ({ ...f, forHireOnly: v }))} />
        {!reReg && <Check label="Linked on 2+ signals" checked={filters.multiSignalOnly} onChange={v => setFilters(f => ({ ...f, multiSignalOnly: v }))} />}

        <div className="flex gap-2 pt-2">
          <button onClick={search} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => { setFilters(defaults); setOffset(0); setApplied(defaults) }} className="px-3 py-2 border rounded-lg text-sm text-gray-700">
            Reset
          </button>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="bg-white rounded-lg border">
          <Toolbar
            building={building}
            buildingText="Scanning the FMCSA census and authority history — about 30 seconds…"
            loading={loading && !data}
            summary={data && (
              <>
                <span><strong className="text-gray-900">{total.toLocaleString()}</strong> {reReg ? 're-registered carrier' : 'suspected chameleon'}{total === 1 ? '' : 's'}</span>
                <RiskCounts counts={data.counts} />
              </>
            )}
            onRescan={() => { setOffset(0); setRefreshNonce(n => n + 1) }}
            onExport={downloadCsv}
            exporting={exporting}
            canExport={total > 0}
          />

          {data && !building && (
            <Banner>
              Checked {data.scanned.toLocaleString()} new carriers registered since {data.since}
              {data.dataThrough && <> (FMCSA census runs through <strong>{data.dataThrough}</strong>)</>} · built {new Date(data.builtAt).toLocaleString()}.
              {reReg
                ? <> "Went inactive" comes from FMCSA authority history (revocations, suspensions) or the insurance cancellation; when FMCSA has neither, the old DOT's last filing is shown.</>
                : <> These are leads, not verdicts — use <strong>Deep check</strong> to see shared trucks and identity history before acting.</>}
            </Banner>
          )}
          {(error || exportError) && <div className="p-3 text-sm text-red-600 bg-red-50">{error || exportError}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                {reReg ? (
                  <tr>
                    <th className="px-3 py-2 w-6"></th>
                    <th className="px-3 py-2">New carrier</th>
                    <th className="px-3 py-2">Old MC (inactive)</th>
                    <th className="px-3 py-2">Went inactive</th>
                    <th className="px-3 py-2">Came back</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-2 w-6"></th>
                    <th className="px-3 py-2">Risk</th>
                    <th className="px-3 py-2">New carrier</th>
                    <th className="px-3 py-2">Linked to (shut down)</th>
                    <th className="px-3 py-2">Signals</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y">
                {!building && !loading && data && results.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Nothing matches these filters.</td></tr>
                )}
                {!building && results.map(c => {
                  const open = expanded === c.dotNumber
                  const toggle = () => setExpanded(open ? null : c.dotNumber)
                  return (
                    <Fragment key={c.dotNumber}>
                      {reReg ? <ReRegRow c={c} open={open} onToggle={toggle} /> : <IdentityRow c={c} open={open} onToggle={toggle} />}
                      {open && (
                        <tr className="bg-gray-50/70">
                          <td></td>
                          <td colSpan={5} className="px-3 py-3"><CandidateDetail c={c} /></td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!building && <Pager offset={offset} total={total} hasMore={!!data?.hasMore} loading={loading} onOffset={setOffset} />}
        </div>
      </main>
    </div>
  )
}

function NewCarrierCell({ c }: { c: { legalName: string; dotNumber: string; mcNumber: string | null; registeredDate: string | null; city?: string | null; state?: string | null; location?: string | null; powerUnits: number | null } }) {
  const place = c.location ?? [c.city, c.state].filter(Boolean).join(', ')
  return (
    <>
      <div className="font-medium text-gray-900">{c.legalName}</div>
      <div className="text-xs text-gray-500 font-mono">DOT {c.dotNumber}{c.mcNumber && <> · {c.mcNumber}</>}</div>
      <div className="text-xs text-gray-500">
        {[`Registered ${c.registeredDate || '—'}`, place, c.powerUnits != null ? `${c.powerUnits} PU reported` : null].filter(Boolean).join(' · ')}
      </div>
    </>
  )
}

function IdentityRow({ c, open, onToggle }: { c: ChameleonScanCandidate; open: boolean; onToggle: () => void }) {
  const top = c.links[0]
  return (
    <tr className="hover:bg-gray-50 align-top cursor-pointer" onClick={onToggle}>
      <td className="px-3 py-2 text-gray-400">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
      <td className="px-3 py-2 whitespace-nowrap"><RiskBadge score={c.score} level={c.riskLevel} /></td>
      <td className="px-3 py-2 min-w-[14rem]"><NewCarrierCell c={c} /></td>
      <td className="px-3 py-2 min-w-[14rem]">
        {top && (
          <>
            <div className="text-gray-900">{top.legalName}</div>
            <div className="text-xs text-gray-500 font-mono">DOT {top.dotNumber}{top.mcNumber && <> · {top.mcNumber}</>}</div>
            <div className="text-xs mt-0.5 flex flex-wrap gap-1"><ShutDownBadges link={top} /></div>
          </>
        )}
        {c.links.length > 1 && <div className="text-xs text-gray-500 mt-1">+{c.links.length - 1} more linked carrier{c.links.length > 2 ? 's' : ''}</div>}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1 max-w-[16rem]">
          {c.reasons.map(r => (
            <span key={r} className={`px-1.5 py-0.5 rounded text-xs ${r === 'prior_revoke' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>{REASON_LABEL[r]}</span>
          ))}
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}><DeepCheck dot={c.dotNumber} /></td>
    </tr>
  )
}

function ReRegRow({ c, open, onToggle }: { c: ChameleonScanCandidate; open: boolean; onToggle: () => void }) {
  const old = c.links.find(l => l.dotNumber === c.reRegistered?.dotNumber) || c.links[0]
  const stopped = old.inactiveSince || old.lastActive
  return (
    <tr className="hover:bg-gray-50 align-top cursor-pointer" onClick={onToggle}>
      <td className="px-3 py-2 text-gray-400">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
      <td className="px-3 py-2 min-w-[14rem]"><NewCarrierCell c={c} /></td>
      <td className="px-3 py-2 min-w-[13rem]">
        <div className="text-gray-900">{old.legalName}</div>
        <div className="text-xs text-gray-500 font-mono">{old.mcNumber || 'No MC'} · DOT {old.dotNumber}</div>
        <div className="text-xs mt-0.5 flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800">{c.reRegistered?.basis}</span>
          {old.safetyRating === 'U' && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800">Unsatisfactory rating</span>}
          {old.safetyRating === 'C' && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Conditional rating</span>}
          {old.everAuthorized === false && <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Never had authority</span>}
        </div>
      </td>
      <td className="px-3 py-2 min-w-[11rem]">
        {old.inactiveSince ? (
          <>
            <div className="font-medium text-gray-900">{old.inactiveSince}</div>
            <div className="text-xs text-gray-600">{old.inactiveReason}</div>
            <div className="text-xs text-gray-500">{ago(old.inactiveSince)}</div>
          </>
        ) : (
          <>
            <div className="text-gray-700">{old.lastActive || '—'}</div>
            <div className="text-xs text-gray-500">last filing{old.lastActive && <> · {ago(old.lastActive)}</>}</div>
          </>
        )}
      </td>
      <td className="px-3 py-2 min-w-[9rem]">
        <div className="text-gray-900">{c.registeredDate || '—'}</div>
        <div className="text-xs text-gray-500">{between(stopped, c.registeredDate)}</div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}><DeepCheck dot={c.dotNumber} /></td>
    </tr>
  )
}

function ShutDownBadges({ link }: { link: ChameleonScanLink }) {
  return (
    <>
      {link.dotInactive && <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">DOT inactive</span>}
      {link.inactiveReason
        ? <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{link.inactiveReason} {link.inactiveSince}</span>
        : link.authorityInactive && <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">Authority inactive</span>}
      {link.safetyRating === 'U' && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800">Unsatisfactory rating</span>}
      {link.safetyRating === 'C' && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Conditional rating</span>}
    </>
  )
}

function CandidateDetail({ c }: { c: ChameleonScanCandidate }) {
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-2 text-xs text-gray-700">
        <div><span className="text-gray-500">Officer:</span> {c.officer || '—'}</div>
        <div><span className="text-gray-500">Phone:</span> {c.phone || '—'}</div>
        <div><span className="text-gray-500">Email:</span> {c.email || '—'}</div>
        <div><span className="text-gray-500">Last MCS-150:</span> {c.mcs150Date || '—'}</div>
        <div><span className="text-gray-500">Drivers:</span> {c.drivers ?? '—'}</div>
        <div><span className="text-gray-500">Operation:</span> {c.forHire ? 'For-hire' : 'Private'}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs bg-white border rounded">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-2 py-1.5">Linked carrier</th>
              <th className="px-2 py-1.5">Registered</th>
              <th className="px-2 py-1.5">Went inactive</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Shared</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {c.links.map(l => (
              <tr key={l.dotNumber}>
                <td className="px-2 py-1.5">
                  <div className="text-gray-900">{l.legalName}</div>
                  <div className="text-gray-500 font-mono">DOT {l.dotNumber}{l.mcNumber && <> · {l.mcNumber}</>}{l.location && <span className="font-sans"> · {l.location}</span>}</div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap">{l.registeredDate || '—'}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  {l.inactiveSince
                    ? <>{l.inactiveSince} <span className="text-gray-500">({ago(l.inactiveSince)})</span></>
                    : <span className="text-gray-500">last filing {l.lastActive || '—'}</span>}
                </td>
                <td className="px-2 py-1.5"><div className="flex flex-wrap gap-1"><ShutDownBadges link={l} /></div></td>
                <td className="px-2 py-1.5">{l.reasons.map(r => REASON_LABEL[r]).join(', ')}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <Link to={`/admin/carrier-pulse/${l.dotNumber}`} state={BACK_STATE} onClick={() => rememberScroll(currentView())} className="text-blue-600 hover:underline">Pulse</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== truck transfers ====================

interface TransferFilters {
  days: string
  minScore: string
  minUnits: string
  state: string
  q: string
  troubledOnly: boolean
  hiddenOnly: boolean
}

const TRANSFER_DEFAULTS: TransferFilters = {
  days: '180', minScore: '0', minUnits: '2', state: '', q: '', troubledOnly: true, hiddenOnly: false,
}

type TransferReady = Extract<VinTransferResponse, { status: 'ready' }>

function TransfersPanel() {
  const [filters, setFilters] = usePersisted<TransferFilters>('transfers:filters', TRANSFER_DEFAULTS)
  const [applied, setApplied] = usePersisted<TransferFilters>('transfers:applied', TRANSFER_DEFAULTS)
  const [offset, setOffset] = usePersisted('transfers:offset', 0)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [expanded, setExpanded] = usePersisted<string | null>('transfers:expanded', null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const { data, building, progress, loading, error } = useScan<TransferReady>(
    refresh => api.vinTransfers({ ...applied, offset, limit: PAGE_SIZE, refresh: refresh ? '1' : undefined }),
    [applied, offset],
    refreshNonce,
  )
  useRestoreScroll('transfers', !!data && !building)

  function search() {
    setOffset(0)
    setExpanded(null)
    setApplied({ ...filters })
  }

  async function downloadCsv() {
    setExporting(true)
    setExportError(null)
    try {
      await downloadFile(api.vinTransfersExportUrl({ ...applied }), `truck-transfers-${applied.days}d-${new Date().toISOString().slice(0, 10)}.csv`)
    } catch (e: any) {
      setExportError(e.message)
    } finally {
      setExporting(false)
    }
  }

  const results = data?.results ?? []
  const total = data?.total ?? 0

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 bg-white rounded-lg border p-4 space-y-3 h-fit md:sticky md:top-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Filters</h3>

        <Field label="New MC registered within">
          <select value={filters.days} onChange={e => setFilters(f => ({ ...f, days: e.target.value }))} className="input">
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last 12 months</option>
          </select>
        </Field>

        <Field label="Trucks moved">
          <select value={filters.minUnits} onChange={e => setFilters(f => ({ ...f, minUnits: e.target.value }))} className="input">
            <option value="2">2 or more</option>
            <option value="3">3 or more</option>
            <option value="5">5 or more</option>
            <option value="10">10 or more</option>
          </select>
        </Field>

        <Field label="Risk">
          <select value={filters.minScore} onChange={e => setFilters(f => ({ ...f, minScore: e.target.value }))} className="input">
            {MIN_SCORE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        <Field label="New carrier state">
          <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))} className="input">
            <option value="">Any</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Name, DOT, MC or VIN">
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') search() }}
            placeholder="ACME, 1234567 or VIN"
            className="input"
          />
        </Field>

        <Check
          label="Old carrier had problems"
          hint="Conditional/Unsatisfactory rating, authority revoked or suspended, insurance cancelled, or DOT inactive"
          checked={filters.troubledOnly}
          onChange={v => setFilters(f => ({ ...f, troubledOnly: v }))}
        />
        <Check
          label="Different name & owner only"
          hint="No name, phone, email, officer or address in common — the hidden ones"
          checked={filters.hiddenOnly}
          onChange={v => setFilters(f => ({ ...f, hiddenOnly: v }))}
        />

        <div className="flex gap-2 pt-2">
          <button onClick={search} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => { setFilters(TRANSFER_DEFAULTS); setOffset(0); setApplied(TRANSFER_DEFAULTS) }} className="px-3 py-2 border rounded-lg text-sm text-gray-700">
            Reset
          </button>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-9">
        <div className="bg-white rounded-lg border">
          <Toolbar
            building={building}
            buildingText={`Tracing trucks through FMCSA inspections — 1 to 2 minutes. ${progress || ''}`}
            loading={loading && !data}
            summary={data && (
              <>
                <span><strong className="text-gray-900">{total.toLocaleString()}</strong> truck transfer{total === 1 ? '' : 's'}</span>
                <RiskCounts counts={data.counts} />
              </>
            )}
            onRescan={() => { setOffset(0); setRefreshNonce(n => n + 1) }}
            onExport={downloadCsv}
            exporting={exporting}
            canExport={total > 0}
          />

          {data && !building && (
            <Banner>
              {data.stats.newCarriers.toLocaleString()} new MCs since {data.since}; {data.stats.inspected.toLocaleString()} of their roadside inspections and{' '}
              {data.stats.vinsChecked.toLocaleString()} trucks traced back · built {new Date(data.builtAt).toLocaleString()}. Only carriers that have been
              inspected can be matched, and a truck counts only if the old carrier ran it within 2 years before the new one. Big, healthy fleets
              (50+ trucks) selling used trucks are left out.
            </Banner>
          )}
          {(error || exportError) && <div className="p-3 text-sm text-red-600 bg-red-50">{error || exportError}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-3 py-2 w-6"></th>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">New MC</th>
                  <th className="px-3 py-2 text-center">Trucks</th>
                  <th className="px-3 py-2">Came from</th>
                  <th className="px-3 py-2">On paper</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!building && !loading && data && results.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No truck transfers match these filters.</td></tr>
                )}
                {!building && results.map(t => {
                  const open = expanded === t.id
                  return (
                    <Fragment key={t.id}>
                      <TransferRow t={t} open={open} onToggle={() => setExpanded(open ? null : t.id)} />
                      {open && (
                        <tr className="bg-gray-50/70">
                          <td></td>
                          <td colSpan={6} className="px-3 py-3"><TransferDetail t={t} /></td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!building && <Pager offset={offset} total={total} hasMore={!!data?.hasMore} loading={loading} onOffset={setOffset} />}
        </div>
      </main>
    </div>
  )
}

function TransferRow({ t, open, onToggle }: { t: VinTransfer; open: boolean; onToggle: () => void }) {
  const o = t.oldCarrier
  return (
    <tr className="hover:bg-gray-50 align-top cursor-pointer" onClick={onToggle}>
      <td className="px-3 py-2 text-gray-400">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
      <td className="px-3 py-2 whitespace-nowrap"><RiskBadge score={t.score} level={t.riskLevel} /></td>
      <td className="px-3 py-2 min-w-[13rem]"><NewCarrierCell c={t.newCarrier} /></td>
      <td className="px-3 py-2 text-center whitespace-nowrap">
        <div className="text-lg font-semibold text-gray-900 tabular-nums">{t.unitCount}</div>
        <div className="text-xs text-gray-500">
          {t.gapDays != null && (t.gapDays <= 0 ? 'same day' : `${t.gapDays}d gap`)}
        </div>
      </td>
      <td className="px-3 py-2 min-w-[14rem]">
        <div className="text-gray-900">{o.legalName}</div>
        <div className="text-xs text-gray-500 font-mono">{o.mcNumber || 'No MC'} · DOT {o.dotNumber}{o.powerUnits != null && <span className="font-sans"> · {o.powerUnits} PU</span>}</div>
        <div className="text-xs mt-0.5 flex flex-wrap gap-1">
          {o.troubles.length
            ? o.troubles.map(tr => (
              <span key={tr} className={`px-1.5 py-0.5 rounded ${/Unsatisfactory|Conditional/.test(tr) ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>{tr}</span>
            ))
            : <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-800">Still active, no problems on file</span>}
        </div>
        {o.inactiveSince && <div className="text-xs text-gray-500 mt-0.5">Stopped {ago(o.inactiveSince)}</div>}
      </td>
      <td className="px-3 py-2 min-w-[9rem]">
        {t.sameIdentity.length === 0
          ? <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">Different name &amp; owner</span>
          : <span className="text-xs text-gray-700">Same {t.sameIdentity.map(k => IDENTITY_LABEL[k] || k).join(', ')}</span>}
      </td>
      <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}><DeepCheck dot={t.newCarrier.dotNumber} /></td>
    </tr>
  )
}

function TransferDetail({ t }: { t: VinTransfer }) {
  const n = t.newCarrier
  const o = t.oldCarrier
  const rows: Array<[string, string | null, string | null]> = [
    ['Company', n.legalName, o.legalName],
    ['MC / DOT', `${n.mcNumber || '—'} · ${n.dotNumber}`, `${o.mcNumber || '—'} · ${o.dotNumber}`],
    ['Officer', n.officer, o.officer],
    ['Phone', n.phone, o.phone],
    ['Email', n.email, o.email],
    ['Address', n.address, o.address],
    ['Registered', n.registeredDate, o.registeredDate],
    ['Power units reported', n.powerUnits?.toString() ?? null, o.powerUnits?.toString() ?? null],
  ]
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs bg-white border rounded">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr><th className="px-2 py-1.5 w-40"></th><th className="px-2 py-1.5">New MC</th><th className="px-2 py-1.5">Old carrier</th></tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(([label, a, b]) => (
              <tr key={label}>
                <td className="px-2 py-1.5 text-gray-500">{label}</td>
                <td className="px-2 py-1.5 text-gray-900">{a || '—'}</td>
                <td className="px-2 py-1.5 text-gray-900">{b || '—'}</td>
              </tr>
            ))}
            <tr>
              <td className="px-2 py-1.5 text-gray-500">Went inactive</td>
              <td className="px-2 py-1.5">—</td>
              <td className="px-2 py-1.5 text-gray-900">{o.inactiveSince ? `${o.inactiveSince} · ${o.inactiveReason} (${ago(o.inactiveSince)})` : 'No end date on file'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {t.shareOfFleet != null && t.shareOfFleet >= 0.5 && (
        <div className="text-xs text-gray-700">
          {t.unitCount} moved trucks vs {n.powerUnits} reported power unit{n.powerUnits === 1 ? '' : 's'} — the new MC runs mostly the old carrier's fleet.
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs bg-white border rounded">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-2 py-1.5">VIN</th>
              <th className="px-2 py-1.5">Make</th>
              <th className="px-2 py-1.5">Under old carrier</th>
              <th className="px-2 py-1.5">Under new MC</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {t.units.map(u => (
              <tr key={u.vin}>
                <td className="px-2 py-1.5 font-mono">{u.vin}</td>
                <td className="px-2 py-1.5">{u.make || '—'}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{u.oldFirstSeen} → {u.oldLastSeen}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">{u.newFirstSeen} → {u.newLastSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 text-xs">
        <Link to={`/admin/chameleon-check/${o.dotNumber}`} state={BACK_STATE} onClick={() => rememberScroll(currentView())} className="text-blue-600 hover:underline">Deep check old carrier</Link>
        <Link to={`/admin/carrier-pulse/${o.dotNumber}`} state={BACK_STATE} onClick={() => rememberScroll(currentView())} className="text-blue-600 hover:underline">Old carrier in Pulse</Link>
        <Link to={`/admin/carrier-pulse/${n.dotNumber}`} state={BACK_STATE} onClick={() => rememberScroll(currentView())} className="text-blue-600 hover:underline">New MC in Pulse</Link>
      </div>
    </div>
  )
}

// ==================== small pieces ====================

function Toolbar(props: {
  building: boolean
  buildingText: string
  loading: boolean
  summary: React.ReactNode
  onRescan: () => void
  onExport: () => void
  exporting: boolean
  canExport: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b">
      <div className="text-sm text-gray-700 flex flex-wrap items-center gap-x-3 gap-y-1">
        {props.building
          ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {props.buildingText}</span>
          : props.loading ? 'Loading…' : props.summary}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={props.onRescan}
          disabled={props.building}
          title="Run the scan again against the latest FMCSA data"
          className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" /> Rescan
        </button>
        <button
          onClick={props.onExport}
          disabled={props.exporting || props.building || !props.canExport}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {props.exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export CSV
        </button>
      </div>
    </div>
  )
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 text-xs bg-blue-50 border-b border-blue-100 text-blue-900 flex items-start gap-2">
      <Info className="w-4 h-4 shrink-0 mt-px" />
      <span>{children}</span>
    </div>
  )
}

function RiskCounts({ counts }: { counts: Record<Risk, number> }) {
  return (
    <>
      {(['critical', 'high', 'moderate', 'low'] as const).map(level => counts[level] > 0 && (
        <span key={level} className={`px-2 py-0.5 rounded-full border text-xs capitalize ${RISK_STYLE[level]}`}>
          {counts[level].toLocaleString()} {level}
        </span>
      ))}
    </>
  )
}

function RiskBadge({ score, level }: { score: number; level: Risk }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${RISK_STYLE[level]}`}>
      {score} · {level}
    </span>
  )
}

function DeepCheck({ dot }: { dot: string }) {
  return (
    <Link to={`/admin/chameleon-check/${dot}`} state={BACK_STATE} onClick={() => rememberScroll(currentView())} className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
      Deep check <ExternalLink className="w-3 h-3" />
    </Link>
  )
}

function Pager({ offset, total, hasMore, loading, onOffset }: { offset: number; total: number; hasMore: boolean; loading: boolean; onOffset: (n: number) => void }) {
  if (total <= PAGE_SIZE) return null
  return (
    <div className="flex items-center justify-between p-3 border-t text-sm text-gray-600">
      <span>{(offset + 1).toLocaleString()}–{Math.min(offset + PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()}</span>
      <div className="flex gap-2">
        <button disabled={offset === 0 || loading} onClick={() => onOffset(Math.max(offset - PAGE_SIZE, 0))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Previous</button>
        <button disabled={!hasMore || loading} onClick={() => onOffset(offset + PAGE_SIZE)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function Check({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700" title={hint}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300 mt-0.5" />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  )
}
