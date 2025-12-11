"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  id: string
  other_user: {
    id: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    user_type: string
  }
  last_message: {
    content: string
    created_at: string
  } | null
  unread_count: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          return
        }

        setCurrentUserId(session.user.id)

        // Fetch cases with unique lawyers
        const { data: casesData } = await supabase
          .from("cases")
          .select(`
            id,
            lawyer_id,
            updated_at,
            lawyer:profiles!cases_lawyer_id_fkey (
              id,
              first_name,
              last_name,
              avatar_url,
              user_type
            )
          `)
          .eq("client_id", session.user.id)
          .not("lawyer_id", "is", null)
          .order("updated_at", { ascending: false })

        if (!casesData || casesData.length === 0) {
          setConversations([])
          setIsLoading(false)
          return
        }

        // Deduplicate by lawyer_id - keep only the most recent case per lawyer
        const uniqueLawyers = new Map<string, typeof casesData[0]>()
        casesData.forEach(c => {
          if (c.lawyer && c.lawyer_id && !uniqueLawyers.has(c.lawyer_id)) {
            uniqueLawyers.set(c.lawyer_id, c)
          }
        })

        // Fetch last message for each case
        const conversationsWithMessages = await Promise.all(
          Array.from(uniqueLawyers.values()).map(async (c) => {
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("content, created_at")
              .eq("case_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            // Count unread messages (messages from lawyer that client hasn't read)
            const { count: unreadCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("case_id", c.id)
              .eq("sender_id", c.lawyer_id)
              .eq("is_read", false)

            return {
              id: c.id,
              other_user: {
                id: c.lawyer.id,
                first_name: c.lawyer.first_name,
                last_name: c.lawyer.last_name,
                avatar_url: c.lawyer.avatar_url,
                user_type: c.lawyer.user_type,
              },
              last_message: lastMsg || null,
              unread_count: unreadCount || 0,
            }
          })
        )

        setConversations(conversationsWithMessages)
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [toast])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      try {
        const supabase = createClient()

        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("case_id", selectedConversation)
          .order("created_at", { ascending: true })

        setMessages(data || [])
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessages()
  }, [selectedConversation])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return

    try {
      setIsSending(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("messages")
        .insert({
          case_id: selectedConversation,
          sender_id: currentUserId,
          content: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setMessages([...messages, data])
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversations List - Scrollable */}
        <aside className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any active cases with lawyers
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Book a lawyer to start messaging
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const userName = `${conv.other_user.first_name || ""} ${conv.other_user.last_name || ""}`.trim() || "Lawyer"

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={cn(
                      "w-full p-4 flex items-start gap-3 hover:bg-accent transition-colors border-b border-border text-left",
                      selectedConversation === conv.id && "bg-accent"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={conv.other_user.avatar_url || undefined} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{userName}</p>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDate(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message.content}
                        </p>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full mt-1">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                {conversations.find(c => c.id === selectedConversation) && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={conversations.find(c => c.id === selectedConversation)?.other_user.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {`${conversations.find(c => c.id === selectedConversation)?.other_user.first_name || ""}`.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {`${conversations.find(c => c.id === selectedConversation)?.other_user.first_name || ""} ${conversations.find(c => c.id === selectedConversation)?.other_user.last_name || ""}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">Lawyer</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserId

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwnMessage ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwnMessage
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Fixed at Bottom */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon">
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
