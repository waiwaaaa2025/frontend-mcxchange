import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

interface Props {
  onCancel: () => void
  onSubmit: (body: any) => Promise<void>
}

export default function AddDriverModal({ onCancel, onSubmit }: Props) {
  const [fullName, setFullName] = useState('')
  const [cdlNumber, setCdlNumber] = useState('')
  const [cdlState, setCdlState] = useState('')
  const [cdlExpiresOn, setCdlExpiresOn] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'ONBOARDING' | 'INACTIVE' | 'TERMINATED'>('ACTIVE')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setErr('Full name required'); return }
    setSaving(true); setErr(null)
    try {
      await onSubmit({
        fullName: fullName.trim(),
        cdlNumber: cdlNumber.trim() || undefined,
        cdlState: cdlState || undefined,
        cdlExpiresOn: cdlExpiresOn || undefined,
        hireDate: hireDate || undefined,
        status,
        notes: notes.trim() || undefined,
      })
      onCancel()
    } catch (e: any) {
      setErr(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onCancel} />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Add driver</h3>
            <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Full name</span>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm" autoFocus />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">CDL #</span>
                <input value={cdlNumber} onChange={e => setCdlNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">CDL state</span>
                <select value={cdlState} onChange={e => setCdlState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm">
                  <option value="">—</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">CDL expires</span>
                <input type="date" value={cdlExpiresOn} onChange={e => setCdlExpiresOn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
              </label>
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">Hire date</span>
                <input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Status</span>
              <select value={status} onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm">
                <option value="ACTIVE">Active</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Notes</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
            </label>
            {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
