import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  Plus,
  Wrench,
  Search,
  ShieldCheck,
  FileWarning,
  Activity,
} from 'lucide-react'
import agentsApi from '../../services/agentsApi'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  steps?: Array<{
    tool: string
    args: Record<string, unknown>
    ok: boolean
    durationMs?: number
    errorMessage?: string
  }>
  createdAt: string
}

interface ConvSummary {
  id: string
  title: string | null
  lastMessageAt: string | null
  createdAt: string
}

const SUGGESTIONS = [
  { icon: Search, color: 'text-cyan-600', text: 'What companies am I tracking?' },
  {
    icon: FileWarning,
    color: 'text-amber-600',
    text: 'What documents are expiring in the next 30 days?',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    text: 'How are my SMS BASIC scores looking?',
  },
  { icon: Activity, color: 'text-pink-600', text: 'What changed across my carriers this week?' },
]

const SLUG = 'dia'

export default function CompDiaChatPage() {
  const [conversations, setConversations] = useState<ConvSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    void loadList()
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    if (activeId) void loadConversation(activeId)
    else setMessages([])
  }, [activeId])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadList() {
    try {
      const res = await agentsApi.listAgentConversations(SLUG)
      setConversations(res.data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function loadConversation(id: string) {
    try {
      const res = await agentsApi.getAgentConversation(SLUG, id)
      setMessages(res.data.messages)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function send(text?: string) {
    const userMessage = (text ?? input).trim()
    if (!userMessage || sending) return
    const optimistic: Message = {
      id: `o-${Date.now()}`,
      role: 'USER',
      content: userMessage,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, optimistic])
    setInput('')
    setSending(true)
    setError(null)
    try {
      const res = await agentsApi.chatWithAgent(SLUG, userMessage, activeId)
      if (!activeId) {
        setActiveId(res.data.conversationId)
        void loadList()
      }
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'ASSISTANT',
          content: res.data.reply,
          steps: res.data.steps,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (e: any) {
      setError(e.message || 'Send failed')
      setMessages((m) => m.filter((x) => x.id !== optimistic.id))
      setInput(userMessage)
    } finally {
      setSending(false)
    }
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Conversation sidebar */}
      <aside
        className="w-64 border-r flex flex-col"
        style={{
          borderColor: 'var(--linq-border)',
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--linq-border)' }}>
          <button
            onClick={newChat}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-sm font-medium shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {conversations.length === 0 ? (
            <div
              className="px-4 py-6 text-xs text-center"
              style={{ color: 'var(--linq-muted)' }}
            >
              No conversations yet.
            </div>
          ) : (
            conversations.map((c) => {
              const active = activeId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b transition-colors ${
                    active ? 'bg-cyan-50/70' : 'hover:bg-slate-100/70'
                  }`}
                  style={{ borderColor: 'var(--linq-border)' }}
                >
                  <div className="text-slate-800 truncate font-medium">
                    {c.title || 'Untitled'}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--linq-muted)' }}>
                    {c.lastMessageAt
                      ? new Date(c.lastMessageAt).toLocaleString()
                      : new Date(c.createdAt).toLocaleString()}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Chat thread */}
      <main
        className="flex-1 flex flex-col"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 800px 400px at 50% -100px, rgba(8,145,178,0.10), transparent 60%), radial-gradient(circle at 100% 100%, rgba(139,92,246,0.06), transparent 55%)',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center gap-3 px-6 py-3 border-b"
          style={{ borderColor: 'var(--linq-border)' }}
        >
          <AvatarRing size={36} />
          <div>
            <div className="font-semibold text-slate-900">Dia</div>
            <div
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--linq-muted)' }}
            >
              AI compliance manager · Alpha
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {isEmpty ? (
            <div className="max-w-2xl mx-auto pt-12 fadein">
              <AvatarRing size={64} className="mb-5" />
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Hey there.
              </h2>
              <p
                className="text-base mt-3 leading-relaxed max-w-md"
                style={{ color: 'var(--linq-muted)' }}
              >
                I&apos;m Dia — your AI compliance manager. I monitor every carrier you&apos;ve
                added, watch SMS scores, track document expirations, and explain how to keep
                your fleet in good standing. Ask me anything.
              </p>
              <div className="mt-8">
                <div
                  className="text-[10px] uppercase tracking-wider mb-3"
                  style={{ color: 'var(--linq-muted)' }}
                >
                  Try asking
                </div>
                <div className="space-y-2 max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => send(s.text)}
                      className="card w-full flex items-center gap-3 px-4 py-3 text-left hover:shadow-md transition-shadow"
                    >
                      <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                      <span className="text-sm text-slate-800">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {sending && (
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--linq-muted)' }}
                >
                  <Loader2 className="w-3 h-3 animate-spin" /> Dia is thinking…
                </div>
              )}
              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-4" style={{ borderColor: 'var(--linq-border)' }}>
          <div className="max-w-3xl mx-auto">
            <div
              className="relative card px-4 py-3 focus-within:ring-2 focus-within:ring-cyan-500/30"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask Dia anything…"
                rows={1}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none pr-9 max-h-32"
                style={{ lineHeight: '1.4' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-30 inline-flex items-center justify-center shadow-md shadow-cyan-500/20"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p
              className="text-[10px] text-center mt-2 leading-snug"
              style={{ color: 'var(--linq-muted)' }}
            >
              Dia can make mistakes. Verify anything that affects regulatory compliance or
              driver qualifications.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function AvatarRing({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative rounded-full p-[2px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 shrink-0 shadow-lg shadow-cyan-500/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
        <Sparkles
          className="text-cyan-600"
          style={{ width: size * 0.42, height: size * 0.42 }}
        />
      </div>
    </div>
  )
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] text-sm whitespace-pre-wrap shadow-md shadow-cyan-500/20">
          {msg.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AvatarRing size={32} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="card px-4 py-2.5 rounded-2xl rounded-tl-md whitespace-pre-wrap text-sm text-slate-800">
          {msg.content}
        </div>
        {msg.steps && msg.steps.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.steps.map((s, i) => (
              <span
                key={i}
                title={`${JSON.stringify(s.args)} · ${s.durationMs ?? 0}ms${
                  s.errorMessage ? ' · ' + s.errorMessage : ''
                }`}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                  s.ok
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-red-50 border-red-200 text-red-700'
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
