// Control metadata for the generic AgentPolicyPage editor.
// Each agent slug maps a policy key → how to render its control.
// Backend already exposes `policyKeys` per task via GET /api/agents/:slug/tasks.
// The intersection of (server-declared keys) and (locally-known controls) is what the UI renders.

export type ControlType = 'boolean' | 'number' | 'select' | 'text'

export interface ControlSpec {
  type: ControlType
  label: string
  help?: string
  group?: string
  // For select
  options?: Array<{ value: string | number; label: string }>
  // For number
  min?: number
  max?: number
  step?: number
}

export const AGENT_POLICY_CONTROLS: Record<string, Record<string, ControlSpec>> = {
  scout: {
    auto_enrich_enabled: {
      type: 'boolean',
      label: 'Auto-enrich new leads',
      help: 'Scout runs an AI analysis on every Lead the moment it’s saved. Disable to make enrichment manual-only.',
      group: 'Lead enrichment',
    },
    auto_enrich_confidence_min: {
      type: 'number',
      label: 'Auto-apply confidence threshold',
      help: 'Only auto-apply enrichment to Lead.notes when the LLM returns at least this confidence (0.0–1.0).',
      group: 'Lead enrichment',
      min: 0,
      max: 1,
      step: 0.05,
    },
    weekly_digest_enabled: {
      type: 'boolean',
      label: 'Weekly digest enabled',
      help: 'Scout sends a per-rep weekly summary of pipeline health and upcoming insurance cancellations.',
      group: 'Weekly digest',
    },
    weekly_digest_day_of_week: {
      type: 'select',
      label: 'Digest day',
      help: 'Which day of the week the digest fires.',
      group: 'Weekly digest',
      options: [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
        { value: 0, label: 'Sunday' },
      ],
    },
  },
  eva: {
    chat_enabled: {
      type: 'boolean',
      label: 'Chat enabled',
      help: 'Master switch for Eva chat. Disable to take her offline.',
      group: 'General',
    },
  },
}
