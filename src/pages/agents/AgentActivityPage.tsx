import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw, Filter } from 'lucide-react'
import agentsApi, { type AgentActionRow } from '../../services/agentsApi'

const STATUSES = ['', 'COMPLETED', 'PENDING', 'FAILED'] as const
const AGENTS = ['', 'scout', 'eva'] as const

export default function AgentActivityPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AgentActionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agentSlug, setAgentSlug] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    void load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [agentSlug, status, limit])

  async function load() {
    try {
      const res = await agentsApi.activityGlobal({
        agentSlug: agentSlug || undefined,
        status: status || undefined,
        limit,
      })
      setRows(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/admin/team')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Team
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Activity</h1>
            <p className="text-sm text-gray-600 mt-1">Live feed of everything every agent has done. Auto-refreshes every 10s.</p>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-700" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
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

        <div className="bg-white border rounded-lg">
          <div className="border-b px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">{rows.length} actions</span>
            <span className="text-gray-400 text-xs">Newest first</span>
          </div>
          {loading && rows.length === 0 ? (
            <div className="p-8 flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No activity matches your filters yet.</div>
          ) : (
            <ul className="divide-y">
              {rows.map(a => <ActivityRow key={a.id} action={a} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ action }: { action: AgentActionRow }) {
  const StatusIcon = action.status === 'COMPLETED' ? CheckCircle2 : action.status === 'FAILED' ? XCircle : Clock
  const statusColor = action.status === 'COMPLETED' ? 'text-green-600' : action.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
  const ts = new Date(action.createdAt)

  return (
    <li className="px-4 py-3 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <StatusIcon className={`w-4 h-4 mt-0.5 ${statusColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{action.agentSlug}</span>
            <code className="text-sm font-mono text-gray-900">{action.actionType}</code>
            {action.targetType && (
              <span className="text-xs text-gray-500">on {action.targetType}{action.targetId ? ` ${String(action.targetId).slice(0, 8)}` : ''}</span>
            )}
          </div>
          {action.outputData && (
            <div className="text-xs text-gray-600 mt-1 ml-0 line-clamp-2">
              {summarizeOutput(action.outputData)}
            </div>
          )}
          {action.triggeredBy && (
            <div className="text-[10px] text-gray-400 mt-0.5">via {action.triggeredBy}</div>
          )}
        </div>
        <time className="text-xs text-gray-400 shrink-0" title={ts.toISOString()}>
          {ts.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </li>
  )
}

function summarizeOutput(data: Record<string, unknown>): string {
  if (typeof data.message === 'string') return data.message
  if (typeof data.summary === 'string') return data.summary
  if (typeof (data as any).next_action === 'string') return (data as any).next_action
  const keys = Object.keys(data).slice(0, 3)
  return keys.map(k => `${k}: ${JSON.stringify((data as any)[k]).slice(0, 60)}`).join(' · ')
}
