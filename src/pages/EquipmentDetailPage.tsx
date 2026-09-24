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
} from 'lucide-react'
import api from '../services/api'
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
  const photos = [...(e.photos || [])]
  const trailer = e.equipmentType === 'TRAILER'
  const sold = listing.status === 'SOLD'
  const TypeIcon = trailer ? Container : TruckIcon
  const photo = photos[active]

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <Link
        to={`/mc/${listing.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to authority listing
      </Link>

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
              or{' '}
              <Link to="/contact" className="text-indigo-600 hover:text-indigo-800">
                contact us
              </Link>{' '}
              with questions.
            </p>
          </div>

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
