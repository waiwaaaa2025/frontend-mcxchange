import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronLeft, Send, Loader2, Plus, Wrench, Search, ShieldCheck, FileWarning, Activity } from 'lucide-react'
import agentsApi from '../../services/agentsApi'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  steps?: Array<{ tool: string; args: Record<string, unknown>; ok: boolean; durationMs?: number; errorMessage?: string }>
  createdAt: string
}

interface ConvSummary { id: string; title: string | null; lastMessageAt: string | null; createdAt: string }

const SUGGESTIONS = [
  { icon: Search, color: 'text-cyan-400', text: 'What companies am I tracking?' },
  { icon: FileWarning, color: 'text-amber-400', text: 'What documents are expiring in the next 30 days?' },
  { icon: ShieldCheck, color: 'text-emerald-400', text: 'How are my SMS BASIC scores looking?' },
  { icon: Activity, color: 'text-pink-400', text: 'What changed across my carriers this week?' },
]

const SLUG = 'dia'

export default function CompDiaChatPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConvSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { void loadList(); inputRef.current?.focus() }, [])
  useEffect(() => { if (activeId) void loadConversation(activeId); else setMessages([]) }, [activeId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadList() {
    try {
      const res = await agentsApi.listAgentConversations(SLUG)
      setConversations(res.data)
    } catch (e: any) { setError(e.message) }
  }

  async function loadConversation(id: string) {
    try {
      const res = await agentsApi.getAgentConversation(SLUG, id)
      setMessages(res.data.messages)
    } catch (e: any) { setError(e.message) }
  }

  async function send(text?: string) {
    const userMessage = (text ?? input).trim()
    if (!userMessage || sending) return
    const optimistic: Message = { id: `o-${Date.now()}`, role: 'USER', content: userMessage, createdAt: new Date().toISOString() }
    setMessages(m => [...m, optimistic])
    setInput(''); setSending(true); setError(null)
    try {
      const res = await agentsApi.chatWithAgent(SLUG, userMessage, activeId)
      if (!activeId) { setActiveId(res.data.conversationId); void loadList() }
      setMessages(m => [
        ...m,
        { id: `e-${Date.now()}`, role: 'ASSISTANT', content: res.data.reply, steps: res.data.steps, createdAt: new Date().toISOString() },
      ])
    } catch (e: any) {
      setError(e.message || 'Send failed')
      setMessages(m => m.filter(x => x.id !== optimistic.id))
      setInput(userMessage)
    } finally { setSending(false) }
  }

  function newChat() {
    setActiveId(null); setMessages([]); setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#0a0a14] text-white flex">
      {/* Conversation sidebar */}
      <aside className="w-64 border-r border-white/[0.06] flex flex-col">
        <div className="p-3 border-b border-white/[0.06]">
          <button onClick={() => navigate('/compliance/dashboard')} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-3">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button onClick={newChat} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-sm text-white">
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="px-4 py-6 text-xs text-gray-500 text-center">No conversations yet.</div>
          ) : (
            conversations.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.04] border-b border-white/[0.04] ${activeId === c.id ? 'bg-white/[0.08]' : ''}`}>
                <div className="text-gray-200 truncate">{c.title || 'Untitled'}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : new Date(c.createdAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Chat thread */}
      <main className="flex-1 flex flex-col"
        style={{ backgroundImage: 'radial-gradient(circle at 50% -10%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.10), transparent 55%)' }}>
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
          <AvatarRing size={36} />
          <div>
            <div className="font-semibold text-white">Dia</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">AI compliance manager · Alpha</div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEmpty ? (
            <div className="max-w-2xl mx-auto pt-12">
              <AvatarRing size={64} className="mb-5" />
              <h2 className="text-3xl font-bold text-white tracking-tight">Hey there.</h2>
              <p className="text-base text-gray-400 mt-3 leading-relaxed max-w-md">
                I'm Dia — your AI compliance manager. I monitor every carrier you've added, watch SMS scores, track document expirations, and explain how to keep your fleet in good standing. Ask me anything.
              </p>
              <div className="mt-8">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Try asking</div>
                <div className="space-y-2 max-w-lg">
                  {SUGGESTIONS.map(s => (
                    <button key={s.text} onClick={() => send(s.text)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-left transition-colors">
                      <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                      <span className="text-sm text-gray-200">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map(m => <Bubble key={m.id} msg={m} />)}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Dia is thinking…
                </div>
              )}
              {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-indigo-400/40">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask Dia anything…"
                rows={1}
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none pr-9 max-h-32"
                style={{ lineHeight: '1.4' }}
              />
              <button onClick={() => send()} disabled={!input.trim() || sending}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center">
                {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2 leading-snug">
              Dia can make mistakes. Verify anything that affects regulatory compliance or driver qualifications.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function AvatarRing({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-pink-400 shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full bg-[#0a0a14] flex items-center justify-center">
        <Sparkles className="text-white" style={{ width: size * 0.42, height: size * 0.42 }} />
      </div>
    </div>
  )
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="bg-indigo-500/20 border border-indigo-500/30 text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] text-sm whitespace-pre-wrap">{msg.content}</div>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AvatarRing size={32} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 rounded-2xl rounded-tl-md whitespace-pre-wrap text-sm text-gray-100">{msg.content}</div>
        {msg.steps && msg.steps.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.steps.map((s, i) => (
              <span key={i} title={`${JSON.stringify(s.args)} · ${s.durationMs ?? 0}ms${s.errorMessage ? ' · ' + s.errorMessage : ''}`}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${s.ok ? 'bg-white/[0.04] border-white/[0.08] text-gray-400' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                <Wrench className="w-2.5 h-2.5" /> {s.tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
