# 🎧 08. Player Architecture

## Overview
The audio player is the engine of Softale. The architecture has evolved from a hook-based Context to a robust **Singleton Audio Engine** pattern for better performance and separation of concerns.

## 🧩 Core Components

### 1. Audio Engine (`src/lib/audio/AudioEngine.ts`)
The new **Singleton Class** that encapsulates all low-level audio logic. It replaces scattered refs and effects.
*   **Responsibility**: 
    *   Manages native `HTMLAudioElement` instances (Voice, Music, Ambience A/B).
    *   Handles playback state (Play, Pause, Seek, Buffering).
    *   Implements **Crossfading** and **Stem Mixing**.
    *   Emits events (`timeupdate`, `statechange`, `ended`) for the UI.
*   **Pattern**: Singleton. Accessible globally via `import { audio }` but primarily consumed by Context/Store.

### 2. PlayerContext (`src/context/PlayerContext.tsx`)
The **ViewModel** layer bridging React and the Audio Engine.
*   **Responsibility**:
    *   Initializes the Audio Engine listeners.
    *   Syncs engine state to React state (`useState` for UI binding).
    *   Exposes high-level actions (`play(story)`, `playQueue`, `toggle`).
    *   Coordinates with `AmbienceContext` (pausing global ambience when story plays).
*   **Benefits**: Components consume this Context and re-render only when necessary state changes, without knowing about `Audio` elements.

### 3. Player Store (`src/store/playerStore.ts`)
A **Zustand** store implemented for future high-frequency state management.
*   **Current Status**: Implemented but currently `PlayerContext` is the primary consumer. Ready for migration if performance needs require bypassing React Context completely.

### 4. AmbienceContext (`src/context/AmbienceContext.tsx`)
Manages the global "Mood" sounds (Rain, Forest, etc.) independent of stories.
*   **Logic**:
    *   **Resume Capability**: Automatically resumes mood sound after a story finishes or pauses, *unless* explicitly toggled off by the user.
    *   **Priority**: Story audio always takes precedence over mood audio.

## 🔄 Data Flow (V2)
1.  **User Action**: Clicks Play -> `PlayerContext.play(story)`.
2.  **Context Action**: 
    *   Pauses global Ambience.
    *   Calls `audio.loadStory(story)`.
3.  **Engine Execution**: 
    *   `AudioEngine` loads 3 stems (Voice, Music, Ambience).
    *   Sets volumes based on config.
    *   Starts playback.
4.  **Event Emission**: 
    *   `AudioEngine` emits `statechange` (isPlaying=true).
    *   `PlayerContext` updates React state -> UI shows Pause button.
5.  **Progress**: 
    *   `AudioEngine` emits `timeupdate` (60fps or throttled).
    *   `PlayerContext` updates `currentTime` -> Progress bar moves.

## 🏗️ Audio Stems Architecture
Stories support 3 distinct concurrent audio tracks, mixed client-side by `AudioEngine`:
1.  **Voice**: The narration (Master timing reference).
2.  **Music**: Background music (Loops seamlessly).
3.  **Ambience**: Sound effects (Crossfades between scenes/phases).
