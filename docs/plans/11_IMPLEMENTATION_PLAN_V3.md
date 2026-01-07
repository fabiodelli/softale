# 11. IMPLEMENTATION PLAN: FACTORY V3 (HARVEST ENGINE) 🚜

## Goal
Transform the code from a "Factory V2" (Hardcoded Split) to "Factory V3" (Recipe Matrix + Harvest Loop).
This ensures we reuse assets ($0 cost) and automatically grow the catalog.

## User Review Required
> [!IMPORTANT]
> **Database Migration**: We need to add a `is_loop` column (boolean) to the `stories` table to strictly identify reusable backing tracks. Currently, we only have `category`, which is ambiguous.
> **SQL**: `ALTER TABLE stories ADD COLUMN is_loop BOOLEAN DEFAULT FALSE;`

## Proposed Changes

### 1. Database Schema
#### [NEW] `supabase/migrations/v3_add_loop_flag.sql`
*   Add `is_loop` column to `stories` table.
*   Update RLS policies if needed (Loops should be public).

### 2. Audio Factory (`tools/audio-factory`)
#### [MODIFY] `src/index.ts`
*   **Remove**: `AUDIO_INTENT_MAP` (Legacy hardcoded list).
*   **Replace**: `getAvailableAmbients` with `getAvailableLoops`.
    *   Query Supabase `stories` where `is_loop = true`.
*   **Implement**: `RecipeMatrix` constant mapping 10 categories to layers.
*   **Implement**: Harvest Logic in `generateMusic`.
    *   If `loopId` provided: Download & Mix (Reuse).
    *   If `loopId` missing: Generate Stable Audio -> Upload to Supabase -> **Insert as Story (`is_loop=true`)**.

### 3. Frontend (`src/app`)
*   **Verify**: Ensure `MoodSelector` filtering still works (it filters by `category`, so `is_loop` flag won't break it).
*   **Update**: Might need to hide `is_loop=true` assets from the "Latest Stories" feed if they are just raw noise (optional).

## Verification Plan

### Automated Verification
*   **Factory Dry Run**: Run `npm run factory -- --dry-run` with a `sleep` category.
    *   Expect: Log output "Fetching Loop... Found X" OR "Creating New Loop...".
*   **Harvest Test**: Run a real generation for a unique concept (e.g. "Mars Wind").
    *   Check Supabase: Does a new Story exist with `is_loop=true`?

### Manual Verification
1.  **Generate** a new asset via CLI.
2.  **Verify** it appears in the Supabase Dashboard.
3.  **Run** a second generation requesting that specific Loop ID.
4.  **Verify** the Factory skips generation and uses the file.
