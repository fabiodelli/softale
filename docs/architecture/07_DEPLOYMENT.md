# 🚀 07. Deployment

## ☁️ Provider
**Vercel**
*   Connected to GitHub repository.
*   Automatic deployments on push to `main`.
*   Preview deployments on Pull Requests.

## 🔑 Environment Variables
Production requires the following keys set in Vercel Settings:

### Core
*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public client key.
*   `SUPABASE_SERVICE_ROLE_KEY`: **SECRET**. Admin access (for n8n/Scripts).

### Payments
*   `STRIPE_SECRET_KEY`: **SECRET**. For backend billing logic.
*   `STRIPE_WEBHOOK_SECRET`: **SECRET**. To verify webhook signatures.
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: For client-side elements.

### AI (Optional for App, Required for n8n)
*The app itself usually doesn't need these, as n8n handles generation.*
*   `ANTHROPIC_API_KEY`
*   `OPENAI_API_KEY`
*   `ELEVENLABS_API_KEY`

## 🌐 Domains
*   **Main**: `softale.app`
*   **WWW**: `www.softale.app` (Redirects to main).

## 🚨 Pre-Flight Check
Before promoting a build to production:
1.  **Check `task.md`**: Ensure all critical verification steps are checked.
2.  **Lint**: Run `npm run lint`.
3.  **Build**: Run `npm run build` locally to catch type errors.
