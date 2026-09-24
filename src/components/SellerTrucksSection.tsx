import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck as TruckIcon, X, ArrowRight } from 'lucide-react'
import { EquipmentItem, equipmentTitle, equipmentTypeLabel, fmtPrice } from '../utils/equipment'

interface Props {
  trucks: EquipmentItem[] | undefined
  isUnlocked: boolean
}

const conditionColor = (c: string | null | undefined) => {
  switch (c) {
    case 'EXCELLENT':
      return 'bg-emerald-100 text-emerald-700'
    case 'GOOD':
      return 'bg-blue-100 text-blue-700'
    case 'FAIR':
      return 'bg-amber-100 text-amber-700'
    case 'POOR':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const fmtMiles = (n: number | null) =>
  n == null ? null : `${n.toLocaleString()} mi`

const SellerTrucksSection = ({ trucks, isUnlocked }: Props) => {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!trucks || trucks.length === 0) return null

  return (
    <div className="max-w-7xl mx-auto px-4 my-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-indigo-500" />
            {trucks.length === 1 ? 'Equipment Included in Sale' : `${trucks.length} Pieces of Equipment Included`}
          </h2>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-medium">
            Turnkey package
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {trucks.map((truck) => (
            <div key={truck.id} className="p-6 flex flex-col md:flex-row gap-5">
              {/* Photos */}
              <div className="md:w-56 flex-shrink-0">
                {truck.photos && truck.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {truck.photos.slice(0, 4).map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setLightbox(photo.url)}
                        className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                          idx === 0 && truck.photos!.length === 1
                            ? 'col-span-2 aspect-video'
                            : 'aspect-square'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={equipmentTitle(truck)}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {idx === 3 && truck.photos!.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-semibold">
                            +{truck.photos!.length - 4}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <TruckIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">No photos</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-0.5">
                      {equipmentTypeLabel(truck)}
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">{equipmentTitle(truck)}</h3>
                    {fmtPrice(truck.price) && (
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">{fmtPrice(truck.price)}</p>
                    )}
                  </div>
                  {truck.condition && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${conditionColor(
                        truck.condition
                      )}`}
                    >
                      {truck.condition.charAt(0) + truck.condition.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 mb-3">
                  {truck.lengthFt != null && (
                    <span>
                      <span className="text-gray-400">Length:</span>{' '}
                      <span className="font-medium text-gray-900">{truck.lengthFt} ft</span>
                    </span>
                  )}
                  {truck.engine && (
                    <span>
                      <span className="text-gray-400">Engine:</span>{' '}
                      <span className="font-medium text-gray-900">{truck.engine}</span>
                    </span>
                  )}
                  {truck.transmission && (
                    <span>
                      <span className="text-gray-400">Transmission:</span>{' '}
                      <span className="font-medium text-gray-900">{truck.transmission}</span>
                    </span>
                  )}
                  {truck.mileage != null && (
                    <span>
                      <span className="text-gray-400">Mileage:</span>{' '}
                      <span className="font-medium text-gray-900">{fmtMiles(truck.mileage)}</span>
                    </span>
                  )}
                  {truck.vin && (
                    <span>
                      <span className="text-gray-400">VIN:</span>{' '}
                      {isUnlocked ? (
                        <span className="font-mono text-gray-900">{truck.vin}</span>
                      ) : (
                        <span className="font-mono blur-[5px] select-none pointer-events-none">
                          XXXXXXXXXXXXXXXXX
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {truck.description && (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {truck.description}
                  </p>
                )}

                <Link
                  to={`/equipment/${truck.id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View equipment page <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

export default SellerTrucksSection
