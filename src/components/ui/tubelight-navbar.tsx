"use client"

import React, { useEffect, useState, useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon, X, Send, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"

interface NavItem {
  name: string
  i18nKey?: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

function DockIcon({
  item,
  isActive,
  mouseX,
  t,
}: {
  item: NavItem
  isActive: boolean
  mouseX: ReturnType<typeof useMotionValue<number>>
  t: (key: string) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const size = useSpring(useTransform(distance, [-120, 0, 120], [40, 56, 40]), {
    mass: 0.1, stiffness: 150, damping: 12,
  })

  const iconScale = useSpring(useTransform(distance, [-120, 0, 120], [1, 1.2, 1]), {
    mass: 0.1, stiffness: 150, damping: 12,
  })

  return (
    <Link href={item.url}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex items-center justify-center rounded-full cursor-pointer transition-colors",
          isActive ? "bg-accent/10 text-accent" : "text-foreground/60 hover:text-foreground",
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg
                bg-heading text-white text-[11px] font-display font-semibold whitespace-nowrap
                shadow-lg pointer-events-none"
            >
              {item.i18nKey ? t(item.i18nKey) : item.name}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div style={{ scale: iconScale }}>
          <Icon size={20} strokeWidth={2} />
        </motion.div>
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
        )}
      </motion.div>
    </Link>
  )
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  const { lang, setLang, t } = useI18n()
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [chatMode, setChatMode] = useState<'closed' | 'input' | 'expanded'>('closed')
  const [hasUnread, setHasUnread] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const mouseX = useMotionValue(Infinity)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const active = items.find(item =>
      item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)
    )
    if (active) setActiveTab(active.name)
  }, [pathname, items])

  useEffect(() => {
    if (chatMode === 'input') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [chatMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const openChat = () => {
    setChatMode('input')
    setHasUnread(false)
  }

  const closeChat = () => {
    setChatMode('closed')
    setMessages([])
    setInputValue('')
  }

  const minimizeChat = () => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      setHasUnread(true)
    }
    setChatMode('closed')
  }

  const sendMessage = async () => {
    const text = inputValue.trim()
    if (!text || isStreaming) return
    setInputValue('')

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
    const assistantId = (Date.now() + 1).toString()

    setMessages(prev => [...prev, userMsg])
    setChatMode('expanded')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = res.body
      if (!body) throw new Error('No body')

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }])

      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line)
            if (parsed.type === 'text') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + parsed.content } : m
              ))
            } else if (parsed.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ))
            }
          } catch { /* skip */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, isStreaming: false } : m
      ))
    } catch {
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: "Sorry, something went wrong. Try again.",
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    if (e.key === 'Escape') {
      minimizeChat()
    }
  }

  const isKa = lang === 'ka'

  return (
    <div className={cn("fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6", className)}>
      {/* Chat panel above dock */}
      <AnimatePresence>
        {chatMode === 'expanded' && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
            style={{ width: '380px', maxWidth: 'calc(100vw - 48px)' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-light/30">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-heading font-display">ALLONE AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={minimizeChat} className="w-6 h-6 rounded-full hover:bg-surface-2 flex items-center justify-center text-muted hover:text-heading transition-colors cursor-pointer">
                  <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
                </button>
                <button onClick={closeChat} className="w-6 h-6 rounded-full hover:bg-surface-2 flex items-center justify-center text-muted hover:text-heading transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="max-h-[45vh] overflow-y-auto px-4 py-3 space-y-3"
              onWheel={(e) => e.stopPropagation()}
            >
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-heading text-white px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%] text-xs">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-heading leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {msg.isStreaming && <span className="inline-block w-1.5 h-4 bg-accent/60 ml-0.5 animate-pulse align-middle" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock pill */}
      <motion.div
        layout
        className="backdrop-blur-xl bg-white/80 rounded-full shadow-lg px-1.5 py-1.5"
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        <AnimatePresence mode="wait">
          {chatMode === 'closed' ? (
            <motion.div
              key="nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex items-center gap-1"
            >
              {items.map((item) => (
                <DockIcon
                  key={item.name}
                  item={item}
                  isActive={activeTab === item.name}
                  mouseX={mouseX}
                  t={t}
                />
              ))}

              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'ka' : 'en')}
                className="w-10 h-10 flex items-center justify-center rounded-full text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                title={isKa ? 'Switch to English' : 'ქართულად'}
              >
                <Globe size={18} strokeWidth={2} />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-foreground/10 mx-0.5" />

              {/* Ask AI */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openChat}
                className="relative px-4 py-2 rounded-full text-xs font-semibold text-foreground/70 hover:text-accent transition-colors cursor-pointer whitespace-nowrap"
              >
                {hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-white animate-pulse" />
                )}
                {isKa ? 'ჰკითხე AI-ს' : 'Ask AI'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="chat-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex items-center gap-2 px-2"
              style={{ minWidth: '320px' }}
            >
              <button
                onClick={minimizeChat}
                className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/40 hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isKa ? 'იკითხეთ რაიმე...' : 'Ask anything...'}
                className="flex-1 bg-transparent text-sm text-heading placeholder:text-foreground/30 outline-none py-2"
                disabled={isStreaming}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isStreaming}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white disabled:opacity-30 transition-opacity cursor-pointer shrink-0"
              >
                <Send size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
