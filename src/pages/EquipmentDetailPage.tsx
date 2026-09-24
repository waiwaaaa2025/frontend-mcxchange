import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Truck as TruckIcon,
  Container,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Upload,
  Trash2,
  Pencil,
  Lock,
  Wrench,
  MessageSquare,
  CheckCircle,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { AUTHORITY_TYPE_LABELS, normalizeAuthorityType } from '../constants/authority'
import { EquipmentItem, equipmentTitle, equipmentTypeLabel, fmtPrice } from '../utils/equipment'

type EquipmentResponse = Awaited<ReturnType<typeof api.getEquipment>>['data']

const conditionColor: Record<string, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-700',
  GOOD: 'bg-blue-100 text-blue-700',
  FAIR: 'bg-amber-100 text-amber-700',
  POOR: 'bg-red-100 text-red-700',
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

function specRows(e: EquipmentItem): Array<[string, string]> {
  if (e.equipmentType === 'PART') {
    const rows: Array<[string, string | null | undefined]> = [
      ['Category', e.partCategory],
      ['Brand', e.make],
      ['Part number', e.partNumber],
      ['Quantity', e.quantity != null ? String(e.quantity) : null],
      ['Condition', e.condition ? titleCase(e.condition) : null],
      ['Location', [e.city, e.state].filter(Boolean).join(', ') || null],
      ['Fits', e.fitment],
    ]
    return rows.filter((r): r is [string, string] => !!r[1])
  }
  const trailer = e.equipmentType === 'TRAILER'
  const rows: Array<[string, string | null | undefined]> = [
    ['Type', equipmentTypeLabel(e)],
    ['Year', e.year ? String(e.year) : null],
    ['Make', e.make],
    ['Model', e.model],
    trailer
      ? ['Length', e.lengthFt ? `${e.lengthFt} ft` : null]
      : ['Mileage', e.mileage != null ? `${e.mileage.toLocaleString()} mi` : null],
    ['Engine', trailer ? null : e.engine],
    ['Transmission', trailer ? null : e.transmission],
    ['Condition', e.condition ? titleCase(e.condition) : null],
    ['Location', [e.city, e.state].filter(Boolean).join(', ') || null],
  ]
  return rows.filter((r): r is [string, string] => !!r[1])
}

const EquipmentDetailPage = () => {
  const { id } = useParams()
  const [data, setData] = useState<EquipmentResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.getEquipment(id)
      setData(res.data)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'This equipment listing could not be found.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    setActive(0)
    load()
  }, [load])

  useEffect(() => {
    if (data?.equipment) document.title = `${equipmentTitle(data.equipment)} | Domilea`
  }, [data])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <TruckIcon className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipment not found</h1>
        <p className="text-gray-500 mb-6">{error || 'This equipment listing is no longer available.'}</p>
        <Link to="/marketplace" className="text-indigo-600 font-semibold hover:text-indigo-800">
          Browse the marketplace
        </Link>
      </div>
    )
  }

  const { equipment: e, listing, otherEquipment, canEdit, vinOnFile } = data
  const purchaseState = new URLSearchParams(window.location.search).get('purchase')
  const photos = [...(e.photos || [])]
  const trailer = e.equipmentType === 'TRAILER'
  const sold = (listing ? listing.status : e.status) === 'SOLD'
  const TypeIcon = e.equipmentType === 'PART' ? Wrench : trailer ? Container : TruckIcon
  const photo = photos[active]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <Link
        to={listing ? `/mc/${listing.id}` : e.equipmentType === 'PART' ? '/parts' : '/equipment'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-5"
      >
        <ArrowLeft className="w-4 h-4" />{' '}
        {listing ? 'Back to authority listing' : e.equipmentType === 'PART' ? 'Back to parts' : 'Back to equipment'}
      </Link>

      {purchaseState === 'success' && (
        <div className="mb-5 flex items-start gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          Payment received — thank you! The seller has been notified, and your receipt is on its way by email. Use
          “Ask the seller” below to arrange {e.equipmentType === 'PART' ? 'shipping' : 'pickup or delivery'}.
        </div>
      )}
      {purchaseState === 'cancelled' && (
        <div className="mb-5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          Checkout was cancelled — you have not been charged.
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Gallery */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            {photo ? (
              <button onClick={() => setLightbox(true)} className="w-full h-full cursor-zoom-in">
                <img src={photo.url} alt={equipmentTitle(e)} className="w-full h-full object-cover" />
              </button>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <TypeIcon className="w-14 h-14 mb-2" />
                <span className="text-sm">No photos yet</span>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActive((active - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActive((active + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 right-3 text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded-full">
                  {active + 1} / {photos.length}
                </span>
              </>
            )}
            {sold && (
              <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wide bg-gray-900 text-white px-3 py-1 rounded-full">
                Sold
              </span>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                    i === active ? 'border-indigo-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                <TypeIcon className="w-3.5 h-3.5" /> {equipmentTypeLabel(e)}
              </span>
              {e.condition && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    conditionColor[e.condition] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {titleCase(e.condition)}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{equipmentTitle(e)}</h1>
            <p className="text-3xl font-black text-emerald-600 mt-3">
              {fmtPrice(e.price) || <span className="text-xl text-gray-500 font-semibold">Price on request</span>}
            </p>
            {vinOnFile && (
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <span className="text-gray-400">VIN</span>
                {e.vin ? (
                  <span className="font-mono text-gray-900">{e.vin}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <Lock className="w-3.5 h-3.5" /> Shown after unlocking the authority listing
                  </span>
                )}
              </p>
            )}
          </div>

          {listing ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sold with this authority
              </p>
              <p className="font-bold text-gray-900">{listing.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {AUTHORITY_TYPE_LABELS[normalizeAuthorityType(listing.authorityType)]}
                {listing.state ? ` · ${[listing.city, listing.state].filter(Boolean).join(', ')}` : ''}
                {listing.mcNumber ? ` · MC ${listing.mcNumber}` : ''}
              </p>
              {fmtPrice(listing.price) && (
                <p className="text-sm text-gray-700 mt-2">
                  Authority asking price: <span className="font-semibold">{fmtPrice(listing.price)}</span>
                </p>
              )}
              <Link
                to={`/mc/${listing.id}`}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
              >
                {sold ? 'View authority listing' : 'View authority & make an offer'}
              </Link>
              <p className="text-xs text-gray-500 mt-3">
                Equipment is purchased together with the authority. Include it in your offer on the authority listing,
                or ask us about it below.
              </p>
              <div className="mt-3">
                <ContactCard item={e} sold={sold} compact />
              </div>
            </div>
          ) : sold ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-sm text-gray-600">
              This item has been sold.
            </div>
          ) : (
            <>
              {!canEdit && <BuyBox item={e} purchase={data.purchase} />}
              {data.canMessageSeller ? (
                <AskSellerCard item={e} />
              ) : (
                !canEdit && <SignInToAsk itemId={e.id} />
              )}
            </>
          )}

          {canEdit && <OwnerTools equipment={e} onChanged={load} />}
        </div>
      </div>

      {/* Specs + description */}
      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 mt-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {specRows(e).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {e.description && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{e.description}</p>
            </div>
          )}
        </div>

        {otherEquipment.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">More equipment with this authority</h2>
              <div className="space-y-3">
                {otherEquipment.map((o) => (
                  <Link
                    key={o.id}
                    to={`/equipment/${o.id}`}
                    className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {o.photo ? (
                        <img src={o.photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : o.equipmentType === 'TRAILER' ? (
                        <Container className="w-6 h-6 text-gray-400" />
                      ) : (
                        <TruckIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{equipmentTitle(o)}</p>
                      <p className="text-xs text-gray-500">{equipmentTypeLabel(o)}</p>
                      {fmtPrice(o.price) && (
                        <p className="text-sm font-bold text-emerald-600">{fmtPrice(o.price)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {lightbox && photo && (
        <div
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={photo.url} alt="" className="max-h-[90vh] max-w-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}

/** Price, quantity (parts) and Stripe checkout for a standalone item. */
const BuyBox = ({ item, purchase }: { item: EquipmentItem; purchase?: EquipmentResponse['purchase'] }) => {
  const { isAuthenticated } = useAuth()
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isPart = item.equipmentType === 'PART'
  const max = Math.max(purchase?.available || 1, 1)

  const buy = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/equipment/${item.id}`)}`
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await api.startEquipmentCheckout(item.id, qty)
      window.location.href = res.data.url
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout')
      setBusy(false)
    }
  }

  if (item.price == null) return null
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {purchase?.purchasable ? (
        <>
          {isPart && max > 1 && (
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center gap-2">
                <select
                  value={qty}
                  onChange={(ev) => setQty(Number(ev.target.value))}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  {Array.from({ length: Math.min(max, 50) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">of {max}</span>
              </div>
            </div>
          )}
          {isPart && qty > 1 && (
            <p className="text-sm text-gray-600 mb-3">
              Total: <span className="font-semibold text-gray-900">{fmtPrice((item.price || 0) * qty)}</span>
            </p>
          )}
          <button
            onClick={buy}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-60"
          >
            <Lock className="w-4 h-4" /> {busy ? 'Opening secure checkout…' : 'Buy now'}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Secure card checkout by Stripe. Payment goes straight to the seller&apos;s verified payout account. All sales are final.
          </p>
        </>
      ) : purchase?.reason === 'ON_HOLD' ? (
        <p className="text-sm text-gray-600">Someone is checking out this item right now. Check back in about 30 minutes.</p>
      ) : (
        <p className="text-sm text-gray-600">
          Online checkout opens once the seller finishes payout setup. Ask the seller a question in the meantime.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  )
}

/** Direct question to the seller (standalone items). MC talk is refused server-side. */
const AskSellerCard = ({ item }: { item: EquipmentItem }) => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!message.trim()) return setError('Write a short message')
    setSending(true)
    setError('')
    try {
      await api.askEquipmentQuestion(item.id, message.trim())
      setSent(true)
      setMessage('')
    } catch (err: any) {
      setError(err?.message || 'Could not send your question')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      {sent ? (
        <p className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> Sent to the seller. Their reply will show in your Messages.
        </p>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 font-semibold text-sm"
        >
          <MessageSquare className="w-4 h-4" /> Ask the seller
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Ask the seller about {equipmentTitle(item)}</p>
          <textarea
            autoFocus
            rows={4}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="Is it still available? Any maintenance records? Can you ship to Dallas?"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={sending}
              onClick={send}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send to seller'}
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500">Questions about MC authorities can&apos;t be sent to sellers.</p>
        </div>
      )}
    </div>
  )
}

const SignInToAsk = ({ itemId }: { itemId: string }) => (
  <Link
    to={`/login?redirect=${encodeURIComponent(`/equipment/${itemId}`)}`}
    className="block text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
  >
    Sign in to ask the seller a question
  </Link>
)

/**
 * Buyer inquiry about this item. Like authority inquiries, it goes to the
 * Domilea team's inbox (Admin → Inquiries), which connects buyer and seller.
 */
const ContactCard = ({ item, sold, compact = false }: { item: EquipmentItem; sold: boolean; compact?: boolean }) => {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const label = equipmentTitle(item)

  const send = async () => {
    if (!message.trim()) return setError('Write a short message')
    setSending(true)
    setError('')
    try {
      const url = `${window.location.origin}/equipment/${item.id}`
      await api.sendInquiryToAdmin(
        item.listingId || undefined,
        `[${equipmentTypeLabel(item)} inquiry] ${label}${item.price != null ? ` — ${fmtPrice(item.price)}` : ''}\n${url}\n\n${message.trim()}`,
        phone.trim() || undefined
      )
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Could not send your message')
    } finally {
      setSending(false)
    }
  }

  if (sold && !compact) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-sm text-gray-600">
        This item has been sold.
      </div>
    )
  }
  if (sold) return null

  return (
    <div className={compact ? '' : 'bg-white rounded-2xl border border-gray-200 shadow-sm p-6'}>
      {sent ? (
        <p className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> Message sent. Our team will connect you with the seller shortly.
        </p>
      ) : !open ? (
        <button
          onClick={() =>
            isAuthenticated
              ? setOpen(true)
              : (window.location.href = `/login?redirect=${encodeURIComponent(`/equipment/${item.id}`)}`)
          }
          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-colors ${
            compact ? 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> {compact ? 'Ask about this item' : 'Contact about this listing'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Ask about {label}</p>
          <textarea
            autoFocus
            rows={4}
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            placeholder="Is it still available? Can I see maintenance records? Is shipping possible?"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
          />
          <input
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            placeholder="Phone (optional)"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={sending}
              onClick={send}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
      {!compact && !sent && (
        <p className="text-xs text-gray-500 mt-3">
          Messages go to the Domilea team, who connect you with the seller.
        </p>
      )}
    </div>
  )
}

/** Seller/admin controls: change the price, add or remove photos. */
const OwnerTools = ({ equipment, onChanged }: { equipment: EquipmentItem; onChanged: () => Promise<void> }) => {
  const [price, setPrice] = useState(equipment.price != null ? String(equipment.price) : '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const photos = equipment.photos || []

  const run = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true)
    setMessage('')
    try {
      await fn()
      await onChanged()
      setMessage(done)
    } catch (err: any) {
      setMessage(err?.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-6">
      <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
        <Pencil className="w-4 h-4 text-amber-600" /> Manage this equipment
      </p>
      <label className="block text-xs font-medium text-gray-700 mb-1">Asking price ($)</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          value={price}
          onChange={(ev) => setPrice(ev.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
        <button
          disabled={busy}
          onClick={() => run(() => api.updateTruck(equipment.id, { price: price === '' ? null : price }), 'Price saved')}
          className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <p className="block text-xs font-medium text-gray-700 mt-4 mb-2">Photos ({photos.length}/5)</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              disabled={busy}
              onClick={() => run(() => api.deleteTruckPhoto(equipment.id, p.id), 'Photo removed')}
              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
              aria-label="Remove photo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {photos.length < 5 && (
          <label
            className={`w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 ${
              busy ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-0.5">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(ev) => {
                const files = Array.from(ev.target.files || [])
                  .filter((f) => f.type.startsWith('image/'))
                  .slice(0, 5 - photos.length)
                ev.target.value = ''
                if (files.length) run(() => api.uploadTruckPhotos(equipment.id, files), 'Photos added')
              }}
            />
          </label>
        )}
      </div>
      {message && <p className="text-xs text-gray-600 mt-3">{message}</p>}
    </div>
  )
}

export default EquipmentDetailPage
