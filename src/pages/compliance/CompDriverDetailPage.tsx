import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import complianceApi, { type DriverRow, type DriverDocumentRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'
import AddDocumentModal from '../../components/compliance/AddDocumentModal'

export default function CompDriverDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [driver, setDriver] = useState<DriverRow | null>(null)
  const [docs, setDocs] = useState<DriverDocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDoc, setShowAddDoc] = useState(false)

  useEffect(() => { void load() }, [id])

  async function load() {
    setLoading(true)
    try {
      const [d, ds] = await Promise.all([
        complianceApi.getDriver(id),
        complianceApi.listDriverDocuments(id),
      ])
      setDriver(d.data)
      setDocs(ds.data)
    } finally { setLoading(false) }
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
    return <div className="min-h-screen flex items-center justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
  }
  if (!driver) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Driver not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white border rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{driver.fullName}</h1>
              <div className="text-sm text-gray-500 mt-1">
                {driver.cdlNumber ? <>CDL {driver.cdlState ? `${driver.cdlState}-` : ''}{driver.cdlNumber}</> : 'No CDL on file'}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className={`uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                  driver.status === 'ACTIVE' ? 'bg-green-50 text-green-700'
                  : driver.status === 'ONBOARDING' ? 'bg-blue-50 text-blue-700'
                  : driver.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600'
                  : 'bg-red-50 text-red-700'
                }`}>{driver.status}</span>
                <span className="text-xs text-gray-500">
                  CDL expires: <ExpiryBadge expiresOn={driver.cdlExpiresOn || null} />
                </span>
                {driver.hireDate && <span className="text-xs text-gray-500">Hired {new Date(driver.hireDate).toLocaleDateString()}</span>}
              </div>
              {driver.notes && <p className="text-sm text-gray-600 mt-3 italic">{driver.notes}</p>}
            </div>
            <button onClick={handleDeleteDriver} className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete driver
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-900">Documents</h2>
            <button onClick={() => setShowAddDoc(true)} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded inline-flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add document
            </button>
          </div>
          {docs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No documents tracked yet. Add a medical card, MVR, drug test, etc.</div>
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
                      <button onClick={() => handleDelete(d.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {driver.company && (
          <div className="mt-4 text-xs text-gray-500">
            Part of <Link to={`/compliance/companies/${driver.company.id}`} className="text-indigo-600 hover:underline">{driver.company.label || `DOT ${driver.company.dotNumber}`}</Link>
          </div>
        )}

        {showAddDoc && <AddDocumentModal scope="driver" onCancel={() => setShowAddDoc(false)} onSubmit={handleAdd} />}
      </div>
    </div>
  )
}
