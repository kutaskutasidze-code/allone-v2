# ALLONE Light Theme Rebrand — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand allone.ge from dark theme to light (tinted white) with Spline 3D hero and island navbar.

**Architecture:** Swap all CSS tokens from dark→light, rewrite Header as floating island pill, replace Hero ConvergenceGrid with Spline 3D embed, recolor all sections/components, keep dark Footer as contrast anchor.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Framer Motion, @splinetool/react-spline

---

## Task 1: Install Spline + Foundation (globals.css)

**Files:**
- Modify: `src/app/globals.css`
- Install: `@splinetool/react-spline @splinetool/runtime`

## Task 2: Island Navbar

**Files:**
- Modify: `src/components/layout/Header.tsx`

## Task 3: Hero with Spline 3D

**Files:**
- Modify: `src/components/sections/Hero.tsx`

## Task 4: Light Theme Sections

**Files:**
- Modify: `src/components/sections/Clients.tsx`
- Modify: `src/components/sections/ServicesNew.tsx`
- Modify: `src/components/sections/Stats.tsx`
- Modify: `src/components/sections/Testimonials.tsx`
- Modify: `src/components/sections/DashboardShowcase.tsx`

## Task 5: Light Theme Service Demos

**Files:**
- Modify: `src/components/sections/services/ChatPlayback.tsx`
- Modify: `src/components/sections/services/WorkflowDiagram.tsx`
- Modify: `src/components/sections/services/LayeredScreens.tsx`

## Task 6: Footer (dark contrast anchor)

**Files:**
- Modify: `src/components/layout/Footer.tsx`

---

## Color Mapping (Dark → Light)

| Token | Old (Dark) | New (Light) |
|-------|-----------|-------------|
| --background | #000000 | #FFFFFF |
| --surface | #111111 | #F8FAFE |
| --surface-2 | #1A1A1A | #F1F6FB |
| --border | #222222 | #DCE9F6 |
| --border-light | #333333 | #E8EEF4 |
| --muted | #888888 | #7E8A97 |
| --text | #F5F5F5 | #071D2F |
| --white | #FFFFFF | #FFFFFF |
| headings color | white | #071D2F |
| glass bg | white 5% | white 70% |
| btn-secondary color | white | #071D2F |
| scrollbar track | black | #F8FAFE |

## Hardcoded Color Mapping (in components)

| Pattern | Replace With |
|---------|-------------|
| `bg-black` | `bg-white` or `bg-background` |
| `bg-black/80` | `bg-white/80` |
| `text-white` | `text-[#071D2F]` or `text-foreground` |
| `text-white/60` | `text-muted` |
| `text-white/[0.08]` | `text-foreground/[0.08]` |
| `border-white/[0.06]` | `border-border` |
| `bg-white/[0.05]` | `bg-surface` |
| `bg-surface` (card bg) | `bg-surface` (now #F8FAFE) |
| `from-black` | `from-white` or `from-background` |
