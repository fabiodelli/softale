# 05. CATALOG MASTER PLAN (THE BIBLE) 📜
*The single source of truth for every audio asset in Softale. If it's not here, it doesn't exist.*

---


---


---

## 🎛️ FACTORY CONTROLS: THE 10 PRODUCTION FORMATS 🎬
*Internal definition of asset types. The Factory produces these 10 distinct formats.*

| Format Code | Format Name | Description | Target UI Mood |
| :--- | :--- | :--- | :--- |
| `sleep` | **Sleep Tales** | Hypnotic narratives, safe spaces. | **Relaxed** (Moon) |
| `meditation` | **Mind & Breath** | Guided techniques (Box breathing, Body scan). | **Focused** (Brain) |
| `fantasy` | **Dreamscapes** | Cinematic journeys, vivid imagery. | **Dreamy** (Sparkles) |
| `nature` | **Pure Nature** | Documentary-style or poetic nature observation. | **Peaceful** (Leaf) |
| `soundscape` | **Atmospheres** | Loop-based textures (Rain, Noise). Base layer. | **All Moods** (Background) |
| `motivation` | **Pep Talks** | Resilient, energetic coaching. | **Energized** (Waves) |
| `work_break` | **Reset** | Short, crisp mental clearing. | **Energized** / **Focused** |
| `kids` | **Bedtime Stories** | Gentle, safe, magical tales for children. | **Dreamy** (Hidden/Optional) |
| `music_instr`| **Instrumental** | Lofi, Classical, Ambient pads. | **Focused** / **Relaxed** |
| `binaural` | **Frequencies** | 40Hz, 432Hz, Iso-chronic tones. | **Focused** / **Relaxed** |

---

## 3. THE MOOD LOGIC (USER FILTER) 🔌
*How the User "sees" these formats via the Mood Selector.*

| UI Mood | Content Mix (What filters in?) |
| :--- | :--- |
| **Relaxed** 🌙 | `Sleep Tales` + `Nature` + `Slow Instrumental` + `Binaural (Theta)` |
| **Focused** 🧠 | `Meditation` + `Work Break` + `Binaural (Gamma)` + `Brown Noise` |
| **Dreamy** ✨ | `Fantasy` + `Kids` + `Abstract Soundscapes` |
| **Peaceful** 🍃 | `Nature` + `Meditation (Grounding)` + `Instrumental` |
| **Energized** 🌊 | `Motivation` + `Work Break` + `Upbeat Nature` |

*Note: The user never selects "Motivation". They select "Energized", and we serve them a Motivation track.*


---

## 📜 THE LAUNCH MANIFEST (MVP)
*Target: ~30 High-Quality Assets. Quality > Quantity.*

### � CATEGORY: SOUNDSCAPES (The Foundation)
*Endless Loops. The "Base Layer" for everything else.*

| ID | Title (Hero Marked ⭐) | Type | Base / Freq | Intent | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sck_rain_01` | **Velvet Rain** ⭐ | Nature | Rain on Tent | Deep Sleep | 🔴 |
| `sck_fire_01` | **Hearth & Home** ⭐ | Nature | Fireplace | Comfort | 🔴 |
| `sck_brown_01` | **Deep Brown** | Noise | Pure Brown Noise | ADHD Focus | 🔴 |
| `sck_ocean_01` | **Ocean Breath** | Nature | Distant Waves | Anxiety | 🔴 |
| `sck_forest_night`| **Night Forest** | Nature | Crickets/Owls | Dream | 🔴 |
| `sck_cafe_01` | **Rainy Café** | Ambience | Muffled Chatter | Creative Flow | 🔴 |
| `sck_wind_hills` | **Wind on Hills** | Nature | High Altitude Wind | Clarity | 🔴 |
| `sck_forest_morn` | **Forest Morning** | Nature | Birds/Stream | Energy | 🔴 |
| `sck_white_01` | **Pure White** | Noise | White Noise | Blocking | 🔴 |
| `sck_pink_01` | **Soft Pink** | Noise | Pink Noise | Sleep | 🔴 |
| `sck_focus_gamma` | **Quantum 40Hz** | Binaural | Gamma iso-chronic | Deep Work | 🔴 |
| `sck_heal_528` | **Repair 528Hz** | Music | Ambient Drone | Healing | 🔴 |


### 🎻 CATEGORY: INSTRUMENTAL (Pure)
*Music for focus and emotion. No voice.*

| ID | Title (Hero ⭐) | Style | Mood | Status |
| :--- | :--- | :--- | :--- | :--- |
| `ins_piano_01` | **Nordic Piano** ⭐ | Felt Piano | Melancholic | 🔴 |
| `ins_cello_01` | **Ambient Cello** | Drone/Melody | Somber | 🔴 |
| `ins_lofi_01` | **Lo-Fi Study** | Beats/Rhodes | Cozy | 🔴 |
| `ins_space_01` | **Deep Space** | Synth Pad | Ethereal | 🔴 |
| `ins_morning_01`| **Acoustic Morning** | Guitar | Happy | 🔴 |

### � CATEGORY: SLEEP STORIES (Narrative)
*Hypnotic journeys. Voice + Soundscape backing.*

| ID | Title (Hero ⭐) | Concept | Voice | Backing | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `slp_train_01` | **The Night Train** ⭐ | Luxury train in Alps | Soft Male | *Velvet Rain* | 🔴 |
| `slp_cabin_01` | **Cabin in the Snow** | Wooden shelter in storm | Soft Female | *Hearth & Home* | 🔴 |
| `slp_cave_01` | **The Crystal Cave** | Bioluminescent u/ground | Soft Female | *Deep Brown* | 🔴 |
| `slp_island_01` | **Floating Island** | Drifting above clouds | Soft Male | *Wind on Hills* | 🔴 |
| `slp_library_01` | **Infinite Library** | Books of dreams | Storyteller | *Hearth & Home* | 🔴 |
| `slp_desert_01` | **Desert Starlight** | Sleeping under vast sky | Soft Male | *Night Forest* | 🔴 |

### 🧘 CATEGORY: MEDITATION (Functional)
*Specific goals. Short & Effective.*

| ID | Title (Hero ⭐) | Duration | Technique | Voice | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `med_box_breath` | **Box Breathing** ⭐ | 3 min | Navy SEAL (4-4-4-4) | Neutral Male | 🔴 |
| `med_body_scan` | **Deep Body Scan** ⭐ | 10 min | PMR (Relaxation) | Soft Female | 🔴 |
| `med_nsdr_20` | **NSDR Reset** ⭐ | 20 min | Non-Sleep Deep Rest | Neutral | 🔴 |
| `med_grounding` | **5-Min Grounding** | 5 min | 5-4-3-2-1 Technique | Neutral Female | 🔴 |
| `med_anxiety` | **Anxiety SOS** | 5 min | Physiological Sigh | Soft Female | 🔴 |
| `med_focus_reset` | **Focus Snap** | 3 min | Alertness trigger | Neutral Male | 🔴 |
| `med_morn_clear` | **Morning Clarity** | 5 min | Intention setting | Energetic | 🔴 |
| `med_eve_down` | **Evening Down** | 5 min | Day review / Release | Soft Male | 🔴 |

### ✨ CATEGORY: FANTASY (Cinematic)
*Wonder and Awe. High production value.*

| ID | Title (Hero ⭐) | Concept | Mood | Status |
| :--- | :--- | :--- | :--- | :--- |
| `fan_islands` | **Sky Bridges** ⭐ | Walking between clouds | Awe | 🔴 |
| `fan_forest_bio` | **Luminous Woods** | Neon flora at night | Wonder | 🔴 |
| `fan_temple_wat` | **Underwater Temple** | Ancient safe ruins | Mystery | 🔴 |
| `fan_observatory` | **Star Observatory** | Telescope to galaxies | Vastness | 🔴 |
| `fan_bamboo` | **Whispering Bamboo** | Giant musical grove | Peace | 🔴 |

---

## 📏 EDITORIAL RULES
1.  **60/30/10 Rule**: 60% Soundscapes (Retention), 30% Guided (Value), 10% Fantasy (Brand).
2.  **Smart Reuse**: Every *Sleep Story* MUST use a backing track from *Soundscapes*. Do not generate unique bg-noise for stories.
3.  **One Hero Per Category**: Highlight the ⭐ track in the UI Hero Section.

