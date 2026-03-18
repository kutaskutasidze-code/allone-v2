# 15. Visual Identity System

**Document:** ALLONE Visual Identity Specification
**Version:** 1.0
**Date:** March 2026
**Status:** Active
**Domain:** allone.ge

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Logo Specifications](#2-logo-specifications)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Design Tokens](#5-design-tokens)
6. [Animation & Motion](#6-animation--motion)
7. [UI Component Patterns](#7-ui-component-patterns)
8. [Photography & Imagery](#8-photography--imagery)
9. [Design Principles](#9-design-principles)

---

## 1. Design Philosophy

### Cold Clarity

ALLONE's visual identity operates under a design philosophy we call **Cold Clarity** — a system built on ultra-clean surfaces, high-contrast relationships, and deliberate precision at every level. This is not minimalism for the sake of emptiness. It is minimalism as a form of respect: respect for the user's attention, respect for the information being communicated, and respect for the craft of building software that actually works.

Cold Clarity draws from Apple's tradition of invisible design — where the interface disappears and the content speaks. But where Apple often warms its palette with photography and gradients, ALLONE leans colder: pure white backgrounds, tinted blue surfaces, and a single electric accent that cuts through the quiet. The result is a brand that feels engineered rather than decorated, precise rather than playful, trustworthy rather than trendy.

### Core Tenets

**Intentional, not decorative.** Every visual element in the ALLONE system exists because it communicates something. There are no ornamental flourishes, no gradient meshes for atmosphere, no floating shapes to "fill space." If an element does not serve hierarchy, navigation, or comprehension, it is removed.

**High contrast creates clarity.** The relationship between the pure white background (#FFFFFF) and the dark navy heading text (#071D2F) produces a contrast ratio that exceeds WCAG AAA standards. This is not accidental. The entire color system is engineered around contrast relationships that make content instantly scannable and accessible to all users, including those with visual impairments.

**Precision at the pixel level.** Border radii are specified to the pixel. Letter-spacing is measured in hundredths of an em. Animation easing curves are defined with four-decimal cubic-bezier values. This level of specification is not pedantry — it is the difference between a brand that feels cohesive and one that feels assembled from parts.

**Whitespace is structural.** ALLONE uses generous spacing — section gaps scale from 5rem to 10rem depending on viewport — not to feel "airy" but to create clear cognitive separation between content blocks. Space is not empty; it is the architecture that gives content meaning.

### What Cold Clarity Is Not

Cold Clarity is not coldness toward the user. The personality of the brand comes through in the precision of the typography, the smoothness of the animations, the quality of the interactions. It is the warmth of competence — the feeling you get when a tool works exactly as you expected it to, without friction or confusion.

Cold Clarity explicitly rejects: purple AI gradients, rounded-everything aesthetic, generic illustration styles, decorative animations, and any visual pattern that signals "we are a startup" rather than "we are a company that builds things that work."

---

## 2. Logo Specifications

### 2.1 The Convergence Mark

The ALLONE logo is called the **Convergence Mark**. It is constructed from two nested chevrons — an outer chevron rendered in Electric Blue (#0A68F5) and an inner chevron rendered in the current foreground color (typically #071D2F in light contexts, #FFFFFF in dark contexts) — that converge toward a central point. At the convergence point sits a filled circle, also in the foreground color.

The mark embodies the company name literally: all lines converging to one point. It represents the consolidation of disparate business needs — AI, web, automation, consulting — into a single partner. The chevrons suggest forward motion, precision targeting, and directional confidence. The filled circle at the convergence point represents the client: the singular destination where all effort is focused.

### 2.2 Logo Construction

The mark is built on a square grid. The outer chevron occupies approximately 60% of the total mark width, while the inner chevron occupies approximately 35%. The convergence circle has a diameter equal to approximately 8% of the total mark width. All angles are consistent between the outer and inner chevrons, maintaining parallel geometry.

The SVG source is vector-based and infinitely scalable. The mark must always be rendered from the original SVG source — never from rasterized assets — to ensure sharpness at all sizes and resolutions.

### 2.3 Clear Space

The minimum clear space around the Convergence Mark is defined as **1x**, where x equals the diameter of the convergence circle (the filled dot at the center point of the mark). No other graphic elements, text, borders, or page edges may encroach within this clear space zone.

For the full lockup (mark + wordmark), the clear space extends 1x from all outer edges of the combined unit.

In practice, generous clear space is always preferred. When placing the logo on marketing materials, aim for 2x-3x clear space whenever layout permits. The logo should always feel like it has room to breathe.

### 2.4 Minimum Size

| Context        | Minimum Width | Notes                                        |
|----------------|---------------|----------------------------------------------|
| Digital (mark only) | 24px     | Below this, the convergence circle becomes indistinct |
| Digital (full lockup) | 120px  | Ensures wordmark legibility on standard displays |
| Print (mark only) | 10mm       | Minimum for offset lithography                |
| Print (full lockup) | 40mm    | Ensures wordmark legibility at standard reading distance |
| Favicon        | 16px          | Use simplified mark variant (circle + single chevron) |

### 2.5 Color Variations

The Convergence Mark has four approved color treatments. No other color combinations are permitted.

**Full Color (Primary)**
- Outer chevron: Electric Blue #0A68F5
- Inner chevron: Dark Navy #071D2F
- Convergence circle: Dark Navy #071D2F
- Use on: White or light (#F8FAFE, #F1F6FB) backgrounds only

**Monochrome Dark**
- All elements: Dark Navy #071D2F
- Use on: White or light backgrounds when color printing is unavailable or when the logo appears alongside other brands where the blue would create visual competition

**Monochrome White (Reversed)**
- All elements: Pure White #FFFFFF
- Use on: Dark Navy (#071D2F) backgrounds, dark photography, video overlays
- This is the standard treatment for the footer region of the website

**Accent-Only**
- All elements: Electric Blue #0A68F5
- Use on: White backgrounds only, for digital contexts where a single-color treatment is needed (loading screens, watermarks, subtle branding)

### 2.6 The Wordmark

The ALLONE wordmark is set in **General Sans Bold** (weight 700), all uppercase: **ALLONE**. The letter-spacing is set to **0.04em** — slightly wider than the standard heading tracking of -0.03em — to give the wordmark openness and presence at display sizes.

In the full lockup, the wordmark sits to the right of the Convergence Mark, vertically centered against the mark's midpoint. The gap between the mark and the first letter of the wordmark equals **0.75x** (where x is the convergence circle diameter).

A stacked lockup variant is also approved for square formats (social media avatars, app icons): the mark sits above the wordmark, both horizontally centered. The vertical gap between the bottom of the mark and the top of the wordmark in the stacked variant is **1x**.

### 2.7 Logo Misuse

The following treatments are explicitly prohibited and must never be applied to the Convergence Mark or wordmark:

- **Do not stretch or distort.** The mark must always maintain its original aspect ratio. Horizontal or vertical scaling independent of the other axis is never permitted.
- **Do not rotate.** The mark is designed to point rightward and slightly downward. Rotating the mark changes its directional meaning and breaks the visual language.
- **Do not change the colors.** The mark may only appear in the four approved color treatments listed above. No gradients, no alternate hues, no color overlays.
- **Do not add effects.** No drop shadows, outer glows, bevels, embosses, 3D extrusions, or any other effect may be applied to the mark. The mark is flat by design.
- **Do not place on busy backgrounds.** If a photographic or textured background is required, the mark must sit within a solid-colored container (white or dark navy) with appropriate clear space.
- **Do not outline.** The mark is always filled, never stroked. An outlined version of the chevrons fundamentally alters the mark's visual weight and identity.
- **Do not animate the mark without approval.** The mark may be animated for loading states or page transitions, but all animations must be reviewed against the motion principles defined in Section 6.
- **Do not combine with other logos.** The Convergence Mark must never be merged, interlocked, or visually combined with partner or client logos. Co-branding layouts must maintain full clear space between marks.

---

## 3. Color System

### 3.1 Foundation Colors

The ALLONE color system is built on a foundation of three roles: **background**, **text**, and **accent**. Every other color in the system is derived from or supports these three.

| Role        | Name           | Hex       | RGB              | Usage                                  |
|-------------|----------------|-----------|------------------|----------------------------------------|
| Background  | White          | `#FFFFFF` | `255, 255, 255`  | Page background, primary canvas        |
| Text        | Dark Navy      | `#071D2F` | `7, 29, 47`      | Headings, body text, primary foreground |
| Accent      | Electric Blue  | `#0A68F5` | `10, 104, 245`   | Links, CTAs, interactive elements, brand mark |

### 3.2 Surface Colors

Surfaces provide subtle depth without resorting to shadows. Each surface level adds a slight blue tint to the white background, creating layered card and section backgrounds.

| Name       | Hex       | RGB              | Usage                                    |
|------------|-----------|------------------|------------------------------------------|
| Surface    | `#F8FAFE` | `248, 250, 254`  | Card backgrounds, elevated sections      |
| Surface-2  | `#F1F6FB` | `241, 246, 251`  | Nested cards, secondary panels           |
| Surface-3  | `#E0EEFB` | `224, 238, 251`  | Active states, selected items, highlights |

### 3.3 Border Colors

| Name         | Hex       | RGB              | Usage                               |
|--------------|-----------|------------------|--------------------------------------|
| Border       | `#DCE9F6` | `220, 233, 246`  | Card borders, dividers, input borders |
| Border Light | `#E8EEF4` | `232, 238, 244`  | Subtle separators, table rules       |

### 3.4 Text Colors

| Name     | Hex       | RGB              | Contrast vs #FFFFFF | WCAG Level | Usage                         |
|----------|-----------|------------------|---------------------|------------|-------------------------------|
| Heading  | `#071D2F` | `7, 29, 47`      | 16.5:1              | AAA        | Headings, primary body text   |
| Muted    | `#7E8A97` | `126, 138, 151`  | 4.0:1               | AA (large) | Secondary text, captions, meta |

The heading color (#071D2F) against white (#FFFFFF) achieves a contrast ratio of approximately 16.5:1 — well above the WCAG AAA requirement of 7:1. This extreme contrast is intentional and central to the Cold Clarity philosophy.

The muted color (#7E8A97) achieves approximately 4.0:1 contrast against white, meeting WCAG AA for large text (18px+ or 14px+ bold). It should not be used for body-size text on white backgrounds. For small muted text, consider using it on Surface (#F8FAFE) or Surface-2 (#F1F6FB) backgrounds where the reduced background luminance improves the effective contrast.

### 3.5 Accent Scale

The full accent scale provides 11 stops from near-white to near-black, all derived from the Electric Blue hue. This scale supports hover states, active states, disabled states, and tinted backgrounds.

| Stop | Hex       | RGB              | Usage                                   |
|------|-----------|------------------|-----------------------------------------|
| 50   | `#EFF6FF` | `239, 246, 255`  | Accent tint backgrounds, hover surfaces |
| 100  | `#DBEAFE` | `219, 234, 254`  | Light accent backgrounds                |
| 200  | `#BFDBFE` | `191, 219, 254`  | Accent borders, focus rings             |
| 300  | `#93C5FD` | `147, 197, 253`  | Decorative accents                      |
| 400  | `#60A5FA` | `96, 165, 250`   | Hover accent on dark backgrounds        |
| 500  | `#3B82F6` | `59, 130, 246`   | Mid-range accent                        |
| 600  | `#0A68F5` | `10, 104, 245`   | **Primary accent** (Electric Blue)      |
| 700  | `#0B5CD6` | `11, 92, 214`    | Hover state for primary accent          |
| 800  | `#1E40AF` | `30, 64, 175`    | Pressed/active state                    |
| 900  | `#1E3A8A` | `30, 58, 138`    | Deep accent for high-contrast needs     |
| 950  | `#032557` | `3, 37, 87`      | Darkest accent, near-black tinted       |

### 3.6 Semantic Colors

Semantic colors communicate system states. They are used exclusively for feedback — never for decoration or branding.

| Name    | Hex       | RGB              | Usage                                |
|---------|-----------|------------------|--------------------------------------|
| Success | `#22C55E` | `34, 197, 94`    | Success messages, positive indicators |
| Warning | `#EAB308` | `234, 179, 8`    | Warning messages, caution states      |
| Error   | `#EF4444` | `239, 68, 68`    | Error messages, destructive actions   |

Semantic colors should never be used as background fills for large areas. They appear as text color, icon color, border color on input fields, and small indicator elements (badges, dots, toast notifications).

### 3.7 Footer / Dark Context

The footer and any dark-themed sections use Dark Navy (#071D2F) as the background color. In this context:

- Text becomes #FFFFFF (white) or rgba(255, 255, 255, 0.7) for muted
- Accent remains #0A68F5 (Electric Blue) — it achieves 3.9:1 contrast against dark navy, suitable for large text and interactive elements
- For small body text on dark navy, use #FFFFFF for maximum legibility
- Borders become rgba(255, 255, 255, 0.1) — subtle white separators
- Surface equivalents are not defined for dark mode; dark sections should remain flat

### 3.8 Accessibility Notes

All color pairings used in the ALLONE system must meet a minimum WCAG AA contrast ratio of 4.5:1 for normal text and 3:1 for large text (18px regular or 14px bold). The primary text/background pairing (#071D2F on #FFFFFF) exceeds AAA at 16.5:1.

Color must never be the sole means of conveying information. All states communicated through color (success, error, warning) must also be communicated through text labels, icons, or other non-color indicators.

---

## 4. Typography System

### 4.1 Font Stack

ALLONE uses three typeface families, each serving a distinct role in the visual hierarchy. The selection was made to avoid the generic uniformity of Inter, Roboto, and Arial — typefaces that have become invisible through overuse. General Sans and Plus Jakarta Sans provide character and recognition while maintaining excellent legibility.

**Display — General Sans**
```
font-family: 'General Sans', system-ui, -apple-system, sans-serif;
```
General Sans is a geometric sans-serif by Indian Type Foundry with subtle humanist details. It performs exceptionally at display sizes due to its even stroke widths and generous x-height. All headings (h1 through h6), hero text, and any text intended to command attention uses General Sans.

**Body — Plus Jakarta Sans**
```
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```
Plus Jakarta Sans is a geometric grotesque designed by Tokotype. It was selected for body text because of its open counters, comfortable reading rhythm at 16px, and its optical distinction from General Sans — similar enough to feel cohesive, different enough to create hierarchy.

**Mono — JetBrains Mono**
```
font-family: 'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace;
```
JetBrains Mono is used exclusively for code snippets, technical labels, and category tags. Its ligatures are disabled in the ALLONE context to maintain character-level clarity.

### 4.2 Type Scale — Display (General Sans)

| Element | Size            | Weight | Line Height | Letter Spacing | Usage                        |
|---------|-----------------|--------|-------------|----------------|------------------------------|
| H1      | clamp(2.5rem, 5vw, 4rem) | 600 | 1.05 | -0.03em | Page titles, hero headlines   |
| H2      | clamp(2rem, 4vw, 3rem)   | 600 | 1.05 | -0.03em | Section headings              |
| H3      | clamp(1.5rem, 3vw, 2rem) | 600 | 1.1  | -0.02em | Subsection headings           |
| H4      | 1.25rem         | 600    | 1.2         | -0.02em        | Card titles, feature headings |
| H5      | 1.125rem        | 600    | 1.3         | -0.01em        | Minor headings                |
| H6      | 1rem            | 600    | 1.4         | -0.01em        | Overlines, label headings     |

All heading sizes from H1 through H3 use fluid typography via `clamp()` to scale smoothly between mobile and desktop viewports. The tight line-height of 1.05 on H1 and H2 creates compact, impactful headline blocks — the text feels dense and intentional rather than loose and casual.

The negative letter-spacing (-0.03em on H1/H2) tightens the character spacing at display sizes, which is standard practice for geometric sans-serifs that have generous default tracking. At smaller sizes (H4-H6), the tracking loosens to maintain legibility.

### 4.3 Type Scale — Body (Plus Jakarta Sans)

| Element      | Size    | Weight | Line Height | Letter Spacing | Usage                     |
|--------------|---------|--------|-------------|----------------|---------------------------|
| Body         | 16px    | 400    | 1.7         | -0.01em        | Primary body text         |
| Body Large   | 18px    | 400    | 1.7         | -0.01em        | Lead paragraphs, intros   |
| Body Small   | 14px    | 400    | 1.6         | 0              | Captions, meta, footnotes |
| Body Bold    | 16px    | 600    | 1.7         | -0.01em        | Emphasis within body text |

The body line-height of 1.7 is deliberately generous. For information-dense content (service descriptions, documentation, case studies), this line-height creates comfortable reading rhythm and prevents the "wall of text" effect that undermines scannability.

Body text weight is 400 (regular). Bold emphasis within body text uses 600 (semibold) rather than 700 (bold) to avoid creating too sharp a contrast within running text.

### 4.4 Type Scale — Mono (JetBrains Mono)

| Element     | Size    | Weight | Line Height | Letter Spacing | Transform  | Color     | Usage                        |
|-------------|---------|--------|-------------|----------------|------------|-----------|------------------------------|
| Code Block  | 14px    | 400    | 1.6         | 0              | None       | #071D2F   | Inline code, code blocks     |
| Label       | 0.75rem | 500    | 1.0         | 0.05em         | Uppercase  | #0A68F5   | Category tags, section labels |
| Badge       | 0.625rem| 500    | 1.0         | 0.08em         | Uppercase  | #0A68F5   | Status indicators, counters  |

The mono label style — uppercase, wide-tracked, small, and rendered in Electric Blue — is a signature element of the ALLONE visual language. It appears above section headings as a category identifier (e.g., "SERVICES", "CASE STUDIES", "ABOUT") and creates a distinctive rhythm when scanning the page.

### 4.5 Font Loading Strategy

All three typefaces are loaded via `@font-face` declarations with `font-display: swap` to prevent invisible text during loading. The system-ui fallback stack ensures the layout remains stable during font loading — both General Sans and Plus Jakarta Sans have metrics similar to system sans-serif fonts, minimizing layout shift.

Critical font weights (General Sans 600, Plus Jakarta Sans 400) should be preloaded via `<link rel="preload">` in the document head for above-the-fold content.

---

## 5. Design Tokens

### 5.1 Border Radius

| Token    | Value | Usage                                          |
|----------|-------|-------------------------------------------------|
| `--radius-sm`  | 6px   | Small elements: badges, tags, inline code       |
| `--radius-md`  | 8px   | Default: inputs, small cards, dropdowns         |
| `--radius-lg`  | 12px  | Primary: buttons, cards, modals                 |
| `--radius-xl`  | 16px  | Large containers, feature cards, image frames   |
| `--radius-2xl` | 20px  | Hero elements, showcase cards                   |
| `--radius-full`| 9999px| Pills, avatar circles, floating navbar          |

The radius scale is intentionally restrained. The smallest radius (6px) is just enough to soften hard corners without looking "bubbly." The progression from 6px to 20px is non-linear, with the jump from lg (12px) to xl (16px) creating a clear visual distinction between standard UI elements and featured/showcase elements.

`radius-full` (9999px) is reserved for elements that must read as pills or circles: the floating navbar island, avatar images, toggle switches, and pagination dots.

### 5.2 Spacing

| Token             | Value                       | Usage                              |
|-------------------|-----------------------------|------------------------------------|
| `--section-gap`   | `clamp(5rem, 12vw, 10rem)` | Vertical gap between major sections |
| `--container-max` | 1200px (implied)            | Maximum content width              |
| `--container-padding` | 1.5rem (mobile), 2rem (desktop) | Horizontal page gutters    |

The section gap uses a fluid clamp that scales from 80px on mobile to 160px on large desktop. This aggressive spacing is a hallmark of Cold Clarity — it creates unmistakable separation between content sections, forcing the user to process one section completely before encountering the next.

Internal spacing within components follows a 4px base grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Component padding typically uses 16px (tight), 24px (default), or 32px (generous).

### 5.3 Shadows

| Name            | Value                                                          | Usage                          |
|-----------------|----------------------------------------------------------------|--------------------------------|
| Shadow SM       | `0 1px 2px rgba(7, 29, 47, 0.05)`                             | Subtle depth for small elements |
| Shadow MD       | `0 4px 12px rgba(7, 29, 47, 0.08)`                            | Card elevation, dropdowns      |
| Shadow LG       | `0 8px 30px rgba(7, 29, 47, 0.12)`                            | Modals, popovers, floating nav |
| Shadow Accent   | `0 4px 15px rgba(10, 104, 245, 0.25)`                         | Primary buttons, CTA glow      |
| Shadow Accent Hover | `0 6px 20px rgba(10, 104, 245, 0.35)`                    | Primary button hover state     |

All shadows in the ALLONE system are tinted with Dark Navy (#071D2F) rather than pure black. This creates shadows that feel integrated with the color system rather than harsh and disconnected. The accent shadow uses the Electric Blue hue to create a subtle glow effect on primary action buttons, reinforcing their importance in the visual hierarchy.

### 5.4 Borders

Default border: `1px solid #DCE9F6`
Light border: `1px solid #E8EEF4`
Focus ring: `0 0 0 3px rgba(10, 104, 245, 0.2)` (accent at 20% opacity)

Borders are used sparingly. Cards may or may not have borders depending on whether they sit on the page background (border needed for definition) or on a surface color (border optional — the background contrast provides definition). When in doubt, prefer surface color differentiation over border lines.

### 5.5 Z-Index Scale

| Layer          | Value | Usage                            |
|----------------|-------|----------------------------------|
| Base           | 0     | Default content                  |
| Cards          | 1     | Elevated cards, overlapping elements |
| Sticky         | 10    | Sticky headers, floating labels  |
| Navbar         | 50    | Floating navigation bar          |
| Dropdown       | 100   | Dropdown menus, select lists     |
| Modal Backdrop | 200   | Modal overlay background         |
| Modal          | 300   | Modal content                    |
| Toast          | 400   | Toast notifications              |
| Tooltip        | 500   | Tooltip overlays                 |

---

## 6. Animation & Motion

### 6.1 Motion Principles

Motion in the ALLONE system serves three purposes: **orientation** (helping users understand where they are), **continuity** (connecting state changes so they feel fluid rather than jarring), and **delight** (subtle moments of craft that reward attention). Motion that does not serve one of these three purposes is removed.

All animations are subtle and brief. The brand should feel fast and responsive, not theatrical. If a user notices an animation, it should be because of its quality, not its duration or extravagance.

### 6.2 Easing Curves

| Name         | Value                                | Character            | Usage                          |
|--------------|--------------------------------------|----------------------|--------------------------------|
| Ease Out     | `cubic-bezier(0.16, 1, 0.3, 1)`     | Fast start, gentle stop | Element entrances, reveals    |
| Ease In-Out  | `cubic-bezier(0.65, 0, 0.35, 1)`    | Symmetric, balanced  | State transitions, toggles    |
| Expo         | `cubic-bezier(0.87, 0, 0.13, 1)`    | Dramatic deceleration | Page transitions, hero animations |

The primary easing curve is **Ease Out** (`cubic-bezier(0.16, 1, 0.3, 1)`). This curve starts fast and decelerates gently, which creates a feeling of natural physics — objects arrive quickly and settle into place. It is used for the majority of entrance animations: elements fading in, cards appearing, text revealing.

The **Expo** curve (`cubic-bezier(0.87, 0, 0.13, 1)`) is reserved for high-impact moments: page-level transitions, hero section animations, and the initial load sequence. Its dramatic deceleration creates a sense of weight and importance.

### 6.3 Animation Types

**Fade In**
```
opacity: 0 → 1
duration: 600ms
easing: ease-out
```
The most basic entrance animation. Used for elements that appear without spatial movement — content swaps, lazy-loaded images, dynamically inserted elements.

**Fade In Up**
```
opacity: 0 → 1
transform: translateY(30px) → translateY(0)
duration: 600ms
easing: ease-out
```
The standard scroll-triggered entrance animation. Elements rise from below while fading in. The 30px translation is subtle enough to register as motion without feeling like the element is "flying in."

**Blur Reveal**
```
opacity: 0 → 1
filter: blur(10px) → blur(0)
duration: 600ms
easing: ease-out
```
A signature ALLONE animation. Elements appear from a blurred state into sharp focus. This is used for hero headlines and high-impact text, reinforcing the "clarity" concept — content literally comes into focus.

**Line Reveal**
```
clip-path: inset(0 100% 0 0) → inset(0 0% 0 0)
duration: 800ms
easing: ease-out
```
Text or horizontal elements reveal from left to right via a clip-path animation. Used for horizontal rules, divider lines, and occasionally for headline text as an alternative to blur-reveal.

**Shimmer**
```
background-position: -200% → 200%
duration: 2000ms
easing: linear
iteration: infinite
```
A continuous shimmer effect for loading skeletons and placeholder content. The gradient sweeps continuously across the element, indicating that content is loading.

**Float**
```
transform: translateY(0) → translateY(-10px) → translateY(0)
duration: 3000ms
easing: ease-in-out
iteration: infinite
```
A gentle vertical oscillation for 3D elements, decorative graphics, or the Spline robot scene. The slow, continuous motion adds life to static layouts without being distracting.

**Pulse Glow**
```
box-shadow: 0 0 0 rgba(10,104,245,0) → 0 0 20px rgba(10,104,245,0.3) → 0 0 0 rgba(10,104,245,0)
duration: 2000ms
easing: ease-in-out
iteration: infinite
```
A pulsing glow effect used on primary CTA buttons during key moments (e.g., pricing pages, consultation booking). The glow uses the Electric Blue accent color at 30% opacity, creating a subtle attention magnet.

**Logo Scroll**
A horizontal scrolling animation for client logo marquees. Logos scroll continuously from right to left at a constant velocity, with seamless looping achieved by duplicating the logo set.

### 6.4 Stagger Pattern

When multiple elements enter the viewport simultaneously (e.g., a grid of service cards), each element's animation is delayed by **100ms** from the previous one. This creates a cascading entrance that draws the eye through the content in a deliberate sequence.

Stagger delays are applied via CSS custom properties or Framer Motion's `staggerChildren` with a value of `0.1`. Maximum total stagger duration should not exceed 500ms (5 elements) to prevent the last elements from feeling sluggish.

### 6.5 Reduced Motion Support

All animations in the ALLONE system respect the `prefers-reduced-motion` media query. When reduced motion is preferred:

- All entrance animations (fade-in, fade-in-up, blur-reveal, line-reveal) are disabled; elements appear immediately at their final state.
- Continuous animations (float, shimmer, pulse-glow, logo-scroll) are paused or set to their static state.
- State transitions (hover effects, focus rings) remain enabled but use instant transitions (duration: 0ms) or extremely short durations (under 100ms).
- Page functionality is never gated behind animation — all content is accessible with animations disabled.

### 6.6 3D Utilities

For elements that require 3D transforms (the Spline robot scene, card tilt effects, parallax layers):

| Property        | Value                  | Usage                           |
|-----------------|------------------------|---------------------------------|
| Perspective     | `perspective(1000px)`  | Parent container for 3D children |
| Transform Style | `preserve-3d`         | Maintain 3D context in children  |
| Backface        | `hidden`              | Prevent flicker on 3D rotations  |

3D effects are used sparingly and always serve the hero section or interactive showcase elements. They should never appear in standard content sections.

---

## 7. UI Component Patterns

### 7.1 Buttons

**Primary Button**
```
background: #0A68F5 (accent)
color: #FFFFFF
padding: 12px 28px
border-radius: 12px (radius-lg)
font-family: 'Plus Jakarta Sans'
font-weight: 600
font-size: 15px
box-shadow: 0 4px 15px rgba(10, 104, 245, 0.25)
transition: all 200ms ease-out

Hover:
  background: #0B5CD6 (accent-hover)
  box-shadow: 0 6px 20px rgba(10, 104, 245, 0.35)
  transform: translateY(-1px)

Active:
  transform: translateY(0)
  box-shadow: 0 2px 8px rgba(10, 104, 245, 0.2)
```
The primary button is the most prominent interactive element on any page. The accent glow shadow creates a subtle halo effect that makes the button "float" above the surface. On hover, the shadow intensifies and the button lifts by 1px, creating a tactile response.

**Secondary Button**
```
background: transparent
color: #071D2F (heading)
padding: 12px 28px
border: 1px solid #DCE9F6 (border)
border-radius: 12px (radius-lg)
font-family: 'Plus Jakarta Sans'
font-weight: 600
font-size: 15px
transition: all 200ms ease-out

Hover:
  color: #0A68F5 (accent)
  border-color: #0A68F5 (accent)
  background: rgba(10, 104, 245, 0.05)
```
The secondary button is visually recessive until hovered. On hover, it shifts to the accent color system, signaling interactivity. This two-tier button system creates clear action hierarchy: one primary action per section, supporting actions as secondary.

**Ghost Button**
```
background: transparent
color: #0A68F5 (accent)
padding: 8px 16px
border: none
font-weight: 600
text-decoration: none
transition: opacity 200ms ease-out

Hover:
  opacity: 0.7
```
Ghost buttons are used for tertiary actions: "Learn more" links, "See all" navigation, breadcrumbs. They have no border or background, relying on color alone for identification.

### 7.2 Cards

**Standard Card**
```
background: #FFFFFF
border: 1px solid #DCE9F6
border-radius: 16px (radius-xl)
padding: 32px
transition: all 300ms ease-out

Hover:
  border-color: #0A68F5 (accent)
  box-shadow: 0 4px 12px rgba(7, 29, 47, 0.08)
  transform: translateY(-2px)
```

**Surface Card** (on white background)
```
background: #F8FAFE (surface)
border: none
border-radius: 16px (radius-xl)
padding: 32px
```

Cards use `radius-xl` (16px) to differentiate them from smaller interactive elements like buttons (radius-lg, 12px). The hover state on interactive cards includes a border color shift to Electric Blue, a subtle shadow, and a 2px lift — three simultaneous changes that create a satisfying, multi-layered interaction.

### 7.3 Glass Effects

**Glass (Standard)**
```
background: rgba(255, 255, 255, 0.7)
backdrop-filter: blur(20px)
-webkit-backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.2)
```

**Glass Strong**
```
background: rgba(255, 255, 255, 0.85)
backdrop-filter: blur(40px)
-webkit-backdrop-filter: blur(40px)
border: 1px solid rgba(255, 255, 255, 0.3)
```

Glass effects are used for the floating navbar and overlay elements that sit above content. The standard glass (70% white, 20px blur) provides translucency that lets background content peek through while maintaining text legibility. Glass Strong (85% white, 40px blur) is used when the glass element contains dense text or interactive controls that require higher contrast.

Glass effects require hardware-accelerated rendering. On browsers or devices that do not support `backdrop-filter`, the fallback is a solid white background with reduced opacity: `background: rgba(255, 255, 255, 0.95)`.

### 7.4 Inputs

```
background: #FFFFFF
border: 1px solid #DCE9F6 (border)
border-radius: 8px (radius-md)
padding: 12px 16px
font-family: 'Plus Jakarta Sans'
font-size: 16px
color: #071D2F
transition: border-color 200ms ease-out

Focus:
  border-color: #0A68F5 (accent)
  outline: none
  box-shadow: 0 0 0 3px rgba(10, 104, 245, 0.15)

Error:
  border-color: #EF4444 (error)
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15)
```

Input fields use `radius-md` (8px) — slightly less rounded than cards and buttons — to visually signal their role as data entry fields rather than action triggers. The focus ring uses the accent color at 15% opacity, creating a soft glow that clearly indicates the active field without being visually aggressive. Input font-size is set to 16px to prevent iOS zoom-on-focus behavior.

### 7.5 Labels and Tags

```
font-family: 'JetBrains Mono'
font-size: 0.75rem (12px)
font-weight: 500
text-transform: uppercase
letter-spacing: 0.05em
color: #0A68F5 (accent)
```

When used as a tag/badge with background:
```
background: #EFF6FF (accent-50)
padding: 4px 10px
border-radius: 6px (radius-sm)
```

The monospace uppercase label is one of the most distinctive typographic elements in the ALLONE system. Its wide tracking (0.05em), small size, and Electric Blue color create a visual pattern that immediately reads as "category" or "metadata." This consistency allows users to quickly identify navigational markers and content classification across all pages.

---

## 8. Photography & Imagery

### 8.1 Photography Style

ALLONE does not rely heavily on photography — the brand's visual presence is built primarily on typography, color, and space. When photography is used, it follows strict guidelines:

**Subject Matter:** Technology, workspaces, architecture, abstract textures. Never generic stock photography with posed smiling people. Never hands-on-laptop cliches. If people appear, they should be captured candidly in real work environments.

**Color Treatment:** Photos should be desaturated slightly (reduce saturation by 15-20%) and have their shadows lifted (increase shadow luminance). This creates a muted, cool-toned appearance that integrates with the Cold Clarity palette. Warm-toned photography (golden hour, warm interiors) should be avoided or color-corrected to match the blue-cool tone of the brand.

**Composition:** Clean compositions with ample negative space. Avoid cluttered scenes. The subject should occupy no more than 60% of the frame, with the remaining space providing breathing room that echoes the generous whitespace of the UI.

**Format:** All photographic images on the web should be delivered as WebP with a quality setting of 80-85%. Image containers use `radius-xl` (16px) border radius. Images should never bleed to the edge of a card or section without radius treatment.

### 8.2 Illustrations

ALLONE uses a geometric illustration style that mirrors the Convergence Mark's language: clean lines, precise angles, and the Electric Blue accent as the primary illustration color. Illustrations are used sparingly — primarily for empty states, onboarding flows, and feature explanations where photography would be inappropriate.

Illustration rules:
- Line weight: 1.5px-2px for consistency with the brand's precise feel
- Primary color: #0A68F5 (Electric Blue)
- Secondary color: #071D2F (Dark Navy) for grounding elements
- Fill colors: Surface tints (#F8FAFE, #F1F6FB) for backgrounds within illustrations
- No gradients, no hand-drawn textures, no organic shapes
- Illustrations should feel diagrammatic rather than artistic

### 8.3 Icons

Icons follow a line-style system with consistent parameters:

- Stroke width: 1.5px
- Corners: Rounded (2px radius on line ends)
- Size: 20px (default), 16px (compact), 24px (feature)
- Color: Inherits from parent (currentColor)
- Style: Outlined, not filled — consistent with the brand's preference for precision over weight

The recommended icon set is Lucide or Phosphor (light weight). Heroicons (outline variant) is acceptable. Filled/solid icon styles should not be used in the ALLONE context.

### 8.4 3D Elements

The ALLONE hero section features an interactive 3D robot scene built with Spline. 3D elements in the brand follow these guidelines:

- Materials: Clean, slightly reflective surfaces — no photorealistic textures
- Lighting: Cool-toned, directional, with soft shadows
- Colors: 3D elements should use the brand palette (white, Electric Blue, Dark Navy)
- Interaction: 3D scenes should respond to mouse/touch input but in a subtle, physics-based way — no sudden movements or jarring rotations
- Performance: 3D scenes must maintain 60fps on mid-range devices. If performance degrades, the scene should gracefully fall back to a static image

---

## 9. Design Principles

Five principles govern every visual decision in the ALLONE system. When evaluating a design choice — whether it is a color pairing, a component layout, an animation curve, or a photographic treatment — it must align with at least one of these principles and violate none.

### Principle 1: Precision Over Decoration

Every element earns its place by serving a functional purpose. A border exists to define a boundary. A shadow exists to communicate elevation. An accent color exists to guide the eye to the primary action. If an element is purely decorative — if removing it would not reduce the user's comprehension or ability to act — it should be questioned and, more often than not, removed.

This does not mean the design should feel barren or austere. Precision itself is beautiful. The exact border-radius on a card, the specific letter-spacing on a headline, the carefully calibrated shadow opacity — these details create a sense of craft and quality that is more compelling than any decorative flourish. The goal is to reach the state where the design feels inevitable: nothing can be added, nothing can be removed.

In practice, this means: no decorative gradients, no floating geometric shapes, no background patterns, no ornamental dividers, no visual elements that exist solely to "fill space." If a section feels empty, the solution is better content — not more decoration.

### Principle 2: Contrast Creates Hierarchy

The human eye is drawn to contrast before any other visual property. The ALLONE system uses contrast — in color, size, weight, and spacing — as the primary tool for creating visual hierarchy. The 16.5:1 contrast ratio between heading text and background is not a technical requirement reluctantly met; it is a design choice that makes the hierarchy unmistakable.

Within any given viewport, the user should be able to identify the following in under two seconds: the page/section title (largest, darkest text), the primary action (Electric Blue button with glow shadow), and the supporting content (smaller, lighter text). This three-tier hierarchy is created entirely through contrast relationships, without relying on boxes, backgrounds, or decorative framing.

The accent color (#0A68F5) achieves its prominence not through size or animation but through chromatic contrast — it is the only saturated color on a page of neutrals. This restraint gives the accent color enormous power. Every blue element on the page reads as "important" or "interactive" because blue is rare in the visual field.

### Principle 3: Motion With Purpose

Animation is a design tool, not a decoration. Every animation in the ALLONE system exists to answer one of three questions: "Where did this come from?" (entrance animations that establish spatial origin), "What changed?" (state transitions that connect before/after states), or "What should I notice?" (attention-directing animations like pulse-glow on CTAs).

Animations that do not answer one of these questions — purely decorative particle effects, background animations, parallax for parallax's sake — are not part of the ALLONE visual language. Motion should always feel fast and confident. Durations between 200ms (micro-interactions) and 800ms (page-level transitions) keep the interface feeling responsive. Nothing in the system exceeds 1000ms for a single animation cycle, with the exception of continuous ambient animations (float, shimmer) which are intentionally slow to avoid drawing attention.

The reduced motion implementation is not an afterthought; it is a design requirement equal in importance to the animations themselves. The interface must be fully functional and aesthetically complete with all animations disabled.

### Principle 4: Space Is a Design Element

Whitespace is not the absence of design. It is the most powerful compositional tool in the ALLONE system. The section gap — scaling from 80px to 160px — is deliberately aggressive because it forces content to be self-contained. Each section must make its point within its own vertical territory, without relying on proximity to adjacent sections for context.

Within components, padding is generous: 32px on cards, 12px 28px on buttons, 1.7 line-height on body text. This generosity communicates confidence. A company that gives its content room to breathe is a company that trusts its content to speak for itself.

The practical test for spacing: if two elements feel "too close together," they probably are. If a section feels "too spacious," it is probably correct. Cold Clarity errs on the side of more space, not less. Cramped layouts signal either desperation (too much to say, not enough room) or carelessness (no one thought about spacing). Neither is acceptable for a brand that sells precision and quality.

### Principle 5: Consistency Breeds Trust

Trust is built through predictability. When a user encounters an Electric Blue element, it should always be interactive. When a user sees a monospace uppercase label in blue, it should always be a category identifier. When a user hovers over a card, it should always respond with the same border-color shift, shadow, and lift.

This consistency extends beyond individual interactions to the systemic level. The border-radius scale, the type scale, the color scale — these are not guidelines to be interpreted; they are specifications to be followed exactly. A card with 14px radius instead of 16px, a heading with -0.02em tracking instead of -0.03em — these "close enough" deviations accumulate into an interface that feels subtly wrong, even if no individual deviation is consciously noticed.

The design token system exists to make consistency effortless. Every visual property — radius, shadow, color, spacing, font — is defined as a token with a specific value. Designers and developers reference tokens, not raw values. This ensures that changes to the visual system propagate uniformly and that no component exists outside the system.

Consistency also means consistency across contexts. The brand should feel the same on the website, in email communications, on social media, in printed materials, and in product interfaces. The typography, color palette, spacing philosophy, and motion principles defined in this document apply universally.

---

## Appendix: Quick Reference

### Color Cheat Sheet
```
White:       #FFFFFF
Surface:     #F8FAFE
Surface-2:   #F1F6FB
Surface-3:   #E0EEFB
Border:      #DCE9F6
Border-Lt:   #E8EEF4
Text:        #071D2F
Muted:       #7E8A97
Accent:      #0A68F5
Accent-Hov:  #0B5CD6
Success:     #22C55E
Warning:     #EAB308
Error:       #EF4444
Dark:        #071D2F
```

### Typography Cheat Sheet
```
Display:  General Sans, weight 600, lh 1.05, ls -0.03em
Body:     Plus Jakarta Sans, weight 400, lh 1.7, ls -0.01em
Mono:     JetBrains Mono, weight 500, uppercase, ls 0.05em
```

### Radius Cheat Sheet
```
6px  → tags, badges
8px  → inputs, small cards
12px → buttons, standard cards
16px → feature cards, image frames
20px → hero elements
Full → navbar, avatars, pills
```

### Easing Cheat Sheet
```
ease-out:    cubic-bezier(0.16, 1, 0.3, 1)     → entrances
ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)    → transitions
expo:        cubic-bezier(0.87, 0, 0.13, 1)     → hero/page
```

---

*This document is the canonical reference for the ALLONE visual identity. All design and development work must conform to the specifications defined herein. Deviations require review and approval before implementation.*
