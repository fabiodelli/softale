# 🎨 01. Brand & Vision

## 🌟 Mission
**Softale** is an AI-powered audio storytelling platform designed to help users disconnect, relax, and dream.
*   **Keywords**: Premium, Ethereal, Calm, Magical, Deep.
*   **Target Audience**: People seeking high-quality sleep stories, meditation, and immersive audio experiences.

---

## 🎨 Design System

### 1. Visual Style: "Dark Glass"
The UI is built on a **Dark Mode First** philosophy, utilizing heavy use of **Glassmorphism**.
*   **Backgrounds**: Deep blacks and zincs (`bg-black`, `bg-zinc-950`).
*   **Cards**: Translucent layers with delicate white borders (`bg-white/5`, `border-white/10`, `backdrop-blur-md`).
*   **Accents**: Subtle glowing gradients (Violet, Indigo, Emerald) rather than flat solid colors.

### 2. Typography
We use **Geist Sans** (via `next/font`) for a modern, clean, and legible aesthetic.
*   **Headings**: Bold, tight tracking.
*   **Body**: Readable, good contrast (Gray-400 for secondary text).

### 3. Color Palette (Tailwind)

| Name | Tailwind Class | Hex (Approx) | Usage |
| :--- | :--- | :--- | :--- |
| **Void** | `bg-black` | `#000000` | Main background. |
| **Surface** | `bg-zinc-900` | `#18181b` | Cards, panels. |
| **Glass** | `bg-white/5` | `rgba(255,255,255,0.05)` | Overlays. |
| **Primary** | `text-violet-500` | `#8b5cf6` | CTAs, active states, premium branding. |
| **Success** | `text-emerald-500` | `#10b981` | Completed actions, nature themes. |
| **Magic** | `text-indigo-500` | `#6366f1` | AI generation features. |

---

## 🎭 UX Principles

1.  **"Show, Don't Tell"**: Use visuals and audio previews immediately.
2.  **Seamless Transitions**: No hard cuts. Use `framer-motion` for smooth layout changes and shared element transitions.
3.  **Mobile First**: The experience must be perfect on mobile (where users listen).
    *   *Note*: Pay attention to `dvh` (Dynamic Viewport Height) for mobile browsers.
4.  **Premium Feel**: Micro-interactions (hover states, click feedback) are mandatory. Nothing should feel "static".

---

## 🖼️ Assets

*   **Logo**: Minimalist geometric shapes.
*   **Cover Art**: AI-generated (DALL-E 3), cinematic aspect ratio (usually Square 1:1 or Portrait 9:16 for social).
