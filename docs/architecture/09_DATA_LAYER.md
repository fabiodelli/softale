# 🗄️ 09. Data Layer (Supabase)

## Overview
The data access layer is modularized in `src/lib/supabase/` to prevent monolithic bloat and improve testability.

## 📂 Module Structure

### 1. Client (`client.ts`)
*   **Responsibility**: Initializing the Supabase Client.
*   **Logic**: Uses `@supabase/ssr` for browser client (cookie persistence) and standard client for other contexts.

### 2. Auth (`auth.ts`)
*   Helper wrappers for `signUp`, `signIn`, `signOut`.
*   OAuth providers integration (Google, Apple, Discord).

### 3. Domain Modules
*   **`stories.ts`**: Fetching stories, filtering by category, getting single story.
*   **`collections.ts`**: Collection management, featured collections, story-collection relationships.
*   **`profiles.ts`**: User profile management, stats (minutes listened, streaks).
*   **`playlists.ts`**: User playlists CRUD.
*   **`progress.ts`**: Listening progress tracking.
*   **`favorites.ts`**: Favorites toggling and checking.

## 🔄 Backward Compatibility
A barrel file `src/lib/supabase/index.ts` re-exports all functions. The original `src/lib/supabase.ts` now simply re-exports from this barrel, ensuring no breaking changes for existing imports.

## 🧪 Testing strategy
Tests are located in `src/lib/supabase/*.test.ts`. We use **Vitest** with mocks to simulate Supabase responses, ensuring logic correctness without hitting the real database during unit tests.
