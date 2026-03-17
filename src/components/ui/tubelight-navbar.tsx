"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
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

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname()
  const { lang, setLang, t } = useI18n()
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)
  const [onDark, setOnDark] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const active = items.find(item =>
      item.url === '/' ? pathname === '/' : pathname.startsWith(item.url)
    )
    if (active) setActiveTab(active.name)
  }, [pathname, items])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Detect if navbar overlaps a dark background section
  const checkBackground = useCallback(() => {
    if (!navRef.current) return
    const rect = navRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // Temporarily hide navbar to sample what's behind it
    navRef.current.style.pointerEvents = 'none'
    navRef.current.style.visibility = 'hidden'
    const el = document.elementFromPoint(cx, cy)
    navRef.current.style.visibility = ''
    navRef.current.style.pointerEvents = ''

    if (!el) return

    // Walk up to find the nearest element with a meaningful background
    let target: Element | null = el
    while (target && target !== document.body) {
      const bg = getComputedStyle(target).backgroundColor
      // Parse rgb(a) values
      const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const r = parseInt(match[1])
        const g = parseInt(match[2])
        const b = parseInt(match[3])
        // Check alpha — skip fully transparent backgrounds
        const alphaMatch = bg.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)/)
        if (alphaMatch && parseFloat(alphaMatch[1]) < 0.1) {
          target = target.parentElement
          continue
        }
        // Luminance check: dark if below threshold
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b)
        setOnDark(luminance < 128)
        return
      }
      target = target.parentElement
    }
    setOnDark(false)
  }, [])

  useEffect(() => {
    checkBackground()
    const onScroll = () => requestAnimationFrame(checkBackground)
    window.addEventListener('scroll', onScroll, { passive: true })
    // Also recheck on resize
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [checkBackground])

  return (
    <div
      ref={navRef}
      className={cn(
        "fixed bottom-0 sm:bottom-auto sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:mb-0 sm:pt-6 transition-colors duration-300",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {/* Main nav island */}
        <div className={cn(
          "flex items-center gap-3 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg transition-colors duration-300",
          onDark ? "bg-black/20" : "bg-white/80",
        )}>
          {items.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.name

            return (
              <Link
                key={item.name}
                href={item.url}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors duration-300",
                  onDark
                    ? "text-white/80 hover:text-accent"
                    : "text-foreground/80 hover:text-accent",
                  isActive && "text-accent",
                )}
              >
                <span className="hidden md:inline">{item.i18nKey ? t(item.i18nKey) : item.name}</span>
                <span className="md:hidden">
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-accent/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-t-full">
                      <div className="absolute w-12 h-6 bg-accent/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-accent/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-accent/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Separate language island */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ka' : 'en')}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-lg shadow-lg transition-colors duration-300 cursor-pointer",
            onDark
              ? "bg-black/20 text-white/70 hover:text-white"
              : "bg-white/80 text-foreground/50 hover:text-foreground",
          )}
          title={lang === 'en' ? 'ქართულად' : 'Switch to English'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
