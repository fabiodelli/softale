# 🎨 10. UI & Design System

## Core Aesthetic
Softale uses a polished **Glassmorphism** aesthetic tailored for relaxation and premium content.
*   **Colors**: Semantic palette defined in `src/config/theme.ts` mapping emotional states (Sleep, Meditation, Fantasy) to specific HSL values.
*   **Typography**: Clean, sans-serif fonts (Geist/Inter) for readability.
*   **Effects**: Heavy use of backdrop-blur (`backdrop-blur-md`), translucent whites (`bg-white/10`), and subtle gradients.

## Component Architecture

### StoryCard Ecosystem
The `StoryCard` is the central UI element, refactored in V6.1 for performance and maintainability.

*   **Wrapper**: `src/components/StoryCard.tsx` - Smart container detecting aspect ratio.
*   **Variants**:
    *   **Default**: `src/components/story/StoryCardDefault.tsx` - Handles Portrait, Square, and Video aspect ratios.
    *   **Horizontal**: `src/components/story/StoryCardHorizontal.tsx` - Optimized for list views.

### Accessibility (A11y) Rules
*   **Interactive Elements**: All clickable cards use a "Stretched Link" pattern with a hidden `<button>` overlay.
*   **No Div-Clicks**: `div`s with `onClick` are forbidden for primary actions.
*   **Focus Management**: High-contrast focus rings (`focus:ring-indigo-500`) for keyboard navigation.
*   **ARIA**: Mandatory `aria-label` on all icon-only buttons.

### Image Optimization Strategy
*   **Next.js Image**: All media assets use `next/image` component.
*   **Configuration**:
    *   **Remote Patterns**: Configured in `next.config.ts` for Supabase Storage.
    *   **Sizing**: `sizes` prop mandatory to serve correct WebP/AVIF variants.
    *   **Loading**: `priority` set for above-the-fold content (e.g., Hero FeaturedCard).

## Key Components

| Component | Path | Description |
| :--- | :--- | :--- |
| **FeaturedCard** | `src/components/FeaturedCard.tsx` | Hero component with premium hover effects and fallback logic. |
| **MiniPlayer** | `src/components/MiniPlayer.tsx` | Persistent footer player. Fully accessible in V6.1. |
| **Theme Config** | `src/config/theme.ts` | Centralized source of truth for Category Colors. |

## Best Practices
1.  **Extract Complex Logic**: Use sub-components for variants (like `StoryCard`).
2.  **Centralize Config**: Don't hardcode colors; use `src/config/theme.ts`.
3.  **Performance First**: Always use `next/image` and verify Core Web Vitals.
