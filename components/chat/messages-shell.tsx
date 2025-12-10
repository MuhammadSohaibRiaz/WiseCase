"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MessageSquare, Paperclip, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { notifyMessage } from "@/lib/notifications"

type MessageStatus = "pending" | "scheduled" | "completed" | "cancelled" | "rescheduled" | "rejected"

interface ParticipantProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  avatar_url?: string | null
  user_type?: string | null
}

interface ConversationSummary {
  id: string
  title: string
  caseType?: string | null
  status: MessageStatus
  participant: ParticipantProfile | null
  participantId: string | null
  clientId: string
  lawyerId: string | null
  lastActivityAt?: string | null
}

interface ChatMessage {
  id: string
  case_id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface MessagesShellProps {
  userType: "client" | "lawyer"
}

const MESSAGE_LIMIT = 150

export function MessagesShell({ userType }: MessagesShellProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  const fetchCurrentUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to view your messages.",
        variant: "destructive",
      })
      return null
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", user.id)
      .single()

    setCurrentUserId(user.id)
    return user.id
  }, [supabase, toast])

  const loadUnreadCounts = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("messages")
        .select("case_id")
        .eq("recipient_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("[v0] Unread fetch error:", error)
        return
      }

      const counts = (data || []).reduce<Record<string, number>>((acc, item: any) => {
        acc[item.case_id] = (acc[item.case_id] || 0) + 1
        return acc
      }, {})

      setUnreadCounts(counts)
    },
    [supabase],
  )

  const loadConversations = useCallback(
    async (userId: string) => {
      try {
        setIsLoadingConversations(true)

        const { data, error } = await supabase
          .from("cases")
          .select(
            `
            id,
            title,
            case_type,
            status,
            updated_at,
            client_id,
            lawyer_id,
            client:profiles!cases_client_id_fkey (
              id,
              first_name,
              last_name,
              email,
              avatar_url,
              user_type
            ),
            lawyer:profiles!cases_lawyer_id_fkey (
              id,
              first_name,
              last_name,
              email,
              avatar_url,
              user_type
            )
          `,
          )
          .or(`client_id.eq.${userId},lawyer_id.eq.${userId}`)
          .order("updated_at", { ascending: false })

        if (error) throw error

        const missingParticipantIds = new Set<string>()

        const mapped: ConversationSummary[] = (data || []).map((caseItem: any) => {
          const participant = caseItem.client?.id === userId ? caseItem.lawyer : caseItem.client
          const participantId = caseItem.client_id === userId ? caseItem.lawyer_id : caseItem.client_id

          if (!participant && participantId) {
            missingParticipantIds.add(participantId)
          }

          return {
            id: caseItem.id,
            title: caseItem.title,
            caseType: caseItem.case_type,
            status: caseItem.status,
            participant: participant || null,
            participantId: participantId || null,
            clientId: caseItem.client_id,
            lawyerId: caseItem.lawyer_id,
            lastActivityAt: caseItem.updated_at,
          }
        })

        if (missingParticipantIds.size > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, avatar_url, user_type")
            .in("id", Array.from(missingParticipantIds))

          const profileMap =
            profileData?.reduce<Record<string, ParticipantProfile>>((acc, profile) => {
              acc[profile.id] = profile
              return acc
            }, {}) ?? {}

          mapped.forEach((conversation) => {
            if (!conversation.participant && conversation.participantId) {
              conversation.participant = profileMap[conversation.participantId] || null
            }
          })
        }

        setConversations(mapped)

        if (mapped.length > 0) {
          setActiveCaseId((prev) => prev || mapped[0].id)
        }
      } catch (error) {
        console.error("[v0] Conversation load error:", error)
        toast({
          title: "Error loading conversations",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingConversations(false)
      }
    },
    [supabase, toast],
  )

  const markMessagesRead = useCallback(
    async (messageIds: string[], caseId: string) => {
      if (!messageIds.length) return

      const { error } = await supabase.from("messages").update({ is_read: true }).in("id", messageIds)

      if (error) {
        console.error("[v0] Mark read error:", error)
        return
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [caseId]: Math.max(0, (prev[caseId] || 0) - messageIds.length),
      }))
    },
    [supabase],
  )

  const loadMessages = useCallback(
    async (caseId: string, userId: string) => {
      try {
        setIsLoadingMessages(true)

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: true })
          .limit(MESSAGE_LIMIT)

        if (error) throw error

        setMessages(data || [])

        const unreadForCase = (data || [])
          .filter((msg) => msg.recipient_id === userId && !msg.is_read)
          .map((msg) => msg.id)

        if (unreadForCase.length > 0) {
          await markMessagesRead(unreadForCase, caseId)
        }
      } catch (error) {
        console.error("[v0] Messages load error:", error)
        toast({
          title: "Error loading messages",
          description: "Unable to load chat history.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMessages(false)
      }
    },
    [supabase, toast, markMessagesRead],
  )

  useEffect(() => {
    let isMounted = true
    
    const initialize = async () => {
      const userId = await fetchCurrentUser()
      if (!userId || !isMounted) return
      await Promise.all([loadConversations(userId), loadUnreadCounts(userId)])
    }
    
    initialize()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  useEffect(() => {
    if (!currentUserId || !activeCaseId) return
    loadMessages(activeCaseId, currentUserId)
    
    // Scroll to bottom when messages load
    setTimeout(() => {
      const messagesEnd = document.getElementById("messages-end")
      const messagesContainer = document.getElementById("messages-container")
      if (messagesEnd) {
        messagesEnd.scrollIntoView({ behavior: "auto", block: "end" })
      } else if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }, 200)
  }, [activeCaseId, currentUserId, loadMessages])

  useEffect(() => {
    if (!currentUserId || !activeCaseId) return

    const channel = supabase
      .channel(`messages-case-${activeCaseId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `case_id=eq.${activeCaseId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages((prev) => {
            // Check if message already exists (prevent duplicates)
            if (prev.find((msg) => msg.id === newMessage.id)) {
              return prev
            }
            // Sort messages by created_at to maintain order
            const updated = [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              const messagesEnd = document.getElementById("messages-end")
              const messagesContainer = document.getElementById("messages-container")
              if (messagesEnd) {
                messagesEnd.scrollIntoView({ behavior: "smooth", block: "end" })
              } else if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight
              }
            }, 100)
            
            return updated
          })

          // Mark as read if recipient is current user
          if (newMessage.recipient_id === currentUserId && !newMessage.is_read) {
            markMessagesRead([newMessage.id], activeCaseId)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `case_id=eq.${activeCaseId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage
          setMessages((prev) => 
            prev.map((msg) => msg.id === updatedMessage.id ? updatedMessage : msg)
          )
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Messages] Subscribed to case ${activeCaseId}`)
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[Messages] Channel error for case ${activeCaseId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId, activeCaseId, markMessagesRead])

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`messages-recipient-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage

          setUnreadCounts((prev) => {
            if (newMessage.case_id === activeCaseId) return prev
            return {
              ...prev,
              [newMessage.case_id]: (prev[newMessage.case_id] || 0) + 1,
            }
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId, activeCaseId])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !activeCaseId) return
    const conversation = conversations.find((conv) => conv.id === activeCaseId)
    const recipientId =
      conversation?.participant?.id ||
      conversation?.participantId ||
      (conversation?.clientId === currentUserId ? conversation?.lawyerId : conversation?.clientId) ||
      null

    if (!recipientId) {
      toast({
        title: "Cannot send message",
        description: "This case does not have an assigned recipient yet.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)
      const content = newMessage.trim()

      const { error, data } = await supabase
        .from("messages")
        .insert({
          case_id: activeCaseId,
          sender_id: currentUserId,
          recipient_id: recipientId,
          content,
        })
        .select()
        .single()

      if (error) throw error

      // Optimistically add message immediately
      const optimisticMessage = {
        ...data,
        created_at: data.created_at || new Date().toISOString(),
      }
      setMessages((prev) => {
        // Check if message already exists (from real-time)
        if (prev.find((msg) => msg.id === data.id)) {
          return prev
        }
        // Sort messages by created_at to maintain order
        const updated = [...prev, optimisticMessage].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        return updated
      })
      setNewMessage("")
      
      // Scroll to bottom after adding message
      setTimeout(() => {
        const messagesEnd = document.getElementById("messages-end")
        const messagesContainer = document.getElementById("messages-container")
        if (messagesEnd) {
          messagesEnd.scrollIntoView({ behavior: "smooth", block: "end" })
        } else if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 100)

      await notifyMessage(
        {
          recipientId,
          senderId: currentUserId,
          caseId: activeCaseId,
          caseTitle: conversation?.title,
          contentPreview: content.slice(0, 120),
        },
        supabase,
      )
    } catch (error) {
      console.error("[v0] Send message error:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const activeConversation = conversations.find((conv) => conv.id === activeCaseId) || null

  if (isLoadingConversations) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (!conversations.length) {
    return (
      <Card className="p-10 text-center">
        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          {userType === "client"
            ? "Book a consultation or start a case to begin chatting with a lawyer."
            : "You’ll see chats here once a client opens a case with you."}
        </p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-4 min-h-[70vh] w-full">
      <Card className="md:col-span-1 flex flex-col max-h-[70vh] order-2 md:order-1">
        <CardHeader>
          <CardTitle className="text-base">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="flex flex-col divide-y">
            {conversations.map((conversation) => {
              const participantName = conversation.participant
                ? `${conversation.participant.first_name || ""} ${conversation.participant.last_name || ""}`.trim() ||
                  (conversation.participant.user_type === "lawyer" ? "Lawyer" : "Client")
                : conversation.clientId === currentUserId
                  ? "Awaiting lawyer"
                  : "Awaiting client"

              const unread = unreadCounts[conversation.id] || 0

              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveCaseId(conversation.id)}
                  className={cn(
                    "w-full text-left p-4 transition-colors",
                    activeCaseId === conversation.id
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.participant?.avatar_url || undefined} />
                      <AvatarFallback>
                        {participantName
                          .split(" ")
                          .map((n) => n.charAt(0))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{participantName}</p>
                        {unread > 0 && (
                          <Badge className="ml-auto bg-primary/10 text-primary border border-primary/20 text-xs">
                            {unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conversation.title}</p>
                      <p className="text-[11px] text-muted-foreground/80">
                        {conversation.caseType || "General"} • {conversation.status}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-3 flex flex-col min-h-[60vh] max-h-[70vh] order-1 md:order-2">
        {activeConversation ? (
          <>
            <CardHeader className="border-b bg-card/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">{activeConversation.caseType}</p>
                  <CardTitle className="text-2xl">{activeConversation.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">Status: {activeConversation.status}</p>
                </div>
                {activeConversation.participant && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={activeConversation.participant.avatar_url || undefined} />
                      <AvatarFallback>
                        {(activeConversation.participant.first_name?.charAt(0) || "") +
                          (activeConversation.participant.last_name?.charAt(0) || "") || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {`${activeConversation.participant.first_name || ""} ${activeConversation.participant.last_name || ""}`.trim() ||
                          (activeConversation.participant.user_type === "lawyer" ? "Lawyer" : "Client")}
                      </p>
                      <p className="text-xs text-muted-foreground">Case partner</p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 py-6 px-6" id="messages-container" style={{ minHeight: '400px' }}>
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserId
                    return (
                      <div key={message.id} className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] sm:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm",
                          )}
                        >
                          <p className="text-base leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={cn(
                              "text-[11px] mt-1",
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground",
                            )}
                          >
                            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div id="messages-end" />
                </>
              )}
            </CardContent>

            <div className="border-t p-3 bg-card/80">
              <div className="flex gap-2 items-end">
                <Input
                  placeholder="Type your message..."
                  className="flex-1 text-base py-3 min-h-[48px]"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isSending}
                />
                <Button variant="outline" size="icon" disabled className="h-[48px] w-[48px]">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="h-[48px] w-[48px]">
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {userType === "client"
                  ? "You are messaging your assigned lawyer."
                  : "You are messaging your client."}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
        )}
      </Card>
    </div>
  )
}
