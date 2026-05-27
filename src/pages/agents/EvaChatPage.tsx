import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronLeft, Send, Loader2, Plus, Trash2, Wrench } from 'lucide-react'
import agentsApi from '../../services/agentsApi'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  steps?: Array<{ tool: string; args: Record<string, unknown>; ok: boolean; durationMs?: number; errorMessage?: string }>
  createdAt: string
}

interface ConvSummary {
  id: string
  title: string | null
  lastMessageAt: string | null
  createdAt: string
}

export default function EvaChatPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConvSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { void loadList() }, [])
  useEffect(() => { if (activeId) void loadConversation(activeId); else setMessages([]) }, [activeId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadList() {
    try {
      const res = await agentsApi.evaListConversations()
      setConversations(res.data)
    } catch (e: any) { setError(e.message) }
  }

  async function loadConversation(id: string) {
    try {
      const res = await agentsApi.evaGetConversation(id)
      setMessages(res.data.messages)
    } catch (e: any) { setError(e.message) }
  }

  async function send() {
    if (!input.trim() || sending) return
    const userMessage = input.trim()
    const optimisticUser: Message = {
      id: `optimistic-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages(m => [...m, optimisticUser])
    setInput('')
    setSending(true)
    setError(null)
    try {
      const res = await agentsApi.evaChat(userMessage, activeId)
      const newConvId = res.data.conversationId
      if (newConvId !== activeId) {
        setActiveId(newConvId)
        await loadList()
      }
      setMessages(m => [
        ...m,
        {
          id: `eva-${Date.now()}`,
          role: 'ASSISTANT',
          content: res.data.reply,
          steps: res.data.steps,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (e: any) {
      setError(e.message || 'Send failed')
      setMessages(m => m.filter(x => x.id !== optimisticUser.id))
      setInput(userMessage)
    } finally { setSending(false) }
  }

  async function deleteConv(id: string) {
    try {
      await agentsApi.evaDeleteConversation(id)
      if (activeId === id) setActiveId(null)
      await loadList()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/admin/team')} className="text-gray-500 hover:text-gray-900" title="Back to Team">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Eva</h1>
          <p className="text-xs text-gray-500">Admin operator · gpt-4o</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Conversation sidebar */}
        <aside className="col-span-3 border-r bg-white overflow-y-auto flex flex-col">
          <button onClick={() => setActiveId(null)} className="m-3 px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New conversation
          </button>
          <ul className="divide-y">
            {conversations.length === 0 && (
              <li className="px-4 py-6 text-xs text-gray-400 text-center">No conversations yet.</li>
            )}
            {conversations.map(c => (
              <li
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 group ${activeId === c.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-gray-900 truncate flex-1">{c.title || 'Untitled'}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConv(c.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : new Date(c.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread */}
        <main className="col-span-9 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-16">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                Ask Eva something. She has tools for searching carriers, looking up leads, and pulling live LINQ reports.
                <div className="mt-4 flex justify-center gap-2 flex-wrap text-xs">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setInput(s)} className="px-3 py-1.5 bg-white border rounded-full hover:border-gray-400">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Eva is thinking…
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t bg-white p-4">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask Eva… (Shift+Enter for newline)"
                rows={2}
                className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'Who am I?',
  'How many leads are in the pipeline by status?',
  'Show me carriers in TX with insurance expiring in 30 days',
  'Look up DOT 3939259',
]

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-2xl whitespace-pre-wrap text-sm">
          {msg.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-white border px-4 py-2.5 rounded-2xl rounded-tl-md whitespace-pre-wrap text-sm text-gray-900">
          {msg.content}
        </div>
        {msg.steps && msg.steps.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {msg.steps.map((s, i) => (
              <span
                key={i}
                title={`${JSON.stringify(s.args)} · ${s.durationMs ?? 0}ms${s.errorMessage ? ' · ' + s.errorMessage : ''}`}
                className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  s.ok ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <Wrench className="w-2.5 h-2.5" /> {s.tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
