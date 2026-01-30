# 🌙 Softale

**AI-Powered Audio Storytelling Platform.**

## 📖 Documentation
**[>> Read the Application Bible (Architecture & Guides)](./docs/architecture/00_INDEX.md)**

Please refer to the documentation above for:
*   Brand Identity & Vision
*   Tech Stack & Auth
*   Factory V7 (n8n)
*   Payments & Deployment

## 🎧 Audio Architecture
The audio engine is powered by a custom **Zustand Store** (`playerStore.ts`) interacting with a singleton `AudioEngine` class.
*   **State Management**: Zustand handles reactive UI (Play/Pause, Progress, Queue).
*   **Audio Logic**: `AudioEngine` manages HTML5 Audio elements, crossfading, and events.
*   **Persistence**: `PlayerContext` synchronizes volume/loop configs with LocalStorage.

## 🚀 Getting Started

1.  **Install**: `npm install`
2.  **Env**: Setup `.env.local` (see docs).
3.  **Run**: `npm run dev`
