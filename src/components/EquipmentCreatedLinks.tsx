import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { EquipmentItem, equipmentTitle, equipmentTypeLabel, fmtPrice } from '../utils/equipment'

/** Success-screen list of the equipment pages a new listing created. */
const EquipmentCreatedLinks = ({ equipment }: { equipment?: EquipmentItem[] | null }) => {
  if (!equipment || equipment.length === 0) return null
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
      <p className="text-sm font-semibold text-gray-900 mb-2">Equipment pages</p>
      <ul className="space-y-1.5">
        {equipment.map((e) => (
          <li key={e.id}>
            <Link
              to={`/equipment/${e.id}`}
              className="flex items-center justify-between gap-3 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <span className="truncate">
                {equipmentTitle(e)} <span className="text-gray-500">· {equipmentTypeLabel(e)}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {fmtPrice(e.price) && <span className="text-gray-700 font-medium">{fmtPrice(e.price)}</span>}
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default EquipmentCreatedLinks
