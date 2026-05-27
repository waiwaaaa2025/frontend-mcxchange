import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

const COMPANY_KINDS = ['COI', 'AUTHORITY', 'MCS150', 'IFTA', 'IRP', 'UCR', 'DRUG_PROGRAM', 'BOC3', 'OTHER'] as const
const DRIVER_KINDS = ['MEDICAL_CARD', 'DOT_PHYSICAL', 'MVR', 'DRUG_TEST', 'ROAD_TEST', 'EMPLOYMENT_APP', 'BACKGROUND_CHECK', 'OTHER'] as const

interface Props {
  scope: 'company' | 'driver'
  onCancel: () => void
  onSubmit: (body: { kind: string; title: string; expiresOn?: string; notes?: string }) => Promise<void>
}

export default function AddDocumentModal({ scope, onCancel, onSubmit }: Props) {
  const kinds = scope === 'company' ? COMPANY_KINDS : DRIVER_KINDS
  const [kind, setKind] = useState<string>(kinds[0])
  const [title, setTitle] = useState('')
  const [expiresOn, setExpiresOn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setErr('Title required'); return }
    setSaving(true); setErr(null)
    try {
      await onSubmit({ kind, title: title.trim(), expiresOn: expiresOn || undefined, notes: notes.trim() || undefined })
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
            <h3 className="font-semibold text-gray-900">Add {scope === 'company' ? 'compliance' : 'driver'} document</h3>
            <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Kind</span>
              <select value={kind} onChange={e => setKind(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded text-sm">
                {kinds.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Title</span>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Certificate of Insurance — Progressive 2026"
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm" autoFocus />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Expires on (optional)</span>
              <input type="date" value={expiresOn} onChange={e => setExpiresOn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">Notes</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Policy number, insurer contact, file location…"
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
