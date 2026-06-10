import { useEffect, useState } from 'react'
import { Send, Search, MessageSquare, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { toast } from 'react-hot-toast'

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

const SellerMessagesPage = () => {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingNew, setSendingNew] = useState(false)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getMessageConversations()
        const fetched = response.data || []

        const mapped = fetched.map((conv: any) => ({
          ...conv,
          listingTitle: undefined,
          mcNumber: undefined,
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
      const response = await api.sendMessage(
        selectedConversation,
        message.trim()
      )
      const sent = response.data as Message
      setMessages((prev) => [...prev, sent])
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === selectedConversation
            ? { ...conv, lastMessage: sent.content, lastMessageAt: sent.createdAt }
            : conv
        )
      )
      setMessage('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSendNewMessage = async () => {
    if (!newMessage.trim()) return
    try {
      setSendingNew(true)
      await api.sendInquiryToAdmin(undefined, newMessage.trim())
      toast.success('Message sent to admin!')
      setNewMessage('')
      // Reload conversations to show the new one
      const response = await api.getMessageConversations()
      const fetched = response.data || []
      const mapped = fetched.map((conv: any) => ({
        ...conv,
        listingTitle: undefined,
        mcNumber: undefined,
      }))
      setConversations(mapped)
      if (mapped.length > 0) {
        setSelectedConversation(mapped[0].participantId)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSendingNew(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return conv.participantName.toLowerCase().includes(term)
  })

  const selectedConversationData = conversations.find(
    (conv) => conv.participantId === selectedConversation
  )

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Messages</h2>
          <p className="text-gray-500">Send a message to our team with any questions</p>
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
            <div className="max-w-lg mx-auto py-8">
              <div className="text-center mb-6">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Our Team</h3>
                <p className="text-gray-500">
                  Have a question about creating a listing, pricing your MC, or how the selling process works? Send us a message and we'll get back to you.
                </p>
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="Type your question here... (e.g. How should I price my MC? What documents will I need?)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendNewMessage()
                    }
                  }}
                />
                <Button
                  onClick={handleSendNewMessage}
                  disabled={sendingNew || !newMessage.trim()}
                  fullWidth
                >
                  {sendingNew ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message to Admin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
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
                <Card className="flex flex-col h-[70vh] lg:h-[600px]">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {selectedConversationData?.participantName || 'Domilea Support'}
                      </div>
                      <div className="text-xs text-gray-500">Admin Team</div>
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
                          className={`max-w-[70%] px-4 py-3 rounded-lg ${
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
                <Card className="h-[70vh] lg:h-[600px] flex items-center justify-center">
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

export default SellerMessagesPage
