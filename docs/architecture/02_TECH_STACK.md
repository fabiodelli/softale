# 🛠️ 02. Tech Stack

## 💻 Frontend Framework
**Next.js 14 (App Router)**
*   **Language**: TypeScript (Strict mode).
*   **Deployment**: Vercel (Production & Preview environments).
*   **Routing**: File-system based routing (`src/app/`).
*   **Server Components**: We use RSC (React Server Components) by default, adding `'use client'` only when interactivity is required.

## 🎨 UI & Styling
*   **Tailwind CSS**: Utility-first styling.
*   **Framer Motion**: Complex animations, layout transitions, and shared element effects.
*   **Lucide React**: Icon library.
*   **UI Components**: Custom components in `src/components/`, designed with a "glassmorphism" aesthetic.

## 🗄️ Backend & Database
**Supabase** (PostgreSQL)
*   **Database**: Relational data for Users, Stories, Collections.
*   **Auth**: Handled via Supabase Auth (Email/Password + OAuth).
*   **Storage**: Buckets for media (`audio`, `covers`, `avatars`).
*   **Edge Functions**: (Optional) For high-latency logic not suitable for Next.js API routes.

## 🏪 State Management
**Zustand**
*   Used for global client state (e.g., Audio Player status, Playlist queue).
*   *Why?* Simpler and lighter than Redux.

## 💳 Payments
**Stripe**
*   Subscriptions (SaaS model).
*   Webhooks handles status updates (Active/PastDue/Canceled).
*   **Critical**: `STRIPE_SECRET_KEY` is required for the build process (even if disabled).

## 🧩 Key Libraries
| Package | Purpose |
| :--- | :--- |
| `n8n` | Workflow automation & AI orchestration (Audio Factory). |
| `ffmpeg-static` | Local audio stitching (Hybrid Pipeline). |
| `fluent-ffmpeg` | Audio processing. |
| `openai`, `@anthropic-ai/sdk` | AI Client SDKs. |
| `zod` | Schema validation. |
