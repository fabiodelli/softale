# 🏭 05. Audio Factory (n8n Hybrid)

> **Status**: Active (Migrated Jan 2026)
> **Engine**: n8n Cloud + Local Stitching (Hybrid)
> **Workflow**: `n8n_audio_factory_v6_complete.json`

## 🧠 Overview
The **Audio Factory** has been migrated from a monolithic CLI to a **Hybrid n8n Workflow**. It combines the orchestrating power of n8n (for AI calls) with the raw processing speed of local tools (for audio stitching).

## 🌊 The Pipeline (Hybrid Stitching Strategy)

We use a **"Solid Stem"** approach to ensure professional, gapless playback on the frontend while enabling the "Mixer" feature.

### 1. The 3-Stem Architecture 🎚️
Instead of a single mixed MP3, we generate three synchronized "stems" that are uploaded separately to Supabase:

1.  **Voice Stem** (`stem_voice.mp3`): The complete, stitched narration track. Zero gaps.
2.  **Music Stem** (`stem_music.mp3`): A loopable background music track (Stable Audio).
3.  **Ambience Stem** (`stem_ambience.mp3`): A high-fidelity loopable texture (Stable Audio).

The Frontend `PlayerContext` loads all three and allows the user to adjust their volumes independently.

### 2. The Workflow Steps 🔄

1.  **Form Trigger**: User inputs story idea, category, and preferences.
2.  **Concept & Script**: Claude AI writes the "Story Bible" and then the script in phases.
3.  **Asset Design**: Claude generates prompts for DALL-E 3 (Covers) and Stable Audio (Backgrounds).
4.  **Voice Generation (Parallel)**: ElevenLabs generates audio for each phase fragment.
5.  **Local Stitching (The Hybrid Part)**:
    *   n8n calls the local CLI: `npx tsx src/index.ts stitch ...`
    *   `ffmpeg-static` runs locally to concatenate fragments into one seamless `stem_voice.mp3`.
6.  **Upload**: All assets (stems + covers) are uploaded to Supabase Storage.
7.  **Database**: A new record is created in `stories` with `voice_url`, `music_url`, and `ambient_url`.

## 🛠️ How to Run

1.  **Start n8n**: Ensure your n8n instance is running and has access to the project directory.
2.  **Import Workflow**: Load `n8n_audio_factory_v6_complete.json`.
3.  **Run**: Use the "Test Workflow" button or the Manual Trigger.

## 🧩 Key Components

- **`tools/audio-factory/src/index.ts`**: Contains the `stitch` command logic.
- **`manifest`**: *Deprecated*. We do not use client-side sequencing manifests anymore. We use server-side stitching.
