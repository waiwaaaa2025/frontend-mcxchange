import { Link, NavLink } from 'react-router-dom'
import { Truck as TruckIcon, Container, Wrench, MapPin, ShieldCheck } from 'lucide-react'
import { MarketCard, equipmentTitle, equipmentTypeLabel, fmtPrice } from '../utils/equipment'

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

export const itemIcon = (type: string) => (type === 'PART' ? Wrench : type === 'TRAILER' ? Container : TruckIcon)

/** Marketplace card for a truck, trailer or part. */
const MarketItemCard = ({ item }: { item: MarketCard }) => {
  const Icon = itemIcon(item.equipmentType)
  const specs = [
    item.equipmentType === 'TRUCK' && item.mileage != null ? `${item.mileage.toLocaleString()} mi` : null,
    item.equipmentType === 'TRAILER' && item.lengthFt ? `${item.lengthFt} ft` : null,
    item.equipmentType === 'PART' && item.partNumber ? `#${item.partNumber}` : null,
    item.equipmentType === 'PART' && item.quantity && item.quantity > 1 ? `Qty ${item.quantity}` : null,
    item.condition ? titleCase(item.condition) : null,
  ].filter(Boolean)

  return (
    <Link
      to={`/equipment/${item.id}`}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {item.photo ? (
          <img
            src={item.photo}
            alt={equipmentTitle(item)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {item.withAuthority && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold bg-white/95 text-indigo-700 px-2 py-1 rounded-full shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Sold with authority
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" /> {equipmentTypeLabel(item)}
        </p>
        <h3 className="mt-1 font-bold text-gray-900 leading-snug line-clamp-2">{equipmentTitle(item)}</h3>
        {specs.length > 0 && <p className="mt-1 text-sm text-gray-500">{specs.join(' · ')}</p>}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <p className="text-lg font-black text-emerald-600">
            {fmtPrice(item.price) || <span className="text-sm font-semibold text-gray-500">Price on request</span>}
          </p>
          {item.state && (
            <p className="text-xs text-gray-500 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              {[item.city, item.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

/** Authorities / Equipment / Parts switcher shown atop each marketplace section. */
export const MarketSectionTabs = () => (
  <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
    {[
      { to: '/marketplace', label: 'Authorities' },
      { to: '/equipment', label: 'Equipment' },
      { to: '/parts', label: 'Parts' },
    ].map((t) => (
      <NavLink
        key={t.to}
        to={t.to}
        end
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
          }`
        }
      >
        {t.label}
      </NavLink>
    ))}
  </div>
)

export default MarketItemCard
