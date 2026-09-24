import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2, ExternalLink, Check, X, Banknote } from 'lucide-react'
import api from '../services/api'
import { itemIcon } from '../components/MarketItemCard'
import { EquipmentOrder, MarketCard, STATUS_STYLES, equipmentTitle, equipmentTypeLabel, fmtPrice } from '../utils/equipment'

type Mode = 'mine' | 'admin'

const ADMIN_TABS = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'ACTIVE', label: 'Live' },
  { value: 'REJECTED', label: 'Not approved' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'ALL', label: 'All' },
]

/**
 * Seller: their standalone equipment & parts with mark-sold / relist / resubmit.
 * Admin: the review queue for standalone items, with approve / reject.
 */
const ManageEquipmentPage = ({ mode }: { mode: Mode }) => {
  const [items, setItems] = useState<MarketCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('PENDING_REVIEW')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null)
  const [view, setView] = useState<'listings' | 'sales' | 'purchases'>('listings')
  const [orders, setOrders] = useState<{ sales: EquipmentOrder[]; purchases: EquipmentOrder[] }>({ sales: [], purchases: [] })
  const [payoutsReady, setPayoutsReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (mode !== 'mine') return
    api.getEquipmentOrders().then((r) => setOrders(r.data)).catch(() => undefined)
    api.getPayoutStatus().then((r) => setPayoutsReady(!!r.data.isOnboarded)).catch(() => setPayoutsReady(null))
  }, [mode])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = mode === 'admin' ? await api.adminListMarketItems(tab) : await api.getMyMarketItems()
      setItems(res.data || [])
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Could not load listings')
    } finally {
      setLoading(false)
    }
  }, [mode, tab])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id)
    try {
      await fn()
      await load()
    } catch (err: any) {
      setError(err?.message || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  const newPath = mode === 'admin' ? '/admin/equipment/new' : '/my-equipment/new'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {mode === 'admin' ? 'Equipment & Parts Review' : 'My Equipment & Parts'}
          </h1>
          <p className="text-gray-500 mt-1">
            {mode === 'admin'
              ? 'Standalone trucks, trailers and parts. New seller listings wait here until approved.'
              : 'Trucks, trailers and parts you listed on their own. Equipment sold with an authority is managed on that listing.'}
          </p>
        </div>
        <Link
          to={newPath}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      {mode === 'mine' && payoutsReady === false && items.some((i) => i.status !== 'SOLD') && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-900 flex items-start gap-2">
            <Banknote className="w-4 h-4 mt-0.5 shrink-0" />
            Set up payouts so buyers can purchase your items online. Until then, buyers can only send you questions.
          </p>
          <Link to="/payouts" className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold text-center shrink-0">
            Set up payouts
          </Link>
        </div>
      )}

      {mode === 'mine' && (
        <div className="flex flex-wrap gap-2 mb-5">
          {([
            ['listings', 'My listings'],
            ['sales', `Sales${orders.sales.length ? ` (${orders.sales.length})` : ''}`],
            ['purchases', `Purchases${orders.purchases.length ? ` (${orders.purchases.length})` : ''}`],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                view === v ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {mode === 'mine' && view !== 'listings' ? (
        <OrdersList orders={view === 'sales' ? orders.sales : orders.purchases} kind={view} />
      ) : (
      <>
      {mode === 'admin' && (
        <div className="flex flex-wrap gap-2 mb-5">
          {ADMIN_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t.value ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-600 font-medium">
            {mode === 'admin' ? 'Nothing here.' : "You haven't listed any equipment or parts yet."}
          </p>
          {mode === 'mine' && (
            <Link to={newPath} className="inline-block mt-2 text-indigo-600 font-semibold hover:text-indigo-800">
              List a truck, trailer or part
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {items.map((item) => {
            const Icon = itemIcon(item.equipmentType)
            const status = STATUS_STYLES[item.status] || { label: item.status, cls: 'bg-gray-100 text-gray-700' }
            const busy = busyId === item.id
            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-28 h-40 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {item.photo ? (
                    <img src={item.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-7 h-7 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                    <span className="text-xs font-semibold text-indigo-600">{equipmentTypeLabel(item)}</span>
                  </div>
                  <p className="font-bold text-gray-900 mt-1 truncate">{equipmentTitle(item)}</p>
                  <p className="text-sm text-gray-500">
                    {[fmtPrice(item.price), [item.city, item.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                  </p>
                  {mode === 'admin' && item.seller && (
                    <p className="text-xs text-gray-500 mt-1">
                      Seller: {item.seller.name} · {item.seller.email}
                    </p>
                  )}
                  {mode === 'admin' && item.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-3 whitespace-pre-line">{item.description}</p>
                  )}
                  {item.status === 'REJECTED' && item.reviewNote && (
                    <p className="text-sm text-red-700 mt-1">Reason: {item.reviewNote}</p>
                  )}

                  {rejecting?.id === item.id && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input
                        autoFocus
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ id: item.id, reason: e.target.value })}
                        placeholder="Reason shown to the seller (optional)"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 outline-none"
                      />
                      <button
                        disabled={busy}
                        onClick={() =>
                          act(item.id, async () => {
                            await api.adminRejectMarketItem(item.id, rejecting.reason)
                            setRejecting(null)
                          })
                        }
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        Confirm reject
                      </button>
                      <button onClick={() => setRejecting(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                  <Link
                    to={`/equipment/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" /> View
                  </Link>
                  {mode === 'admin' && item.status !== 'ACTIVE' && item.status !== 'SOLD' && (
                    <button
                      disabled={busy}
                      onClick={() => act(item.id, () => api.adminApproveMarketItem(item.id))}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {mode === 'admin' && item.status !== 'REJECTED' && rejecting?.id !== item.id && (
                    <button
                      disabled={busy}
                      onClick={() => setRejecting({ id: item.id, reason: '' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  )}
                  {mode === 'mine' && item.status === 'ACTIVE' && (
                    <button
                      disabled={busy}
                      onClick={() => act(item.id, () => api.setMarketItemStatus(item.id, 'SOLD'))}
                      className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Mark sold
                    </button>
                  )}
                  {mode === 'mine' && item.status === 'SOLD' && (
                    <button
                      disabled={busy}
                      onClick={() => act(item.id, () => api.setMarketItemStatus(item.id, 'ACTIVE'))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Relist
                    </button>
                  )}
                  {mode === 'mine' && item.status === 'REJECTED' && (
                    <button
                      disabled={busy}
                      onClick={() => act(item.id, () => api.setMarketItemStatus(item.id, 'PENDING_REVIEW'))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Resubmit
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}
    </div>
  )
}

const OrdersList = ({ orders, kind }: { orders: EquipmentOrder[]; kind: 'sales' | 'purchases' }) => {
  if (orders.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-600 font-medium">
        {kind === 'sales' ? 'No sales yet.' : 'No purchases yet.'}
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
      {orders.map((o) => {
        const Icon = itemIcon(o.equipmentType || 'TRUCK')
        return (
          <div key={o.id} className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-28 h-40 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {o.photo ? <img src={o.photo} alt="" className="w-full h-full object-cover" /> : <Icon className="w-7 h-7 text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <Link to={`/equipment/${o.itemId}`} className="font-bold text-gray-900 hover:text-indigo-700">
                {o.itemName}
                {o.quantity > 1 ? ` × ${o.quantity}` : ''}
              </Link>
              <p className="text-gray-500">
                {new Date(o.paidAt).toLocaleDateString()} · {fmtPrice(o.amount)}
                {kind === 'purchases' && o.seller ? ` · from ${o.seller.name}` : ''}
              </p>
              {kind === 'sales' && (
                <>
                  <p className="text-gray-700 mt-1">
                    Payout <span className="font-semibold">{fmtPrice(o.sellerPayout)}</span>{' '}
                    <span className="text-gray-500">(after {fmtPrice(o.platformFee)} platform fee)</span>
                  </p>
                  {o.buyer && (
                    <p className="text-gray-700 mt-1">
                      Buyer: {o.buyer.name} · {o.buyer.email}
                      {o.buyerPhone ? ` · ${o.buyerPhone}` : ''}
                    </p>
                  )}
                  {o.shippingAddress && (
                    <p className="text-gray-700 mt-1 whitespace-pre-line">
                      <span className="text-gray-500">Ship to:</span>
                      {'\n'}
                      {o.shippingAddress}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ManageEquipmentPage
