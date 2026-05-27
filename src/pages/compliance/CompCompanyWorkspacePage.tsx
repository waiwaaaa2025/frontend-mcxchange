import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Plus, Trash2, FileText, Users, ShieldCheck, RefreshCw, Activity, AlertTriangle, AlertOctagon, Info, Check } from 'lucide-react'
import complianceApi, { type ManagedCompany, type ComplianceDocumentRow, type DriverRow } from '../../services/complianceApi'
import LinqCarrierProfile from '../../components/compliance/LinqCarrierProfile'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'
import AddDocumentModal from '../../components/compliance/AddDocumentModal'
import AddDriverModal from '../../components/compliance/AddDriverModal'

type Tab = 'overview' | 'pulse' | 'documents' | 'drivers'

export default function CompCompanyWorkspacePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [company, setCompany] = useState<ManagedCompany | null>(null)
  const [linq, setLinq] = useState<{ carrier: any; insurance: any; report: any } | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [docs, setDocs] = useState<ComplianceDocumentRow[]>([])
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [changes, setChanges] = useState<any[]>([])
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showAddDriver, setShowAddDriver] = useState(false)

  useEffect(() => { void loadCompany() }, [id])
  useEffect(() => {
    if (tab === 'documents') void loadDocs()
    if (tab === 'drivers') void loadDrivers()
    if (tab === 'pulse') void loadChanges()
  }, [tab, id])

  async function loadCompany() {
    setLoading(true)
    try {
      const res = await complianceApi.getCompany(id)
      setCompany(res.data.company)
      setLinq(res.data.linq)
      setLastFetchedAt((res.data as any).snapshot?.lastFetchedAt || null)
    } finally { setLoading(false) }
  }
  async function loadChanges() {
    const res = await complianceApi.getCompanyChanges(id)
    setChanges(res.data)
  }
  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await complianceApi.refreshCompany(id)
      setLastFetchedAt(res.data.lastFetchedAt)
      await Promise.all([loadCompany(), tab === 'pulse' ? loadChanges() : Promise.resolve()])
      if (res.data.changesDetected > 0) {
        alert(`${res.data.changesDetected} change${res.data.changesDetected === 1 ? '' : 's'} detected. See the Pulse tab.`)
      }
    } catch (e: any) {
      alert(e.message || 'Refresh failed')
    } finally { setRefreshing(false) }
  }
  async function handleAck(eventId: string) {
    await complianceApi.acknowledgeChange(eventId)
    await loadChanges()
  }
  async function loadDocs() {
    const res = await complianceApi.listCompanyDocuments(id)
    setDocs(res.data)
  }
  async function loadDrivers() {
    const res = await complianceApi.listCompanyDrivers(id)
    setDrivers(res.data)
  }

  async function handleAddDoc(body: any) {
    await complianceApi.createDocument(id, body)
    await loadDocs()
  }
  async function handleAddDriver(body: any) {
    await complianceApi.createDriver(id, body)
    await loadDrivers()
  }
  async function handleDeleteDoc(docId: string) {
    if (!confirm('Delete this document?')) return
    await complianceApi.deleteDocument(docId)
    await loadDocs()
  }
  async function handleDeleteCompany() {
    if (!confirm('Stop managing this company? Documents and drivers will be deleted.')) return
    await complianceApi.deleteCompany(id)
    navigate('/compliance/companies')
  }

  if (loading && !company) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
  }
  if (!company) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Company not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/compliance/companies')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Companies
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.label || `DOT ${company.dotNumber}`}</h1>
            <div className="text-sm text-gray-500 font-mono mt-1">DOT {company.dotNumber}</div>
            {company.notes ? <div className="text-sm text-gray-600 mt-2 italic">{company.notes}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                title="Pull a fresh snapshot from FMCSA via LINQ"
                className="text-xs px-3 py-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              {lastFetchedAt && (
                <div className="text-[10px] text-gray-500 mt-1">Updated {relativeTime(lastFetchedAt)}</div>
              )}
            </div>
            <button onClick={handleDeleteCompany} className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Stop managing
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-5">
          {(['overview', 'pulse', 'documents', 'drivers'] as Tab[]).map(t => {
            const Icon = t === 'overview' ? ShieldCheck : t === 'pulse' ? Activity : t === 'documents' ? FileText : Users
            const unack = t === 'pulse' ? changes.filter(c => !c.acknowledged).length : 0
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t[0].toUpperCase() + t.slice(1)}
                {unack > 0 && (
                  <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unack}</span>
                )}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <LinqCarrierProfile loading={loading} carrier={linq?.carrier} insurance={linq?.insurance} report={linq?.report} />
        )}

        {tab === 'pulse' && (
          <div className="bg-white border rounded-xl">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent changes</h2>
              <span className="text-xs text-gray-500">
                {changes.length === 0 ? 'No changes detected yet' : `${changes.length} event${changes.length === 1 ? '' : 's'}`}
              </span>
            </div>
            {changes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No changes yet. The first refresh sets a baseline — subsequent refreshes will compare against it.
              </div>
            ) : (
              <ul className="divide-y">
                {changes.map(c => <ChangeRow key={c.id} event={c} onAck={() => handleAck(c.id)} />)}
              </ul>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div className="bg-white border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Compliance documents</h2>
              <button onClick={() => setShowAddDoc(true)} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded inline-flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add document
              </button>
            </div>
            {docs.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No documents yet. Add a COI, MCS-150, IFTA, etc.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-2">Kind</th>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Expiry</th>
                    <th className="px-4 py-2">Notes</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {docs.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2"><span className="text-[10px] uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">{d.kind.replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-2 font-medium text-gray-900">{d.title}</td>
                      <td className="px-4 py-2"><ExpiryBadge expiresOn={d.expiresOn || null} /></td>
                      <td className="px-4 py-2 text-xs text-gray-600 max-w-[300px] truncate" title={d.notes || ''}>{d.notes || '—'}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleDeleteDoc(d.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'drivers' && (
          <div className="bg-white border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Drivers</h2>
              <button onClick={() => setShowAddDriver(true)} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded inline-flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add driver
              </button>
            </div>
            {drivers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No drivers tracked yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">CDL</th>
                    <th className="px-4 py-2">CDL expires</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {drivers.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        <Link to={`/compliance/drivers/${d.id}`} className="hover:text-indigo-600 hover:underline">{d.fullName}</Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 font-mono">
                        {d.cdlState ? `${d.cdlState}-` : ''}{d.cdlNumber || '—'}
                      </td>
                      <td className="px-4 py-2"><ExpiryBadge expiresOn={d.cdlExpiresOn || null} /></td>
                      <td className="px-4 py-2 text-xs">
                        <span className={`uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                          d.status === 'ACTIVE' ? 'bg-green-50 text-green-700'
                          : d.status === 'ONBOARDING' ? 'bg-blue-50 text-blue-700'
                          : d.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-50 text-red-700'
                        }`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link to={`/compliance/drivers/${d.id}`} className="text-xs text-indigo-600 hover:underline">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showAddDoc && <AddDocumentModal scope="company" onCancel={() => setShowAddDoc(false)} onSubmit={handleAddDoc} />}
        {showAddDriver && <AddDriverModal onCancel={() => setShowAddDriver(false)} onSubmit={handleAddDriver} />}
      </div>
    </div>
  )
}

function ChangeRow({ event, onAck }: { event: any; onAck: () => void }) {
  const Icon = event.severity === 'CRITICAL' ? AlertOctagon : event.severity === 'WARN' ? AlertTriangle : Info
  const tone = event.severity === 'CRITICAL' ? 'text-red-700 bg-red-50'
    : event.severity === 'WARN' ? 'text-amber-700 bg-amber-50'
    : 'text-blue-700 bg-blue-50'
  return (
    <li className={`px-5 py-3 flex items-start gap-3 ${event.acknowledged ? 'opacity-60' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{event.description || event.field}</div>
        <div className="text-xs text-gray-500 mt-0.5 font-mono">
          {event.field}: {fmt(event.oldValue)} → <strong>{fmt(event.newValue)}</strong>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          {new Date(event.detectedAt).toLocaleString()}{event.acknowledged ? ' · Acknowledged' : ''}
        </div>
      </div>
      {!event.acknowledged && (
        <button onClick={onAck} title="Mark as read" className="text-gray-400 hover:text-green-600 p-1">
          <Check className="w-4 h-4" />
        </button>
      )}
    </li>
  )
}

function fmt(v: any): string {
  if (v == null) return '∅'
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 40)
  return String(v)
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  return `${day}d ago`
}
