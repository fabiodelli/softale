# 🌙 Softale

**AI-Powered Audio Storytelling Platform.**

## 📖 Documentation
**[>> Read the Application Bible (Architecture & Guides)](./docs/architecture/00_INDEX.md)**

Please refer to the documentation above for:
*   Brand Identity & Vision
*   Tech Stack & Auth
*   Factory V7 (n8n)
*   Payments & Deployment

### Audio Engine
- **Custom Audio Engine**: Native `HTMLAudioElement` implementation (No external libraries)
- **Features**: 3-Layer Mixing (Voice, Music, Ambience), Crossfading, State Management
- **State**: Zustand with optimized selectors to prevent re-renders

## 🎧 Audio Architecture
15.  **Audio Architecture**: Custom **Zustand Store** (`playerStore.ts`) + Singleton `AudioEngine`.
16.  **Performance**: `usePlayer` (stable UI) vs `usePlayerTime` (reactive progress) split for zero unnecessary re-renders.
17.  **Logic**: `AudioEngine` manages HTML5 Audio, crossfading, and stems.
18.  **Persistence**: `PlayerContext` synchronizes volume/loop configs.

## 🚀 Getting Started

1.  **Install**: `npm install`
2.  **Env**: Setup `.env.local` (see docs).
3.  **Run**: `npm run dev`
