# 📖 Softale Application Bible
*The definitive guide to the Softale application architecture, design, and workflows.*

> **Last Updated:** January 2026
> **Version:** 6.1 (Qwen & Stems Architecture)

---

## 🏗️ Architecture & Documentation

This directory contains the single source of truth for the application.

| Section | Description |
| :--- | :--- |
| **[01. Brand & Vision](./01_BRAND_AND_VISION.md)** | Design system, typography, color palette, and core mission. |
| **[02. Tech Stack](./02_TECH_STACK.md)** | Frameworks, libraries, database schema, and key dependencies. |
| **[03. Authentication](./03_AUTHENTICATION.md)** | User flows, Supabase Auth implementation, and protected routes. |
| **[04. Payments](./04_PAYMENTS.md)** | Stripe integration, subscription models, and webhook handling. |
| **[05. Audio Factory](./05_AUDIO_FACTORY_V7.md)** | **V6.1 Architecture**: Qwen TTS, 3-Stem Delivery, Warm-up, & Harvesting. |
| **[06. Social Studio](./06_SOCIAL_STUDIO.md)** | Social media automation, reel management, and caption generation. |
| **[07. Deployment](./07_DEPLOYMENT.md)** | Vercel deployment, environment variables, and production checks. |
| **[08. Player Architecture](./08_PLAYER_ARCHITECTURE.md)** | Frontend Audio Engine & Hooks. |
| **[09. Data Layer](./09_DATA_LAYER.md)** | Modular Supabase architecture. |
| **[10. UI & Design System](./10_UI_COMPONENTS.md)** | **V6.1 Update**: Component architecture, A11y rules, and Image Optimization. |

---

## 🚀 Quick Start for Developers

1.  **Clone & Install**:
    ```bash
    git clone ...
    npm install
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env.local` and populate keys (Supabase, Stripe, etc.).

3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

4.  **Audio Factory**:
    Now runs as a **Local Hybrid** system (TS + Python).
    See [Section 05](./05_AUDIO_FACTORY_V7.md) for setup instructions.
    *Do NOT use the old n8n workflows.*

---

## 📂 Project Structure

*   **/src/app**: Next.js App Router pages.
*   **/src/components**: React components (atomic designish).
*   **/src/lib**: Utilities, database clients, shared logic.
*   **/tools**:
    *   `audio-factory`: Core logic (TS).
    *   `qwen-api`: Local TTS Server (Python).
*   **/supabase**: SQL migrations and types.
