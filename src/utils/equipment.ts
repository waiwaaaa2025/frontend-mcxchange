import api from '../services/api'

export type EquipmentType = 'TRUCK' | 'TRAILER' | 'PART'
export type EquipmentCondition = '' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'

/** One truck or trailer as edited in the create-listing forms. */
export interface EquipmentFormValue {
  equipmentType: EquipmentType
  make: string
  model: string
  year: string
  mileage: string
  vin: string
  condition: EquipmentCondition
  description: string
  price: string
  trailerType: string
  lengthFt: string
  engine: string
  transmission: string
  photos: File[]
}

/** Equipment as the API returns it. */
export interface EquipmentItem {
  id: string
  equipmentType?: EquipmentType | null
  make: string
  model: string
  year: number | null
  mileage: number | null
  vin: string | null
  condition: string | null
  description: string | null
  price?: number | null
  trailerType?: string | null
  lengthFt?: number | null
  engine?: string | null
  transmission?: string | null
  photos?: Array<{ id: string; url: string }>
  // Standalone equipment & parts
  listingId?: string | null
  status?: string
  city?: string | null
  state?: string | null
  name?: string | null
  partCategory?: string | null
  partNumber?: string | null
  quantity?: number | null
  fitment?: string | null
}

/** Marketplace card as the browse / my-items / admin endpoints return it. */
export interface MarketCard {
  id: string
  equipmentType: EquipmentType
  make: string
  model: string
  name: string | null
  year: number | null
  mileage: number | null
  price: number | null
  condition: string | null
  trailerType: string | null
  lengthFt: number | null
  partCategory: string | null
  partNumber: string | null
  quantity: number | null
  city: string | null
  state: string | null
  status: string
  withAuthority: boolean
  listingId: string | null
  photo: string | null
  createdAt: string
  reviewNote?: string | null
  // admin list only
  description?: string | null
  vin?: string | null
  fitment?: string | null
  seller?: { id: string; name: string; email: string } | null
}

/** A paid equipment/parts order, from the seller's (sale) or buyer's (purchase) side. */
export interface EquipmentOrder {
  id: string
  itemId: string
  itemName: string
  equipmentType: EquipmentType | null
  photo: string | null
  quantity: number
  amount: number
  paidAt: string
  // sales only
  platformFee?: number
  sellerPayout?: number
  buyer?: { id: string; name: string; email: string } | null
  buyerPhone?: string | null
  shippingAddress?: string | null
  // purchases only
  seller?: { id: string; name: string } | null
}

export const PART_CATEGORIES = [
  'Engine',
  'Transmission',
  'Drivetrain',
  'Brakes',
  'Suspension',
  'Tires & Wheels',
  'Electrical',
  'Cab & Interior',
  'Body & Exterior',
  'Exhaust & Aftertreatment',
  'Cooling',
  'Trailer Parts',
  'Reefer Units',
  'Other',
]

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC',
  'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

export const TRAILER_TYPES = [
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Step Deck',
  'Lowboy',
  'Conestoga',
  'Tanker',
  'Car Hauler',
  'Hopper',
  'Dump',
  'Other',
]

export const emptyEquipment = (equipmentType: EquipmentType = 'TRUCK'): EquipmentFormValue => ({
  equipmentType,
  make: '',
  model: '',
  year: '',
  mileage: '',
  vin: '',
  condition: '',
  description: '',
  price: '',
  trailerType: '',
  lengthFt: '',
  engine: '',
  transmission: '',
  photos: [],
})

const intOrNull = (v: string) => (v.trim() ? parseInt(v.replace(/[^\d]/g, ''), 10) || null : null)
const moneyOrNull = (v: string) => {
  const n = parseFloat(v.replace(/[$,\s]/g, ''))
  return isFinite(n) && n >= 0 ? n : null
}

/**
 * Items worth sending: a make is the one required field. The create pages send
 * `payload` and later pair the created ids with `items` by index, so both come
 * from the same filtered list.
 */
export function buildEquipmentPayload(list: EquipmentFormValue[]) {
  const items = list.filter((e) => e.make.trim())
  const payload = items.map((e) => {
    const trailer = e.equipmentType === 'TRAILER'
    return {
      equipmentType: e.equipmentType,
      make: e.make.trim(),
      model: e.model.trim(),
      year: intOrNull(e.year),
      mileage: trailer ? null : intOrNull(e.mileage),
      vin: e.vin.trim() || null,
      condition: e.condition || null,
      description: e.description.trim() || null,
      price: moneyOrNull(e.price),
      trailerType: trailer ? e.trailerType || null : null,
      lengthFt: trailer ? intOrNull(e.lengthFt) : null,
      engine: trailer ? null : e.engine.trim() || null,
      transmission: trailer ? null : e.transmission || null,
    }
  })
  return { items, payload }
}

/**
 * Upload each item's photos to the equipment the API just created (same order
 * as `items`). Returns how many items' photos failed so the page can say so.
 */
export async function uploadEquipmentPhotos(
  created: Array<{ id: string }> | undefined,
  items: EquipmentFormValue[]
): Promise<number> {
  let failed = 0
  for (let i = 0; i < items.length; i++) {
    const id = created?.[i]?.id
    if (!items[i].photos.length) continue
    if (!id) {
      failed++
      continue
    }
    try {
      await api.uploadTruckPhotos(id, items[i].photos)
    } catch (err) {
      console.error('Equipment photo upload failed', err)
      failed++
    }
  }
  return failed
}

// Parts are titled by their name; trucks and trailers by year/make/model.
export const equipmentTitle = (
  e: Pick<EquipmentItem, 'year' | 'make' | 'model'> & { name?: string | null; equipmentType?: string | null }
) => (e.equipmentType === 'PART' && e.name ? e.name : [e.year, e.make, e.model].filter(Boolean).join(' '))

export const equipmentTypeLabel = (
  e: Pick<EquipmentItem, 'equipmentType' | 'trailerType'> & { partCategory?: string | null }
) =>
  e.equipmentType === 'PART'
    ? e.partCategory ? `${e.partCategory} Part` : 'Part'
    : e.equipmentType === 'TRAILER'
      ? e.trailerType ? `${e.trailerType} Trailer` : 'Trailer'
      : 'Truck'

export const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  PENDING_REVIEW: { label: 'Pending review', cls: 'bg-amber-100 text-amber-800' },
  ACTIVE: { label: 'Live', cls: 'bg-emerald-100 text-emerald-700' },
  SOLD: { label: 'Sold', cls: 'bg-gray-200 text-gray-700' },
  REJECTED: { label: 'Not approved', cls: 'bg-red-100 text-red-700' },
}

export const fmtPrice = (n: number | null | undefined) =>
  n == null ? null : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
