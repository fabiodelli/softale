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

## 🧩 Key Libraries & Services
| Package / Service | Purpose |
| :--- | :--- |
| **Qwen 2.5 (Python)** | Local TTS Server (FastAPI). Replaces external TTS limits. |
| **Stable Audio** | API for high-fidelity background music & ambience. |
| `ffmpeg-static` | Local audio mixing (Stems & Warmup injection). |
| `fluent-ffmpeg` | Audio processing wrapper. |
| `openai`, `@anthropic-ai` | AI Clients for Concept & Script generation. |
| `zod` | Schema validation. |
