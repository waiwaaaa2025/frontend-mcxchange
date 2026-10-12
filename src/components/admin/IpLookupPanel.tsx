import { useState } from 'react'
import { Globe, Search, Loader2, MapPin, Users, AlertTriangle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import api from '../../services/api'

interface Geo {
  city?: string
  region?: string
  country?: string
  countryCode?: string
  isp?: string
  proxy?: boolean
  hosting?: boolean
}

interface SharedUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  hits: number
  lastSeen: string
}

interface IpEntry {
  ip: string
  events: string[]
  hits: number
  firstSeen: string
  lastSeen: string
  geo: Geo | null
  otherUsers: SharedUser[]
}

interface UserResult {
  user: { id: string; name: string; email: string; role: string; status: string; createdAt: string }
  ips: IpEntry[]
}

type LookupResult =
  | { mode: 'user'; users: UserResult[] }
  | { mode: 'ip'; ip: string; geo: Geo | null; users: SharedUser[] }

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatGeo = (geo: Geo | null) => {
  if (!geo) return 'Unknown location'
  return [geo.city, geo.region, geo.countryCode || geo.country].filter(Boolean).join(', ') || 'Unknown location'
}

const GeoLine = ({ geo }: { geo: Geo | null }) => (
  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
    <MapPin className="w-4 h-4 text-gray-400" />
    <span>{formatGeo(geo)}</span>
    {geo?.isp && <span className="text-gray-400">· {geo.isp}</span>}
    {(geo?.proxy || geo?.hosting) && (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        {geo.proxy ? 'VPN / Proxy' : 'Datacenter'}
      </span>
    )}
  </div>
)

const SharedUsersList = ({ users, onLookup }: { users: SharedUser[]; onLookup: (q: string) => void }) => (
  <ul className="divide-y divide-gray-100">
    {users.map((u) => (
      <li key={u.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <button className="text-left hover:underline" onClick={() => onLookup(u.email)}>
          <span className="font-medium text-gray-900">{u.name}</span>{' '}
          <span className="text-gray-500">{u.email}</span>
        </button>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-gray-100">{u.role}</span>
          {u.status !== 'ACTIVE' && <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{u.status}</span>}
          <span>{u.hits} hits · last {formatDate(u.lastSeen)}</span>
        </span>
      </li>
    ))}
  </ul>
)

const IpLookupPanel = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LookupResult | null>(null)

  const lookup = async (q = query) => {
    const value = q.trim()
    if (value.length < 2) return
    setQuery(value)
    setLoading(true)
    setError(null)
    try {
      const response = await api.getIpLookup(value)
      setResult(response.data)
    } catch (err: any) {
      setError(err.message || 'Lookup failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">IP Lookup</h2>
        </div>
        <p className="text-sm text-gray-500 -mt-2">
          Enter a name, email or IP address to see login IPs, their location, and other accounts on the same IP.
        </p>
        <form
          className="flex flex-col md:flex-row gap-3"
          onSubmit={(e) => { e.preventDefault(); lookup() }}
        >
          <div className="flex-1">
            <Input
              placeholder="john@example.com, John Smith, or 73.12.44.9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button type="submit" disabled={loading || query.trim().length < 2}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Look up
          </Button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result?.mode === 'ip' && (
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="font-mono font-semibold text-gray-900">{result.ip}</div>
            <GeoLine geo={result.geo} />
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" /> {result.users.length} account{result.users.length === 1 ? '' : 's'} seen on this IP
            </div>
            {result.users.length > 0 && <SharedUsersList users={result.users} onLookup={lookup} />}
          </div>
        )}

        {result?.mode === 'user' && result.users.length === 0 && (
          <p className="text-sm text-gray-500">No users match "{query}".</p>
        )}

        {result?.mode === 'user' && result.users.map(({ user, ips }) => {
          const sharedCount = new Set(ips.flatMap((ip) => ip.otherUsers.map((u) => u.id))).size
          return (
            <div key={user.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email} · {user.role} · joined {formatDate(user.createdAt)}</div>
                </div>
                {sharedCount > 0 ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> {sharedCount} other account{sharedCount === 1 ? '' : 's'} share an IP
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">No shared IPs</span>
                )}
              </div>

              {ips.length === 0 ? (
                <p className="text-sm text-gray-500">No IPs recorded for this user.</p>
              ) : (
                <div className="space-y-2">
                  {ips.map((ip) => (
                    <div
                      key={ip.ip}
                      className={`rounded-lg border-l-4 p-3 ${ip.otherUsers.length ? 'border-l-red-500 bg-red-50' : 'border-l-gray-300 bg-gray-50'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button className="font-mono text-sm font-semibold text-gray-900 hover:underline" onClick={() => lookup(ip.ip)}>
                          {ip.ip}
                        </button>
                        <span className="text-xs text-gray-500">
                          {ip.events.join(', ')} · {ip.hits}× · {formatDate(ip.firstSeen)} → {formatDate(ip.lastSeen)}
                        </span>
                      </div>
                      <GeoLine geo={ip.geo} />
                      {ip.otherUsers.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Also used by</div>
                          <SharedUsersList users={ip.otherUsers} onLookup={lookup} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default IpLookupPanel
