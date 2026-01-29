# 🏭 05. Audio Factory (V6.1 Phased Architecture)

> **Status**: Active (Updated Jan 2026)
> **Engine**: Local TS/Python Hybrid (Qwen TTS + Stable Audio + FFmpeg)
> **Architecture**: Phased Generation + 3-Stem Delivery

## 🧠 Overview
The **Audio Factory V6.1** uses a **Phased Architecture** to generate high-quality, structured audio stories. It moves away from monolithic files to a flexible "Stem-Based" approach, allowing the frontend to control mixing and pacing dynamically.

## 🌊 Core Architecture

### 1. The 3-Stem System 🎚️
Instead of a single baked MP3, every story generates four assets:

1.  **Full Mix** (`audio_url`): A complete, pre-mixed MP3 (Fallback/Download). Contains physical silence for warm-up.
2.  **Voice Stem** (`voice_url`): The isolated narration track using Qwen 2.5 TTS.
3.  **Music Stem** (`music_url`): A loopable background music track (Stable Audio / Harvested).
4.  **Ambience Stem** (`ambient_url`): A loopable texture track (Stable Audio / Harvested).

The Frontend `PlayerContext` loads the stems to enable real-time volume control and dynamic warm-up delays.

### 2. The Pipelines 🔄

#### A. Generation Pipeline (`index.ts`)
1.  **Concept**: Claude generates a `StoryConcept` (Title, Phases, Prompts).
2.  **Script**: Claude expands phases into narration text.
3.  **Voice**: `LocalTTSService` (Python Qwen Server) generates audio for each phase.
4.  **Backgrounds**: Stable Audio generates Music/Ambience (or reusing existing loops).
5.  **Harvesting**: New Backgrounds are saved as **Loops** in Supabase for future re-use.
6.  **Mixing**: `ffmpeg` combines everything into the Full Mix (respecting `warmupDuration`).

#### B. The "Warm-up" Logic ⏳
- **Backend**: The Full Mix MP3 has *physical silence* added at the start (`TotalDuration = Phases + Warmup`).
- **Frontend**: The Player uses a `useAudioWarmup` hook to visually indicate the warm-up phase, playing only Music/Ambience before the Voice stem begins.

## 🛠️ Key Components

| Component | Function | Status |
| :--- | :--- | :--- |
| **`tools/qwen-api`** | Python FastAPI server hosting Qwen 2.5 TTS (1.7B). | ✅ Active |
| **`LocalTTSService.ts`** | TS Client for Qwen. Handles voice mapping & ID resolution. | ✅ Active |
| **`ConceptEngine.ts`** | Generating creative briefs and phase structures. | ✅ Active |
| **`index.ts`**| Orchestrator. Handles stable-audio, ffmpeg mixing, upload. | ✅ Active |

## 🌾 Harvesting Engine
To optimize costs and consistency, the engine "harvests" generated assets:
- **Input**: "Forest Rain" prompt.
- **Action**: Generates MP3 -> Uploads as Story Loop -> Tags `is_loop: true`.
- **Future**: Next story needing "Forest Rain" can simply link to this Loop ID instead of regenerating.

## 🚀 How to Run

```bash
# 1. Start Qwen Server (Terminal 1)
cd tools/qwen-api
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# 2. Run Audio Factory (Terminal 2)
cd tools/audio-factory
npx tsx src/manual_test_run.ts
```
