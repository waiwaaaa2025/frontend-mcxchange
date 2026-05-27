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
    if (!dotNumber.trim()) {
      setError('DOT number is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await complianceApi.addCompany({
        dotNumber: dotNumber.trim(),
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      navigate(`/compliance/companies/${res.data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to add company')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto fadein">
        <button
          onClick={() => navigate('/compliance/companies')}
          className="text-sm mb-4 inline-flex items-center gap-1 hover:text-slate-900"
          style={{ color: 'var(--linq-muted)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Companies
        </button>

        <div className="card p-6">
          <div
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--linq-muted)' }}
          >
            New carrier
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mt-1 mb-2">Add a company</h1>
          <p className="text-sm mb-5" style={{ color: 'var(--linq-muted)' }}>
            We&apos;ll pull live FMCSA data via LINQ — authority status, safety rating, insurance,
            fleet size, SMS BASIC scores — and start tracking compliance health.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 mb-1 block">DOT number *</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={dotNumber}
                  onChange={(e) => setDotNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 3602389"
                  inputMode="numeric"
                  autoFocus
                  className="w-full pl-10 pr-3 py-2 bg-white rounded-lg text-sm border focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  style={{ borderColor: 'var(--linq-border)' }}
                />
              </div>
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--linq-muted)' }}>
                Find a DOT at safer.fmcsa.dot.gov if you don&apos;t know yours.
              </span>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700 mb-1 block">
                Friendly label (optional)
              </span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Auto-filled from FMCSA if blank"
                className="w-full px-3 py-2 bg-white rounded-lg text-sm border focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                style={{ borderColor: 'var(--linq-border)' }}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700 mb-1 block">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes — main contact, fleet manager, etc."
                className="w-full px-3 py-2 bg-white rounded-lg text-sm border focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                style={{ borderColor: 'var(--linq-border)' }}
              />
            </label>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !dotNumber.trim()}
              className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Validating with FMCSA…' : 'Add company'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
