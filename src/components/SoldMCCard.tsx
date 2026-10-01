import { MapPin, BadgeCheck, Briefcase, Calendar, Lock } from 'lucide-react'
import Card from './ui/Card'
import { AUTHORITY_TYPE_BADGE_LABELS, normalizeAuthorityType } from '../constants/authority'

interface SoldMCCardProps {
  listing: {
    state?: string | null
    authorityType?: string | null
    soldMonth?: string | null // YYYY-MM
  }
}

// A sold authority is the parties' business. The backend sends only state,
// authority type and sale month — nothing that could be looked back up to the
// MC — so the card shows that a sale happened and no more.
const SoldMCCard = ({ listing }: SoldMCCardProps) => {
  const soldLabel = listing.soldMonth
    ? new Date(`${listing.soldMonth}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null

  return (
    <Card className="relative overflow-hidden opacity-75">
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 shadow-sm">
          <BadgeCheck className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold tracking-wide text-white">SOLD</span>
        </div>
      </div>

      <div className="rounded-xl -mx-2 -mt-2 mb-3 px-4 py-3 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {AUTHORITY_TYPE_BADGE_LABELS[normalizeAuthorityType(listing.authorityType || 'MOTOR_CARRIER')]} Authority
        </h3>
        {listing.state && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="font-medium">{listing.state}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
          <Lock className="w-4 h-4" />
          Details Confidential
        </div>
        {soldLabel && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{soldLabel}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-medium text-sm bg-emerald-100 text-emerald-700 cursor-default">
        <Briefcase className="w-4 h-4" />
        Sold on Domilea
      </div>
    </Card>
  )
}

export default SoldMCCard
