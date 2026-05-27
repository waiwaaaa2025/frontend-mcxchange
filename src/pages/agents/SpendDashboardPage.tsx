import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, Coins, RefreshCw, TrendingUp, Calendar } from 'lucide-react'
import agentsApi from '../../services/agentsApi'

interface SpendData {
  from: string
  to: string
  series: Array<{ day: string; agentSlug: string; inputTokens: number; outputTokens: number; totalTokens: number; calls: number }>
  byAgent: Record<string, { inputTokens: number; outputTokens: number; totalTokens: number; calls: number }>
  today: { used: number; platformCap: number; userCap: number }
}

const AGENT_COLOR: Record<string, string> = {
  scout: '#0EA5E9',
  eva: '#A855F7',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

export default function SpendDashboardPage() {
  const navigate = useNavigate()
  const today = new Date()
  const defaultFrom = new Date(today.getTime() - 13 * 86_400_000)
  const [from, setFrom] = useState(defaultFrom.toISOString().slice(0, 10))
  const [to, setTo] = useState(today.toISOString().slice(0, 10))
  const [data, setData] = useState<SpendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [from, to])

  async function load() {
    setLoading(true)
    try {
      const res = await agentsApi.spend({ from, to })
      setData(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  // Build day-by-day stacked bars
  const { days, dayTotals, maxDay } = useMemo(() => {
    if (!data) return { days: [], dayTotals: {} as Record<string, Record<string, number>>, maxDay: 1 }
    const days: string[] = []
    const dayTotals: Record<string, Record<string, number>> = {}
    for (const r of data.series) {
      if (!dayTotals[r.day]) {
        dayTotals[r.day] = {}
        days.push(r.day)
      }
      dayTotals[r.day][r.agentSlug] = (dayTotals[r.day][r.agentSlug] || 0) + r.totalTokens
    }
    // Make sure every day in the range is present (even with 0)
    const fromDate = new Date(data.from)
    const toDate = new Date(data.to)
    const allDays: string[] = []
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      allDays.push(d.toISOString().slice(0, 10))
    }
    for (const d of allDays) if (!dayTotals[d]) dayTotals[d] = {}
    allDays.sort()
    const maxDay = Math.max(1, ...allDays.map(d => Object.values(dayTotals[d]).reduce((a, b) => a + b, 0)))
    return { days: allDays, dayTotals, maxDay }
  }, [data])

  const todayPct = data ? Math.min(100, Math.round((data.today.used / Math.max(1, data.today.platformCap)) * 100)) : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/admin/team')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Team
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Spend</h1>
            <p className="text-sm text-gray-600 mt-1">Daily LLM token usage by agent. Auto-pulled from <code>agent_inferences</code>.</p>
          </div>
          <button onClick={load} className="text-gray-400 hover:text-gray-700" title="Refresh"><RefreshCw className="w-5 h-5" /></button>
        </div>

        {/* Today vs cap */}
        <div className="bg-white border rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Today vs platform cap</h2>
            </div>
            <div className="text-xs text-gray-500">{data ? `${fmt(data.today.used)} / ${fmt(data.today.platformCap)} tokens` : '—'}</div>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${todayPct > 80 ? 'bg-red-500' : todayPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${todayPct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500">Per-user cap</div>
              <div className="font-semibold text-gray-900 tabular-nums">{data ? fmt(data.today.userCap) : '—'} tokens/day</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-500">Platform cap</div>
              <div className="font-semibold text-gray-900 tabular-nums">{data ? fmt(data.today.platformCap) : '—'} tokens/day</div>
            </div>
          </div>
        </div>

        {/* Date range */}
        <div className="bg-white border rounded-lg p-4 mb-4 flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <label className="flex items-center gap-2">
            From <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border rounded px-2 py-1" />
          </label>
          <label className="flex items-center gap-2">
            To <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border rounded px-2 py-1" />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {loading && !data ? (
          <div className="bg-white border rounded-lg p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* Per-agent totals */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {data && Object.entries(data.byAgent).length === 0 ? (
                <div className="col-span-full bg-white border rounded-lg p-8 text-center text-sm text-gray-500">
                  No LLM activity in the selected range.
                </div>
              ) : data && Object.entries(data.byAgent).map(([slug, t]) => (
                <div key={slug} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: AGENT_COLOR[slug] || '#9CA3AF' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">{slug}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">{fmt(t.totalTokens)}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    <span className="tabular-nums">{fmt(t.inputTokens)}</span> in · <span className="tabular-nums">{fmt(t.outputTokens)}</span> out · <span className="tabular-nums">{t.calls}</span> calls
                  </div>
                </div>
              ))}
            </div>

            {/* Day-by-day stacked bar chart */}
            <div className="bg-white border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-gray-900">Daily usage</h2>
              </div>
              {days.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">No data.</div>
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {days.map(d => {
                    const dayBy = dayTotals[d] || {}
                    const total = Object.values(dayBy).reduce((a, b) => a + b, 0)
                    const heightPct = (total / maxDay) * 100
                    return (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1.5 group" title={`${d}: ${fmt(total)} tokens`}>
                        <div className="w-full flex-1 flex flex-col-reverse">
                          {Object.entries(dayBy).map(([slug, n]) => {
                            const segHeight = (n / Math.max(1, total)) * heightPct
                            return (
                              <div
                                key={slug}
                                style={{ height: `${segHeight}%`, background: AGENT_COLOR[slug] || '#9CA3AF' }}
                                className="w-full first:rounded-t-md"
                              />
                            )
                          })}
                        </div>
                        <div className="text-[9px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                          {d.slice(5)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs">
                {Object.keys(data?.byAgent || {}).map(slug => (
                  <div key={slug} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded" style={{ background: AGENT_COLOR[slug] || '#9CA3AF' }} />
                    <span className="text-gray-600">{slug}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
