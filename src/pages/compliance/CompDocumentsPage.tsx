import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileText } from 'lucide-react'
import complianceApi, { type ComplianceDocumentRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDocumentsPage() {
  const [docs, setDocs] = useState<ComplianceDocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complianceApi
      .listAllDocuments()
      .then((r) => setDocs(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto fadein">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--linq-muted)' }}>
            Filings &amp; expirations
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Documents</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--linq-muted)' }}>
            All company-level compliance documents, sorted by earliest expiry.
          </p>
        </div>

        {loading ? (
          <div className="card p-8 flex items-center justify-center gap-2" style={{ color: 'var(--linq-muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="font-semibold text-slate-900">No documents tracked yet</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--linq-muted)' }}>
              Open a company and add COIs, MCS-150 filings, IFTA, etc.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--linq-surface-2)' }}>
                <tr className="text-left" style={{ color: 'var(--linq-muted)' }}>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Kind</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                {docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.title}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="chip chip-neu">{d.kind.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--linq-muted)' }}>
                      {d.company ? (
                        <Link
                          to={`/compliance/companies/${d.company.id}`}
                          className="hover:underline"
                        >
                          {d.company.label || `DOT ${d.company.dotNumber}`}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge expiresOn={d.expiresOn || null} />
                    </td>
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
