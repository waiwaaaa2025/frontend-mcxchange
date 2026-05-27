import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Search, AlertCircle } from 'lucide-react'
import complianceApi from '../../services/complianceApi'

export default function CompAddCompanyPage() {
  const navigate = useNavigate()
  const [dotNumber, setDotNumber] = useState('')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!dotNumber.trim()) { setError('DOT number is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await complianceApi.addCompany({
        dotNumber: dotNumber.trim(),
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      navigate(`/compliance/companies/${res.data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to add company')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/compliance/companies')} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to Companies
        </button>

        <div className="bg-white border rounded-xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Add a company</h1>
          <p className="text-sm text-gray-600 mb-5">
            We'll pull live FMCSA data via LINQ — authority status, safety rating, insurance, fleet size, SMS BASIC scores — and start tracking compliance health.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-700 mb-1 block">DOT number *</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={dotNumber}
                  onChange={e => setDotNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 3602389"
                  inputMode="numeric"
                  autoFocus
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Find a DOT at safer.fmcsa.dot.gov if you don't know yours.</span>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700 mb-1 block">Friendly label (optional)</span>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Auto-filled from FMCSA if blank"
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400" />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700 mb-1 block">Notes (optional)</span>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Internal notes — main contact, fleet manager, etc."
                className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-indigo-400" />
            </label>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={saving || !dotNumber.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Validating with FMCSA…' : 'Add company'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
