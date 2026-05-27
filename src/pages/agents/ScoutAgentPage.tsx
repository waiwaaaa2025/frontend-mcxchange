import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, ChevronLeft, Loader2, AlertCircle, CheckCircle2, XCircle, Play, RefreshCw, Clock } from 'lucide-react'
import agentsApi, { type AgentActionRow, type AgentJobRow } from '../../services/agentsApi'

export default function ScoutAgentPage() {
  const navigate = useNavigate()
  const [activity, setActivity] = useState<AgentActionRow[]>([])
  const [jobs, setJobs] = useState<AgentJobRow[]>([])
  const [tasks, setTasks] = useState<Array<{ name: string; summary: string; decisionAuthority: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => {
    void load()
    const t = setInterval(load, 5000) // light auto-refresh
    return () => clearInterval(t)
  }, [])

  async function load() {
    try {
      const [act, jb, tk] = await Promise.all([
        agentsApi.activity('scout', 50),
        agentsApi.jobs({ agentSlug: 'scout', limit: 20 }),
        agentsApi.tasks('scout'),
      ])
      setActivity(act.data)
      setJobs(jb.data)
      setTasks(tk.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function runTask(name: string) {
    setRunning(name)
    try {
      await agentsApi.runScoutTask(name)
      setTimeout(load, 1500)
    } catch (e: any) {
      setError(e.message || `Failed to run ${name}`)
    } finally {
      setRunning(null)
    }
  }

  const recent = activity.slice(0, 30)
  const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'RUNNING')
  const failedJobs = jobs.filter(j => j.status === 'FAILED')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/admin/team')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Team
        </button>

        {/* Identity header */}
        <div className="bg-white border rounded-lg p-6 mb-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">Scout</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">INSIGHTS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Admin</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Hunts and qualifies leads, enriches carrier data, and surfaces what to chase this week.</p>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-700" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity feed (main) */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg">
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent activity</h2>
                <span className="text-xs text-gray-500">{recent.length} of last {activity.length}</span>
              </div>
              {loading && activity.length === 0 ? (
                <div className="p-8 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />Loading…
                </div>
              ) : recent.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Scout hasn't done anything yet. Use the task panel on the right to run a test.
                </div>
              ) : (
                <ul className="divide-y">
                  {recent.map(a => <ActivityItem key={a.id} action={a} />)}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar: tasks + jobs */}
          <div className="space-y-4">
            <div className="bg-white border rounded-lg">
              <div className="border-b px-4 py-3"><h2 className="font-semibold text-gray-900">Tasks</h2></div>
              {tasks.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">No tasks registered.</div>
              ) : (
                <ul className="divide-y">
                  {tasks.map(t => (
                    <li key={t.name} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <code className="text-xs font-mono text-gray-900">{t.name}</code>
                        <button
                          onClick={() => runTask(t.name)}
                          disabled={running === t.name}
                          className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {running === t.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Run
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">{t.summary}</p>
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1 inline-block">
                        {t.decisionAuthority}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(pendingJobs.length > 0 || failedJobs.length > 0) && (
              <div className="bg-white border rounded-lg">
                <div className="border-b px-4 py-3"><h2 className="font-semibold text-gray-900">Jobs</h2></div>
                <ul className="divide-y">
                  {pendingJobs.map(j => (
                    <li key={j.id} className="px-4 py-2 text-xs flex items-center justify-between">
                      <span className="font-mono text-gray-700">{j.taskName}</span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <Clock className="w-3 h-3" />{j.status}
                      </span>
                    </li>
                  ))}
                  {failedJobs.slice(0, 5).map(j => (
                    <li key={j.id} className="px-4 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gray-700">{j.taskName}</span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-3 h-3" />FAILED
                        </span>
                      </div>
                      {j.errorMessage && <div className="text-red-500 mt-1 truncate" title={j.errorMessage}>{j.errorMessage}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ action }: { action: AgentActionRow }) {
  const StatusIcon = action.status === 'COMPLETED' ? CheckCircle2 : action.status === 'FAILED' ? XCircle : Clock
  const statusColor = action.status === 'COMPLETED' ? 'text-green-600' : action.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
  const ts = new Date(action.createdAt)

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusColor} shrink-0`} />
            <code className="text-sm font-mono text-gray-900">{action.actionType}</code>
            {action.targetType && (
              <span className="text-xs text-gray-500">on {action.targetType}{action.targetId ? ` ${String(action.targetId).slice(0, 8)}` : ''}</span>
            )}
          </div>
          {action.outputData && (
            <div className="text-xs text-gray-600 mt-1 ml-6 truncate">
              {summarizeOutput(action.outputData)}
            </div>
          )}
          {action.triggeredBy && (
            <div className="text-[10px] text-gray-400 ml-6 mt-0.5">via {action.triggeredBy}</div>
          )}
        </div>
        <time className="text-xs text-gray-400 shrink-0" title={ts.toISOString()}>
          {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </time>
      </div>
    </li>
  )
}

function summarizeOutput(data: Record<string, unknown>): string {
  if (typeof data.message === 'string') return data.message
  if (typeof data.summary === 'string') return data.summary
  const keys = Object.keys(data).slice(0, 3)
  return keys.map(k => `${k}: ${JSON.stringify((data as any)[k]).slice(0, 50)}`).join(' · ')
}
