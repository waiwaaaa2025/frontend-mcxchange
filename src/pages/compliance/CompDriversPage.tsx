import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Users } from 'lucide-react'
import complianceApi, { type DriverRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complianceApi
      .listAllDrivers()
      .then((r) => setDrivers(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto fadein">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--linq-muted)' }}>
            Workforce
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Drivers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--linq-muted)' }}>
            Every driver across every company you manage.
          </p>
        </div>

        {loading ? (
          <div className="card p-8 flex items-center justify-center gap-2" style={{ color: 'var(--linq-muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : drivers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="font-semibold text-slate-900">No drivers tracked yet</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--linq-muted)' }}>
              Add drivers from inside any company workspace.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--linq-surface-2)' }}>
                <tr className="text-left" style={{ color: 'var(--linq-muted)' }}>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">CDL</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">CDL expires</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link
                        to={`/compliance/drivers/${d.id}`}
                        className="hover:text-cyan-700 hover:underline"
                      >
                        {d.fullName}
                      </Link>
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
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--linq-muted)' }}>
                      {d.cdlState ? `${d.cdlState}-` : ''}
                      {d.cdlNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge expiresOn={d.cdlExpiresOn || null} />
                    </td>
                    <td className="px-4 py-3">
                      <DriverStatusChip status={d.status} />
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

function DriverStatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'chip-good',
    ONBOARDING: 'chip-accent',
    INACTIVE: 'chip-neu',
  }
  const tone = map[status] || 'chip-bad'
  return <span className={`chip ${tone}`}>{status}</span>
}
