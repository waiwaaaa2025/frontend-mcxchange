import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Users,
  ShieldCheck,
  RefreshCw,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
} from 'lucide-react'
import complianceApi, {
  type ManagedCompany,
  type ComplianceDocumentRow,
  type DriverRow,
} from '../../services/complianceApi'
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

  useEffect(() => {
    void loadCompany()
  }, [id])
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
    } finally {
      setLoading(false)
    }
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
      await Promise.all([
        loadCompany(),
        tab === 'pulse' ? loadChanges() : Promise.resolve(),
      ])
      if (res.data.changesDetected > 0) {
        alert(
          `${res.data.changesDetected} change${res.data.changesDetected === 1 ? '' : 's'} detected. See the Pulse tab.`
        )
      }
    } catch (e: any) {
      alert(e.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
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
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ color: 'var(--linq-muted)' }}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }
  if (!company) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ color: 'var(--linq-muted)' }}>
        Company not found.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto fadein">
        <button
          onClick={() => navigate('/compliance/companies')}
          className="text-sm mb-4 inline-flex items-center gap-1 hover:text-slate-900"
          style={{ color: 'var(--linq-muted)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Companies
        </button>

        {/* Header */}
        <div className="card p-5 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--linq-muted)' }}
              >
                Carrier workspace
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mt-1 truncate">
                {company.label || `DOT ${company.dotNumber}`}
              </h1>
              <div
                className="text-sm font-mono mt-1"
                style={{ color: 'var(--linq-muted)' }}
              >
                DOT {company.dotNumber}
              </div>
              {company.notes ? (
                <div className="text-sm text-slate-600 mt-2 italic">{company.notes}</div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Pull a fresh snapshot from FMCSA via LINQ"
                  className="text-xs px-3 py-1.5 border border-cyan-200 text-cyan-700 hover:bg-cyan-50 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                {lastFetchedAt && (
                  <div
                    className="text-[10px] mt-1"
                    style={{ color: 'var(--linq-muted)' }}
                  >
                    Updated {relativeTime(lastFetchedAt)}
                  </div>
                )}
              </div>
              <button
                onClick={handleDeleteCompany}
                className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Stop managing
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 border-b mb-5"
          style={{ borderColor: 'var(--linq-border)' }}
        >
          {(['overview', 'pulse', 'documents', 'drivers'] as Tab[]).map((t) => {
            const Icon =
              t === 'overview'
                ? ShieldCheck
                : t === 'pulse'
                ? Activity
                : t === 'documents'
                ? FileText
                : Users
            const unack = t === 'pulse' ? changes.filter((c) => !c.acknowledged).length : 0
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t[0].toUpperCase() + t.slice(1)}
                {unack > 0 && (
                  <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {unack}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <LinqCarrierProfile
            loading={loading}
            carrier={linq?.carrier}
            insurance={linq?.insurance}
            report={linq?.report}
          />
        )}

        {tab === 'pulse' && (
          <div className="card overflow-hidden">
            <div
              className="px-5 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--linq-border)' }}
            >
              <h2 className="font-semibold text-slate-900">Recent changes</h2>
              <span className="text-xs" style={{ color: 'var(--linq-muted)' }}>
                {changes.length === 0
                  ? 'No changes detected yet'
                  : `${changes.length} event${changes.length === 1 ? '' : 's'}`}
              </span>
            </div>
            {changes.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--linq-muted)' }}>
                <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No changes yet. The first refresh sets a baseline — subsequent refreshes will
                compare against it.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                {changes.map((c) => (
                  <ChangeRow key={c.id} event={c} onAck={() => handleAck(c.id)} />
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--linq-border)' }}
            >
              <h2 className="font-semibold text-slate-900">Compliance documents</h2>
              <button
                onClick={() => setShowAddDoc(true)}
                className="text-sm bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add document
              </button>
            </div>
            {docs.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--linq-muted)' }}>
                No documents yet. Add a COI, MCS-150, IFTA, etc.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--linq-surface-2)' }}>
                  <tr className="text-left" style={{ color: 'var(--linq-muted)' }}>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Kind</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Title</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Expiry</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                  {docs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <span className="chip chip-neu">{d.kind.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-900">{d.title}</td>
                      <td className="px-4 py-2">
                        <ExpiryBadge expiresOn={d.expiresOn || null} />
                      </td>
                      <td
                        className="px-4 py-2 text-xs max-w-[300px] truncate"
                        style={{ color: 'var(--linq-muted)' }}
                        title={d.notes || ''}
                      >
                        {d.notes || '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteDoc(d.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'drivers' && (
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--linq-border)' }}
            >
              <h2 className="font-semibold text-slate-900">Drivers</h2>
              <button
                onClick={() => setShowAddDriver(true)}
                className="text-sm bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add driver
              </button>
            </div>
            {drivers.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--linq-muted)' }}>
                No drivers tracked yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--linq-surface-2)' }}>
                  <tr className="text-left" style={{ color: 'var(--linq-muted)' }}>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">CDL</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">CDL expires</th>
                    <th className="px-4 py-2 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">
                        <Link
                          to={`/compliance/drivers/${d.id}`}
                          className="hover:text-cyan-700 hover:underline"
                        >
                          {d.fullName}
                        </Link>
                      </td>
                      <td
                        className="px-4 py-2 text-xs font-mono"
                        style={{ color: 'var(--linq-muted)' }}
                      >
                        {d.cdlState ? `${d.cdlState}-` : ''}
                        {d.cdlNumber || '—'}
                      </td>
                      <td className="px-4 py-2">
                        <ExpiryBadge expiresOn={d.cdlExpiresOn || null} />
                      </td>
                      <td className="px-4 py-2">
                        <DriverStatusChip status={d.status} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          to={`/compliance/drivers/${d.id}`}
                          className="text-xs text-cyan-700 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showAddDoc && (
          <AddDocumentModal
            scope="company"
            onCancel={() => setShowAddDoc(false)}
            onSubmit={handleAddDoc}
          />
        )}
        {showAddDriver && (
          <AddDriverModal
            onCancel={() => setShowAddDriver(false)}
            onSubmit={handleAddDriver}
          />
        )}
      </div>
    </div>
  )
}

function DriverStatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'chip-good',
    ONBOARDING: 'chip-accent',
    INACTIVE: 'chip-neu',
  }
  const tone = map[status] || 'chip-bad'
  return <span className={`chip ${tone}`}>{status}</span>
}

function ChangeRow({ event, onAck }: { event: any; onAck: () => void }) {
  const Icon =
    event.severity === 'CRITICAL'
      ? AlertOctagon
      : event.severity === 'WARN'
      ? AlertTriangle
      : Info
  const tone =
    event.severity === 'CRITICAL'
      ? 'text-red-700 bg-red-50'
      : event.severity === 'WARN'
      ? 'text-amber-700 bg-amber-50'
      : 'text-blue-700 bg-blue-50'
  return (
    <li
      className={`px-5 py-3 flex items-start gap-3 ${event.acknowledged ? 'opacity-60' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">
          {event.description || event.field}
        </div>
        <div
          className="text-xs mt-0.5 font-mono"
          style={{ color: 'var(--linq-muted)' }}
        >
          {event.field}: {fmt(event.oldValue)} → <strong>{fmt(event.newValue)}</strong>
        </div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--linq-muted)' }}>
          {new Date(event.detectedAt).toLocaleString()}
          {event.acknowledged ? ' · Acknowledged' : ''}
        </div>
      </div>
      {!event.acknowledged && (
        <button
          onClick={onAck}
          title="Mark as read"
          className="text-slate-400 hover:text-emerald-600 p-1"
        >
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
