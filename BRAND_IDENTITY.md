# Softale Brand Identity & Design System

> **Version:** 1.1  
> **Last Updated:** January 2026  
> **Project:** Reverie - Audio Stories & Meditation App

---

## 🎨 Brand Overview

**Softale** is a premium audio storytelling platform focused on sleep, meditation, and mindfulness. Our design language emphasizes **serenity, clarity, and premium quality** through glassmorphic aesthetics and calming visual elements.

### Core Values
- **Tranquility**: Calm, soothing visual experience
- **Premium Quality**: Polished, professional design
- **Clarity**: Clear hierarchy and readable content
- **Immersion**: Beautiful imagery and smooth interactions

---

## 🎭 Two-Tier Page Strategy

Softale uses a **two-tier design system** to balance aesthetics with readability across different page types.

### Tier 1: Immersive Pages
**Purpose:** Content browsing, exploration, and discovery  
**Background:** `bg-slate-50/60 backdrop-blur-2xl` (Light, Clean)  
**Text Style:** Dark (`text-slate-900`) for maximum legibility on light glass.  
**Use Cases:** Home, Library, Collection Detail, Favorites

```tsx
<GlassLayout variant="immersive">
  <h1 className="text-3xl font-bold text-slate-900">
    Page Title
  </h1>
</GlassLayout>
```

**Characteristics:**
- **Light & Airy**: Uses soft white/slate transparency (`bg-slate-50/60`).
- **Dark Text**: Always use `text-slate-900` for content.
- **Mood-based**: Background images provide color through the glass.
- **NO Dark Mode**: The app follows a consistent "Day/Light" aesthetic.

### Tier 2: Functional Pages
**Purpose:** Account management, transactions, and settings  
**Background:** `bg-white/95 backdrop-blur-xl`  
**Text Style:** Dark (`text-slate-900`)  
**Use Cases:** Account, Upgrade, Settings, Auth pages

```tsx
<GlassLayout variant="functional">
  <h1 className="text-3xl font-bold text-slate-900">
    Account Settings
  </h1>
</GlassLayout>
```

**Characteristics:**
- Nearly opaque white background for maximum readability
- Dark text (slate-900/700) for optimal contrast
- WCAG AA compliant for accessibility
- Optimized for reading important information and completing actions

### When to Use Each Tier

**Use Immersive (Tier 1) when:**
- User is browsing or discovering content
- Visual aesthetics enhance the experience
- Background imagery adds context (mood-based)

**Use Functional (Tier 2) when:**
- User needs to read detailed information
- Forms or inputs are present
- Financial or account information is displayed
- Maximum readability is critical

---

## 🌈 Color Palette

### Primary Colors
```css
/* Indigo - Primary Brand Color */
--indigo-50:  #EEF2FF
--indigo-100: #E0E7FF
--indigo-500: #6366F1  /* Primary CTA */
--indigo-600: #4F46E5  /* Primary Hover */
--indigo-700: #4338CA

/* Violet - Secondary Accent */
--violet-500: #8B5CF6
--violet-600: #7C3AED
```

### Mood Colors
Each mood has a dedicated color palette for consistency:

```css
/* Sleep - Indigo */
bg-indigo-100 text-indigo-700

/* Meditation - Teal */
bg-teal-100 text-teal-700

/* Fantasy - Fuchsia */
bg-fuchsia-100 text-fuchsia-700

/* Nature - Emerald */
bg-emerald-100 text-emerald-700

/* Energized - Amber */
bg-amber-100 text-amber-700

/* Focus - Sky */
bg-sky-100 text-sky-700
```

### Neutral Colors
```css
/* White - Backgrounds and Image Overlays */
--white: #FFFFFF

/* Black - Shadows */
--black: #000000

/* Slate - Text and UI Elements */
--slate-50:  #F8FAFC
--slate-100: #F1F5F9
--slate-200: #E2E8F0
--slate-500: #64748B
--slate-600: #475569
--slate-900: #0F172A  /* Primary Text */
```

### Premium Accents
```css
/* Gold - Premium Features */
--amber-300: #FCD34D
--amber-400: #FBBF24
--amber-500: #F59E0B

/* Red - Favorites */
--red-400: #F87171
--red-500: #EF4444
```

---

## 📝 Typography

### Font Family
```css
/* Primary Font - Inter (System Default) */
font-family: system-ui, -apple-system, sans-serif;
```

### Text Hierarchy

#### Headings
```tsx
/* Page Title (H1) */
className="text-3xl font-bold text-slate-900"

/* Section Title (H2) */
className="text-xl font-bold text-slate-900"

/* Subsection Title (H3) */
className="text-lg font-bold text-slate-900"

/* Card Overlay Title (On Image) */
className="text-base font-bold text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]"
```

#### Body Text
```tsx
/* Primary Body */
className="text-sm text-slate-600"

/* Secondary Body - Muted */
className="text-sm text-slate-500"

/* Metadata (Author, Duration) */
className="text-xs font-medium text-slate-500"
```

### Text Shadow Usage
**Only use text-shadow when text is placed directly over an image or video:**

```css
/* Strong Shadow (Image Overlays) */
[text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]
```

---

## 🎴 Glassmorphic Design System

### Core Principle
**Glassmorphism** creates depth and premium feel through layered transparency, blur, and subtle borders. We use a **Light Glass** approach for a clean, modern look.

### Standard Glass Card
```tsx
className="
  bg-white/30 
  backdrop-blur-xl 
  border border-white/20 
  rounded-2xl 
  shadow-lg
"
```

### Glass Variations

#### Light Glass (Hover States)
```tsx
bg-white/40 backdrop-blur-xl
```

#### Dark Glass (Image Overlays & Badges)
```tsx
bg-black/40 backdrop-blur-md
```

#### Premium Glass (Featured Content)
```tsx
bg-white/20 backdrop-blur-2xl border border-white/30
```

---

## 🃏 Component Standards

### Story Card

#### Square Card (Default)
```tsx
<div className="group cursor-pointer flex flex-col gap-3">
  {/* Image Container */}
  <div className="
    relative rounded-xl overflow-hidden 
    aspect-square
    border border-slate-100
    shadow-md hover:shadow-xl hover:-translate-y-0.5
    transition-all duration-500
  ">
    <img className="w-full h-full object-cover 
      transition-transform duration-1000 
      group-hover:scale-105" 
    />
  </div>
  
  {/* Title */}
  <h3 className="
    font-bold text-base leading-tight mb-1.5 line-clamp-2
    text-slate-900
    transition-colors
  ">
    Story Title
  </h3>
  
  {/* Author */}
  <span className="
    text-xs font-medium text-slate-600 
  ">
    Author Name
  </span>
</div>
```

### Collection Card
```tsx
<div className="relative aspect-square rounded-2xl overflow-hidden">
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t 
    from-black/60 via-transparent to-transparent opacity-80" 
  />
  
  {/* Badge */}
  <div className="absolute top-3 left-3 
    px-3 py-1.5 
    bg-black/40 backdrop-blur-md rounded-lg 
    text-xs font-bold text-white 
    [text-shadow:_0_1px_2px_rgb(0_0_0_/_90%)]
  ">
    X tracks
  </div>
  
  {/* Title (On Image) */}
  <h3 className="
    text-lg font-bold text-white 
    [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]
  ">
    Collection Title
  </h3>
</div>
```

### Featured Card (Desktop)
```tsx
<div className="relative rounded-3xl overflow-hidden min-h-[400px]">
  {/* Background Image */}
  <img className="absolute inset-0 w-full h-full object-cover" />
  
  {/* Gradient Overlay - LIGHT for desktop */}
  <div className="absolute inset-0 
    bg-gradient-to-r from-black/30 via-black/20 to-black/10
  " />
  
  {/* Content */}
  <div className="relative p-8">
    <h2 className="
      text-2xl font-extrabold text-white 
      [text-shadow:_0_1px_3px_rgb(0_0_0_/_90%)]
    ">
      Featured Story
    </h2>
  </div>
</div>
```

### Section Headers
```tsx
<h3 className="
  text-xl font-bold text-slate-900
">
  Section Title
</h3>

<p className="
  text-sm text-slate-500
">
  Subtitle or description
</p>
```

---

## 🎭 Interactive States

### Hover Effects
```tsx
/* Cards */
hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300

/* Images */
group-hover:scale-105 transition-transform duration-1000

/* Buttons */
hover:bg-white/40 transition-colors duration-200
```

### Active States
```tsx
/* Active Story Card */
ring-2 ring-indigo-500 ring-offset-2 shadow-lg

/* Active Text */
text-indigo-600
```

### Loading States
```tsx
/* Spinner */
<div className="
  w-8 h-8 border-2 border-slate-900 
  border-t-transparent rounded-full animate-spin
" />
```

---

## 🎯 Button Styles

### Primary CTA
```tsx
className="
  px-6 py-3 
  bg-indigo-600 hover:bg-indigo-700 
  text-white font-semibold 
  rounded-full 
  shadow-lg hover:shadow-xl 
  transition-all duration-200
"
```

### Secondary Button
```tsx
className="
  px-6 py-3 
  bg-white/30 backdrop-blur-xl 
  border border-white/20 
  text-slate-900 font-semibold 
  rounded-full 
  hover:bg-white/40 
  transition-all duration-200
"
```

### Filter Button (Active)
```tsx
className="
  px-4 py-2 
  bg-slate-900 text-white 
  rounded-full text-sm font-semibold
"
```

### Filter Button (Inactive)
```tsx
className="
  px-4 py-2 
  bg-white text-slate-600 
  border border-slate-200 
  rounded-full text-sm font-semibold
  hover:border-slate-300
"
```

---

## 🏷️ Badges & Pills

### Category Badge
```tsx
className="
  text-xs uppercase tracking-wider font-bold 
  px-2 py-1 rounded-lg 
  bg-indigo-100 text-indigo-700
  shadow-sm
"
```

### Premium Badge
```tsx
className="
  text-xs bg-black/60 text-amber-300 
  px-1.5 py-0.5 rounded-md font-bold 
  backdrop-blur-md 
  border border-amber-500/30 
  shadow-sm
"
```

### Collection Badge
```tsx
className="
  px-3 py-1.5 
  bg-black/40 backdrop-blur-md rounded-lg 
  text-xs font-bold text-white 
  [text-shadow:_0_1px_2px_rgb(0_0_0_/_90%)]
"
```

---

## 📐 Spacing & Layout

### Container Padding
```tsx
/* Mobile */
px-6 py-6

/* Desktop */
md:px-12 md:py-8
```

### Section Spacing
```tsx
/* Between sections */
mb-8 md:mb-12

/* Between cards in grid */
gap-4 md:gap-6
```

### Card Grids
```tsx
/* Responsive Grid */
className="
  grid 
  grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-4 
  xl:grid-cols-5 
  gap-4 md:gap-6
"
```

### Horizontal Scrollers
```tsx
className="
  flex gap-4 
  overflow-x-auto pb-4 
  scrollbar-hide 
  -mx-6 md:-mx-12 px-6 md:px-12
"
```

---

## 🎬 Animations

### Standard Transitions
```tsx
/* All transitions */
transition-all duration-300

/* Transform only */
transition-transform duration-500

/* Colors only */
transition-colors duration-200
```

### Framer Motion Patterns
```tsx
/* Card Entrance */
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.03 * index }}

/* Hover Scale */
whileHover={{ y: -4 }}
whileTap={{ scale: 0.98 }}
```

---

## 🖼️ Image Standards

### Aspect Ratios
```tsx
/* Square (Default) */
aspect-square

/* Portrait */
aspect-[2/3]

/* Video/Landscape */
aspect-video
```

### Image Optimization
- Always use `object-cover` for card images
- Add `group-hover:scale-105` for subtle zoom
- Use `transition-transform duration-1000` for smooth scaling

### Gradient Overlays
```tsx
/* Dark Overlay (for white text on images) */
bg-gradient-to-t from-black/60 via-transparent to-transparent

/* Light Overlay (desktop featured) */
bg-gradient-to-r from-black/30 via-black/20 to-black/10
```

---

## ✨ Premium Features Indicators

### Premium Lock Icon
```tsx
<svg className="w-3 h-3 text-amber-300">
  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</svg>
```

### Premium Badge
```tsx
<span className="
  text-xs bg-amber-400/90 text-amber-900 
  px-2 py-1 rounded-lg font-bold 
  flex items-center gap-1
">
  ✨ PREMIUM
</span>
```

---

## 🎵 Audio Player Standards

### Mini Player
```tsx
className="
  fixed bottom-0 left-0 right-0 
  bg-white/80 backdrop-blur-xl 
  border-t border-white/20 
  shadow-lg 
  z-50
"
```

### Progress Bar
```tsx
<div className="h-1 bg-slate-200">
  <div className="h-full bg-indigo-500 
    shadow-[0_0_10px_rgba(99,102,241,0.5)]
  " />
</div>
```

---

## 📱 Responsive Breakpoints

```tsx
/* Mobile First */
default: 0-640px

/* Tablet */
md: 768px+

/* Desktop */
lg: 1024px+

/* Large Desktop */
xl: 1280px+
```

### Mobile-Specific Patterns
- Absolute positioned logo: `top-8 left-1/2 -translate-x-1/2`
- Full-width horizontal scrollers with negative margin
- Simplified layouts (no gradient overlays on featured cards)

---

## 🚫 Don'ts - Common Mistakes to Avoid

❌ **Never** use dark text on dark glass backgrounds (illegible)
✅ **Always** use white text with text-shadow when on top of images

❌ **Never** use white text on light glass without a shadow
✅ **Always** use dark text (slate-900) on light glass for readability

❌ **Never** use solid backgrounds for cards
✅ **Always** use glassmorphic `bg-white/30 backdrop-blur-xl`

❌ **Never** use icons in section headers or badges (cluttered)
✅ **Always** use clean text with emojis when appropriate

❌ **Never** use harsh shadows
✅ **Always** use subtle shadows (`shadow-md`, `shadow-lg`)

---

## 📋 Quick Reference Checklist

When creating new components, ensure:

- [ ] Dark text for content / White text for overlays
- [ ] Light glassmorphic backgrounds (`bg-white/30 backdrop-blur-xl`)
- [ ] Smooth transitions (`transition-all duration-300`)
- [ ] Hover states defined
- [ ] Responsive design (mobile-first)
- [ ] Proper spacing (mb-8, gap-4)
- [ ] Rounded corners (`rounded-xl`, `rounded-2xl`)
- [ ] Subtle borders (`border border-white/20`)

---

## 🎨 Design Philosophy Summary

> **"Tranquil, Luminous, Clear"**

Our design language prioritizes:
1. **Clarity through contrast**: Dark text on light glass, white on dark overlays
2. **Depth through layers**: Glassmorphic overlays create visual hierarchy
3. **Calm through motion**: Smooth, gentle animations
4. **Premium through polish**: Attention to detail in every interaction

---

**End of Brand Identity Document**
*For questions or updates, contact the design team.*
