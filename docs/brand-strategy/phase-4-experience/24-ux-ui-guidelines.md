# 24. UX/UI Guidelines

**Document:** ALLONE Design System — "Cold Clarity"
**Version:** 1.0
**Last Updated:** March 2026
**Applies To:** allone.ge and all ALLONE digital products

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Layout Principles](#2-layout-principles)
3. [Component Patterns](#3-component-patterns)
4. [Animation Specifications](#4-animation-specifications)
5. [Interaction Design](#5-interaction-design)
6. [Responsive Design](#6-responsive-design)
7. [Accessibility Standards](#7-accessibility-standards)
8. [Performance Guidelines](#8-performance-guidelines)
9. [Dark Mode Considerations](#9-dark-mode-considerations)

---

## 1. Design Philosophy

### Cold Clarity

ALLONE's design language is called **Cold Clarity**. It is not a style trend or an aesthetic borrowed from another brand. It is the visual translation of a core belief: that intelligence is most powerful when it is most precise, and that precision requires the discipline to remove everything that does not serve the user.

Cold Clarity operates on three principles:

**Precision over decoration.** Every element on screen exists because it earns its place. There are no ornamental gradients, no decorative illustrations filling whitespace, no UI chrome that exists solely to look "designed." When a surface is white, it is white — `#FFFFFF` — not off-white, not cream, not a warm neutral. When text is dark, it is `#071D2F` — a deep navy that carries authority without the harshness of pure black. The palette is deliberately narrow because constraint produces clarity.

**Space as a design element.** Whitespace is not the absence of content. It is the most important content on the page. The generous section spacing — `clamp(5rem, 12vw, 10rem)` — is not wasted real estate. It is breathing room that lets each section land with its full weight before the next one begins. Within components, padding and margins follow a strict 4px base scale that prevents the visual noise of arbitrary spacing. Space communicates hierarchy, separates concerns, and gives the eye permission to rest.

**Motion with purpose.** Every animation in the system exists to communicate state change, guide attention, or provide feedback. The `fade-in-up` that greets a new section on scroll is not decorative — it tells the user "this content just arrived for you." The `shimmer` on a loading state is not flair — it communicates "work is happening." The spring physics on interactive elements (`stiffness: 80, damping: 25, mass: 0.5`) are calibrated to feel responsive without feeling frantic. If an animation cannot explain why it exists, it should not exist.

### Design Values

| Value | Meaning | Anti-pattern |
|-------|---------|-------------|
| Restraint | Use fewer elements with more intention | Cluttered layouts, decorative gradients |
| Legibility | Information is effortlessly scannable | Dense text walls, low-contrast labels |
| Responsiveness | The interface reacts to the user, not the other way around | Static hover states, no loading feedback |
| Consistency | Same element, same behavior, everywhere | One-off component variants, inconsistent spacing |
| Honesty | The UI shows what is real, not what looks impressive | Fake metrics, placeholder content shipped as final |

---

## 2. Layout Principles

### Grid System

The layout grid is a **12-column fluid grid** with the following specifications:

| Property | Value |
|----------|-------|
| Max content width | `1280px` |
| Column count | 12 |
| Gutter width | `24px` (desktop), `16px` (tablet), `16px` (mobile) |
| Outer margin | `clamp(1rem, 5vw, 4rem)` |
| Container padding | `0 1.5rem` (default), `0 1rem` (mobile) |

Content containers should use `max-width: 1280px` with `margin: 0 auto` for centering. Full-bleed sections (such as the footer or hero) extend to the viewport edge while their inner content remains within the container.

### Spacing Scale

All spacing derives from a **4px base unit**. The scale follows a geometric progression for larger values:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight inline gaps, icon-to-label spacing |
| `--space-2` | `8px` | Input padding (vertical), compact list items |
| `--space-3` | `12px` | Button padding (vertical), card inner gaps |
| `--space-4` | `16px` | Default component padding, form field gaps |
| `--space-5` | `20px` | Card padding, between related groups |
| `--space-6` | `24px` | Section sub-headings to content |
| `--space-8` | `32px` | Between component groups |
| `--space-10` | `40px` | Large section internal padding |
| `--space-12` | `48px` | Page header to content |
| `--space-16` | `64px` | Between major page sections (minimum) |
| `--space-section` | `clamp(5rem, 12vw, 10rem)` | Between top-level page sections |

### Section Structure

Every top-level page section follows a consistent vertical rhythm:

```
[Section Gap: clamp(5rem, 12vw, 10rem)]
[Mono Label: service category or section identifier]
[Space: 16px]
[Section Heading: H2]
[Space: 12px]
[Section Subheading: body text, max-width 640px]
[Space: 48px]
[Section Content: grid/cards/media]
[Section Gap: clamp(5rem, 12vw, 10rem)]
```

The mono label above the heading serves as a wayfinding signal — it tells the user what category of content they are about to encounter before the heading delivers the specifics.

### Content Width

| Content Type | Max Width | Rationale |
|-------------|-----------|-----------|
| Page container | `1280px` | Prevents lines from exceeding comfortable reading length on ultrawide displays |
| Body text blocks | `640px` | Maintains 60-75 characters per line for optimal readability |
| Section headings | `800px` | Allows display type to breathe without spanning the full container |
| Card grids | `100%` of container | Fills available width, cards handle their own max-width |
| Hero content | `720px` (centered) | Focused reading area for the primary value proposition |

### Responsive Breakpoints

| Breakpoint | Value | Target |
|-----------|-------|--------|
| `sm` | `640px` | Large phones in landscape, small tablets |
| `md` | `768px` | Tablets in portrait |
| `lg` | `1024px` | Tablets in landscape, small laptops |
| `xl` | `1280px` | Standard laptops and desktops |
| `2xl` | `1536px` | Large desktop monitors |

### Component Density

Components should maintain comfortable density that avoids both cramped interfaces and wasteful emptiness. As a rule:

- **Cards** maintain a minimum internal padding of `20px` on all sides, increasing to `24px` on desktop.
- **Button groups** use `12px` gap between buttons, `16px` when mixed with other element types.
- **Form fields** stack with `16px` vertical gap; related field groups use `24px` separation from other groups.
- **List items** use `12px` vertical padding for comfortable touch targets without excessive height.

---

## 3. Component Patterns

### Buttons

**Primary Button**
The default call-to-action. Used for the single most important action in any given context.

| Property | Value |
|----------|-------|
| Background | `#0A68F5` (accent) |
| Text color | `#FFFFFF` |
| Font | Plus Jakarta Sans, 500 weight |
| Padding | `12px 28px` |
| Border radius | `--radius-lg` (`12px`) |
| Box shadow | `0 1px 2px rgba(0,0,0,0.05)` |
| Hover | Background lightens 8%, `translateY(-1px)`, shadow expands |
| Active | `translateY(0)`, shadow contracts |
| Disabled | `opacity: 0.5`, `pointer-events: none` |

**Secondary Button**
Used for supporting actions that complement the primary action.

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Text color | `#071D2F` |
| Border | `1px solid #E0EEFB` |
| Padding | `12px 28px` |
| Border radius | `--radius-lg` (`12px`) |
| Hover | Border color transitions to `#0A68F5`, text color transitions to `#0A68F5` |
| Active | Background `#F8FAFE` |

**Ghost Button**
Used for tertiary actions, navigation links styled as buttons, or contexts where visual weight must be minimized.

| Property | Value |
|----------|-------|
| Background | `transparent` |
| Text color | `#0A68F5` |
| Border | none |
| Padding | `8px 16px` |
| Hover | Background `rgba(10, 104, 245, 0.06)`, `border-radius: 8px` |
| Active | Background `rgba(10, 104, 245, 0.1)` |

### Cards

**Service Cards**
Service cards vary by `card_type`, each containing a unique interactive demonstration of the service:

- **`chatbot`** — Contains a conversation script that auto-plays message bubbles to demonstrate AI chat capabilities. Messages appear sequentially with typing indicators.
- **`custom_ai`** — Displays animated statistics and performance metrics with counting animations.
- **`workflow`** — Shows a simplified process diagram with animated flow connections.
- **`website`** — Renders a miniature browser preview frame with a thumbnail of sample work.
- **`consulting`** — Features a prominent CTA with a brief value statement and arrow icon.

All service cards share these base properties:

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid #E0EEFB` |
| Border radius | `--radius-xl` (`16px`) |
| Padding | `24px` |
| Shadow | `0 1px 3px rgba(0,0,0,0.04)` |
| Hover shadow | `0 8px 30px rgba(0,0,0,0.08)` |
| Hover transform | `translateY(-2px)` |
| Transition | `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)` |

**Project Cards** display portfolio work with full-bleed imagery and overlay text on hover. **Testimonial Cards** use a left-aligned accent border (`3px solid #0A68F5`) with the quote in italic Plus Jakarta Sans.

### Forms

**Text Inputs**

| Property | Value |
|----------|-------|
| Height | `48px` |
| Background | `#F8FAFE` |
| Border | `1px solid #E0EEFB` |
| Border radius | `--radius-md` (`8px`) |
| Padding | `12px 16px` |
| Font | Plus Jakarta Sans, 16px, `#071D2F` |
| Placeholder color | `#7E8A97` |
| Focus border | `1px solid #0A68F5` |
| Focus shadow | `0 0 0 3px rgba(10, 104, 245, 0.1)` |
| Error border | `1px solid #E53E3E` |
| Error shadow | `0 0 0 3px rgba(229, 62, 62, 0.1)` |

**Select** inputs mirror text input styling with a custom chevron icon (`#7E8A97`) positioned `16px` from the right edge. **Textarea** inputs use the same styling with a minimum height of `120px` and `resize: vertical`.

All form fields include a label above the field (Plus Jakarta Sans, 14px, 500 weight, `#071D2F`) and optional helper text below (13px, `#7E8A97`). Error messages replace helper text in `#E53E3E`.

### Navigation — Floating Glass Navbar

The navbar is the signature UI element of Cold Clarity. It floats above the content as a pill-shaped glass panel:

| Property | Value |
|----------|-------|
| Position | `fixed`, centered horizontally, `16px` from top |
| Background | `rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)` |
| Border | `1px solid rgba(255, 255, 255, 0.3)` |
| Border radius | `9999px` (rounded-full) |
| Padding | `8px 24px` |
| Shadow | `0 4px 20px rgba(0, 0, 0, 0.06)` |
| Z-index | `50` |
| Transition | `background 0.3s ease, box-shadow 0.3s ease` |

On scroll, the navbar's background intensifies to `rgba(255, 255, 255, 0.85)` with `blur(40px)` (the "strong glass" variant) and the shadow deepens slightly. Navigation links use Plus Jakarta Sans at 14px, 500 weight. The active link is indicated by text color `#0A68F5` with an underline dot (4px circle, accent color, centered below the text).

On mobile (below `768px`), the navbar collapses to show the logo and a hamburger menu that opens a full-screen overlay with vertically stacked navigation links.

### Footer — Dark Contrast Anchor

The footer provides visual grounding with a dark navy background:

| Property | Value |
|----------|-------|
| Background | `#071D2F` |
| Text color | `rgba(255, 255, 255, 0.7)` |
| Heading color | `#FFFFFF` |
| Link hover | `#FFFFFF` |
| Accent elements | `#0A68F5` |
| Padding | `80px 0 40px` |
| Border top | none (dark bg provides sufficient contrast) |

The footer is divided into a multi-column grid: company info with logo on the left, link groups in the center columns, and a contact/CTA section on the right. A thin `1px solid rgba(255, 255, 255, 0.1)` divider separates the main footer from the copyright bar at the bottom.

### Mono Labels

Mono labels are the typographic workhorse of the section identification system:

| Property | Value |
|----------|-------|
| Font | JetBrains Mono |
| Size | `0.75rem` (12px) |
| Weight | 500 |
| Transform | `uppercase` |
| Letter spacing | `0.05em` |
| Color | `#0A68F5` (accent) |
| Line height | `1.5` |

They appear above section headings, on card category tags, in sidebar navigation, and as data labels in dashboard-style components.

### Glass Panels

Glass panels are used for overlays, floating UI elements, and elevated containers that need to feel lightweight:

| Variant | Background | Blur | Border |
|---------|-----------|------|--------|
| Default | `rgba(255, 255, 255, 0.7)` | `20px` | `1px solid rgba(255, 255, 255, 0.3)` |
| Strong | `rgba(255, 255, 255, 0.85)` | `40px` | `1px solid rgba(255, 255, 255, 0.4)` |

Glass panels require a visually complex background behind them (images, gradients, or content) to justify their existence. A glass panel over a flat white background is pointless and should be replaced with a simple bordered container.

### Modals and Dialogs

Modals use the strong glass variant for their backdrop overlay and a solid white panel for the content:

| Property | Value |
|----------|-------|
| Overlay | `rgba(7, 29, 47, 0.5)` with `backdrop-filter: blur(8px)` |
| Panel background | `#FFFFFF` |
| Panel border radius | `--radius-xl` (`16px`) |
| Panel padding | `32px` |
| Panel shadow | `0 24px 48px rgba(0, 0, 0, 0.12)` |
| Max width | `540px` (standard), `720px` (large) |
| Entry animation | `fade-in-up` with `200ms` duration |
| Exit animation | `fade-out-down` with `150ms` duration |

Modals always include a close button (top-right, `24x24` touch target padded to `44x44`) and support dismissal via overlay click and the Escape key.

---

## 4. Animation Specifications

### Entry Animations

All entry animations are defined as CSS keyframes and applied via utility classes or Framer Motion:

**`fade-in`** — Simple opacity transition.
```
0%:   opacity: 0
100%: opacity: 1
Duration: 600ms | Easing: ease-out cubic-bezier(0.16, 1, 0.3, 1)
```

**`fade-in-up`** — Opacity with upward translation. The default scroll-reveal animation.
```
0%:   opacity: 0, transform: translateY(20px)
100%: opacity: 1, transform: translateY(0)
Duration: 700ms | Easing: ease-out cubic-bezier(0.16, 1, 0.3, 1)
```

**`blur-reveal`** — Opacity with blur-to-sharp transition. Used for hero text and high-impact headings.
```
0%:   opacity: 0, filter: blur(10px)
100%: opacity: 1, filter: blur(0)
Duration: 800ms | Easing: ease-out cubic-bezier(0.16, 1, 0.3, 1)
```

**`line-reveal`** — Text lines revealed sequentially by a clipping mask. Used sparingly for headline reveals.
```
0%:   clip-path: inset(0 100% 0 0)
100%: clip-path: inset(0 0% 0 0)
Duration: 600ms per line | Stagger: 100ms | Easing: expo cubic-bezier(0.87, 0, 0.13, 1)
```

### Scroll-Triggered Animations

Scroll animations use Framer Motion's `whileInView` with `viewport={{ once: true, margin: "-100px" }}`. Direction-based variants support six entry vectors:

| Direction | Initial Transform |
|-----------|------------------|
| `left` | `translateX(-40px)` |
| `right` | `translateX(40px)` |
| `top` | `translateY(-30px)` |
| `bottom` | `translateY(30px)` |
| `top-left` | `translate(-30px, -20px)` |
| `top-right` | `translate(30px, -20px)` |

All direction variants pair their translation with `opacity: 0` at start. The viewport margin of `-100px` ensures elements begin animating before they are fully visible, preventing a jarring pop-in.

**Stagger pattern:** When multiple sibling elements animate on scroll (such as a row of cards), each subsequent element delays by `100ms`. For a grid of 6 cards, the stagger sequence is `0ms, 100ms, 200ms, 300ms, 400ms, 500ms`. This creates a wave-like reveal that directs the eye across the content.

### Interaction Animations

**Button hover:** `translateY(-1px)` with expanded shadow over `200ms` using `ease-out`.
**Button active:** `translateY(0)` with contracted shadow over `100ms`.
**Card hover:** `translateY(-2px)` with shadow expansion over `300ms` using `cubic-bezier(0.16, 1, 0.3, 1)`.
**Link hover:** Color transition to `#0A68F5` over `150ms` with optional underline slide-in from left.

### Loading States

**`shimmer`** — A horizontal light sweep across a placeholder element.
```
0%:   background-position: -200% 0
100%: background-position: 200% 0
Duration: 1.5s | Iteration: infinite | Easing: linear
Background: linear-gradient(90deg, #F1F6FB 25%, #E0EEFB 50%, #F1F6FB 75%)
Background-size: 200% 100%
```

Shimmer placeholders should match the approximate dimensions and layout of the content they replace. A card skeleton should be card-shaped. A text skeleton should be line-shaped.

### Continuous Animations

**`float`** — Gentle vertical oscillation for decorative or ambient elements (such as the 3D robot in the hero).
```
0%:   transform: translateY(0)
50%:  transform: translateY(-10px)
100%: transform: translateY(0)
Duration: 3s | Iteration: infinite | Easing: ease-in-out cubic-bezier(0.65, 0, 0.35, 1)
```

**`pulse-glow`** — Subtle radial glow pulsation for active state indicators or notification badges.
```
0%:   box-shadow: 0 0 0 0 rgba(10, 104, 245, 0.3)
70%:  box-shadow: 0 0 0 10px rgba(10, 104, 245, 0)
100%: box-shadow: 0 0 0 0 rgba(10, 104, 245, 0)
Duration: 2s | Iteration: infinite | Easing: ease-out
```

### Spring Configuration (Framer Motion)

All spring-based Framer Motion animations use a unified configuration:

| Property | Value |
|----------|-------|
| `stiffness` | `80` |
| `damping` | `25` |
| `mass` | `0.5` |

This configuration produces a responsive, slightly underdamped motion — elements arrive at their target quickly with a single subtle overshoot that resolves within `~400ms`. This feel is central to Cold Clarity: responsive enough to feel alive, controlled enough to feel precise.

### Reduced Motion

**All animations respect `prefers-reduced-motion: reduce`.** When this media query matches:

- All `transition-duration` and `animation-duration` values collapse to `0.01ms`.
- Scroll-triggered animations display content immediately at their final state (no translation, full opacity).
- The `float` and `pulse-glow` continuous animations cease entirely.
- Spring animations in Framer Motion switch to `type: "tween"` with `duration: 0`.
- The `shimmer` loading animation is replaced with a static `#F1F6FB` background.

This is not optional. This is a hard requirement for every animation added to the system.

---

## 5. Interaction Design

### Hover States

Hover states provide immediate visual feedback that an element is interactive. Every interactive element must have a distinct hover state:

- **Buttons:** See button specifications in Section 3. The primary button lightens, secondary gains accent border, ghost gains a subtle background.
- **Links:** Transition to `#0A68F5` over `150ms`. Underlined links thicken their underline; non-underlined links may add an underline that slides in from the left.
- **Cards:** `translateY(-2px)` lift with shadow expansion. The transition uses the ease-out cubic bezier for a satisfying "pickup" feel.
- **Icon buttons:** Background circle fades in at `rgba(10, 104, 245, 0.06)` with `border-radius: 50%`.
- **Table rows:** Background transitions to `#F8FAFE`.

### Focus States

Focus states are critical for keyboard navigation and accessibility:

| Property | Value |
|----------|-------|
| Outline | `1px solid #0A68F5` |
| Outline offset | `2px` |
| Border radius | Matches the element's own border-radius |
| Transition | `outline-color 150ms ease` |

Focus states must never be removed with `outline: none` without providing an equivalent or superior visual alternative. The `2px` offset prevents the outline from visually merging with the element's border.

For elements inside dark containers (footer, dark modals), the focus outline uses `#FFFFFF` instead of `#0A68F5`.

### Selection

Text selection uses the accent color:

| Property | Value |
|----------|-------|
| `::selection` background | `#0A68F5` |
| `::selection` color | `#FFFFFF` |

### Scroll Behavior

The document uses `scroll-behavior: smooth` for all anchor link navigation. Custom scrollbar styling is applied globally:

| Property | Value |
|----------|-------|
| Scrollbar width | `6px` |
| Track color | Surface color (`#F1F6FB`) |
| Thumb color | Border color (`#E0EEFB`) |
| Thumb hover | `#7E8A97` |
| Thumb border-radius | `3px` |

### Touch Targets

All interactive elements maintain a minimum touch target of **44x44 pixels**, per WCAG 2.5.5 (Enhanced) guidelines. For elements that are visually smaller than 44px (such as icon buttons or close buttons), invisible padding extends the tap area to meet the minimum. This is non-negotiable on mobile and strongly recommended on desktop for accessibility.

---

## 6. Responsive Design

### Mobile-First Approach

All CSS is authored mobile-first. Base styles target the smallest supported viewport (`320px` width), and `min-width` media queries layer on complexity for larger screens. This ensures the mobile experience is the foundation, not an afterthought.

### Breakpoint Strategy

| Breakpoint | Layout Changes |
|-----------|---------------|
| Base (< 640px) | Single column, stacked components, full-width cards, hamburger menu, 16px body padding |
| `sm` (640px) | Two-column grids where appropriate, increased card padding |
| `md` (768px) | Navbar expands from hamburger to inline links, side-by-side form fields |
| `lg` (1024px) | Three-column service card grid, sidebar layouts become available |
| `xl` (1280px) | Full 12-column grid, maximum content width reached |
| `2xl` (1536px) | Increased outer margins only, content width does not expand beyond 1280px |

### Component Adaptation Patterns

**Cards:** At base width, cards stack vertically at full width. At `sm`, they form a 2-column grid. At `lg`, they expand to 3 columns. Card internal padding reduces from `24px` to `20px` on mobile.

**Navigation:** Below `md`, the floating pill navbar shows only the logo (left) and hamburger icon (right). The hamburger opens a full-screen overlay with vertically centered navigation links at `24px` font size.

**Hero:** The hero section reduces its vertical padding from `clamp(5rem, 12vw, 10rem)` to `clamp(3rem, 8vw, 5rem)` on mobile. The 3D Spline scene scales down or is replaced with a static image on viewports below `640px` to conserve performance.

**Footer:** The multi-column grid collapses to a single column on mobile. Link groups stack vertically with accordion-style expand/collapse behavior.

### Typography Scaling

Typography uses a fluid scale that interpolates between mobile and desktop sizes:

| Element | Mobile | Desktop | Implementation |
|---------|--------|---------|----------------|
| H1 | `32px` | `56px` | `clamp(2rem, 5vw, 3.5rem)` |
| H2 | `26px` | `42px` | `clamp(1.625rem, 3.5vw, 2.625rem)` |
| H3 | `22px` | `32px` | `clamp(1.375rem, 2.5vw, 2rem)` |
| H4 | `18px` | `24px` | `clamp(1.125rem, 2vw, 1.5rem)` |
| Body | `16px` | `16px` | Fixed — `16px` is the readability floor |
| Small | `14px` | `14px` | Fixed |
| Mono label | `11px` | `12px` | `clamp(0.6875rem, 1vw, 0.75rem)` |

All headings use General Sans with `-0.03em` letter-spacing and `1.05` line-height. Body text uses Plus Jakarta Sans at `1.7` line-height for generous readability.

---

## 7. Accessibility Standards

### Compliance Target

ALLONE targets **WCAG 2.1 Level AA** compliance as a minimum, with select AAA criteria adopted where they improve the user experience without compromising the design language.

### Color Contrast Ratios

All color pairings in the system have been validated against WCAG AA contrast requirements:

| Pairing | Contrast Ratio | Requirement | Status |
|---------|---------------|-------------|--------|
| `#071D2F` on `#FFFFFF` | 16.3:1 | 4.5:1 (AA normal text) | Pass |
| `#071D2F` on `#F8FAFE` | 15.1:1 | 4.5:1 (AA normal text) | Pass |
| `#0A68F5` on `#FFFFFF` | 4.6:1 | 4.5:1 (AA normal text) | Pass |
| `#FFFFFF` on `#0A68F5` | 4.6:1 | 4.5:1 (AA normal text) | Pass |
| `#7E8A97` on `#FFFFFF` | 4.5:1 | 4.5:1 (AA normal text) | Pass (borderline) |
| `#FFFFFF` on `#071D2F` | 16.3:1 | 4.5:1 (AA normal text) | Pass |

The muted text color `#7E8A97` sits at the AA boundary. It must only be used at `16px` or larger. For text below `16px`, use `#071D2F` or `#0A68F5` instead.

### Focus Management

- All interactive elements are reachable via keyboard Tab navigation in a logical order.
- Modal dialogs trap focus within themselves when open and restore focus to the triggering element on close.
- Skip-to-content link is the first focusable element on every page, visually hidden until focused.
- Focus is never removed or made invisible. Custom focus styles (Section 5) replace browser defaults but always remain visible.

### Screen Reader Considerations

- All images include descriptive `alt` text. Decorative images use `alt=""` and `aria-hidden="true"`.
- Icon buttons include `aria-label` describing their action (e.g., `aria-label="Close dialog"`).
- Section landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`) are used consistently.
- Dynamic content updates (loading states, form validation) use `aria-live` regions.
- The Spline 3D scene is wrapped in a container with `role="img"` and a descriptive `aria-label`, since its content is not accessible to screen readers.

### Keyboard Navigation

- `Tab` / `Shift+Tab` moves between interactive elements.
- `Enter` or `Space` activates buttons and links.
- `Escape` closes modals, dropdowns, and the mobile navigation overlay.
- Arrow keys navigate within component groups (tab bars, dropdown options, radio groups).
- All custom components that mimic native controls implement the appropriate ARIA roles and keyboard patterns from the [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).

### Reduced Motion Support

As detailed in Section 4, all animations honor `prefers-reduced-motion: reduce`. This includes CSS animations, CSS transitions, Framer Motion spring and tween animations, and any JavaScript-driven animation. No exceptions.

---

## 8. Performance Guidelines

### Image Optimization

All images use the **Next.js `<Image>` component**, which provides:

- Automatic format conversion to WebP/AVIF based on browser support.
- Responsive `srcset` generation at appropriate breakpoints.
- Lazy loading by default (images below the fold load on demand).
- Blur-up placeholder via `placeholder="blur"` for above-the-fold images.
- Explicit `width` and `height` attributes to prevent cumulative layout shift (CLS).

Rules:
- Never use `<img>` tags directly. Always use `next/image`.
- Hero images and the first visible image in any viewport should use `priority={true}` to disable lazy loading.
- Icons below `24px` should be inline SVGs, not image files.
- Maximum image weight: `200KB` for hero images, `100KB` for card images, `50KB` for thumbnails (post-optimization).

### Animation Performance

Animations must only manipulate **composite-friendly properties** to avoid layout thrashing:

| Allowed | Forbidden in animations |
|---------|----------------------|
| `transform` | `width`, `height` |
| `opacity` | `margin`, `padding` |
| `filter` (with caution) | `top`, `left`, `right`, `bottom` |
| `clip-path` (with caution) | `border`, `font-size` |

The `will-change` property should be applied to elements that will animate, but only immediately before the animation begins — not as a permanent style. Permanent `will-change` declarations waste GPU memory.

3D transforms (`perspective(1000px)`, `preserve-3d`, `backface-hidden`) are used for the Spline scene and card flip effects. These trigger GPU compositing and should be scoped to the specific elements that need them.

### Font Loading Strategy

Fonts are loaded via `next/font` with the following configuration:

| Font | Weight Subsets | Display Strategy |
|------|---------------|-----------------|
| General Sans | 500, 600, 700 | `swap` |
| Plus Jakarta Sans | 400, 500, 600 | `swap` |
| JetBrains Mono | 400, 500 | `swap` |

The `swap` strategy ensures text is immediately visible in a fallback system font, then transitions to the custom font once loaded. This prevents invisible text during load (FOIT) at the cost of a brief layout shift (FOUT), which is the better tradeoff for perceived performance.

Font files are self-hosted (no external Google Fonts requests) and subset to Latin characters only, reducing total font payload to under `150KB`.

### Bundle Optimization

- **Code splitting:** Next.js automatic code splitting per route. No manual chunk configuration unless a specific route exceeds `200KB` initial JS.
- **Dynamic imports:** Heavy components (Spline 3D scene, chart libraries, rich text editors) use `next/dynamic` with `{ ssr: false }` and a shimmer loading placeholder.
- **Tree shaking:** Import specific functions from utility libraries (`import { motion } from "framer-motion"` rather than importing the entire package).
- **Third-party scripts:** Any external script (analytics, chat widgets) loads via `next/script` with `strategy="lazyOnload"` unless it is critical to the first interaction.

---

## 9. Dark Mode Considerations

Dark mode is not currently implemented in the ALLONE design system. However, the token architecture has been designed with future dark mode support in mind. Below is the planned token mapping for when dark mode is introduced.

### Token Mapping

| Token | Light Mode | Dark Mode (Planned) |
|-------|-----------|-------------------|
| `--bg` | `#FFFFFF` | `#0B1120` |
| `--surface-1` | `#F8FAFE` | `#131B2E` |
| `--surface-2` | `#F1F6FB` | `#1A2540` |
| `--surface-3` | `#E0EEFB` | `#243356` |
| `--text-primary` | `#071D2F` | `#E8EDF4` |
| `--text-muted` | `#7E8A97` | `#8B95A5` |
| `--accent` | `#0A68F5` | `#3D8BFF` |
| `--border` | `#E0EEFB` | `#1E2D48` |
| `--glass-bg` | `rgba(255,255,255,0.7)` | `rgba(11,17,32,0.7)` |
| `--glass-border` | `rgba(255,255,255,0.3)` | `rgba(255,255,255,0.08)` |
| `--footer-bg` | `#071D2F` | `#060D18` |
| `--footer-text` | `rgba(255,255,255,0.7)` | `rgba(255,255,255,0.6)` |

### Implementation Plan

Dark mode will be implemented via the `class` strategy (toggling a `.dark` class on `<html>`) rather than relying solely on `prefers-color-scheme`. This allows users to explicitly choose their preference. The system will:

1. Check for a stored preference in `localStorage`.
2. Fall back to `prefers-color-scheme` if no preference is stored.
3. Default to light mode if neither is available.

The accent color shifts from `#0A68F5` to `#3D8BFF` in dark mode to maintain sufficient contrast against dark backgrounds while preserving the blue identity. All contrast ratios in the dark palette must be re-validated against WCAG AA before launch.

### Design Principles for Dark Mode

- Dark mode is not "invert the colors." It is a separate, intentionally designed palette that preserves the Cold Clarity identity.
- The dark background is a deep navy (`#0B1120`), not pure black. This maintains the brand's blue-tinted identity and reduces eye strain compared to `#000000`.
- Surface elevation is communicated through lightness (higher surfaces are lighter), the inverse of light mode's shadow-based elevation.
- Glass effects in dark mode use lower opacity and reduced blur to avoid a muddy appearance.
- The 3D Spline scene and any hero imagery may require separate dark-mode-optimized assets.

---

## Appendix: Quick Reference

### CSS Custom Property Summary

```css
/* Colors */
--color-bg:          #FFFFFF;
--color-surface-1:   #F8FAFE;
--color-surface-2:   #F1F6FB;
--color-surface-3:   #E0EEFB;
--color-accent:      #0A68F5;
--color-text:        #071D2F;
--color-muted:       #7E8A97;
--color-footer:      #071D2F;

/* Typography */
--font-display:      'General Sans', sans-serif;
--font-body:         'Plus Jakarta Sans', sans-serif;
--font-mono:         'JetBrains Mono', monospace;

/* Radius */
--radius-sm:         6px;
--radius-md:         8px;
--radius-lg:         12px;
--radius-xl:         16px;
--radius-2xl:        20px;
--radius-full:       9999px;

/* Easing */
--ease-out:          cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:       cubic-bezier(0.65, 0, 0.35, 1);
--ease-expo:         cubic-bezier(0.87, 0, 0.13, 1);

/* Spacing */
--section-gap:       clamp(5rem, 12vw, 10rem);

/* Glass */
--glass-bg:          rgba(255, 255, 255, 0.7);
--glass-blur:        blur(20px);
--glass-strong-bg:   rgba(255, 255, 255, 0.85);
--glass-strong-blur: blur(40px);

/* 3D */
--perspective:       perspective(1000px);
```

### Framer Motion Defaults

```tsx
// Spring configuration
const spring = {
  type: "spring",
  stiffness: 80,
  damping: 25,
  mass: 0.5,
};

// Scroll-triggered fade-in-up
const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

// Stagger children
const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.1 } },
};
```

---

*This document is the single source of truth for ALLONE's interface design decisions. Every component, animation, and interaction pattern implemented in the codebase should be traceable back to a specification in this document. When in doubt, refer to the three principles: precision over decoration, space as a design element, motion with purpose.*
