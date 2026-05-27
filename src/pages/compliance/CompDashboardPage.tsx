import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, FileWarning, Calendar, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import complianceApi, { type DashboardSummary, type ComplianceDocumentRow } from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDashboardPage() {
  const [stats, setStats] = useState<DashboardSummary | null>(null)
  const [expiringDocs, setExpiringDocs] = useState<ComplianceDocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const [s, docs] = await Promise.all([
        complianceApi.dashboardSummary(),
        complianceApi.listAllDocuments(),
      ])
      setStats(s.data)
      setExpiringDocs(docs.data.slice(0, 8))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Health snapshot across every carrier you manage.</p>
        </div>

        {loading ? (
          <div className="bg-white border rounded-xl p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Building2} color="indigo" label="Companies managed" value={stats?.totalCompanies ?? 0} link="/compliance/companies" />
              <StatCard icon={Users} color="blue" label="Active drivers" value={stats?.totalDrivers ?? 0} link="/compliance/drivers" />
              <StatCard icon={FileWarning} color="amber" label="Docs expiring in 30d"
                value={(stats?.docsExpiring.in7 ?? 0) + (stats?.docsExpiring.in30 ?? 0)} link="/compliance/documents" />
              <StatCard icon={Calendar} color="red" label="Docs expired" value={stats?.docsExpiring.expired ?? 0} link="/compliance/documents" />
            </div>

            {/* Expiry buckets breakdown */}
            <div className="grid md:grid-cols-2 gap-4">
              <BreakdownCard title="Compliance documents" buckets={stats?.docsExpiring} />
              <BreakdownCard title="Driver CDLs" buckets={stats?.cdlExpiring} />
            </div>

            {/* Top expiring documents */}
            <div className="bg-white border rounded-xl">
              <div className="px-5 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Top documents expiring soonest</h2>
                <Link to="/compliance/documents" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5"/></Link>
              </div>
              {expiringDocs.length === 0 ? (
                <div className="p-8 text-sm text-gray-400 text-center flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                  All clear. No documents tracked yet — add a company to get started.
                </div>
              ) : (
                <ul className="divide-y">
                  {expiringDocs.map(d => (
                    <li key={d.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{d.title}</div>
                        <div className="text-xs text-gray-500">
                          {d.kind.replace(/_/g, ' ')}{d.company ? ` · ${d.company.label || `DOT ${d.company.dotNumber}`}` : ''}
                        </div>
                      </div>
                      <ExpiryBadge expiresOn={d.expiresOn || null} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value, link }: { icon: any; color: string; label: string; value: number; link?: string }) {
  const palette: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
    red: { bg: 'bg-red-50', text: 'text-red-700' },
  }
  const c = palette[color] || palette.indigo
  const inner = (
    <div className="bg-white border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      </div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : inner
}

function BreakdownCard({ title, buckets }: { title: string; buckets?: { in7: number; in30: number; in60: number; in90: number; expired: number } }) {
  const b = buckets || { in7: 0, in30: 0, in60: 0, in90: 0, expired: 0 }
  const total = b.in7 + b.in30 + b.in60 + b.in90 + b.expired
  return (
    <div className="bg-white border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2 text-xs">
        <Row label="Expired" value={b.expired} color="bg-red-500" total={total} />
        <Row label="≤ 7 days" value={b.in7} color="bg-red-400" total={total} />
        <Row label="≤ 30 days" value={b.in30} color="bg-amber-400" total={total} />
        <Row label="≤ 60 days" value={b.in60} color="bg-yellow-400" total={total} />
        <Row label="≤ 90 days" value={b.in90} color="bg-green-400" total={total} />
      </div>
    </div>
  )
}

function Row({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-gray-600">{label}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right tabular-nums font-semibold text-gray-700">{value}</div>
    </div>
  )
}
