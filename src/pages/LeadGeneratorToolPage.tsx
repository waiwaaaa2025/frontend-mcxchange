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
  Phone,
  ShieldAlert,
  Handshake,
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

// The 3-step pitch shown on the tool page and the upsell gate: filter distressed
// carriers → reach out and offer to buy → hire Domilea if you can't close it yourself.
const HOW_IT_WORKS = [
  {
    icon: ShieldAlert,
    color: 'from-amber-500 to-orange-600',
    title: 'Find insurance pending cancellation',
    desc: 'Filter the carrier database for companies whose insurance is pending cancellation or about to expire — often a strong signal the owner is ready to sell their authority.',
  },
  {
    icon: Phone,
    color: 'from-cyan-500 to-cyan-600',
    title: 'Reach out and offer to buy',
    desc: 'Reveal the carrier’s phone number, contact the owner directly, and make an offer to purchase their company and operating authority.',
  },
  {
    icon: Handshake,
    color: 'from-emerald-500 to-emerald-600',
    title: 'Can’t close it yourself? Hire Domilea',
    desc: 'If you can’t reach a deal directly with the seller, hire Domilea to step in and help broker and close the sale for you.',
  },
]

// Illustrative rows only — never sent to the API. Used to preview what live
// results look like before the user runs a search (and on the upsell gate).
const PREVIEW_ROWS = [
  { dotNumber: '2841097', legalName: 'Lone Star Freight LLC', state: 'TX', units: 14, insurance: 'Pending cancellation · 6 days', phone: '(214) 555-0142' },
  { dotNumber: '3019574', legalName: 'Cascade Hauling Inc', state: 'OR', units: 7, insurance: 'Pending cancellation · 11 days', phone: '(503) 555-0188' },
  { dotNumber: '1764223', legalName: 'Great Lakes Logistics Co', state: 'MI', units: 22, insurance: 'Expires in 19 days', phone: '(313) 555-0117' },
  { dotNumber: '2298410', legalName: 'Sunbelt Carriers LLC', state: 'FL', units: 5, insurance: 'Pending cancellation · 3 days', phone: '(305) 555-0164' },
]

function HowItWorks() {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Sparkles className="h-4 w-4 text-cyan-500" /> How the Lead Generator works
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Turn carriers whose insurance is lapsing into acquisition opportunities — reach out, make an offer, and lean on Domilea when you need help closing the deal.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${step.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-xs font-bold text-slate-400">STEP {i + 1}</div>
              <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PreviewTable() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Search className="h-4 w-4 text-slate-400" /> Example results
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Sample data — run a search for live carriers
        </span>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-3 py-3">DOT</th>
            <th className="px-3 py-3">Carrier</th>
            <th className="px-3 py-3">State</th>
            <th className="px-3 py-3">Units</th>
            <th className="px-3 py-3">Insurance</th>
            <th className="px-3 py-3">Phone</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {PREVIEW_ROWS.map((r) => (
            <tr key={r.dotNumber} className="border-t border-slate-100">
              <td className="px-3 py-3 font-mono text-xs">{r.dotNumber}</td>
              <td className="px-3 py-3 font-medium text-slate-900">{r.legalName}</td>
              <td className="px-3 py-3">{r.state}</td>
              <td className="px-3 py-3">{r.units}</td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <ShieldAlert className="h-3 w-3" /> {r.insurance}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Phone className="h-4 w-4" /> {r.phone}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <span className="inline-flex items-center gap-1 text-xs text-cyan-600">
                  <BookmarkPlus className="h-4 w-4" /> Save
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  )
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
  // Phone/email fetched on demand per DOT — search results don't carry contact info.
  const [contacts, setContacts] = useState<
    Record<string, { phone: string | null; email: string | null; loading: boolean }>
  >({})

  const isBroker = tier === 'BROKER' || tier === 'ADMIN'

  // Open a carrier's CarrierPulse report (credit + risk intelligence) the same
  // way admins can — the CarrierPulse page already accepts a DOT. Each role has
  // its own dashboard route; compliance/unknown roles fall back to the public
  // preview so the link never 404s.
  const carrierPulsePath = (dot: string) => {
    switch (user?.role) {
      case 'admin': return `/admin/carrier-pulse/${dot}`
      case 'seller': return `/seller/carrier-pulse/${dot}`
      case 'buyer': return `/buyer/carrier-pulse/${dot}`
      default: return `/carrier-pulse-preview/${dot}`
    }
  }

  const fetchContact = useCallback(async (dot: string) => {
    setContacts((c) => ({ ...c, [dot]: { phone: null, email: null, loading: true } }))
    try {
      const res = await api.leadGeneratorGetContact(dot)
      setContacts((c) => ({
        ...c,
        [dot]: { phone: res.data.phone, email: res.data.email, loading: false },
      }))
    } catch {
      setContacts((c) => ({ ...c, [dot]: { phone: null, email: null, loading: false } }))
    }
  }, [])

  // Detect access on mount via the dedicated access endpoint, which resolves the
  // tier from the subscription alone. We deliberately do NOT gate on a search
  // call: search depends on the external carrier-data provider and returns 502
  // when it's down, which previously made paying subscribers look like they had
  // no access. Access and data availability are now independent concerns.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.leadGeneratorAccess()
        if (!alive) return
        setTier(res.data.hasAccess ? res.data.tier : null)
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
    setExporting(true)
    try {
      if (isBroker) {
        // Broker/Admin: full result set, enriched with phone + email.
        await api.leadGeneratorExportCsv({ ...filters, limit: 1000 })
      } else {
        // Buyer: just the current page (25 carriers).
        await api.leadGeneratorExportCsv({ ...filters, page, limit: 25 })
      }
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
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-6 text-3xl font-bold text-slate-900">Lead Generator access required</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Filter the carrier database for companies whose insurance is pending cancellation, reach out to owners,
            and offer to buy their authority. Can’t close it yourself? Hire Domilea to help with the sale.
          </p>
          <p className="mt-3 text-slate-600">
            Pick a tier to start prospecting. Buyer ($49/mo) covers the basics; Broker ($299/mo) unlocks advanced filters and bulk CSV export.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button variant="primary" onClick={() => navigate('/lead-generator')}>
              See plans
            </Button>
            <Button variant="secondary" onClick={() => navigate('/buyer/subscription')}>
              Manage subscription
            </Button>
          </div>
        </div>

        <div className="mt-10">
          <HowItWorks />
          <PreviewTable />
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
              <span>Buyer tier — core filters, personal saves, and CSV download of the current page (25). <Link to="/lead-generator" className="text-cyan-600 underline">Upgrade to Broker</Link> to export the full list with phone &amp; email.</span>
            )}
            {tier === 'ADMIN' && <span>Admin view — all tools unlocked.</span>}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          <Bookmark className="mr-2 h-4 w-4" />
          Saved ({saves.length})
        </Button>
      </header>

      {/* How it works */}
      <HowItWorks />

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

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {rows.length > 0 && `${rows.length} carriers shown · page ${page}`}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear
            </Button>
            <Button variant="secondary" disabled={exporting || rows.length === 0} onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {exporting
                ? 'Exporting…'
                : isBroker
                  ? 'Download all (CSV + phone/email)'
                  : 'Download page (25)'}
            </Button>
            <Button variant="primary" onClick={() => runSearch(1)} disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
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
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !searching && (
              <tr>
                <td colSpan={isBroker ? 9 : 8} className="px-3 py-12 text-center text-slate-500">
                  Set filters and hit Search to see live carriers — here’s an example of what you’ll get:
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
                <td className="px-3 py-3 font-mono text-xs">
                  <Link
                    to={carrierPulsePath(r.dotNumber)}
                    className="text-cyan-600 underline-offset-2 hover:text-cyan-800 hover:underline"
                    title="Open CarrierPulse details"
                  >
                    {r.dotNumber}
                  </Link>
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">{r.legalName || '—'}</td>
                <td className="px-3 py-3">{r.state || '—'}</td>
                <td className="px-3 py-3">{r.totalPowerUnits ?? '—'}</td>
                <td className="px-3 py-3">{r.authorityStatus || '—'}</td>
                <td className="px-3 py-3">{r.safetyRating || '—'}</td>
                <td className="px-3 py-3">
                  <CallAction
                    contact={contacts[r.dotNumber]}
                    onReveal={() => fetchContact(r.dotNumber)}
                  />
                </td>
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
        </div>

        {hasMore && (
          <div className="border-t border-slate-100 p-3 text-center">
            <Button variant="secondary" onClick={() => runSearch(page + 1)} disabled={searching}>
              Load page {page + 1}
            </Button>
          </div>
        )}
      </section>

      {/* Preview of sample results before the first live search */}
      {rows.length === 0 && !searching && (
        <div className="mt-6">
          <PreviewTable />
        </div>
      )}

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
                  <div className="mt-2">
                    <CallAction
                      contact={contacts[s.dotNumber]}
                      onReveal={() => fetchContact(s.dotNumber)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

// Click-to-call control. Reveals the carrier's phone on demand, then renders a
// `tel:` link so subscribers can dial straight from their phone. Used in both
// the search results and the saved-leads drawer; available to all paid tiers.
function CallAction({
  contact,
  onReveal,
}: {
  contact: { phone: string | null; email: string | null; loading: boolean } | undefined
  onReveal: () => void
}) {
  if (!contact) {
    return (
      <button
        onClick={onReveal}
        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-800"
      >
        <Phone className="h-4 w-4" /> Show phone
      </button>
    )
  }
  if (contact.loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
  }
  if (contact.phone) {
    return (
      <a
        href={`tel:${contact.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800"
      >
        <Phone className="h-4 w-4" /> {contact.phone}
      </a>
    )
  }
  return <span className="text-xs text-slate-400">No phone on file</span>
}
