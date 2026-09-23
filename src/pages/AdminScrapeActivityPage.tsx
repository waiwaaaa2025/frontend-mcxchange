import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Radar,
  RefreshCw,
  Download,
  Loader2,
  Bot,
  Users,
  Eye,
  Search as SearchIcon,
  AlertTriangle,
  Globe,
  Clock,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import api, { type BlockedIpRow, type IpBlockState } from '../services/api'

interface ScrapeClient {
  ipAddress: string | null
  requests: number
  detailViews: number
  searches: number
  listingsTouched: number
  users: number
  anonymousRequests: number
  userAgents: string | null
  firstSeen: string
  lastSeen: string
  block: IpBlockState | null
}

const windowOptions = [
  { value: '1', label: 'Last hour' },
  { value: '24', label: 'Last 24 hours' },
  { value: '168', label: 'Last 7 days' },
  { value: '720', label: 'Last 30 days' },
]

// User agents that identify themselves as tooling rather than a browser. A
// scraper can of course forge a browser UA, which is why this is only one
// signal of several and never the sole basis for the verdict.
const TOOL_UA = /curl|wget|python|scrapy|requests|httpx|go-http|java|okhttp|headless|puppeteer|playwright|bot|spider|crawler/i

// Requests per minute allowed by listingBrowseLimiter. A client sitting near
// this ceiling is working much harder than a person reading listings.
const LIMITER_PER_MIN = 120

type Verdict = { label: string; tone: 'danger' | 'warn' | 'ok'; reasons: string[] }

/**
 * Heuristic, not proof. Weighs the things that separate a bot from a customer:
 * tooling user agent, never signing in, touching a large slice of the
 * catalogue, and sustained request rate.
 */
function assess(c: ScrapeClient): Verdict {
  const reasons: string[] = []

  const spanMinutes = Math.max(
    1,
    (new Date(c.lastSeen).getTime() - new Date(c.firstSeen).getTime()) / 60000
  )
  const perMinute = c.requests / spanMinutes

  if (!c.userAgents || TOOL_UA.test(c.userAgents)) reasons.push('Tooling user agent')
  if (c.users === 0 && c.requests >= 20) reasons.push('Never signed in')
  if (c.listingsTouched >= 10) reasons.push(`Opened ${c.listingsTouched} listings`)
  if (perMinute >= LIMITER_PER_MIN * 0.5) reasons.push(`~${Math.round(perMinute)} req/min`)
  if (c.searches >= 20) reasons.push(`${c.searches} searches`)

  if (reasons.length >= 3) return { label: 'Likely bot', tone: 'danger', reasons }
  if (reasons.length >= 1) return { label: 'Worth a look', tone: 'warn', reasons }
  return { label: 'Looks human', tone: 'ok', reasons }
}

const toneStyles: Record<Verdict['tone'], string> = {
  danger: 'bg-red-100 text-red-700 border-red-200',
  warn: 'bg-amber-100 text-amber-700 border-amber-200',
  ok: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function AdminScrapeActivityPage() {
  const [clients, setClients] = useState<ScrapeClient[]>([])
  const [hours, setHours] = useState('24')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedIps, setBlockedIps] = useState<BlockedIpRow[]>([])
  const [busyIp, setBusyIp] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, blocked] = await Promise.all([
        api.getScrapeActivity({ hours: parseInt(hours, 10), limit: 200 }),
        api.getBlockedIps().catch(() => null),
      ])
      if (blocked?.success) setBlockedIps(blocked.data || [])
      if (res.success && res.data) {
        setClients(res.data.clients || [])
      } else {
        setError('Could not load access activity')
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load access activity')
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const toggleBlock = async (ip: string, currentlyBlocked: boolean) => {
    const verb = currentlyBlocked ? 'Unblock' : 'Block'
    if (!window.confirm(`${verb} ${ip}? ${currentlyBlocked
      ? 'It will be able to read listings without signing in again, and auto-block will leave it alone for 30 days.'
      : 'It will not be able to read listings without signing in until you unblock it.'}`)) return
    setBusyIp(ip)
    try {
      if (currentlyBlocked) await api.unblockIp(ip)
      else await api.blockIp(ip, 'Blocked from Access Activity')
      await fetchActivity()
    } catch (err: any) {
      setError(err?.message || `Could not ${verb.toLowerCase()} ${ip}`)
    } finally {
      setBusyIp(null)
    }
  }

  const activeBlocks = useMemo(
    () => blockedIps.filter((b) => b.status === 'BLOCKED' && (!b.expiresAt || new Date(b.expiresAt) > new Date())),
    [blockedIps]
  )

  const assessed = useMemo(
    () => clients.map((c) => ({ client: c, verdict: assess(c) })),
    [clients]
  )

  const stats = useMemo(() => {
    const totalRequests = clients.reduce((sum, c) => sum + c.requests, 0)
    const anonymous = clients.reduce((sum, c) => sum + c.anonymousRequests, 0)
    return {
      totalRequests,
      clients: clients.length,
      anonymousShare: totalRequests ? Math.round((anonymous / totalRequests) * 100) : 0,
      suspected: assessed.filter((a) => a.verdict.tone === 'danger').length,
    }
  }, [clients, assessed])

  const exportToCSV = () => {
    const headers = [
      'IP', 'Verdict', 'Requests', 'Detail views', 'Searches',
      'Listings touched', 'Signed-in users', 'Anonymous requests',
      'User agents', 'First seen', 'Last seen', 'Blocked',
    ]
    const rows = assessed.map(({ client: c, verdict }) => [
      c.ipAddress ?? 'unknown', verdict.label, c.requests, c.detailViews, c.searches,
      c.listingsTouched, c.users, c.anonymousRequests,
      (c.userAgents ?? '').replace(/"/g, "'"), c.firstSeen, c.lastSeen,
      c.block?.active ? `${c.block.source.toLowerCase()} until ${c.block.expiresAt ?? 'unblocked'}` : '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n')
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `scrape-activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Activity</h1>
          <p className="text-gray-500 mt-1">
            Who is reading the marketplace catalogue, grouped by IP. MC numbers stay masked
            for everyone here — this shows who is trying to collect them. IPs scored as likely
            bots are blocked automatically for 7 days (checked every 10 minutes); a blocked IP
            can still be used by anyone who signs in.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              options={windowOptions}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchActivity} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={clients.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Catalogue reads</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Distinct clients</p>
              <p className="text-2xl font-bold text-purple-900">{stats.clients.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Anonymous</p>
              <p className="text-2xl font-bold text-gray-900">{stats.anonymousShare}%</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-600">Likely bots</p>
              <p className="text-2xl font-bold text-red-900">{stats.suspected}</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Active blocks — includes IPs outside the selected window */}
      {activeBlocks.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ShieldBan className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Blocked IPs ({activeBlocks.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">IP</th>
                  <th className="py-2 pr-4 font-medium">How</th>
                  <th className="py-2 pr-4 font-medium">Why</th>
                  <th className="py-2 pr-4 font-medium text-right">Refused since</th>
                  <th className="py-2 pr-4 font-medium">Until</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {activeBlocks.map((b) => (
                  <tr key={b.ipAddress} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="py-2 pr-4 font-mono text-gray-900">{b.ipAddress}</td>
                    <td className="py-2 pr-4 text-gray-600">{b.source === 'AUTO' ? 'Auto' : 'Manual'}</td>
                    <td className="py-2 pr-4 text-xs text-gray-500 max-w-xs">{b.reason}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">{b.hits.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                      {b.expiresAt ? formatWhen(b.expiresAt) : 'Until unblocked'}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyIp === b.ipAddress}
                        onClick={() => toggleBlock(b.ipAddress, true)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Unblock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Clients */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Loading access activity…
          </div>
        ) : assessed.length === 0 ? (
          <div className="text-center py-16">
            <Radar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">No catalogue reads in this window</p>
            <p className="text-gray-500 text-sm mt-1">
              Try a longer window. Logging began when access logging shipped, so earlier
              traffic was never recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-3 pr-4 font-medium">Client</th>
                  <th className="py-3 pr-4 font-medium">Assessment</th>
                  <th className="py-3 pr-4 font-medium text-right">Reads</th>
                  <th className="py-3 pr-4 font-medium text-right">Listings</th>
                  <th className="py-3 pr-4 font-medium text-right">Searches</th>
                  <th className="py-3 pr-4 font-medium text-right">Accounts</th>
                  <th className="py-3 pr-4 font-medium">Seen</th>
                  <th className="py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {assessed.map(({ client: c, verdict }) => (
                  <tr key={c.ipAddress ?? 'unknown'} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900 font-mono">{c.ipAddress ?? 'unknown'}</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={c.userAgents ?? ''}>
                        {c.userAgents || 'no user agent'}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg border text-xs font-medium ${toneStyles[verdict.tone]}`}
                      >
                        {verdict.label}
                      </span>
                      {c.block?.active && (
                        <span className="ml-1 inline-flex items-center px-2 py-1 rounded-lg border text-xs font-medium bg-red-600 text-white border-red-700">
                          <ShieldBan className="w-3 h-3 mr-1" />
                          Blocked{c.block.source === 'AUTO' ? ' (auto)' : ''}
                        </span>
                      )}
                      {verdict.reasons.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {verdict.reasons.map((r) => (
                            <li key={r} className="text-xs text-gray-500">• {r}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-900">
                      {c.requests.toLocaleString()}
                      <span className="block text-xs text-gray-400 font-normal">
                        <Eye className="w-3 h-3 inline mr-0.5" />
                        {c.detailViews} detail
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-700">{c.listingsTouched}</td>
                    <td className="py-3 pr-4 text-right text-gray-700">
                      <SearchIcon className="w-3 h-3 inline mr-1 text-gray-400" />
                      {c.searches}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-700">
                      {c.users === 0 ? <span className="text-gray-400">none</span> : c.users}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatWhen(c.firstSeen)}
                      <span className="block ml-4">→ {formatWhen(c.lastSeen)}</span>
                    </td>
                    <td className="py-3 text-right">
                      {c.ipAddress && (
                        <Button
                          size="sm"
                          variant={c.block?.active ? 'outline' : 'ghost'}
                          disabled={busyIp === c.ipAddress}
                          onClick={() => toggleBlock(c.ipAddress as string, !!c.block?.active)}
                        >
                          {c.block?.active ? (
                            <><ShieldCheck className="w-4 h-4 mr-1" />Unblock</>
                          ) : (
                            <><ShieldBan className="w-4 h-4 mr-1" />Block</>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-gray-400">
        Assessments are heuristics, not proof — a scraper can forge a browser user agent, and a
        shared office connection can look busy. Treat them as somewhere to start looking.
      </p>
    </div>
  )
}
