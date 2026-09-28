import { useState } from 'react'
import {
  Truck, Link2, History, Phone, AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Info,
} from 'lucide-react'
import Card from '../ui/Card'
import type {
  ChameleonIntel, ChameleonIntelSeverity, ChameleonLinkedCarrier, ChameleonSharedVin,
} from '../../types'

const SEVERITY_STYLE: Record<ChameleonIntelSeverity, string> = {
  critical: 'bg-red-50 border-red-200 text-red-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  low: 'bg-blue-50 border-blue-200 text-blue-800',
  info: 'bg-gray-50 border-gray-200 text-gray-700',
}

const REASON_LABEL: Record<string, string> = {
  vin: 'Shared trucks',
  phone: 'Same phone',
  email: 'Same email',
  officer: 'Same officer',
  address: 'Same address',
  prior_revoke: 'FMCSA prior-revocation link',
}

const RELATION_LABEL: Record<ChameleonSharedVin['relation'], string> = {
  came_from: 'Came from them',
  went_to: 'Went to them',
  overlap: 'Both at the same time',
}

const SOURCE_LABEL: Record<string, string> = {
  inspections: 'Roadside inspections',
  fmcsa_files: 'FMCSA records disagree',
  domilea_history: 'Domilea history',
}

function StatusBadge({ status }: { status: ChameleonLinkedCarrier['status'] }) {
  const style = status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}>{status}</span>
}

function DotLink({ dot, onCheckDot }: { dot: string; onCheckDot: (dot: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onCheckDot(dot)}
      className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
      title="Run a Chameleon Check on this DOT"
    >
      DOT {dot}
    </button>
  )
}

function EquipmentRow({ lc, onCheckDot }: { lc: ChameleonLinkedCarrier; onCheckDot: (dot: string) => void }) {
  const [open, setOpen] = useState(false)
  const trucks = lc.sharedVins.filter((v) => v.unitType === 'power_unit').length
  const trailers = lc.sharedVins.length - trucks
  const relations = [...new Set(lc.sharedVins.map((v) => RELATION_LABEL[v.relation]))]

  return (
    <div className="border border-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-2 p-3 text-left hover:bg-gray-50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-gray-900">DOT {lc.dotNumber}</span>
            <StatusBadge status={lc.status} />
            {lc.reasons.filter((r) => r !== 'vin').map((r) => (
              <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{REASON_LABEL[r] || r}</span>
            ))}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {lc.legalName || 'Unknown carrier'}
            {lc.location ? ` · ${lc.location}` : ''}
            {lc.powerUnits != null ? ` · ${lc.powerUnits} trucks` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-700">
            {trucks > 0 && <strong>{trucks} truck{trucks > 1 ? 's' : ''}</strong>}
            {trucks > 0 && trailers > 0 && ' · '}
            {trailers > 0 && `${trailers} trailer${trailers > 1 ? 's' : ''}`}
          </span>
          <span className="text-xs text-gray-500 hidden md:inline">{relations.join(' / ')}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-1.5 pr-3 font-medium">VIN</th>
                  <th className="py-1.5 pr-3 font-medium">Type</th>
                  <th className="py-1.5 pr-3 font-medium">Under DOT {lc.dotNumber}</th>
                  <th className="py-1.5 pr-3 font-medium">Under this carrier</th>
                  <th className="py-1.5 font-medium">Direction</th>
                </tr>
              </thead>
              <tbody>
                {lc.sharedVins.map((v) => (
                  <tr key={v.vin} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3 font-mono text-gray-900">{v.vin}</td>
                    <td className="py-1.5 pr-3 text-gray-600">{v.unitType === 'power_unit' ? 'Truck' : 'Trailer'}{v.make ? ` · ${v.make}` : ''}</td>
                    <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">{v.theirFirstSeen} → {v.theirLastSeen}</td>
                    <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">{v.ourFirstSeen} → {v.ourLastSeen}</td>
                    <td className="py-1.5 text-gray-700 whitespace-nowrap">{RELATION_LABEL[v.relation]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <DotLink dot={lc.dotNumber} onCheckDot={onCheckDot} />
            <span className="text-xs text-gray-500"> — run a check on this carrier</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  intel: ChameleonIntel
  onCheckDot: (dot: string) => void
}

export default function ChameleonIntelPanel({ intel, onCheckDot }: Props) {
  const [showAllEquipment, setShowAllEquipment] = useState(false)
  const equipmentLinks = intel.linkedCarriers.filter((lc) => lc.sharedVins.length > 0)
  const contactLinks = intel.linkedCarriers.filter((lc) => lc.reasons.some((r) => r !== 'vin'))
  const visibleEquipment = showAllEquipment ? equipmentLinks : equipmentLinks.slice(0, 10)
  const names = intel.identityTimeline.filter((p) => p.kind === 'name')
  const addresses = intel.identityTimeline.filter((p) => p.kind === 'address')
  const c = intel.current

  return (
    <div className="space-y-6">
      {/* Flags */}
      <Card padding="md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            FMCSA Cross-Reference
          </h3>
          <span className="text-sm text-gray-500 whitespace-nowrap">Score <strong className="text-gray-900">{intel.score}</strong>/100</span>
        </div>
        {intel.flags.length === 0 ? (
          <p className="text-sm text-gray-600">No shared equipment, shared contact details or identity changes found.</p>
        ) : (
          <div className="space-y-2">
            {intel.flags.map((f) => (
              <div key={f.id} className={`p-3 rounded-lg border ${SEVERITY_STYLE[f.severity]}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{f.severity}</span>
                  <p className="text-sm font-semibold">{f.title}</p>
                </div>
                <p className="text-xs mt-1 opacity-90 break-words">{f.detail}</p>
              </div>
            ))}
          </div>
        )}
        {intel.sourcesFailed.length > 0 && (
          <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Some FMCSA sources didn't respond, so this check may be incomplete. Try again in a few minutes.
          </p>
        )}
      </Card>

      {/* Equipment under other DOTs */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          Same VINs Under Other DOT Numbers
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Every truck and trailer inspected under this carrier, matched against roadside inspections of every other carrier
          ({intel.equipment.vinsChecked} VINs from {intel.equipment.inspectionsChecked} inspections
          {intel.equipment.truncated ? ', most recent fleet only' : ''}).
        </p>
        {equipmentLinks.length === 0 ? (
          <p className="text-sm text-gray-600">
            {intel.equipment.vinsChecked === 0
              ? 'No roadside inspections on record, so there are no VINs to cross-check.'
              : 'None of this carrier\'s VINs have been inspected under another DOT number.'}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {visibleEquipment.map((lc) => <EquipmentRow key={lc.dotNumber} lc={lc} onCheckDot={onCheckDot} />)}
            </div>
            {equipmentLinks.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllEquipment(!showAllEquipment)}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                {showAllEquipment ? 'Show fewer' : `Show all ${equipmentLinks.length} DOT numbers`}
              </button>
            )}
          </>
        )}
      </Card>

      {/* Contact / officer / address overlap */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-500" />
          Other DOTs With the Same Phone, Email, Officer or Address
        </h3>
        <p className="text-xs text-gray-500 mb-3">Matched against every carrier in the FMCSA census.</p>
        {contactLinks.length === 0 ? (
          <p className="text-sm text-gray-600">No other carrier shares this carrier's phone, email, officers or street address.</p>
        ) : (
          <div className="space-y-2">
            {contactLinks.map((lc) => (
              <div key={lc.dotNumber} className="p-3 rounded-lg border border-gray-100 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <DotLink dot={lc.dotNumber} onCheckDot={onCheckDot} />
                  <StatusBadge status={lc.status} />
                  <span className="text-gray-700 min-w-0 break-words">{lc.legalName || 'Unknown'}</span>
                </div>
                {lc.addDate && (
                  <p className="text-xs text-gray-400 mt-0.5">Registered {lc.addDate}{lc.location ? ` · ${lc.location}` : ''}</p>
                )}
                <p className="text-xs text-gray-600 mt-1 break-words">
                  {lc.matchDetail.join(' · ')}
                  {lc.sharedVins.length > 0 && ` · ${lc.sharedVins.length} shared VIN${lc.sharedVins.length > 1 ? 's' : ''}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Identity changes */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          Ownership & Identity Changes
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          FMCSA doesn't publish a history of phone, email or officer changes, so we piece it together from roadside
          inspections, FMCSA records updated on different schedules, and every earlier check run on Domilea.
        </p>
        {intel.identityChanges.length === 0 ? (
          <p className="text-sm text-gray-600">No name, address, phone, email or officer changes detected.</p>
        ) : (
          <div className="space-y-2">
            {intel.identityChanges.map((ch, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{ch.field}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{SOURCE_LABEL[ch.source]}</span>
                  {ch.when && <span className="text-xs text-gray-500">{ch.when}</span>}
                </div>
                <p className="text-gray-700 break-words">
                  <span className="line-through text-gray-400">{ch.from || '—'}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-medium">{ch.to || '—'}</span>
                </p>
              </div>
            ))}
          </div>
        )}
        {(names.length > 1 || addresses.length > 1) && (
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {[{ title: 'Names on inspections', list: names }, { title: 'Addresses on inspections', list: addresses }].map(({ title, list }) => (
              <div key={title}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
                <ul className="space-y-1.5 text-xs">
                  {list.map((p) => (
                    <li key={p.value} className="text-gray-700">
                      <span className="font-medium">{p.value}</span>
                      <span className="block text-gray-500">{p.firstSeen} → {p.lastSeen} · {p.inspections} inspections</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contact on file */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-indigo-500" />
          Contact & Officers on File
        </h3>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ['Phone', c.phone],
            ['Cell phone', c.cellPhone],
            ['Fax', c.fax],
            ['Email', c.email],
            ['Officers', c.officers.join(', ')],
            ['Physical address', c.physicalAddress],
            ['Mailing address', c.mailingAddress !== c.physicalAddress ? c.mailingAddress : 'Same as physical'],
            ['DOT registered', c.addDate],
            ['Last MCS-150 update', c.mcs150Date],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between gap-4 py-1.5 border-b border-gray-100">
              <span className="text-gray-500 flex-shrink-0">{label}</span>
              <span className="font-medium text-gray-900 text-right break-words min-w-0">{value || '—'}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-start gap-1">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          We save these details every time this carrier is checked, so later checks can show when the phone, email or officers change.
        </p>
      </Card>
    </div>
  )
}
