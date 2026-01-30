# Fix "Play-Pause-Play" Glitch - Implementation Plan

## Goal Description
Resolve the issue where the playback status flickers (Play -> Pause -> Play) causing the UI border to disappear momentarily. This is caused by a race condition where `playerStore` optimistically sets the status to `PLAYING` before the `AudioEngine` confirms playback, leading to intermediate events (like buffering) triggering a fallback to `PAUSED`.

## Proposed Changes

### [Store Logic] src/store/playerStore.ts
#### [MODIFY] [playerStore.ts](file:///c:/Users/ntqde/.gemini/antigravity/scratch/reverie-app/src/store/playerStore.ts)
- Remove `set({ status: 'PLAYING', isPlaying: true });` inside the `play` action.
- Rely solely on the `AudioEngine` events (`statechange`) to update the store status from `LOADING` to `PLAYING`.
- This ensures that transient states during initialization (like buffering) do not prematurely switch the visible status to `PAUSED` because the store will remain in `LOADING` state until explicit confirmation.

## Verification Plan

### Automated Tests
- Run updated unit tests for `playerStore` to confirm that `play` relies on events.
- Note: Existing tests might need adjustment because they might expect immediate state change.

### Manual Verification
- Launch the app (`npm run dev`).
- Click Play on a story.
- Observe the border color and verify it stays purple (or indicates loading) without disappearing.
- Verify that `Pause` works correctly.
- Verify that clicking another story transitions smoothly.
