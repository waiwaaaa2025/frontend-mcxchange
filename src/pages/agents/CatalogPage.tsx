import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ChevronLeft, ArrowRight, Loader2, AlertCircle, Lock } from 'lucide-react'
import agentsApi, { type CatalogAgent } from '../../services/agentsApi'

const CATEGORY_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  OPERATIONS: { label: 'Operations', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  INSIGHTS: { label: 'Insights', bg: 'bg-blue-100', text: 'text-blue-700' },
  COMMS: { label: 'Comms', bg: 'bg-amber-100', text: 'text-amber-700' },
  ORCHESTRATOR: { label: 'Orchestrator', bg: 'bg-purple-100', text: 'text-purple-700' },
}

export default function CatalogPage() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<CatalogAgent[]>([])
  const [activeSlugs, setActiveSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const [cat, active] = await Promise.all([agentsApi.catalog(), agentsApi.active()])
      setAgents(cat.data)
      setActiveSlugs(new Set(active.data.map(r => r.agentSlug)))
    } catch (e: any) {
      setError(e.message || 'Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/admin/team')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Team
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Agent Catalog</h1>
          <p className="text-sm text-gray-600 mt-1">
            Every agent available on the Domilea platform. Read-only — pricing and hiring will come once each agent goes GA.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white border rounded-lg p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-sm text-gray-500">No agents in the catalog yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(a => {
              const cat = CATEGORY_STYLE[a.category] || { label: a.category, bg: 'bg-gray-100', text: 'text-gray-700' }
              const isActive = activeSlugs.has(a.slug)
              const Icon = a.category === 'ORCHESTRATOR' ? Sparkles : Bot
              return (
                <Link
                  key={a.slug}
                  to={`/admin/team/${a.slug}`}
                  className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {a.isAdminOnly && (
                        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{a.name}</h3>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cat.bg} ${cat.text}`}>{cat.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{a.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">{a.monthlyPrice ? `$${a.monthlyPrice}/mo` : 'Free'}</span>
                    <span className="text-indigo-600 font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
