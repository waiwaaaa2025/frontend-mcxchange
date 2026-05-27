import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle, CheckCircle2, Save, Sliders } from 'lucide-react'
import agentsApi from '../../services/agentsApi'
import { AGENT_POLICY_CONTROLS, type ControlSpec } from '../../config/agentPolicyControls'

interface PoliciesPayload {
  defaults: Record<string, unknown>
  overrides: Record<string, unknown>
  merged: Record<string, unknown>
}

export default function AgentPolicyPage() {
  const { slug = 'scout' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [policies, setPolicies] = useState<PoliciesPayload | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => { void load() }, [slug])

  async function load() {
    setLoading(true)
    try {
      const res = await agentsApi.policies(slug)
      setPolicies(res.data)
      setValues({ ...res.data.merged })
      setDirty(new Set())
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load policies')
    } finally {
      setLoading(false)
    }
  }

  function setValue(key: string, v: unknown) {
    setValues(prev => ({ ...prev, [key]: v }))
    setDirty(prev => new Set(prev).add(key))
  }

  async function save() {
    if (dirty.size === 0) return
    setSaving(true)
    setError(null)
    try {
      const patch: Record<string, unknown> = {}
      for (const k of dirty) patch[k] = values[k]
      await agentsApi.updatePolicies(slug, patch)
      setSavedAt(new Date())
      setDirty(new Set())
      // Re-pull so the merged view shows the new state
      await load()
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const controls = AGENT_POLICY_CONTROLS[slug] || {}
  // Show only keys that exist BOTH server-side (in defaults) AND locally (in controls).
  const renderableKeys = Object.keys(controls).filter(k => policies && (k in (policies.defaults as object)))

  // Group by group label
  const groups: Record<string, string[]> = {}
  for (const k of renderableKeys) {
    const g = controls[k].group || 'General'
    if (!groups[g]) groups[g] = []
    groups[g].push(k)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(`/admin/team/${slug}`)} className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to {slug}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">{slug} · Policies</h1>
            <p className="text-sm text-gray-500">Per-user overrides on top of the agent's defaults. Changes apply on the next task run.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white border rounded-lg p-8 flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading policies…
          </div>
        ) : renderableKeys.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-sm text-gray-500">
            No editable policies for <code>{slug}</code> yet.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([groupLabel, keys]) => (
              <section key={groupLabel} className="bg-white border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <h2 className="text-sm font-semibold text-gray-700">{groupLabel}</h2>
                </div>
                <div className="divide-y">
                  {keys.map(key => (
                    <PolicyRow
                      key={key}
                      controlKey={key}
                      spec={controls[key]}
                      value={values[key]}
                      defaultValue={policies?.defaults[key]}
                      isOverride={policies?.overrides && key in policies.overrides}
                      isDirty={dirty.has(key)}
                      onChange={v => setValue(key, v)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Sticky save bar */}
        {renderableKeys.length > 0 && (
          <div className="sticky bottom-4 mt-6 flex items-center justify-between bg-white border rounded-lg shadow-md px-4 py-3">
            <div className="text-xs text-gray-500">
              {dirty.size > 0 ? `${dirty.size} unsaved change${dirty.size === 1 ? '' : 's'}`
                : savedAt ? <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>Saved at {savedAt.toLocaleTimeString()}</span>
                : 'No changes'}
            </div>
            <button
              onClick={save}
              disabled={saving || dirty.size === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PolicyRow({
  controlKey, spec, value, defaultValue, isOverride, isDirty, onChange,
}: {
  controlKey: string
  spec: ControlSpec
  value: unknown
  defaultValue: unknown
  isOverride: boolean | undefined
  isDirty: boolean
  onChange: (v: unknown) => void
}) {
  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="font-medium text-gray-900 text-sm">{spec.label}</label>
          {isOverride && !isDirty && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">Override</span>
          )}
          {isDirty && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Unsaved</span>
          )}
        </div>
        {spec.help && <p className="text-xs text-gray-500 mt-1">{spec.help}</p>}
        <p className="text-[10px] text-gray-400 mt-1">Default: <code>{JSON.stringify(defaultValue)}</code> · Key: <code>{controlKey}</code></p>
      </div>
      <div className="shrink-0 w-44">
        {spec.type === 'boolean' && (
          <button
            onClick={() => onChange(!value)}
            className={`w-12 h-7 rounded-full transition-colors flex items-center ${value ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'}`}
          >
            <span className="w-6 h-6 rounded-full bg-white shadow mx-0.5" />
          </button>
        )}
        {spec.type === 'number' && (
          <input
            type="number"
            value={Number(value ?? 0)}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full px-2 py-1.5 text-sm border rounded"
          />
        )}
        {spec.type === 'select' && spec.options && (
          <select
            value={String(value)}
            onChange={e => onChange(spec.options!.find(o => String(o.value) === e.target.value)?.value ?? e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded"
          >
            {spec.options.map(o => (
              <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
            ))}
          </select>
        )}
        {spec.type === 'text' && (
          <input
            type="text"
            value={String(value ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded"
          />
        )}
      </div>
    </div>
  )
}
