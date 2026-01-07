# 🏭 FACTORY LOGIC V4 (UNIFIED ARCHITECTURE)
*Current State as of Jan 07 2026*

The Audio Factory has been unified into a single robust pipeline (`src/index.ts`) that handles all categories with the same reliable logic.

## 🧠 The V4 Pipeline

```mermaid
graph TD
    Start[CLI Input (Full/Batch)] --> Phase1[Phase 1: Story Design]
    Phase1 --> Phase2[Phase 2: Script Gen]
    Phase2 --> Phase3[Phase 3: Asset Design]
    
    subgraph "Phase 3: The Intelligent Choice"
    Phase3 --> Check{Catalog Check}
    Check -- "Found Match" --> Catalog[Use Existing ID]
    Check -- "No Match" --> Generate[Generate Stable Audio 2.5]
    Generate --> Harvest[Harvest & Store]
    end
    
    Phase3 --> Phase4[Phase 4: Audio Direction]
    Phase4 --> |Metadata Only| JSON[Script JSON]
    
    JSON --> Voice[Generate Voice (11Labs)]
    JSON --> Music[Fetch/Gen Music Loop]
    
    Voice --> Mixer[Simple Mixer]
    Music --> Mixer
    Mixer --> Upload[Supabase Storage: YYYY-MM-DD/slug/]
```

## 🎵 Audio Logic (The "Version 1" Decision)

We have standardized on a **Single Foundation Track** approach for stability.

### 1. The Foundation (Active ✅)
*   **What**: A single, high-quality audio loop (3 mins) that plays for the entire story.
*   **Source**: Either pulled from the `Catalog` (40+ items) or generated fresh via Stable Audio 2.5.
*   **Logic**: Claude analyzes the story mood and picks the best backing.
*   **Pure Audio**: Logic ensures "No Reuse" for Pure Audio products (Unique 3min generation each time).

### 2. Storage Structure (Updated Jan 2026) 📂
*   **New Assets**: `audio/YYYY-MM-DD/slug/audio.mp3` & `cover.png`
*   **Legacy Assets**: Moved to `audio/legacy/` folder.
*   **Social**: `social/YYYY-MM-DD/slug/reel.mp4`

### 3. The Transitions (DISABLED 🚫)
*   **What**: Dynamic sound effects (e.g., "Door opening", "Rain starting") triggered at specific timestamps.
*   **Status**: **COMPLETELY SKIPPED**.
    *   To save AI tokens and complexity, this phase is currently turned off.
    *   The `audioPhases` array in the JSON will be empty.
    *   *Can be re-enabled in `src/index.ts` (Phase 4).*

## 📂 Project Structure

| File | Purpose |
| :--- | :--- |
| `src/index.ts` | **The Core**. CLI, API, Logic. Contains `full`, `batch`, `script` commands. |
| `src/catalog-config.ts` | **The Content**. Defines the Catalog Items. |
| `seed-ambience.ts` | **Utility**. Checks/Downloads external SFX assets (Legacy). |

## 🚀 How to Run

**Single Story:**
```bash
npx tsx tools/audio-factory/src/index.ts full fantasy 5
```

**Batch Processing:**
```bash
# Dry Run (Check logic)
npx ts-node src/index.ts batch --dry-run

# Real Run (Generates assets $$)
npx ts-node src/index.ts batch --start 0 --count 1
```
