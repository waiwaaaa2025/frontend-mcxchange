import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Bot, Sparkles, Shield, AlertCircle, ArrowRight } from 'lucide-react'
import agentsApi, { type CatalogAgent } from '../../services/agentsApi'

export default function TeamPage() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<CatalogAgent[]>([])
  const [activeSlugs, setActiveSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingResult, setPingResult] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try {
      const [cat, active] = await Promise.all([agentsApi.catalog(), agentsApi.active()])
      setAgents(cat.data)
      setActiveSlugs(new Set(active.data.map(r => r.agentSlug)))
    } catch (e: any) {
      setError(e.message || 'Failed to load agents')
    } finally { setLoading(false) }
  }

  async function toggleHire(slug: string) {
    try {
      if (activeSlugs.has(slug)) await agentsApi.cancel(slug)
      else await agentsApi.hire(slug)
      await load()
    } catch (e: any) { setError(e.message || 'Action failed') }
  }

  async function runPing() {
    setPinging(true); setPingResult(null)
    try {
      const { data } = await agentsApi.runScoutTask('ping')
      setPingResult(`Enqueued job ${data.jobId.slice(0, 8)}…`)
      setTimeout(async () => {
        const act = await agentsApi.activity('scout', 1)
        const latest = act.data[0]
        if (latest?.actionType === 'ping') {
          setPingResult(`✓ Scout completed at ${new Date(latest.createdAt).toLocaleTimeString()}`)
        }
      }, 3000)
    } catch (e: any) { setPingResult(`Failed: ${e.message}`) }
    finally { setPinging(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your AI Team</h1>
          <p className="text-sm text-gray-600 mt-1">Agents that work alongside you on Domilea. Each one specializes in something different.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded mb-6 flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Phase 1 — foundation only.</strong> Scout and Eva are wired up but only Scout's <code>ping</code> task runs today.
            Real behaviors (lead enrichment, weekly digest, chat) land in Phase 2.
            Use the "Test Scout" button below to verify the queue→worker→action loop is working.
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={runPing}
            disabled={pinging}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {pinging && <Loader2 className="w-4 h-4 animate-spin" />}
            Test Scout (ping)
          </button>
          {pingResult && <span className="text-sm text-gray-700">{pingResult}</span>}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />Loading agents…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(a => (
              <AgentCard
                key={a.slug}
                agent={a}
                isActive={activeSlugs.has(a.slug)}
                onToggle={() => toggleHire(a.slug)}
                onOpen={() => navigate(`/admin/team/${a.slug}`)}
              />
            ))}
            {agents.length === 0 && (
              <div className="col-span-2 text-center text-gray-400 py-8">No agents available yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AgentCard({ agent, isActive, onToggle, onOpen }: { agent: CatalogAgent; isActive: boolean; onToggle: () => void; onOpen: () => void }) {
  const Icon = agent.category === 'ORCHESTRATOR' ? Sparkles : Bot
  const categoryColor = agent.category === 'ORCHESTRATOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'

  return (
    <div className="bg-white rounded-lg border p-5 hover:shadow-sm transition-shadow group cursor-pointer" onClick={onOpen}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white shrink-0">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${categoryColor}`}>{agent.category}</span>
            {agent.isAdminOnly && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">Admin</span>}
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-700 ml-auto" />
          </div>
          <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                isActive
                  ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  : 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {isActive ? '✓ Active' : 'Hire'}
            </button>
            <span className="text-xs text-gray-400">{agent.monthlyPrice ? `$${agent.monthlyPrice}/mo` : 'Free'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
