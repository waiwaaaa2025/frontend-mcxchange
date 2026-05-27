import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  FileWarning,
  Calendar,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import complianceApi, {
  type DashboardSummary,
  type ComplianceDocumentRow,
} from '../../services/complianceApi'
import ExpiryBadge from '../../components/compliance/ExpiryBadge'

export default function CompDashboardPage() {
  const [stats, setStats] = useState<DashboardSummary | null>(null)
  const [expiringDocs, setExpiringDocs] = useState<ComplianceDocumentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      const [s, docs] = await Promise.all([
        complianceApi.dashboardSummary(),
        complianceApi.listAllDocuments(),
      ])
      setStats(s.data)
      setExpiringDocs(docs.data.slice(0, 8))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const expiring30 = (stats?.docsExpiring.in7 ?? 0) + (stats?.docsExpiring.in30 ?? 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 fadein">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--linq-muted)' }}
            >
              Compliance control center
            </div>
            <h1 className="text-2xl font-semibold mt-1 text-slate-900">
              Health snapshot across every carrier you manage
            </h1>
          </div>
          <Link
            to="/compliance/dia"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white shadow-md bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition"
          >
            <Sparkles className="w-4 h-4" /> Ask Dia
          </Link>
        </div>

        {loading ? (
          <div className="card p-8 flex items-center justify-center gap-2" style={{ color: 'var(--linq-muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Building2}
                tone="accent"
                label="Companies managed"
                value={stats?.totalCompanies ?? 0}
                link="/compliance/companies"
              />
              <StatCard
                icon={Users}
                tone="info"
                label="Active drivers"
                value={stats?.totalDrivers ?? 0}
                link="/compliance/drivers"
              />
              <StatCard
                icon={FileWarning}
                tone="warn"
                label="Docs expiring in 30d"
                value={expiring30}
                link="/compliance/documents"
              />
              <StatCard
                icon={Calendar}
                tone="bad"
                label="Docs expired"
                value={stats?.docsExpiring.expired ?? 0}
                link="/compliance/documents"
              />
            </div>

            {/* Expiry buckets */}
            <div className="grid md:grid-cols-2 gap-4">
              <BreakdownCard title="Compliance documents" buckets={stats?.docsExpiring} />
              <BreakdownCard title="Driver CDLs" buckets={stats?.cdlExpiring} />
            </div>

            {/* Top expiring documents */}
            <div className="card overflow-hidden">
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--linq-border)' }}
              >
                <h2 className="font-semibold text-slate-900">Top documents expiring soonest</h2>
                <Link
                  to="/compliance/documents"
                  className="text-sm font-medium text-cyan-700 hover:text-cyan-800 inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {expiringDocs.length === 0 ? (
                <div
                  className="p-10 text-sm text-center flex flex-col items-center gap-2"
                  style={{ color: 'var(--linq-muted)' }}
                >
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  All clear. No documents tracked yet — add a company to get started.
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: 'var(--linq-border)' }}>
                  {expiringDocs.map((d) => (
                    <li key={d.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {d.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--linq-muted)' }}>
                          {d.kind.replace(/_/g, ' ')}
                          {d.company
                            ? ` · ${d.company.label || `DOT ${d.company.dotNumber}`}`
                            : ''}
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

type StatTone = 'accent' | 'info' | 'warn' | 'bad'

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  link,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: StatTone
  label: string
  value: number
  link?: string
}) {
  const palette: Record<StatTone, { bg: string; text: string; ring: string }> = {
    accent: { bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
    warn: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    bad: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  }
  const c = palette[tone]
  const inner = (
    <div className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div
        className={`w-12 h-12 rounded-lg ${c.bg} ${c.text} ring-1 ring-inset ${c.ring} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-xs" style={{ color: 'var(--linq-muted)' }}>
          {label}
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{value}</div>
      </div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : inner
}

function BreakdownCard({
  title,
  buckets,
}: {
  title: string
  buckets?: { in7: number; in30: number; in60: number; in90: number; expired: number }
}) {
  const b = buckets || { in7: 0, in30: 0, in60: 0, in90: 0, expired: 0 }
  const total = b.in7 + b.in30 + b.in60 + b.in90 + b.expired
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="space-y-2 text-xs">
        <Row label="Expired" value={b.expired} color="bg-red-500" total={total} />
        <Row label="≤ 7 days" value={b.in7} color="bg-red-400" total={total} />
        <Row label="≤ 30 days" value={b.in30} color="bg-amber-400" total={total} />
        <Row label="≤ 60 days" value={b.in60} color="bg-yellow-400" total={total} />
        <Row label="≤ 90 days" value={b.in90} color="bg-emerald-400" total={total} />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  color,
  total,
}: {
  label: string
  value: number
  color: string
  total: number
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-slate-600">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right tabular-nums font-semibold text-slate-700">{value}</div>
    </div>
  )
}
