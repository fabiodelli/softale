# 📱 06. Social Studio

## 🎯 Purpose
The Social Studio (`/admin/social`) is a dedicated dashboard for repurposing audio stories into short-form video content (Reels/TikToks) to drive growth.

## ⚙️ Architecture
*   **Source**: Takes an existing `Story` from the database.
*   **Visuals**: Uses the `cover_portrait_url` (9:16 aspect ratio).
*   **Audio**: Uses a snippet of the generated audio.
*   **Output**: An `.mp4` video file stored in Supabase (`social_reel_url`).

## 🛠️ Features

### 1. Dashboard
*   View all generated reels.
*   Status tracking: `Draft` -> `Approved` -> `Posted`.
*   Download button for easy upload to mobile phones.

### 2. Caption Generator
*   **Button**: "Generate Caption" (Message icon).
*   **Logic**: Uses a specialized AI prompt (`src/lib/social-caption.ts`) to write 3 variations:
    *   **Instagram**: Aesthetic, hashtag-heavy.
    *   **TikTok**: Viral, hook-based.
    *   **YouTube**: SEO-optimized.

### 3. Manual Mixer (`/admin/social/mixer`)
*   A tool to manually assemble a reel if the auto-generation isn't perfect.
*   Allows distinct control over the "Visual Loop" and "Audio Snippet".

## 🚀 Future Roadmap
*   **Auto-Posting**: connecting to Instagram/TikTok APIs to post directly from the dashboard (currently manual download-and-post).
