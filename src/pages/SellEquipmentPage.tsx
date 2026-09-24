import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { itemIcon } from '../components/MarketItemCard'
import { EquipmentCondition, EquipmentType, PART_CATEGORIES, TRAILER_TYPES, US_STATES } from '../utils/equipment'

const CONDITIONS: Array<{ value: EquipmentCondition; label: string }> = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]
const TRANSMISSIONS = ['Manual', 'Automatic', 'Automated Manual']

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none'

const Field = ({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
)

const empty = {
  make: '',
  model: '',
  year: '',
  mileage: '',
  vin: '',
  engine: '',
  transmission: '',
  trailerType: '',
  lengthFt: '',
  name: '',
  partCategory: '',
  partNumber: '',
  quantity: '1',
  fitment: '',
  price: '',
  condition: '' as EquipmentCondition,
  description: '',
  city: '',
  state: '',
}

/** List one standalone truck, trailer or part (seller dashboard and admin). */
const SellEquipmentPage = () => {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const initialType = (['TRUCK', 'TRAILER', 'PART'] as EquipmentType[]).find((t) => t === params.get('type')) || 'TRUCK'
  const [type, setType] = useState<EquipmentType>(initialType)
  const [form, setForm] = useState(empty)
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ id: string; status: string; photoFailed: boolean } | null>(null)

  const set = (patch: Partial<typeof empty>) => setForm((f) => ({ ...f, ...patch }))
  const isPart = type === 'PART'
  const base = user?.role === 'admin' ? '/admin' : '/seller'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPart ? !form.name.trim() : !form.make.trim()) {
      setError(isPart ? 'Enter the part name' : 'Enter the make')
      return
    }
    if (!form.price) return setError('Enter an asking price')
    if (!form.state) return setError('Select the state where it is located')

    setSubmitting(true)
    setError('')
    try {
      const common = {
        equipmentType: type,
        price: form.price,
        condition: form.condition || null,
        description: form.description,
        city: form.city,
        state: form.state,
        year: form.year,
        make: form.make,
        model: form.model,
      }
      const specific = isPart
        ? { name: form.name, partCategory: form.partCategory, partNumber: form.partNumber, quantity: form.quantity, fitment: form.fitment }
        : type === 'TRAILER'
          ? { vin: form.vin, trailerType: form.trailerType, lengthFt: form.lengthFt }
          : { vin: form.vin, mileage: form.mileage, engine: form.engine, transmission: form.transmission }
      const res = await api.createMarketItem({ ...common, ...specific })
      let photoFailed = false
      if (photos.length > 0) {
        try {
          await api.uploadTruckPhotos(res.data.id, photos)
        } catch {
          photoFailed = true
        }
      }
      setCreated({ id: res.data.id, status: res.data.status, photoFailed })
    } catch (err: any) {
      setError(err?.message || 'Could not create the listing')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    const live = created.status === 'ACTIVE'
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">{live ? 'Listing is live!' : 'Submitted for review'}</h1>
        <p className="text-gray-500 mb-6">
          {live
            ? 'It now shows in the marketplace.'
            : "Our team reviews new listings before they go public. We'll notify you once it's approved."}
        </p>
        {created.photoFailed && (
          <p className="mb-6 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            The photos could not be uploaded. Open the listing page to add them again.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/equipment/${created.id}`}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
          >
            View listing
          </Link>
          <Link to={`${base}/equipment`} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            My equipment & parts
          </Link>
          <button
            onClick={() => {
              setCreated(null)
              setForm(empty)
              setPhotos([])
            }}
            className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            List another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sell equipment or parts</h1>
      <p className="text-gray-500 mt-1 mb-6">
        List a truck, trailer or part on its own. To sell equipment together with an authority, add it when you create
        the authority listing.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-medium text-gray-700 mb-3">What are you selling?</p>
          <div className="grid grid-cols-3 gap-3">
            {(['TRUCK', 'TRAILER', 'PART'] as EquipmentType[]).map((t) => {
              const Icon = itemIcon(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`p-4 rounded-xl border-2 text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                    type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {t === 'TRUCK' ? 'Truck' : t === 'TRAILER' ? 'Trailer' : 'Part'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isPart ? (
              <>
                <Field label="Part name *" className="sm:col-span-2">
                  <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="DD15 Turbocharger" className={inputCls} />
                </Field>
                <Field label="Category">
                  <select value={form.partCategory} onChange={(e) => set({ partCategory: e.target.value })} className={inputCls}>
                    <option value="">Select category</option>
                    {PART_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Brand">
                  <input value={form.make} onChange={(e) => set({ make: e.target.value })} placeholder="Detroit" className={inputCls} />
                </Field>
                <Field label="Part number">
                  <input value={form.partNumber} onChange={(e) => set({ partNumber: e.target.value })} placeholder="A4720900880" className={inputCls} />
                </Field>
                <Field label="Quantity">
                  <input type="number" min="1" value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Fits (makes / models / years)" className="sm:col-span-2">
                  <input
                    value={form.fitment}
                    onChange={(e) => set({ fitment: e.target.value })}
                    placeholder="Freightliner Cascadia 2016–2022 with DD15"
                    className={inputCls}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Make *">
                  <input
                    value={form.make}
                    onChange={(e) => set({ make: e.target.value })}
                    placeholder={type === 'TRAILER' ? 'Great Dane' : 'Freightliner'}
                    className={inputCls}
                  />
                </Field>
                <Field label="Model">
                  <input
                    value={form.model}
                    onChange={(e) => set({ model: e.target.value })}
                    placeholder={type === 'TRAILER' ? 'Everest' : 'Cascadia'}
                    className={inputCls}
                  />
                </Field>
                <Field label="Year">
                  <input type="number" min="1970" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => set({ year: e.target.value })} placeholder="2020" className={inputCls} />
                </Field>
                {type === 'TRUCK' ? (
                  <>
                    <Field label="Mileage">
                      <input type="number" min="0" value={form.mileage} onChange={(e) => set({ mileage: e.target.value })} placeholder="450000" className={inputCls} />
                    </Field>
                    <Field label="Engine">
                      <input value={form.engine} onChange={(e) => set({ engine: e.target.value })} placeholder="Detroit DD15" className={inputCls} />
                    </Field>
                    <Field label="Transmission">
                      <select value={form.transmission} onChange={(e) => set({ transmission: e.target.value })} className={inputCls}>
                        <option value="">Select</option>
                        {TRANSMISSIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Trailer type">
                      <select value={form.trailerType} onChange={(e) => set({ trailerType: e.target.value })} className={inputCls}>
                        <option value="">Select type</option>
                        {TRAILER_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Length (ft)">
                      <input type="number" min="0" value={form.lengthFt} onChange={(e) => set({ lengthFt: e.target.value })} placeholder="53" className={inputCls} />
                    </Field>
                  </>
                )}
                <Field label="VIN" className={type === 'TRUCK' ? '' : 'sm:col-span-2'}>
                  <input
                    value={form.vin}
                    onChange={(e) => set({ vin: e.target.value.toUpperCase() })}
                    maxLength={17}
                    placeholder="1FUJGHDV8LLLH1234"
                    className={`${inputCls} font-mono uppercase`}
                  />
                </Field>
              </>
            )}

            <Field label="Condition" className="sm:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set({ condition: c.value })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      form.condition === c.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder={
                  isPart
                    ? 'Condition details, hours or miles on it, why it was removed, warranty, shipping or pickup…'
                    : 'Maintenance history, tires, recent repairs, accident history, anything a buyer should know…'
                }
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Price & location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={isPart && Number(form.quantity) > 1 ? 'Price per unit ($) *' : 'Asking price ($) *'}>
              <input type="number" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder={isPart ? '1200' : '65000'} className={inputCls} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="Houston" className={inputCls} />
            </Field>
            <Field label="State *">
              <select value={form.state} onChange={(e) => set({ state: e.target.value })} className={inputCls}>
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Photos</h2>
          <p className="text-sm text-gray-500 mb-4">Up to 5. Listings with clear photos sell faster.</p>
          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                  aria-label="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">Add</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
                    setPhotos([...photos, ...files].slice(0, 5))
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
          {photos.length === 0 && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> JPG/PNG, up to 5 MB each
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {user?.role === 'admin' ? 'Publish listing' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}

export default SellEquipmentPage
