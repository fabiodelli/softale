# Task Checklist

- [x] Fix 'Play-Pause-Play' Visual Glitch
    - [x] Update `StoryCardDefault.tsx` to handle `LOADING` status
    - [x] Update `StoryCardHorizontal.tsx` to handle `LOADING` status
    - [x] Verify `playerStore.ts` logic for clean transitions
- [x] Debug MiniPlayer Synchronization
    - [x] Refactor `MiniPlayer` to use `playerStore` selectors
    - [x] Fix type definitions in `PlayerContext`
- [/] Codebase Debt & Optimization
    - [x] Fix Player Re-render Performance (Refactored `usePlayer`)
    - [x] Migrate `SubtitleOverlay` to optimized hook
    - [x] Verify Design System Consistency (Docs match code)
    - [x] Generate Supabase Types (Generated)
- [x] Final Documentation & Push
    - [x] Update `README.md`
    - [x] Deep Documentation Audit (Index, Player Arch, Tech Stack)
    - [x] Clean up any test artifacts (if needed)
    - [ ] Push changes to git
