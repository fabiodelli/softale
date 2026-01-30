# 🔐 03. Authentication

## 🛡️ Overview
Authentication is managed entirely by **Supabase Auth**. We support:
*   **Modular Implementation**: Core auth logic is located in `@/lib/supabase/auth.ts`.
1.  **Email / Password**
2.  **Magic Links** (Passwordless)
3.  **Social Login** (Google) - *Configured in Supabase Dashboard*.

## 🛣️ Key Flows

### 1. Sign Up
*   **Page**: `/signup`
*   **Action**: Creates a user in `auth.users` (Supabase internal).
*   **Trigger**: A Postgres Trigger automatically creates a corresponding public profile in the `public.users` table.

### 2. Login
*   **Page**: `/login`
*   **Redirects**: Supports `?redirect=/path` query param to return user to their previous page after login.

### 3. Password Reset
*   **Flow**: User requests link -> Email sent -> User clicks link -> Redirects to `/auth/update-password` (Standard).
*   **Note**: Ensure Supabase Email Template includes the correct redirect URL (e.g., `https://softale.app/auth/update-password`).

## 🧱 Authorization & Protection

### Middleware (`middleware.ts`)
The Next.js Middleware runs on every request to check session validity.
*   **Public Routes**: `/`, `/login`, `/signup`, `/vision`, `/pricing`.
*   **Protected**: `/app/*`, `/account`, `/admin/*`.
*   **Admin Guard**: Admin routes are further protected by checking `users.role === 'admin'`.

### RLS (Row Level Security)
Postgres level security is **ENABLED**.
*   **Public Read**: Anyone can read published stories.
*   **Admin Write**: Only users with `is_admin` claim (or specific role table entry) can create/edit content.
*   **User Data**: Users can only edit their own `preferences` and `playlists`.

## 🍪 Cookies
We use the standard Supabase Cookie helpers (`@supabase/ssr`) to manage the JWT access token and refresh token securely.
