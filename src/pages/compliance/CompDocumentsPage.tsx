import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileText } from 'lucide-react'
import complianceApi, { type ComplianceDocumentRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDocumentsPage() {
  const [docs, setDocs] = useState<ComplianceDocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complianceApi.listAllDocuments().then(r => setDocs(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-600 mt-1">All company-level compliance documents, sorted by earliest expiry.</p>
        </div>

        {loading ? (
          <div className="bg-white border rounded-xl p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900">No documents tracked yet</h2>
            <p className="text-sm text-gray-500 mt-1">Open a company and add COIs, MCS-150 filings, IFTA, etc.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Kind</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {docs.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{d.title}</td>
                    <td className="px-4 py-2 text-xs"><span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">{d.kind.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {d.company ? <Link to={`/compliance/companies/${d.company.id}`} className="hover:underline">{d.company.label || `DOT ${d.company.dotNumber}`}</Link> : '—'}
                    </td>
                    <td className="px-4 py-2"><ExpiryBadge expiresOn={d.expiresOn || null} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
