import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Users } from 'lucide-react'
import complianceApi, { type DriverRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complianceApi.listAllDrivers().then(r => setDrivers(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-600 mt-1">Every driver across every company you manage.</p>
        </div>

        {loading ? (
          <div className="bg-white border rounded-xl p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : drivers.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-900">No drivers tracked yet</h2>
            <p className="text-sm text-gray-500 mt-1">Add drivers from inside any company workspace.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">CDL</th>
                  <th className="px-4 py-2">CDL expires</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <Link to={`/compliance/drivers/${d.id}`} className="hover:text-indigo-600 hover:underline">{d.fullName}</Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {d.company ? (
                        <Link to={`/compliance/companies/${d.company.id}`} className="hover:underline">{d.company.label || `DOT ${d.company.dotNumber}`}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 font-mono">{d.cdlState ? `${d.cdlState}-` : ''}{d.cdlNumber || '—'}</td>
                    <td className="px-4 py-2"><ExpiryBadge expiresOn={d.cdlExpiresOn || null} /></td>
                    <td className="px-4 py-2 text-xs">
                      <span className={`uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                        d.status === 'ACTIVE' ? 'bg-green-50 text-green-700'
                        : d.status === 'ONBOARDING' ? 'bg-blue-50 text-blue-700'
                        : d.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-50 text-red-700'
                      }`}>{d.status}</span>
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
