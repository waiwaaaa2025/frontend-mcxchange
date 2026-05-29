import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Download, X, Phone, Mail, Building2, Calendar, Loader2,
  Clock, AlertTriangle, ListChecks, Trophy, ArrowRight, Sparkles, Pencil, UserCog,
  Activity, ExternalLink,
} from 'lucide-react'
import api from '../services/api'

// Carrier Pulse detail route for the full MC profile (safety, authority,
// insurance, fleet, chameleon, etc.). Admin Leads lives under /admin, so the
// pulse page is the sibling /admin/carrier-pulse/:dotNumber.
const pulseUrl = (dot: string | number) => `/admin/carrier-pulse/${dot}`

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CALLBACK', 'WON', 'DEAD'] as const
type LeadStatus = typeof LEAD_STATUSES[number]

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

interface Filters {
  state: string
  name: string
  insuranceExpiresWithinDays: string
  minFleet: string
  maxFleet: string
  authorityStatus: string
  safetyRating: string
  addedBefore: string
  addedAfter: string
}

const EMPTY_FILTERS: Filters = {
  state: '', name: '', insuranceExpiresWithinDays: '', minFleet: '', maxFleet: '',
  authorityStatus: '', safetyRating: '', addedBefore: '', addedAfter: '',
}

export default function AdminLeadsPage() {
  const [tab, setTab] = useState<'search' | 'pipeline'>('search')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [results, setResults] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [insuranceHorizon, setInsuranceHorizon] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDot, setSelectedDot] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [pipelineFilter, setPipelineFilter] = useState<'mine' | 'all'>('mine')
  const [statFilter, setStatFilter] = useState<'all' | 'follow_up' | 'expiring' | 'won'>('all')
  const [stats, setStats] = useState<{ needsFollowUp: number; expiring: number; activePipeline: number; wonThisMonth: number } | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [logPopover, setLogPopover] = useState<{ leadId: string; kind: 'call' | 'email' | 'voicemail' } | null>(null)

  const searchParams = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit])

  async function runSearch() {
    setLoading(true); setError(null)
    try {
      const res = await api.leadsSearchCarriers(searchParams)
      setResults(res.data.carriers)
      setHasMore(!!res.data.hasMore)
      setInsuranceHorizon((res.data as any).insuranceHorizon || null)
    } catch (e: any) {
      setError(e.message || 'Search failed')
    } finally { setLoading(false) }
  }

  async function loadPipeline() {
    setLeadsLoading(true)
    try {
      const res = await api.leadsList(pipelineFilter === 'all')
      setLeads(res.data)
    } finally { setLeadsLoading(false) }
  }

  async function loadStats() {
    try {
      const res = await api.leadsPipelineStats()
      setStats(res.data)
    } catch { /* ignore — stats are nice-to-have */ }
  }

  async function openLeadActivity(leadId: string) {
    setSelectedLeadId(leadId)
    setActivity([])
    setActivityLoading(true)
    try {
      const res = await api.leadsGetActivity(leadId)
      setActivity(res.data.activity)
    } finally { setActivityLoading(false) }
  }

  async function submitLog(leadId: string, kind: 'call' | 'email' | 'voicemail', text: string) {
    const body = kind === 'email' ? { kind, body: text } : { kind, outcome: text }
    await api.leadsLogActivity(leadId, body)
    setLogPopover(null)
    await Promise.all([loadPipeline(), loadStats(), selectedLeadId === leadId ? openLeadActivity(leadId) : Promise.resolve()])
  }

  // Client-side stat filter on the pipeline list — same predicates as the
  // backend widget queries so the click-through matches the count above.
  const filteredLeads = useMemo(() => {
    if (statFilter === 'all') return leads
    const today = new Date().toISOString().slice(0, 10)
    const weekOut = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
    const followUpCutoff = Date.now() - 7 * 86_400_000
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    return leads.filter(l => {
      if (statFilter === 'follow_up') {
        return ['CONTACTED', 'INTERESTED', 'CALLBACK'].includes(l.status)
          && (!l.lastContactedAt || new Date(l.lastContactedAt).getTime() < followUpCutoff)
      }
      if (statFilter === 'expiring') {
        const d = l.insuranceCancellationSnapshot
        return d && d >= today && d <= weekOut
          && !['WON', 'DEAD', 'NOT_INTERESTED'].includes(l.status)
      }
      if (statFilter === 'won') {
        return l.status === 'WON' && new Date(l.updatedAt).getTime() >= startOfMonth
      }
      return true
    })
  }, [leads, statFilter])

  useEffect(() => { if (tab === 'search') runSearch() }, [tab, page, limit])
  useEffect(() => {
    if (tab === 'pipeline') {
      loadPipeline()
      loadStats()
    }
  }, [tab, pipelineFilter])

  async function openDetail(dot: string) {
    setSelectedDot(dot); setDetail(null); setDetailLoading(true)
    try {
      const res = await api.leadsGetCarrier(dot)
      setDetail(res.data)
    } finally { setDetailLoading(false) }
  }

  async function saveAsLead(dot: string) {
    try {
      await api.leadsCreate({ dotNumber: dot })
      alert('Saved to your pipeline')
    } catch (e: any) { alert(e.message || 'Save failed') }
  }

  async function updateLeadStatus(id: string, status: LeadStatus) {
    await api.leadsUpdate(id, { status, lastContactedAt: new Date().toISOString() })
    loadPipeline()
  }

  async function updateLeadNotes(id: string, notes: string) {
    await api.leadsUpdate(id, { notes })
  }

  function downloadCsv() {
    const url = api.leadsCsvExportUrl({ ...filters, limit })
    const token = localStorage.getItem('mcx_token')
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`
        a.click()
      })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <div className="flex gap-2">
            <button onClick={() => setTab('search')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==='search'?'bg-blue-600 text-white':'bg-white text-gray-700 border'}`}>Search Carriers</button>
            <button onClick={() => setTab('pipeline')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab==='pipeline'?'bg-blue-600 text-white':'bg-white text-gray-700 border'}`}>My Pipeline</button>
          </div>
        </div>

        {tab === 'search' && (
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3 bg-white rounded-lg border p-4 space-y-3 h-fit sticky top-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Filters</h3>

              <Field label="Company name">
                <input value={filters.name} onChange={e=>setFilters(f=>({...f,name:e.target.value}))} placeholder="ACME Trucking" className="input"/>
              </Field>

              <Field label="State">
                <select value={filters.state} onChange={e=>setFilters(f=>({...f,state:e.target.value}))} className="input">
                  <option value="">Any</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Insurance expires within (days)">
                <input type="number" value={filters.insuranceExpiresWithinDays} onChange={e=>setFilters(f=>({...f,insuranceExpiresWithinDays:e.target.value}))} placeholder="30" className="input"/>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Min fleet"><input type="number" value={filters.minFleet} onChange={e=>setFilters(f=>({...f,minFleet:e.target.value}))} className="input"/></Field>
                <Field label="Max fleet"><input type="number" value={filters.maxFleet} onChange={e=>setFilters(f=>({...f,maxFleet:e.target.value}))} className="input"/></Field>
              </div>

              <Field label="Authority status">
                <select value={filters.authorityStatus} onChange={e=>setFilters(f=>({...f,authorityStatus:e.target.value}))} className="input">
                  <option value="">Any</option>
                  <option>active</option><option>inactive</option><option>revoked</option>
                </select>
              </Field>

              <Field label="Safety rating">
                <select value={filters.safetyRating} onChange={e=>setFilters(f=>({...f,safetyRating:e.target.value}))} className="input">
                  <option value="">Any</option>
                  <option>Satisfactory</option><option>Conditional</option><option>Unsatisfactory</option>
                </select>
              </Field>

              <Field label="Carrier added before"><input type="date" value={filters.addedBefore} onChange={e=>setFilters(f=>({...f,addedBefore:e.target.value}))} className="input"/></Field>
              <Field label="Carrier added after"><input type="date" value={filters.addedAfter} onChange={e=>setFilters(f=>({...f,addedAfter:e.target.value}))} className="input"/></Field>

              <div className="flex gap-2 pt-2">
                <button onClick={()=>{ setPage(1); runSearch() }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1">
                  <Search className="w-4 h-4" /> Search
                </button>
                <button onClick={()=>{ setFilters(EMPTY_FILTERS); setPage(1) }} className="px-3 py-2 border rounded-lg text-sm text-gray-700">Clear</button>
              </div>
            </aside>

            <main className="col-span-9">
              <div className="bg-white rounded-lg border">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="text-sm text-gray-700">
                    {loading ? 'Loading…' : `${results.length} carrier${results.length === 1 ? '' : 's'} on this page${hasMore ? ' (more available)' : ''}`}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 flex items-center gap-1">
                      Rows:
                      <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1) }} className="border rounded px-2 py-1 text-sm">
                        {[10,25,50,100,250,500].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </label>
                    <button onClick={downloadCsv} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                </div>

                {error && <div className="p-3 text-sm text-red-600 bg-red-50">{error}</div>}
                {insuranceHorizon && (
                  <div className="px-4 py-2.5 text-xs bg-amber-50 border-b border-amber-200 text-amber-900">
                    🔥 Every row below has insurance expiring by <strong>{insuranceHorizon}</strong>. Click a row to see the exact cancellation date and contact info.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-left">
                      <tr>
                        <th className="px-3 py-2">DOT</th>
                        <th className="px-3 py-2">Legal Name</th>
                        <th className="px-3 py-2">State</th>
                        <th className="px-3 py-2 text-right">Fleet</th>
                        <th className="px-3 py-2">Authority</th>
                        <th className="px-3 py-2">Safety</th>
                        <th className="px-3 py-2">Ins. Cancels</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.length === 0 && !loading && (
                        <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                          No carriers match these filters. Try widening the criteria.
                        </td></tr>
                      )}
                      {results.map(c => (
                        <tr key={c.dotNumber} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(c.dotNumber)}>
                          <td className="px-3 py-2 font-mono text-xs">
                            <Link
                              to={pulseUrl(c.dotNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Open full profile in Carrier Pulse"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              {c.dotNumber}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </Link>
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">{c.legalName || '—'}</td>
                          <td className="px-3 py-2">{c.state || '—'}</td>
                          <td className="px-3 py-2 text-right">{c.totalPowerUnits ?? '—'}</td>
                          <td className="px-3 py-2">{c.authorityStatus || '—'}</td>
                          <td className="px-3 py-2">{c.safetyRating || '—'}</td>
                          <td className="px-3 py-2">{c.insuranceCancellationDate || '—'}</td>
                          <td className="px-3 py-2">
                            <button onClick={(e)=>{ e.stopPropagation(); saveAsLead(c.dotNumber) }} className="text-xs text-blue-600 hover:underline">+ Save</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(page > 1 || hasMore) && (
                  <div className="flex items-center justify-between p-3 border-t text-sm">
                    <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
                    <div>Page {page}</div>
                    <button disabled={!hasMore} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

        {tab === 'pipeline' && (
          <div className="space-y-4">
            {/* Pipeline stats strip — clickable filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Clock} color="amber"
                label="Needs follow-up" value={stats?.needsFollowUp ?? null}
                active={statFilter === 'follow_up'}
                onClick={() => setStatFilter(statFilter === 'follow_up' ? 'all' : 'follow_up')}
              />
              <StatCard
                icon={AlertTriangle} color="red"
                label="Insurance expiring (7d)" value={stats?.expiring ?? null}
                active={statFilter === 'expiring'}
                onClick={() => setStatFilter(statFilter === 'expiring' ? 'all' : 'expiring')}
              />
              <StatCard
                icon={ListChecks} color="blue"
                label="Active pipeline" value={stats?.activePipeline ?? null}
                active={false}
                onClick={() => setStatFilter('all')}
              />
              <StatCard
                icon={Trophy} color="green"
                label="Won this month" value={stats?.wonThisMonth ?? null}
                active={statFilter === 'won'}
                onClick={() => setStatFilter(statFilter === 'won' ? 'all' : 'won')}
              />
            </div>

            <div className="bg-white rounded-lg border">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex gap-2 items-center">
                  <button onClick={()=>setPipelineFilter('mine')} className={`px-3 py-1 rounded text-sm ${pipelineFilter==='mine'?'bg-blue-100 text-blue-700':'text-gray-600'}`}>Mine</button>
                  <button onClick={()=>setPipelineFilter('all')} className={`px-3 py-1 rounded text-sm ${pipelineFilter==='all'?'bg-blue-100 text-blue-700':'text-gray-600'}`}>All reps</button>
                  {statFilter !== 'all' && (
                    <button onClick={()=>setStatFilter('all')} className="ml-2 text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear stat filter
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-500">{leadsLoading ? 'Loading…' : `${filteredLeads.length} leads`}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left">
                    <tr>
                      <th className="px-3 py-2">DOT</th>
                      <th className="px-3 py-2">Carrier</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Ins. Cancels</th>
                      <th className="px-3 py-2">Assignee</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Last Contact</th>
                      <th className="px-3 py-2 text-right">Quick log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredLeads.length === 0 && !leadsLoading && (
                      <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                        {statFilter === 'all' ? 'No leads saved yet.' : 'No leads match this filter.'}
                      </td></tr>
                    )}
                    {filteredLeads.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>openLeadActivity(l.id)}>
                        <td className="px-3 py-2 font-mono text-xs">
                          <Link
                            to={pulseUrl(l.dotNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open full profile in Carrier Pulse"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {l.dotNumber}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-medium">{l.carrierNameSnapshot || '—'}</td>
                        <td className="px-3 py-2">{l.phoneSnapshot
                          ? <a onClick={e=>e.stopPropagation()} href={`tel:${l.phoneSnapshot}`} className="text-blue-600 hover:underline">{l.phoneSnapshot}</a>
                          : <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2">{l.emailSnapshot
                          ? <a onClick={e=>e.stopPropagation()} href={`mailto:${l.emailSnapshot}`} className="text-blue-600 hover:underline">{l.emailSnapshot}</a>
                          : <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2">{l.insuranceCancellationSnapshot || '—'}</td>
                        <td className="px-3 py-2">{l.assignee?.name || '—'}</td>
                        <td className="px-3 py-2" onClick={e=>e.stopPropagation()}>
                          <select value={l.status} onChange={e=>updateLeadStatus(l.id, e.target.value as LeadStatus)} className="text-xs border rounded px-2 py-1">
                            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2 text-right" onClick={e=>e.stopPropagation()}>
                          <div className="inline-flex gap-1">
                            <button onClick={()=>setLogPopover({ leadId: l.id, kind: 'call' })} title="Log call" className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100">📞</button>
                            <button onClick={()=>setLogPopover({ leadId: l.id, kind: 'email' })} title="Log email" className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-100">✉️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead activity drawer — opens when a pipeline row is clicked */}
      {selectedLeadId && (() => {
        const lead = leads.find(l => l.id === selectedLeadId)
        return (
          <Drawer onClose={()=>setSelectedLeadId(null)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{lead?.carrierNameSnapshot || `DOT ${lead?.dotNumber}`}</h2>
                <div className="text-sm text-gray-600 font-mono">DOT {lead?.dotNumber} · <span className="text-gray-500">{lead?.status}</span></div>
              </div>
              <button onClick={()=>setSelectedLeadId(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
            </div>

            {lead?.dotNumber && (
              <Link
                to={pulseUrl(lead.dotNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 flex items-center justify-center gap-2 mb-4"
              >
                <Activity className="w-4 h-4" /> View full details in Carrier Pulse
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={()=>setLogPopover({ leadId: selectedLeadId, kind: 'call' })} className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1.5">📞 Log call</button>
              <button onClick={()=>setLogPopover({ leadId: selectedLeadId, kind: 'email' })} className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1.5">✉️ Log email</button>
              <button onClick={()=>setLogPopover({ leadId: selectedLeadId, kind: 'voicemail' })} className="px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1.5">📨 Voicemail</button>
            </div>

            {/* Activity timeline */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Activity</h3>
              {activityLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin"/>Loading…</div>
              ) : activity.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 italic">No activity yet.</div>
              ) : (
                <ul className="space-y-2">
                  {activity.map(a => <ActivityRow key={a.id} action={a} />)}
                </ul>
              )}
            </div>

            {/* Notes editor */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
              <textarea
                defaultValue={lead?.notes || ''}
                onBlur={e => updateLeadNotes(selectedLeadId, e.target.value)}
                placeholder="Add a note… (Scout's AI summaries also write here)"
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm min-h-[120px]"
              />
            </div>
          </Drawer>
        )
      })()}

      {/* Log activity popover */}
      {logPopover && (
        <LogActivityPopover
          kind={logPopover.kind}
          onCancel={()=>setLogPopover(null)}
          onSubmit={(text)=>submitLog(logPopover.leadId, logPopover.kind, text)}
        />
      )}

      {selectedDot && (
        <Drawer onClose={()=>setSelectedDot(null)}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">DOT {selectedDot}</h2>
              {detail?.carrier?.legal_name && <div className="text-sm text-gray-600">{detail.carrier.legal_name}</div>}
            </div>
            <button onClick={()=>setSelectedDot(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
          </div>
          {detailLoading && <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin"/>Loading…</div>}
          {!detailLoading && detail && (
            <div className="space-y-4">
              {detail.carrier && (
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 rounded p-3">
                  <Info icon={<Building2 className="w-4 h-4"/>} label="State" value={detail.carrier.physical_address?.state || detail.carrier.state}/>
                  <Info icon={<Building2 className="w-4 h-4"/>} label="City" value={detail.carrier.physical_address?.city || detail.carrier.city}/>
                  <Info icon={<Phone className="w-4 h-4"/>} label="Phone" value={detail.carrier.phone || detail.carrier.cell_phone}/>
                  <Info icon={<Mail className="w-4 h-4"/>} label="Email" value={detail.carrier.email}/>
                  <Info icon={<Calendar className="w-4 h-4"/>} label="Added" value={detail.carrier.add_date}/>
                  <Info icon={<Calendar className="w-4 h-4"/>} label="Insurance cancels" value={detail.insurance?.summary?.earliest_cancellation_date}/>
                  <Info icon={<Building2 className="w-4 h-4"/>} label="Fleet" value={detail.carrier.power_units}/>
                  <Info icon={<Building2 className="w-4 h-4"/>} label="Authority" value={detail.carrier.operating_status}/>
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600">Raw LINQ payload</summary>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto mt-2 max-h-96">{JSON.stringify({ carrier: detail.carrier, insurance: detail.insurance }, null, 2)}</pre>
              </details>
              <Link
                to={pulseUrl(selectedDot)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" /> View full details in Carrier Pulse
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button onClick={()=>saveAsLead(selectedDot)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">+ Save to My Pipeline</button>
            </div>
          )}
        </Drawer>
      )}

      <style>{`
        .input { width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; }
        .input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
      `}</style>
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

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-gray-900">{value || '—'}</div>
      </div>
    </div>
  )
}

function Drawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 p-6 overflow-y-auto">{children}</div>
    </>
  )
}

const STAT_COLORS: Record<string, { bg: string; text: string; iconBg: string }> = {
  amber: { bg: 'bg-white', text: 'text-amber-700', iconBg: 'bg-amber-50' },
  red: { bg: 'bg-white', text: 'text-red-700', iconBg: 'bg-red-50' },
  blue: { bg: 'bg-white', text: 'text-blue-700', iconBg: 'bg-blue-50' },
  green: { bg: 'bg-white', text: 'text-green-700', iconBg: 'bg-green-50' },
}

function StatCard({
  icon: Icon, color, label, value, active, onClick,
}: {
  icon: typeof Clock
  color: 'amber' | 'red' | 'blue' | 'green'
  label: string
  value: number | null
  active: boolean
  onClick: () => void
}) {
  const c = STAT_COLORS[color]
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 ${c.bg} border rounded-xl p-3 text-left transition-shadow hover:shadow-md ${active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'}`}
    >
      <div className={`w-10 h-10 rounded-lg ${c.iconBg} ${c.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value ?? '—'}</div>
      </div>
    </button>
  )
}

// Renders one row of the activity timeline. Picks an icon + summary line based
// on actionType. inputData/outputData are shaped by the backend writer.
function ActivityRow({ action }: { action: any }) {
  const date = new Date(action.createdAt)
  const actorLabel =
    action.agentSlug === 'scout' ? 'Scout'
    : action.agentSlug === 'eva' ? 'Eva'
    : action.actor?.name || 'System'

  const { icon, line, accent } = renderAction(action)

  return (
    <li className="flex items-start gap-3 py-2">
      <div className={`w-7 h-7 rounded-lg ${accent} flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900">{line}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {actorLabel} · {date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </li>
  )
}

function renderAction(a: any): { icon: React.ReactNode; line: React.ReactNode; accent: string } {
  switch (a.actionType) {
    case 'enrich_lead': {
      const o = a.outputData || {}
      const priority = o.priority || '?'
      const conf = typeof o.confidence === 'number' ? o.confidence.toFixed(2) : '?'
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
        accent: 'bg-purple-50',
        line: <>Scout enriched · <strong>{priority}</strong> priority · confidence {conf}{o.summary ? <span className="text-gray-600 block mt-0.5 text-xs italic">"{String(o.summary).slice(0, 140)}"</span> : null}</>,
      }
    }
    case 'status_changed': {
      const o = a.outputData || {}
      return {
        icon: <ArrowRight className="w-3.5 h-3.5 text-blue-600" />,
        accent: 'bg-blue-50',
        line: <>Status: <strong>{o.from || '?'}</strong> → <strong>{o.to || '?'}</strong></>,
      }
    }
    case 'assignee_changed':
      return {
        icon: <UserCog className="w-3.5 h-3.5 text-indigo-600" />,
        accent: 'bg-indigo-50',
        line: <>Reassigned</>,
      }
    case 'call_logged':
      return {
        icon: <Phone className="w-3.5 h-3.5 text-green-600" />,
        accent: 'bg-green-50',
        line: <><strong>Call</strong>{a.outputData?.outcome ? <> — {a.outputData.outcome}</> : null}</>,
      }
    case 'email_logged':
      return {
        icon: <Mail className="w-3.5 h-3.5 text-blue-600" />,
        accent: 'bg-blue-50',
        line: <><strong>Email</strong>{a.inputData?.body ? <> — <span className="text-gray-600 italic">{String(a.inputData.body).slice(0, 100)}</span></> : null}</>,
      }
    case 'voicemail_logged':
      return {
        icon: <Phone className="w-3.5 h-3.5 text-amber-600" />,
        accent: 'bg-amber-50',
        line: <><strong>Voicemail</strong>{a.outputData?.outcome ? <> — {a.outputData.outcome}</> : null}</>,
      }
    case 'note_updated':
      return {
        icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
        accent: 'bg-gray-100',
        line: <>Notes updated</>,
      }
    default:
      return {
        icon: <Clock className="w-3.5 h-3.5 text-gray-500" />,
        accent: 'bg-gray-100',
        line: <code className="text-xs text-gray-600">{a.actionType}</code>,
      }
  }
}

function LogActivityPopover({
  kind, onCancel, onSubmit,
}: {
  kind: 'call' | 'email' | 'voicemail'
  onCancel: () => void
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState('')
  const label =
    kind === 'call' ? 'Log a call' :
    kind === 'email' ? 'Log an email' : 'Log a voicemail'
  const placeholder =
    kind === 'call' ? 'Outcome (left voicemail, answered, will call back…)' :
    kind === 'email' ? 'Email body or summary' : 'Voicemail message left'

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onCancel} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 pointer-events-auto">
          <h3 className="font-semibold text-gray-900 mb-3">{label}</h3>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-400"
          />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">Cancel</button>
            <button onClick={() => onSubmit(text)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Log</button>
          </div>
        </div>
      </div>
    </>
  )
}
