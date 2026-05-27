const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('mcx_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return data as T
}

export interface CatalogAgent {
  slug: string
  name: string
  description: string
  category: 'OPERATIONS' | 'INSIGHTS' | 'COMMS' | 'ORCHESTRATOR'
  isAdminOnly: boolean
  isActive: boolean
  monthlyPrice: number | null
}

export interface AgentActionRow {
  id: string
  agentSlug: string
  actionType: string
  targetType: string | null
  targetId: string | null
  outputData: Record<string, unknown> | null
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  triggeredBy: string | null
  createdAt: string
}

export interface AgentJobRow {
  id: string
  agentSlug: string
  taskName: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  retryCount: number
  maxRetries: number
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
}

export const agentsApi = {
  catalog: () => request<{ success: boolean; data: CatalogAgent[] }>('/agents/catalog'),
  active: () => request<{ success: boolean; data: Array<{ id: string; agentSlug: string; status: string }> }>('/agents/active'),
  hire: (slug: string) => request<{ success: boolean; data: any }>(`/agents/${slug}/hire`, { method: 'POST' }),
  cancel: (slug: string) => request<{ success: boolean; data: any }>(`/agents/${slug}/cancel`, { method: 'POST' }),
  policies: (slug: string) => request<{ success: boolean; data: { defaults: Record<string, unknown>; overrides: Record<string, unknown>; merged: Record<string, unknown> } }>(`/agents/${slug}/policies`),
  updatePolicies: (slug: string, patch: Record<string, unknown>) =>
    request<{ success: boolean }>(`/agents/${slug}/policies`, { method: 'PUT', body: JSON.stringify(patch) }),
  tasks: (slug: string) => request<{ success: boolean; data: Array<{ name: string; summary: string; decisionAuthority: string }> }>(`/agents/${slug}/tasks`),
  activity: (slug: string, limit = 50) => request<{ success: boolean; data: AgentActionRow[] }>(`/agents/${slug}/activity?limit=${limit}`),
  jobs: (params: { agentSlug?: string; status?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.agentSlug) qs.set('agentSlug', params.agentSlug)
    if (params.status) qs.set('status', params.status)
    if (params.limit) qs.set('limit', String(params.limit))
    return request<{ success: boolean; data: AgentJobRow[] }>(`/agents/jobs?${qs}`)
  },
  cancelJob: (id: string) =>
    request<{ success: boolean }>(`/agents/jobs/${id}/cancel`, { method: 'POST' }),
  activityGlobal: (params: { agentSlug?: string; status?: string; targetType?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.agentSlug) qs.set('agentSlug', params.agentSlug)
    if (params.status) qs.set('status', params.status)
    if (params.targetType) qs.set('targetType', params.targetType)
    if (params.limit) qs.set('limit', String(params.limit))
    return request<{ success: boolean; data: AgentActionRow[] }>(`/agents/activity?${qs}`)
  },
  spend: (params: { from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams()
    if (params.from) qs.set('from', params.from)
    if (params.to) qs.set('to', params.to)
    return request<{
      success: boolean
      data: {
        from: string
        to: string
        series: Array<{ day: string; agentSlug: string; inputTokens: number; outputTokens: number; totalTokens: number; calls: number }>
        byAgent: Record<string, { inputTokens: number; outputTokens: number; totalTokens: number; calls: number }>
        today: { used: number; platformCap: number; userCap: number }
      }
    }>(`/agents/spend?${qs}`)
  },
  runScoutTask: (task: string, input?: Record<string, unknown>) =>
    request<{ success: boolean; data: { jobId: string } }>('/agents/admin/scout/run', {
      method: 'POST',
      body: JSON.stringify({ task, input: input || {} }),
    }),

  // ----- Eva chat -----
  evaChat: (message: string, conversationId?: string | null) =>
    request<{
      success: boolean
      data: {
        conversationId: string
        reply: string
        steps: Array<{ tool: string; args: Record<string, unknown>; ok: boolean; durationMs?: number; errorMessage?: string }>
      }
    }>('/agents/eva/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId: conversationId || null }),
    }),
  evaListConversations: () =>
    request<{ success: boolean; data: Array<{ id: string; title: string | null; lastMessageAt: string | null; createdAt: string }> }>(
      '/agents/eva/conversations'
    ),
  evaGetConversation: (id: string) =>
    request<{
      success: boolean
      data: {
        conversation: { id: string; title: string | null }
        messages: Array<{
          id: string
          role: 'USER' | 'ASSISTANT'
          content: string
          steps: any
          createdAt: string
        }>
      }
    }>(`/agents/eva/conversations/${id}`),
  evaDeleteConversation: (id: string) =>
    request<{ success: boolean }>(`/agents/eva/conversations/${id}`, { method: 'DELETE' }),

  // ----- Generic chat for any registered agent (Dia uses these) -----
  chatWithAgent: (slug: string, message: string, conversationId?: string | null) =>
    request<{
      success: boolean
      data: {
        conversationId: string
        reply: string
        steps: Array<{ tool: string; args: Record<string, unknown>; ok: boolean; durationMs?: number; errorMessage?: string }>
      }
    }>(`/agents/${slug}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, conversationId: conversationId || null }),
    }),
  listAgentConversations: (slug: string) =>
    request<{ success: boolean; data: Array<{ id: string; title: string | null; lastMessageAt: string | null; createdAt: string }> }>(
      `/agents/${slug}/conversations`
    ),
  getAgentConversation: (slug: string, id: string) =>
    request<{
      success: boolean
      data: {
        conversation: { id: string; title: string | null }
        messages: Array<{ id: string; role: 'USER' | 'ASSISTANT'; content: string; steps: any; createdAt: string }>
      }
    }>(`/agents/${slug}/conversations/${id}`),
}

export default agentsApi
