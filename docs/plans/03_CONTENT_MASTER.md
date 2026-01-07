# 03. CONTENT MASTER PLAN 🎧
* The definitive guide to Audio Assets, Catalog Strategy, and the Production Factory.*

---

## 1. CATALOG STRATEGY: "The 3 Levels" 🏛️

### Level 1: THE FOUNDATION (Textures) 🧱
*Rumori naturali puri. Il "tappeto" sonoro.*
*   **Asset**: Rain, Fire, Brown Noise, Ocean, Wind.
*   **Strategy**: Attualmente sottoutilizzati.
    *   **New Product**: "Soundscapes" (Paesaggi Sonori). Non solo background, ma mix curati (es. "Rain on Tent + Crackling Fire").
    *   **Usage**: Audio per Mood Selector, transizioni, e layer base per le storie.
*   **Stato**: ✅ Completato (Asset presenti in DB e Factory Folder).

### Level 2: THE FLOW (Music & Frequencies) 🌊
*Evoluzioni musicali loopabili per Focus/Sleep.*
*   **Asset**: 432Hz Tone, 528Hz, Deep Theta, Piano Minimal (Satie), Ambient Pads (Eno).
*   **Tecnologia**: Stable Audio 2.0 (AI).
*   **Caratteristiche**: 3 minuti, Zero-crossing loop, Musicalità lenta.
*   **Stato**: ✅ Completato (Factory Batch).

### Level 3: THE NARRATIVE (Stories) 🗣️
*Storie guidate e meditazioni. Il prodotto "Premium".*
*   **Asset**: Sleep Tales ("The Train"), Guided Meditations, NSDR.
*   **Mix**: Voce narrante + Livello 1 (Background) + Livello 2 (Music).
*   **Stato**: 🚧 In Produzione.

---

## 2. THE AUDIO FACTORY PIPELINE 🏭
*Automated system for massive asset generation.*

### A. Current Engine (V2 Hybrid) 🚧
*Status: Live in `tools/audio-factory`.*
1.  **Scripting**: Claude 3 Opus. High-quality narrative instruction.
2.  **Voice**: ElevenLabs (Models: Liam, Rachel).
3.  **Music**:
    *   **Dream/Fantasy**: Stable Audio 2.0 (Generative).
    *   **Sleep/Meditation**: Ambience Cues (Rain, Forest) from DB.
4.  **Integration**: Auto-mix and Upload to Supabase.

### B. Target Engine (V3 Unified) 🎯
*Status: Planned / Strategy Approved.*
*   **Goal**: Medical Grade Safety.
*   **Change**: Eliminate Generative Music. Use **Curated Loops** for ALL categories.
*   **Pipeline**: Script + Voice + `loop_id` (Stock Asset) = Final Mix.


---

## 3. VISUAL STRATEGY: "Living Images" 🖼️
*Asset visivi per Hero Section (Landscape) e Cards (Portrait).*

### Production Workflow
1.  **Base Image**: 
    *   **Primary**: DALL-E 3 (`dall-e-3`) via OpenAI API.
    *   **Fallback**: Pollinations.ai (FLUX Model) quando OpenAI fallisce o per test rapidi (`model=flux`).
    *   *Prompt Style*: "Cinematic, landscape/portrait, minimalist, [Mood], soft lighting".
2.  **Animation**: Runway Gen-2 (Motion Brush) o Leonardo.
    *   *Target*: Movimento sottile (foglie, acqua, nuvole). No movimenti complessi.
3.  **Optimization**:
    *   Formato: WebM (Chrome) + MP4 (Safari).
    *   Peso target: < 2MB per loop.

### Mood Mapping (5 Core Moods)
| Mood | Visual Concept | Elemento in movimento | Palette |
| :--- | :--- | :--- | :--- |
| **Sleep** | Notte stellata, Nebbia | Stelle (twinkle), Nebbia lenta | Indigo / Dark Blue |
| **Focus** | Geometrico, Ruscello | Flusso acqua costante | Amber / Warm White |
| **Peace** | Giardino Zen, Foresta | Foglie, Luce filtrata | Sage Green / Earth |
| **Dream** | Nuvole rosa, Tramonto | Nuvole lente che scorrono | Pink / Lavender |
| **Energy** | Mare mosso, Alba | Onde, Raggi di luce | Cyan / Bright Orange |

---

## 4. THE LAUNCH CATALOG (MANIFEST) 📜
*La lista esatta degli Asset da produrre per il Lancio (MVP).*

> [!IMPORTANT]
> The detailed Production Manifest has been moved to its own dedicated Master File.
> **See: [`05_CATALOG_MASTER.md`](05_CATALOG_MASTER.md)**

---
