import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Loader2, Plus, Truck as TruckIcon, Wrench } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import MarketItemCard, { MarketSectionTabs } from '../components/MarketItemCard'
import { MarketCard, US_STATES } from '../utils/equipment'

type Mode = 'equipment' | 'parts'

const COPY: Record<Mode, { title: string; blurb: string; sell: string; empty: string; search: string }> = {
  equipment: {
    title: 'Trucks & Trailers',
    blurb: 'Used trucks and trailers from carriers and owner-operators — on their own or sold together with an authority.',
    sell: 'Sell equipment',
    empty: 'No trucks or trailers match these filters yet.',
    search: 'Search make, model, trailer type…',
  },
  parts: {
    title: 'Truck & Trailer Parts',
    blurb: 'Engines, transmissions, tires, reefer units and more — listed by carriers and shops.',
    sell: 'Sell parts',
    empty: 'No parts match these filters yet.',
    search: 'Search part name, number, brand, fitment…',
  },
}

const inputCls =
  'px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none'

/** Sellers list from their dashboard; admins from theirs; everyone else signs in first. */
const sellPath = (role: string | undefined, mode: Mode) => {
  const path = `${role === 'admin' ? '/admin' : '/seller'}/equipment/new${mode === 'parts' ? '?type=PART' : ''}`
  return role === 'admin' || role === 'seller' ? path : `/login?redirect=${encodeURIComponent(path)}`
}

const EquipmentMarketPage = ({ mode }: { mode: Mode }) => {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<MarketCard[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState(params.get('search') || '')

  const type = mode === 'parts' ? 'PART' : params.get('type') || 'EQUIPMENT'
  const state = params.get('state') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const search = params.get('search') || ''
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const copy = COPY[mode]

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  useEffect(() => {
    document.title = `${copy.title} for Sale | Domilea`
  }, [copy.title])

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== search) setParam('search', searchInput.trim())
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .browseEquipment({
        type,
        search: search || undefined,
        state: state || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page,
        limit: 24,
      })
      .then((res) => {
        if (cancelled) return
        setItems(res.data || [])
        setTotal(res.pagination?.total || 0)
        setTotalPages(res.pagination?.totalPages || 1)
        setError('')
      })
      .catch((err) => !cancelled && setError(err?.message || 'Could not load listings'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [type, search, state, minPrice, maxPrice, page])

  const EmptyIcon = mode === 'parts' ? Wrench : TruckIcon
  const canSell = !user || user.role === 'seller' || user.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <MarketSectionTabs />

      <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">{copy.blurb}</p>
        </div>
        {canSell && (
          <Link
            to={sellPath(user?.role, mode)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" /> {copy.sell}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={copy.search}
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        {mode === 'equipment' && (
          <select value={type} onChange={(e) => setParam('type', e.target.value === 'EQUIPMENT' ? '' : e.target.value)} className={inputCls}>
            <option value="EQUIPMENT">Trucks & trailers</option>
            <option value="TRUCK">Trucks</option>
            <option value="TRAILER">Trailers</option>
          </select>
        )}
        <select value={state} onChange={(e) => setParam('state', e.target.value)} className={inputCls}>
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(e) => setParam('minPrice', e.target.value)}
          placeholder="Min $"
          className={inputCls}
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => setParam('maxPrice', e.target.value)}
          placeholder="Max $"
          className={inputCls}
        />
      </div>

      <p className="mt-4 text-sm text-gray-500">{loading ? 'Loading…' : `${total.toLocaleString()} listing${total === 1 ? '' : 's'}`}</p>

      {error ? (
        <p className="mt-10 text-center text-red-600">{error}</p>
      ) : loading && items.length === 0 ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <EmptyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{copy.empty}</p>
          {canSell && (
            <Link to={sellPath(user?.role, mode)} className="inline-block mt-3 text-indigo-600 font-semibold hover:text-indigo-800">
              Be the first to list — {copy.sell.toLowerCase()}
            </Link>
          )}
        </div>
      ) : (
        <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${loading ? 'opacity-60' : ''}`}>
          {items.map((item) => (
            <MarketItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setParam('page', String(page + 1))}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </div>
  )
}

export default EquipmentMarketPage
