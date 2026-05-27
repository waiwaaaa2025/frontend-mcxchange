import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sparkles, Loader2, Wrench, X, Plus, MessagesSquare, ArrowUp, Package, TrendingUp, Wrench as WrenchIcon, MapPin, ShieldCheck, Search, Activity, FileSearch,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import agentsApi from '../../services/agentsApi'

interface Step {
  tool: string
  args: Record<string, unknown>
  ok: boolean
  durationMs?: number
  errorMessage?: string
}

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  steps?: Step[]
  createdAt: string
}

interface ConversationSummary {
  id: string
  title: string | null
  lastMessageAt: string | null
  createdAt: string
}

interface Suggestion {
  icon: typeof Search
  iconColor: string
  text: string
}

const SUGGESTIONS_BY_ROLE: Record<string, Suggestion[]> = {
  admin: [
    { icon: Search, iconColor: 'text-cyan-400', text: 'Show me carriers in TX with insurance expiring in 30 days' },
    { icon: FileSearch, iconColor: 'text-emerald-400', text: 'Run due diligence on DOT 3602389' },
    { icon: ShieldCheck, iconColor: 'text-amber-400', text: 'Which leads need attention this week?' },
    { icon: Activity, iconColor: 'text-pink-400', text: 'What\'s Scout been working on?' },
  ],
  seller: [
    { icon: Package, iconColor: 'text-cyan-400', text: 'What\'s the status of my listings?' },
    { icon: TrendingUp, iconColor: 'text-emerald-400', text: 'Show me offers I\'ve received' },
    { icon: Activity, iconColor: 'text-amber-400', text: 'Analytics on my newest listing' },
    { icon: WrenchIcon, iconColor: 'text-pink-400', text: 'How are my transactions doing?' },
  ],
  buyer: [
    { icon: Search, iconColor: 'text-cyan-400', text: 'Find TX trucking businesses under $200k' },
    { icon: MapPin, iconColor: 'text-emerald-400', text: 'Show me my saved listings' },
    { icon: TrendingUp, iconColor: 'text-amber-400', text: 'How many credits do I have left?' },
    { icon: Package, iconColor: 'text-pink-400', text: 'Status of my offers sent' },
  ],
}

interface Props { open: boolean; onClose: () => void }

export default function EvaDrawer({ open, onClose }: Props) {
  const { user } = useAuth()
  const role = (user?.role || 'buyer').toLowerCase()
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      window.addEventListener('keydown', onKey)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function loadHistory() {
    try {
      const res = await agentsApi.evaListConversations()
      setConversations(res.data)
    } catch { /* ignore */ }
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || sending) return
    const optimistic: Message = { id: `o-${Date.now()}`, role: 'USER', content: msg, createdAt: new Date().toISOString() }
    setMessages(m => [...m, optimistic])
    setInput('')
    setSending(true)
    setError(null)
    try {
      const res = await agentsApi.evaChat(msg, conversationId)
      setConversationId(res.data.conversationId)
      setMessages(m => [
        ...m,
        { id: `e-${Date.now()}`, role: 'ASSISTANT', content: res.data.reply, steps: res.data.steps, createdAt: new Date().toISOString() },
      ])
    } catch (e: any) {
      setError(e.message || 'Send failed')
      setMessages(m => m.filter(x => x.id !== optimistic.id))
      setInput(msg)
    } finally {
      setSending(false)
    }
  }

  function newChat() {
    setConversationId(null)
    setMessages([])
    setShowHistory(false)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function openConversation(id: string) {
    try {
      const res = await agentsApi.evaGetConversation(id)
      setConversationId(id)
      setMessages(res.data.messages.map(m => ({
        id: m.id, role: m.role, content: m.content, steps: m.steps as Step[] | undefined, createdAt: m.createdAt,
      })))
      setShowHistory(false)
    } catch (e: any) {
      setError(e.message || 'Failed to open conversation')
    }
  }

  function toggleHistory() {
    setShowHistory(s => {
      if (!s) void loadHistory()
      return !s
    })
  }

  const suggestions = SUGGESTIONS_BY_ROLE[role] || SUGGESTIONS_BY_ROLE.buyer
  const isEmpty = messages.length === 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Transparent click-catcher so clicking outside still closes the drawer */}
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0a0a14] text-white shadow-2xl z-50 flex flex-col"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% -10%, rgba(139,92,246,0.18), transparent 55%), radial-gradient(circle at 100% 100%, rgba(236,72,153,0.10), transparent 55%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
              <AvatarRing size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-[15px] leading-tight">Eva</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">AI · Alpha</div>
              </div>
              <IconButton onClick={newChat} title="New chat"><Plus className="w-4 h-4" /></IconButton>
              <IconButton onClick={toggleHistory} active={showHistory} title="Conversations"><MessagesSquare className="w-4 h-4" /></IconButton>
              <IconButton onClick={onClose} title="Close"><X className="w-4 h-4" /></IconButton>
            </div>

            {/* History list (slides over body when toggled) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="border-b border-white/[0.06] bg-[#0a0a14]/95 backdrop-blur"
                >
                  <button onClick={newChat} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors border-b border-white/[0.05]">
                    <Plus className="w-4 h-4" /> New chat
                  </button>
                  <div className="max-h-64 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <div className="px-4 py-6 text-xs text-gray-500 text-center">No conversations yet.</div>
                    ) : (
                      conversations.map(c => (
                        <button
                          key={c.id}
                          onClick={() => openConversation(c.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors ${conversationId === c.id ? 'bg-white/[0.06]' : ''}`}
                        >
                          <div className="text-gray-200 truncate">{c.title || 'Untitled'}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : new Date(c.createdAt).toLocaleString()}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isEmpty ? (
                <div className="pt-2">
                  <AvatarRing size={56} className="mb-5" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">Hey {firstName}.</h2>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                    I’m your AI compliance manager. I can see your leads, carriers, listings, and the agent team for <span className="text-white font-medium">Domilea</span>. Ask me anything.
                  </p>

                  <div className="mt-8">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Try asking</div>
                    <div className="space-y-2">
                      {suggestions.map(s => (
                        <button
                          key={s.text}
                          onClick={() => send(s.text)}
                          className="w-full flex items-center gap-3 px-3 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-left transition-colors"
                        >
                          <s.icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                          <span className="text-sm text-gray-200">{s.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(m => <Bubble key={m.id} msg={m} />)}
                  {sending && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Eva is thinking…
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded p-2">{error}</div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/[0.06] p-3 shrink-0">
              <div className="relative bg-white/[0.05] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-indigo-400/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Ask Eva anything…"
                  rows={1}
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none focus:outline-none pr-9 max-h-32"
                  style={{ lineHeight: '1.4' }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || sending}
                  className="absolute right-2 bottom-2 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-colors"
                  title="Send"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <ArrowUp className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 text-center mt-2 leading-snug">
                Eva can make mistakes. Verify anything that moves money or affects compliance.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function AvatarRing({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-pink-400 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-[#0a0a14] flex items-center justify-center">
        <Sparkles className="text-white" style={{ width: size * 0.42, height: size * 0.42 }} />
      </div>
    </div>
  )
}

function IconButton({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title?: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center text-gray-300 hover:text-white transition-colors ${active ? 'bg-white/[0.08]' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
    >
      {children}
    </button>
  )
}

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'USER') {
    return (
      <div className="flex justify-end">
        <div className="bg-indigo-500/20 border border-indigo-500/30 text-white px-3.5 py-2 rounded-2xl rounded-br-md max-w-[85%] text-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2.5 max-w-full">
      <AvatarRing size={28} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="bg-white/[0.04] border border-white/[0.06] px-3.5 py-2.5 rounded-2xl rounded-tl-md whitespace-pre-wrap text-sm text-gray-100">
          {msg.content}
        </div>
        {msg.steps && msg.steps.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {msg.steps.map((s, i) => (
              <span
                key={i}
                title={`${JSON.stringify(s.args)} · ${s.durationMs ?? 0}ms${s.errorMessage ? ' · ' + s.errorMessage : ''}`}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  s.ok ? 'bg-white/[0.04] border-white/[0.08] text-gray-400' : 'bg-red-500/10 border-red-500/20 text-red-300'
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

// Header trigger — small circular dark button with gradient sparkle + pink dot indicator
export function EvaTriggerButton({ onClick, unread = true }: { onClick: () => void; unread?: boolean }) {
  return (
    <button
      onClick={onClick}
      title="Ask Eva"
      className="relative w-9 h-9 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 flex items-center justify-center transition-colors group"
    >
      <Sparkles className="w-4 h-4 text-pink-400 group-hover:text-pink-300 transition-colors" />
      {unread && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.7)]" />
      )}
    </button>
  )
}
