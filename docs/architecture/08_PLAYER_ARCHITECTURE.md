# 🎧 08. Player Architecture

## Overview
The audio player is the core feature of Softale. The architecture has evolved from a monolithic Context to a modular Hook-based system (post-refactoring).

## 🧩 Core Components

### 1. PlayerContext (`src/context/PlayerContext.tsx`)
The simplified Provider that acts as the "glue". It:
*   Holds **Global State**: `status`, `queue`, `currentStory`.
*   Composes **Hooks**: Instantiates the logic hooks below and exposes their methods.
*   Renders the `<audio>` element (Master or Voice channel).

### 2. Audio Hooks (`src/hooks/audio/`)

#### `useAudioConfig`
*   **Responsibility**: User preferences & persistence.
*   **State**: `voiceVolume`, `musicVolume`, `ambientVolume`, `playbackRate`.
*   **Storage**: Syncs with `localStorage`.

#### `useAudioStems`
*   **Responsibility**: Physical Audio Element management.
*   **Refs**: `musicRef`, `ambientRefA`, `ambientRefB`.
*   **Logic**: Handles 3-stem playback (Voice + Music + Ambience) and initialization.

#### `useAmbientEngine`
*   **Responsibility**: The "Smart" DJ.
*   **Logic**: 
    *   Determines current audio intent based on story phase.
    *   Manages **Crossfading** between ambient tracks.
    *   Handles volume transitions.

#### `useProgressTracker`
*   **Responsibility**: Analytics & Persistence.
*   **Logic**: 
    *   Syncs playback progress to Supabase (`listening_progress`).
    *   Increments stats (Streak, Minutes Listened).
    *   Tracks Story Completion.

## 🔄 Data Flow
1.  **User Action**: Clicks Play -> `PlayerContext.play()`.
2.  **State Update**: `status` becomes `LOADING` -> `PLAYING`.
3.  **Effect Trigger**: 
    *   `useAudioStems` ensures correct `<audio>` sources are loaded.
    *   `useAmbientEngine` calculates which ambient track to fade in.
4.  **Playback**: Audio starts. `onTimeUpdate` triggers `useProgressTracker`.

## 🏗️ V6 Audio Stems Architecture
Stories now support 3 distinct concurrent audio tracks:
1.  **Voice**: The narration (Primary `<audio>` in Context).
2.  **Music**: Background music (Looping, handled by `useAudioStems`).
3.  **Ambience**: Sound effects (Looping/Crossfading, handled by `useAmbientEngine`).
