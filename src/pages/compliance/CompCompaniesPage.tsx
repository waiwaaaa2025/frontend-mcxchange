import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Building2, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import complianceApi, { type ManagedCompany } from '../../services/complianceApi'

export default function CompCompaniesPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<ManagedCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const res = await complianceApi.listCompanies()
      setCompanies(res.data)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-sm text-gray-600 mt-1">Carriers you manage on Domilea.</p>
          </div>
          <button onClick={() => navigate('/compliance/companies/new')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add company
          </button>
        </div>

        {loading ? (
          <div className="bg-white border rounded-xl p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900 mb-1">No companies yet</h2>
            <p className="text-sm text-gray-500 mb-4">Add your first carrier by DOT number to get started.</p>
            <button onClick={() => navigate('/compliance/companies/new')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add company
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <Link key={c.id} to={`/compliance/companies/${c.id}`} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow group">
                <div className="w-11 h-11 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{c.label || `DOT ${c.dotNumber}`}</h3>
                <div className="text-xs text-gray-500 mt-1 font-mono">DOT {c.dotNumber}</div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-indigo-600 font-semibold flex items-center justify-end gap-1 group-hover:gap-2 transition-all">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
