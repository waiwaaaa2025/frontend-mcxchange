import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Search, MessageSquare, User } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

interface Conversation {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string | null
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  listingId?: string
  listingTitle?: string
  mcNumber?: string
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

const BuyerMessagesPage = () => {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getMessageConversations()
        const fetched = response.data || []

        const listingIds = Array.from(
          new Set(fetched.map((conv) => conv.listingId).filter(Boolean))
        ) as string[]

        const listingMap = new Map<string, { title?: string; mcNumber?: string }>()
        await Promise.all(
          listingIds.map(async (listingId) => {
            try {
              const listingResponse = await api.getListing(listingId)
              listingMap.set(listingId, {
                title: listingResponse.data?.title,
                mcNumber: listingResponse.data?.mcNumber,
              })
            } catch {
              listingMap.set(listingId, {})
            }
          })
        )

        const mapped = fetched.map((conv) => ({
          ...conv,
          listingTitle: conv.listingId ? listingMap.get(conv.listingId)?.title : undefined,
          mcNumber: conv.listingId ? listingMap.get(conv.listingId)?.mcNumber : undefined,
        }))

        setConversations(mapped)
        if (mapped.length > 0 && !selectedConversation) {
          setSelectedConversation(mapped[0].participantId)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return
      try {
        const response = await api.getMessageConversation(selectedConversation)
        setMessages(response.data || [])
        setConversations((prev) =>
          prev.map((conv) =>
            conv.participantId === selectedConversation
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        )
      } catch (err: any) {
        setError(err.message || 'Failed to load messages')
      }
    }

    loadMessages()
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return
    try {
      setSending(true)
      const activeConversation = conversations.find(
        (conv) => conv.participantId === selectedConversation
      )
      const response = await api.sendMessage(
        selectedConversation,
        message.trim(),
        activeConversation?.listingId
      )
      const newMessage = response.data as Message
      setMessages((prev) => [...prev, newMessage])
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === selectedConversation
            ? {
                ...conv,
                lastMessage: newMessage.content,
                lastMessageAt: newMessage.createdAt,
              }
            : conv
        )
      )
      setMessage('')
    } catch (err: any) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      conv.participantName.toLowerCase().includes(term) ||
      (conv.listingTitle || '').toLowerCase().includes(term)
    )
  })

  const selectedConversationData = conversations.find(
    (conv) => conv.participantId === selectedConversation
  )

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
          <p className="text-gray-500">Communicate with our team</p>
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading messages...</h3>
              <p className="text-gray-500">Fetching your conversations</p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load messages</h3>
              <p className="text-gray-500">{error}</p>
            </div>
          </Card>
        ) : conversations.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500 mb-6">
                Start a conversation by contacting our team from a listing
              </p>
              <Link to="/marketplace">
                <Button>Browse Marketplace</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card>
                <div className="mb-4">
                  <Input
                    placeholder="Search conversations..."
                    icon={<Search className="w-4 h-4" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.participantId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedConversation === conv.participantId
                          ? 'bg-gray-100 border border-gray-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-semibold text-sm text-gray-900">{conv.participantName}</div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {conv.listingTitle || 'Business Inquiry'}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1">{conv.lastMessage}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {format(new Date(conv.lastMessageAt), 'MMM d, yyyy h:mm a')}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {selectedConversationData?.participantName || 'Support Team'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedConversationData?.listingTitle || 'Business Inquiry'}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-lg ${
                            msg.senderId === user?.id
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm mb-1">{msg.content}</p>
                          <div className="text-xs opacity-70">
                            {format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button onClick={handleSendMessage} disabled={sending}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyerMessagesPage
