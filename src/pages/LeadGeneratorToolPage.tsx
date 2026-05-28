import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  BookmarkPlus,
  Bookmark,
  Trash2,
  Sparkles,
  Lock,
  Loader2,
  Crown,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

type Tier = 'BUYER' | 'BROKER' | 'ADMIN'

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

interface SavedRow {
  id: string
  dotNumber: string
  carrierName: string | null
  carrierStateCode: string | null
  notes: string | null
  createdAt: string
}

interface Filters {
  // Buyer-tier (always available)
  state: string
  authorityStatus: string
  safetyRating: string
  name: string
  insuranceExpiresWithinDays: string
  // Broker-tier (gated)
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

export default function LeadGeneratorToolPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [accessChecked, setAccessChecked] = useState(false)
  const [tier, setTier] = useState<Tier | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [rows, setRows] = useState<CarrierRow[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saves, setSaves] = useState<SavedRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const isBroker = tier === 'BROKER' || tier === 'ADMIN'

  // Detect access on mount: a tiny search call returns the tier or 403.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.leadGeneratorSearch({ limit: 1 })
        if (!alive) return
        setTier(res.data.tier)
      } catch {
        if (!alive) return
        setTier(null)
      } finally {
        if (alive) setAccessChecked(true)
      }
    })()
    return () => { alive = false }
  }, [])

  const loadSaves = useCallback(async () => {
    try {
      const res = await api.leadGeneratorListSaves()
      setSaves(res.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (tier) loadSaves()
  }, [tier, loadSaves])

  const runSearch = useCallback(async (nextPage = 1) => {
    setSearching(true)
    try {
      const res = await api.leadGeneratorSearch({ ...filters, page: nextPage, limit: 25 })
      setRows(res.data.carriers)
      setHasMore(res.data.hasMore)
      setPage(res.data.page)
    } catch (err) {
      console.error('Lead Generator search failed', err)
    } finally {
      setSearching(false)
    }
  }, [filters])

  const handleSave = async (row: CarrierRow) => {
    try {
      await api.leadGeneratorCreateSave({
        dotNumber: row.dotNumber,
        carrierName: row.legalName,
        carrierStateCode: row.state,
      })
      await loadSaves()
    } catch (err) {
      console.error('Save failed', err)
    }
  }

  const handleDeleteSave = async (id: string) => {
    try {
      await api.leadGeneratorDeleteSave(id)
      setSaves((s) => s.filter((r) => r.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const handleExport = async () => {
    if (!isBroker) return
    setExporting(true)
    try {
      await api.leadGeneratorExportCsv({ ...filters, limit: 1000 })
    } catch (err) {
      console.error('Export failed', err)
      alert('CSV export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const savedDots = useMemo(() => new Set(saves.map((s) => s.dotNumber)), [saves])

  // Gate: not subscribed → upsell screen
  if (accessChecked && !tier) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Lock className="mx-auto h-12 w-12 text-slate-400" />
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Lead Generator access required</h1>
        <p className="mt-3 text-slate-600">
          Pick a tier to start prospecting. Buyer ($99/mo) covers the basics; Broker ($499/mo) unlocks advanced filters and bulk CSV export.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/lead-generator')}>
            See plans
          </Button>
          <Button variant="secondary" onClick={() => navigate('/buyer/subscription')}>
            Manage subscription
          </Button>
        </div>
      </div>
    )
  }

  if (!accessChecked) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 lg:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Sparkles className="h-6 w-6 text-cyan-500" />
            Lead Generator
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {tier === 'BROKER' && (
              <span className="inline-flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-amber-500" /> Broker tier — advanced filters and CSV export unlocked
              </span>
            )}
            {tier === 'BUYER' && (
              <span>Buyer tier — core filters and personal saves. <Link to="/lead-generator" className="text-cyan-600 underline">Upgrade to Broker</Link> for bulk export.</span>
            )}
            {tier === 'ADMIN' && <span>Admin view — all tools unlocked.</span>}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          <Bookmark className="mr-2 h-4 w-4" />
          Saved ({saves.length})
        </Button>
      </header>

      {/* Filter panel */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <input
            value={filters.state}
            onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
            placeholder="State (e.g. TX)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={filters.authorityStatus}
            onChange={(e) => setFilters((f) => ({ ...f, authorityStatus: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Authority: Any</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REVOKED">Revoked</option>
          </select>
          <select
            value={filters.safetyRating}
            onChange={(e) => setFilters((f) => ({ ...f, safetyRating: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Safety rating: Any</option>
            <option value="Satisfactory">Satisfactory</option>
            <option value="Conditional">Conditional</option>
            <option value="Unsatisfactory">Unsatisfactory</option>
          </select>
          <input
            value={filters.name}
            onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name contains…"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={filters.insuranceExpiresWithinDays}
            onChange={(e) => setFilters((f) => ({ ...f, insuranceExpiresWithinDays: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Insurance expiry: Any</option>
            <option value="7">Expires in 7 days</option>
            <option value="14">Expires in 14 days</option>
            <option value="30">Expires in 30 days</option>
            <option value="60">Expires in 60 days</option>
            <option value="90">Expires in 90 days</option>
          </select>
        </div>

        {isBroker && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Crown className="h-4 w-4 text-amber-500" /> Advanced filters (Broker)
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
              <input
                value={filters.minFleet}
                onChange={(e) => setFilters((f) => ({ ...f, minFleet: e.target.value }))}
                placeholder="Min power units"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={filters.maxFleet}
                onChange={(e) => setFilters((f) => ({ ...f, maxFleet: e.target.value }))}
                placeholder="Max power units"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={filters.cargoType}
                onChange={(e) => setFilters((f) => ({ ...f, cargoType: e.target.value }))}
                placeholder="Cargo type"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filters.addedAfter}
                onChange={(e) => setFilters((f) => ({ ...f, addedAfter: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                title="Authority added after"
              />
              <input
                type="date"
                value={filters.addedBefore}
                onChange={(e) => setFilters((f) => ({ ...f, addedBefore: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                title="Authority added before"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {rows.length > 0 && `${rows.length} carriers shown · page ${page}`}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </Button>
            {isBroker && (
              <Button variant="secondary" disabled={exporting} onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting…' : 'Download CSV'}
              </Button>
            )}
            <Button variant="primary" onClick={() => runSearch(1)} disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              {isBroker && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(rows.map((r) => r.dotNumber)))
                      else setSelected(new Set())
                    }}
                  />
                </th>
              )}
              <th className="px-3 py-3">DOT</th>
              <th className="px-3 py-3">Carrier</th>
              <th className="px-3 py-3">State</th>
              <th className="px-3 py-3">Units</th>
              <th className="px-3 py-3">Authority</th>
              <th className="px-3 py-3">Safety</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !searching && (
              <tr>
                <td colSpan={isBroker ? 8 : 7} className="px-3 py-12 text-center text-slate-500">
                  Set filters and hit Search to see carriers.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.dotNumber} className="border-t border-slate-100">
                {isBroker && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.dotNumber)}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(r.dotNumber)
                          else next.delete(r.dotNumber)
                          return next
                        })
                      }}
                    />
                  </td>
                )}
                <td className="px-3 py-3 font-mono text-xs">{r.dotNumber}</td>
                <td className="px-3 py-3 font-medium text-slate-900">{r.legalName || '—'}</td>
                <td className="px-3 py-3">{r.state || '—'}</td>
                <td className="px-3 py-3">{r.totalPowerUnits ?? '—'}</td>
                <td className="px-3 py-3">{r.authorityStatus || '—'}</td>
                <td className="px-3 py-3">{r.safetyRating || '—'}</td>
                <td className="px-3 py-3 text-right">
                  {savedDots.has(r.dotNumber) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Bookmark className="h-4 w-4 fill-current" /> Saved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSave(r)}
                      className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800"
                    >
                      <BookmarkPlus className="h-4 w-4" /> Save
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <div className="border-t border-slate-100 p-3 text-center">
            <Button variant="secondary" onClick={() => runSearch(page + 1)} disabled={searching}>
              Load page {page + 1}
            </Button>
          </div>
        )}
      </section>

      {/* Saved drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <aside className="w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">My Saved Leads</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {saves.length === 0 && (
                <p className="text-sm text-slate-500">No saves yet. Hit "Save" on a search result.</p>
              )}
              {saves.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{s.carrierName || `DOT ${s.dotNumber}`}</div>
                      <div className="text-xs text-slate-500">
                        DOT {s.dotNumber}{s.carrierStateCode ? ` · ${s.carrierStateCode}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSave(s.id)}
                      className="text-slate-400 hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {s.notes && <p className="mt-2 text-xs text-slate-600">{s.notes}</p>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
