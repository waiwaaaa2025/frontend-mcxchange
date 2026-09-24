import { useState } from 'react'
import { Truck as TruckIcon, Container, Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react'
import {
  EquipmentFormValue,
  EquipmentType,
  EquipmentCondition,
  TRAILER_TYPES,
  emptyEquipment,
} from '../utils/equipment'

// Kept for existing imports; the section now covers trucks and trailers.
export type TruckFormValue = EquipmentFormValue
export const emptyTruck = () => emptyEquipment('TRUCK')

interface Props {
  value: EquipmentFormValue[]
  onChange: (equipment: EquipmentFormValue[]) => void
}

const CONDITIONS: Array<{ value: EquipmentCondition; label: string }> = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
]

const TRANSMISSIONS = ['Manual', 'Automatic', 'Automated Manual']

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm'

const Field = ({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    {children}
  </div>
)

const TruckFormSection = ({ value, onChange }: Props) => {
  const [enabled, setEnabled] = useState(value.length > 0)

  const setEnabledAndSync = (next: boolean) => {
    setEnabled(next)
    if (next && value.length === 0) onChange([emptyEquipment('TRUCK')])
    if (!next) onChange([])
  }

  const update = (index: number, patch: Partial<EquipmentFormValue>) => {
    onChange(value.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const remove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next)
    if (next.length === 0) setEnabled(false)
  }

  const add = (type: EquipmentType) => onChange([...value, emptyEquipment(type)])

  const addPhotos = (index: number, files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'))
    update(index, { photos: [...value[index].photos, ...incoming].slice(0, 5) })
  }

  const removePhoto = (index: number, photoIndex: number) => {
    update(index, { photos: value[index].photos.filter((_, i) => i !== photoIndex) })
  }

  const counts = value.reduce(
    (acc, e) => ({ ...acc, [e.equipmentType]: acc[e.equipmentType] + 1 }),
    { TRUCK: 0, TRAILER: 0 } as Record<EquipmentType, number>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
        <TruckIcon className="w-5 h-5 text-indigo-500" />
        Are you also selling equipment?
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Optional — list trucks or trailers with this authority. Each piece gets its own listing page with photos and
        price.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setEnabledAndSync(true)}
          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
            enabled
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
          }`}
        >
          Yes, selling equipment
        </button>
        <button
          type="button"
          onClick={() => setEnabledAndSync(false)}
          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
            !enabled
              ? 'border-gray-500 bg-gray-100 text-gray-700'
              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
          }`}
        >
          No
        </button>
      </div>

      {enabled && (
        <div className="space-y-4">
          {value.map((item, index) => {
            const trailer = item.equipmentType === 'TRAILER'
            const ordinal = value.slice(0, index + 1).filter((e) => e.equipmentType === item.equipmentType).length
            return (
              <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50/40">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    {trailer ? (
                      <Container className="w-4 h-4 text-indigo-500" />
                    ) : (
                      <TruckIcon className="w-4 h-4 text-indigo-500" />
                    )}
                    {trailer ? 'Trailer' : 'Truck'} {counts[item.equipmentType] > 1 ? ordinal : ''}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                      {(['TRUCK', 'TRAILER'] as EquipmentType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update(index, { equipmentType: t })}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                            item.equipmentType === t ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {t === 'TRUCK' ? 'Truck' : 'Trailer'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Make *">
                    <input
                      type="text"
                      value={item.make}
                      onChange={(e) => update(index, { make: e.target.value })}
                      placeholder={trailer ? 'Great Dane' : 'Freightliner'}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Model">
                    <input
                      type="text"
                      value={item.model}
                      onChange={(e) => update(index, { model: e.target.value })}
                      placeholder={trailer ? 'Everest' : 'Cascadia'}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Year">
                    <input
                      type="number"
                      value={item.year}
                      onChange={(e) => update(index, { year: e.target.value })}
                      placeholder="2020"
                      min="1970"
                      max={new Date().getFullYear() + 1}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Asking Price ($)">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => update(index, { price: e.target.value })}
                      placeholder={trailer ? '25000' : '65000'}
                      min="0"
                      className={inputCls}
                    />
                  </Field>

                  {trailer ? (
                    <>
                      <Field label="Trailer Type">
                        <select
                          value={item.trailerType}
                          onChange={(e) => update(index, { trailerType: e.target.value })}
                          className={`${inputCls} bg-white`}
                        >
                          <option value="">Select type</option>
                          {TRAILER_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Length (ft)">
                        <input
                          type="number"
                          value={item.lengthFt}
                          onChange={(e) => update(index, { lengthFt: e.target.value })}
                          placeholder="53"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Mileage">
                        <input
                          type="number"
                          value={item.mileage}
                          onChange={(e) => update(index, { mileage: e.target.value })}
                          placeholder="450000"
                          min="0"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Engine">
                        <input
                          type="text"
                          value={item.engine}
                          onChange={(e) => update(index, { engine: e.target.value })}
                          placeholder="Detroit DD15"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Transmission" className="col-span-2 sm:col-span-1">
                        <select
                          value={item.transmission}
                          onChange={(e) => update(index, { transmission: e.target.value })}
                          className={`${inputCls} bg-white`}
                        >
                          <option value="">Select</option>
                          {TRANSMISSIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}

                  <Field label="VIN" className={trailer ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
                    <input
                      type="text"
                      value={item.vin}
                      onChange={(e) => update(index, { vin: e.target.value.toUpperCase() })}
                      placeholder={trailer ? '1GRAA0621KB123456' : '1FUJGHDV8LLLH1234'}
                      maxLength={17}
                      className={`${inputCls} font-mono uppercase`}
                    />
                  </Field>

                  <Field label="Condition" className="col-span-2">
                    <div className="grid grid-cols-4 gap-2">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => update(index, { condition: c.value })}
                          className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                            item.condition === c.value
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Description" className="col-span-2">
                    <textarea
                      value={item.description}
                      onChange={(e) => update(index, { description: e.target.value })}
                      rows={3}
                      placeholder={
                        trailer
                          ? 'Floor, doors, tires, reefer unit hours, recent repairs, etc.'
                          : 'Recent maintenance, modifications, accident history, tires, etc.'
                      }
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Photos (up to 5)</label>
                    <div className="flex flex-wrap gap-2">
                      {item.photos.map((photo, pIdx) => (
                        <div key={pIdx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index, pIdx)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {item.photos.length < 5 && (
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              addPhotos(index, e.target.files)
                              e.target.value = ''
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    {item.photos.length === 0 && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> JPG/PNG, up to 5 MB each
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => add('TRUCK')}
              className="py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add truck
            </button>
            <button
              type="button"
              onClick={() => add('TRAILER')}
              className="py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add trailer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TruckFormSection
