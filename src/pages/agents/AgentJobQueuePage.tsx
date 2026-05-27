import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw, Filter, Play, X as Cancel } from 'lucide-react'
import agentsApi, { type AgentJobRow } from '../../services/agentsApi'

const STATUSES = ['', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const
const AGENTS = ['', 'scout', 'eva'] as const

export default function AgentJobQueuePage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AgentJobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentSlug, setAgentSlug] = useState('')
  const [status, setStatus] = useState('')
  const [limit, setLimit] = useState(100)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    void load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [agentSlug, status, limit])

  async function load() {
    try {
      const res = await agentsApi.jobs({ agentSlug: agentSlug || undefined, status: status || undefined, limit })
      setRows(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id)
    try {
      await agentsApi.cancelJob(id)
      await load()
    } catch (e: any) {
      setError(e.message || 'Cancel failed')
    } finally {
      setCancelling(null)
    }
  }

  const counts = rows.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/admin/team')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Team
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Queue</h1>
            <p className="text-sm text-gray-600 mt-1">Every job the agent worker has touched. Auto-refreshes every 5s.</p>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-700" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <StatusCard label="Pending" value={counts.PENDING || 0} icon={Clock} color="text-amber-600 bg-amber-50" />
          <StatusCard label="Running" value={counts.RUNNING || 0} icon={Play} color="text-blue-600 bg-blue-50" />
          <StatusCard label="Completed" value={counts.COMPLETED || 0} icon={CheckCircle2} color="text-green-600 bg-green-50" />
          <StatusCard label="Failed" value={counts.FAILED || 0} icon={XCircle} color="text-red-600 bg-red-50" />
          <StatusCard label="Cancelled" value={counts.CANCELLED || 0} icon={Cancel} color="text-gray-600 bg-gray-100" />
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Filter className="w-4 h-4 text-gray-400" />
          <label className="flex items-center gap-2">
            <span className="text-gray-600">Agent:</span>
            <select value={agentSlug} onChange={e => setAgentSlug(e.target.value)} className="border rounded px-2 py-1">
              {AGENTS.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-gray-600">Status:</span>
            <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1">
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 ml-auto">
            <span className="text-gray-600">Limit:</span>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border rounded px-2 py-1">
              {[50, 100, 250, 500].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="bg-white border rounded-lg overflow-hidden">
          {loading && rows.length === 0 ? (
            <div className="p-8 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No jobs match your filters yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-2">Agent</th>
                    <th className="px-4 py-2">Task</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Retries</th>
                    <th className="px-4 py-2">Error</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map(j => (
                    <JobRow key={j.id} job={j} cancelling={cancelling === j.id} onCancel={() => handleCancel(j.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RetryDots({ used, max }: { used: number; max: number }) {
  const safeMax = Math.max(1, max)
  const exhausted = used >= safeMax
  return (
    <div className="flex items-center gap-1.5" title={`${used} of ${safeMax} retries used`}>
      <div className="flex gap-0.5">
        {Array.from({ length: safeMax }).map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < used ? (exhausted ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] tabular-nums ${exhausted ? 'text-red-600' : 'text-gray-500'}`}>
        {used}/{safeMax}
      </span>
    </div>
  )
}

function StatusCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Clock; color: string }) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-75">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

function JobRow({ job, cancelling, onCancel }: { job: AgentJobRow; cancelling: boolean; onCancel: () => void }) {
  const isCancellable = job.status === 'PENDING'
  const statusColor: Record<string, string> = {
    PENDING: 'text-amber-700 bg-amber-50',
    RUNNING: 'text-blue-700 bg-blue-50',
    COMPLETED: 'text-green-700 bg-green-50',
    FAILED: 'text-red-700 bg-red-50',
    CANCELLED: 'text-gray-600 bg-gray-100',
  }
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-700">{job.agentSlug}</td>
      <td className="px-4 py-2 font-mono text-xs text-gray-900">{job.taskName}</td>
      <td className="px-4 py-2">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${statusColor[job.status] || ''}`}>{job.status}</span>
      </td>
      <td className="px-4 py-2">
        <RetryDots used={job.retryCount} max={job.maxRetries} />
      </td>
      <td className="px-4 py-2 text-xs text-red-600 max-w-[280px] truncate" title={job.errorMessage || ''}>
        {job.errorMessage || '—'}
      </td>
      <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
        {new Date(job.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-4 py-2">
        {isCancellable ? (
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cancel className="w-3 h-3" />}
            Cancel
          </button>
        ) : null}
      </td>
    </tr>
  )
}
