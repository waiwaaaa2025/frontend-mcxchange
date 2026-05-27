import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import complianceApi, {
  type DriverRow,
  type DriverDocumentRow,
} from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'
import AddDocumentModal from '../../components/compliance/AddDocumentModal'

export default function CompDriverDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [driver, setDriver] = useState<DriverRow | null>(null)
  const [docs, setDocs] = useState<DriverDocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDoc, setShowAddDoc] = useState(false)

  useEffect(() => {
    void load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const [d, ds] = await Promise.all([
        complianceApi.getDriver(id),
        complianceApi.listDriverDocuments(id),
      ])
      setDriver(d.data)
      setDocs(ds.data)
    } finally {
      setLoading(false)
    }
  }
  async function handleAdd(body: any) {
    await complianceApi.createDriverDocument(id, body)
    await load()
  }
  async function handleDelete(docId: string) {
    if (!confirm('Delete this document?')) return
    await complianceApi.deleteDriverDocument(docId)
    await load()
  }
  async function handleDeleteDriver() {
    if (!confirm('Delete this driver and all their documents?')) return
    await complianceApi.deleteDriver(id)
    navigate('/compliance/drivers')
  }

  if (loading && !driver) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ color: 'var(--linq-muted)' }}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }
  if (!driver) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ color: 'var(--linq-muted)' }}>
        Driver not found.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto fadein">
        <button
          onClick={() => navigate(-1)}
          className="text-sm mb-4 inline-flex items-center gap-1 hover:text-slate-900"
          style={{ color: 'var(--linq-muted)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--linq-muted)' }}>
                Driver profile
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 mt-1">{driver.fullName}</h1>
              <div className="text-sm mt-1" style={{ color: 'var(--linq-muted)' }}>
                {driver.cdlNumber ? (
                  <>
                    CDL {driver.cdlState ? `${driver.cdlState}-` : ''}
                    {driver.cdlNumber}
                  </>
                ) : (
                  'No CDL on file'
                )}
              </div>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <DriverStatusChip status={driver.status} />
                <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--linq-muted)' }}>
                  CDL expires: <ExpiryBadge expiresOn={driver.cdlExpiresOn || null} />
                </span>
                {driver.hireDate && (
                  <span className="text-xs" style={{ color: 'var(--linq-muted)' }}>
                    Hired {new Date(driver.hireDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {driver.notes && (
                <p className="text-sm text-slate-600 mt-3 italic">{driver.notes}</p>
              )}
            </div>
            <button
              onClick={handleDeleteDriver}
              className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete driver
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--linq-border)' }}
          >
            <h2 className="font-semibold text-slate-900">Documents</h2>
            <button
              onClick={() => setShowAddDoc(true)}
              className="text-sm bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add document
            </button>
          </div>
          {docs.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--linq-muted)' }}>
              No documents tracked yet. Add a medical card, MVR, drug test, etc.
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
                        onClick={() => handleDelete(d.id)}
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

        {driver.company && (
          <div className="mt-4 text-xs" style={{ color: 'var(--linq-muted)' }}>
            Part of{' '}
            <Link
              to={`/compliance/companies/${driver.company.id}`}
              className="text-cyan-700 hover:underline font-medium"
            >
              {driver.company.label || `DOT ${driver.company.dotNumber}`}
            </Link>
          </div>
        )}

        {showAddDoc && (
          <AddDocumentModal
            scope="driver"
            onCancel={() => setShowAddDoc(false)}
            onSubmit={handleAdd}
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
