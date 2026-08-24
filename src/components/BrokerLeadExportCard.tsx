import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, Loader2, Search, Filter, Crown, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Card from './ui/Card'
import Button from './ui/Button'
import api from '../services/api'

// ============================================================
// BROKER LEAD GENERATOR — search + bulk CSV export
// Only rendered for users whose Lead Generator entitlement is the Broker tier
// (admins included). Carries the same filter set as the Lead Generator tool —
// state, insurance expiry window, authority, safety rating, plus the broker-only
// advanced filters — so what you filter is exactly what the CSV contains. The
// server-side export enriches every row with phone + email for these tiers.
//
// Download stays disabled until a search returns rows: exporting an unfiltered
// or zero-match query is what produced header-only "empty" CSVs before.
//
// Shown on both the buyer and seller dashboards — the Lead Generator is a
// cross-role product, so sellers can hold a Broker subscription too.
// ============================================================

interface Filters {
  state: string
  authorityStatus: string
  safetyRating: string
  name: string
  insuranceExpiresWithinDays: string
  minFleet: string
  maxFleet: string
  cargoType: string
  addedAfter: string
  addedBefore: string
}

const EMPTY_FILTERS: Filters = {
  state: '',
  authorityStatus: '',
  safetyRating: '',
  name: '',
  insuranceExpiresWithinDays: '',
  minFleet: '',
  maxFleet: '',
  cargoType: '',
  addedAfter: '',
  addedBefore: '',
}

interface CarrierRow {
  dotNumber: string
  legalName: string | null
  dba: string | null
  state: string | null
  totalPowerUnits: number | null
  totalDrivers: number | null
  authorityStatus: string | null
  safetyRating: string | null
}

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm w-full'

export default function BrokerLeadExportCard() {
  const { user } = useAuth()
  const [tier, setTier] = useState<'BUYER' | 'BROKER' | 'ADMIN' | null>(null)
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [rows, setRows] = useState<CarrierRow[]>([])
  const [contacts, setContacts] = useState<
    Record<string, { phone: string | null; email: string | null }>
  >({})
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [limit, setLimit] = useState('1000')
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.leadGeneratorAccess()
        if (alive) setTier(res.data.hasAccess ? res.data.tier : null)
      } catch {
        if (alive) setTier(null)
      }
    })()
    return () => { alive = false }
  }, [])

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const runSearch = async (nextPage = 1) => {
    setSearching(true)
    setMessage(null)
    try {
      const res = await api.leadGeneratorSearch({ ...filters, page: nextPage, limit: 25 })
      setRows(res.data.carriers)
      setHasMore(res.data.hasMore)
      setPage(res.data.page)
      setSearched(true)
      if (res.data.carriers.length === 0) {
        setMessage('No carriers matched those filters. Try widening them.')
      }
      // Phone/email aren't in the search response — pull them for the page shown
      // so you can eyeball the contact data before downloading the full set.
      const dots = res.data.carriers.map((c) => c.dotNumber)
      if (dots.length > 0) {
        api
          .leadGeneratorGetContactsBatch(dots)
          .then((c) => setContacts((prev) => ({ ...prev, ...c.data.contacts })))
          .catch(() => {})
      }
    } catch (err) {
      console.error('Lead search failed', err)
      setMessage((err as Error)?.message || 'Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    setMessage(null)
    try {
      // Same filters as the search above — the CSV is the full result set for the
      // query on screen, not just the page being previewed.
      await api.leadGeneratorExportCsv({ ...filters, limit })
    } catch (err) {
      console.error('Lead export failed', err)
      setMessage((err as Error)?.message || 'CSV export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  // Only buyers have the tool mounted inside their dashboard shell; every other
  // role opens the standalone route.
  const toolPath = user?.role === 'buyer' ? '/buyer/lead-generator' : '/lead-generator/app'

  // Buyer tier exports only the page they're viewing inside the tool, so this
  // bulk card stays hidden for them.
  if (tier !== 'BROKER' && tier !== 'ADMIN') return null

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 -m-6 p-5">
        {/* Header — click to expand the filter panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-gray-900">Lead Search &amp; Export</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
                  Broker
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Filter carriers by state, insurance expiration and more, then download the
                results as a CSV with phone numbers and emails.
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Link
              to={toolPath}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-medium whitespace-nowrap"
            >
              Open full tool
            </Link>
            <Button variant="outline" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="ml-1.5">{open ? 'Hide' : 'Search leads'}</span>
            </Button>
          </div>
        </div>

        {open && (
          <div className="mt-5 rounded-xl bg-white border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4" /> Filters
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                value={filters.state}
                onChange={(e) => setFilter('state', e.target.value)}
                placeholder="State (e.g. TX)"
                className={inputClass}
              />
              <select
                value={filters.insuranceExpiresWithinDays}
                onChange={(e) => setFilter('insuranceExpiresWithinDays', e.target.value)}
                className={inputClass}
              >
                <option value="">Insurance expiry: Any</option>
                <option value="7">Expires in 7 days</option>
                <option value="14">Expires in 14 days</option>
                <option value="30">Expires in 30 days</option>
                <option value="60">Expires in 60 days</option>
                <option value="90">Expires in 90 days</option>
              </select>
              <select
                value={filters.authorityStatus}
                onChange={(e) => setFilter('authorityStatus', e.target.value)}
                className={inputClass}
              >
                <option value="">Authority: Any</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="REVOKED">Revoked</option>
              </select>
              <select
                value={filters.safetyRating}
                onChange={(e) => setFilter('safetyRating', e.target.value)}
                className={inputClass}
              >
                <option value="">Safety rating: Any</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Conditional">Conditional</option>
                <option value="Unsatisfactory">Unsatisfactory</option>
              </select>
              <input
                value={filters.name}
                onChange={(e) => setFilter('name', e.target.value)}
                placeholder="Name contains…"
                className={inputClass}
              />
            </div>

            {/* Broker-only advanced filters — same set as the full tool. */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Crown className="h-4 w-4 text-amber-500" /> Advanced filters
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <input
                  value={filters.minFleet}
                  onChange={(e) => setFilter('minFleet', e.target.value)}
                  placeholder="Min power units"
                  className={inputClass}
                />
                <input
                  value={filters.maxFleet}
                  onChange={(e) => setFilter('maxFleet', e.target.value)}
                  placeholder="Max power units"
                  className={inputClass}
                />
                <input
                  value={filters.cargoType}
                  onChange={(e) => setFilter('cargoType', e.target.value)}
                  placeholder="Cargo type"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={filters.addedAfter}
                  onChange={(e) => setFilter('addedAfter', e.target.value)}
                  className={inputClass}
                  title="Authority added after"
                />
                <input
                  type="date"
                  value={filters.addedBefore}
                  onChange={(e) => setFilter('addedBefore', e.target.value)}
                  className={inputClass}
                  title="Authority added before"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {searched && rows.length > 0 && `${rows.length} carriers shown · page ${page}`}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters(EMPTY_FILTERS)
                    setRows([])
                    setSearched(false)
                    setMessage(null)
                  }}
                >
                  Clear
                </Button>
                <Button onClick={() => runSearch(1)} disabled={searching}>
                  {searching ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {searching ? 'Searching…' : 'Search'}
                </Button>
                <select
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className={inputClass + ' sm:w-auto'}
                  title="Maximum rows in the CSV"
                >
                  <option value="500">500 rows</option>
                  <option value="1000">1,000 rows</option>
                  <option value="2500">2,500 rows</option>
                  <option value="5000">5,000 rows</option>
                </select>
                <Button
                  onClick={handleExport}
                  disabled={exporting || !searched || rows.length === 0}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  title={
                    searched && rows.length > 0
                      ? 'Download every match for these filters'
                      : 'Run a search first'
                  }
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Building CSV…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </>
                  )}
                </Button>
              </div>
            </div>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}

            {exporting && (
              <p className="mt-3 text-xs text-slate-500">
                Large exports pull phone and email for every carrier, so this can take a
                couple of minutes. Keep this tab open.
              </p>
            )}

            {/* Result preview — what the CSV will contain, one page at a time. */}
            {searched && rows.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-2 py-2">DOT</th>
                      <th className="px-2 py-2">Carrier</th>
                      <th className="px-2 py-2">State</th>
                      <th className="px-2 py-2">Units</th>
                      <th className="px-2 py-2">Phone</th>
                      <th className="px-2 py-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.dotNumber} className="border-t border-slate-100">
                        <td className="px-2 py-2 font-medium text-slate-900">{r.dotNumber}</td>
                        <td className="px-2 py-2 text-slate-700">{r.legalName || '—'}</td>
                        <td className="px-2 py-2 text-slate-700">{r.state || '—'}</td>
                        <td className="px-2 py-2 text-slate-700">{r.totalPowerUnits ?? '—'}</td>
                        <td className="px-2 py-2 text-slate-700">
                          {contacts[r.dotNumber]?.phone || '—'}
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {contacts[r.dotNumber]?.email || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || searching}
                    onClick={() => runSearch(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!hasMore || searching}
                    onClick={() => runSearch(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
