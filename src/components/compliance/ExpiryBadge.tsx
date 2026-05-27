// Color-coded chip for document expiry dates.
// Green > 90d, blue 60–90d, amber 30–60d, red < 30d, dark red expired, gray no date.

interface Props {
  expiresOn?: string | null
  className?: string
}

export default function ExpiryBadge({ expiresOn, className = '' }: Props) {
  if (!expiresOn) {
    return <span className={`text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 ${className}`}>No expiry</span>
  }
  const ms = new Date(expiresOn).getTime() - Date.now()
  const days = Math.ceil(ms / 86_400_000)

  let cls: string
  let label: string
  if (days < 0) {
    cls = 'bg-red-100 text-red-800 border border-red-300'
    label = `Expired ${Math.abs(days)}d ago`
  } else if (days <= 30) {
    cls = 'bg-red-50 text-red-700 border border-red-200'
    label = `${days}d left`
  } else if (days <= 60) {
    cls = 'bg-amber-50 text-amber-700 border border-amber-200'
    label = `${days}d left`
  } else if (days <= 90) {
    cls = 'bg-blue-50 text-blue-700 border border-blue-200'
    label = `${days}d left`
  } else {
    cls = 'bg-green-50 text-green-700 border border-green-200'
    label = `${days}d left`
  }
  return <span title={new Date(expiresOn).toLocaleDateString()} className={`text-[10px] font-medium px-2 py-0.5 rounded ${cls} ${className}`}>{label}</span>
}
