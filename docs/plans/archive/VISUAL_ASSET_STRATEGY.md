# VISUAL STRATEGY: "Living Images" for Moods

**Obiettivo**: Sostituire le immagini statiche dei Mood con "Living Canvas" (Video Loop minimali).
**Risultato**: Quando clicchi un Mood, l'immagine non cambia drasticamente scena, ma "prende vita" (es. le nuvole si muovono, le foglie tremano).

---

## 1. TOOLS DI PRODUZIONE (AI Video)
Per creare video loop di alta qualità partendo da immagini statiche (Image-to-Video):

1.  **Runway Gen-2 (Motion Brush)**:
    *   *Perché*: Ti permette di "pennellare" solo le parti che vuoi muovere (es. solo l'acqua, o solo le nuvole). Il resto rimane fermo.
    *   *Costo*: Crediti (Piano da $12/mese).
    *   *Output*: MP4 alta qualità.

2.  **Leonardo.ai (Motion)**:
    *   *Perché*: Ottimo per movimenti "eterei" e lenti. Regola l'intensità del movimento (1-10).
    *   *Best for*: Fumo, Nebbia, Particelle.

3.  **Pika Labs / Kling**:
    *   *Alternative*: Molto potenti per scene realistiche naturali.

---

## 2. CATALOGO MOOD & Prompt Strategy

| Mood | Visual Concept | Movimento (Runway/Leonardo) | Asset Audio (Layer 2) |
| :--- | :--- | :--- | :--- |
| **Dreamy** | Nuvole/Cielo rosa al tramonto | Movimento lento delle nuvole verso destra. | Wind Chimes (Lontano) |
| **Peaceful** | Foresta o Giardino Zen | Leggero tremolio delle foglie, un raggio di luce che cambia. | Birds (Rari), Leaves |
| **Focus** | Astratto Geometrico o Ruscello | Flusso costante dell'acqua o forme che pulsano lentamente. | River Flow, Brown Noise |
| **Anxious** | Pioggia su vetro o Camino | Gocce che scendono sul vetro. | Heavy Rain, Fire Crackle |
| **Sleepy** | Notte stellata o Luna | Stelle che luccicano (twinkle), nebbia bassa che scorre. | Crickets (Lontano), Pink Noise |
| **Energized** | Alba o Mare mosso | Onde che si infrangono, sole che sorge (light rays). | Ocean Waves (Active) |

---

## 3. IMPLEMENTAZIONE TECNICA (Web Performance)
Non possiamo caricare 10 video da 50MB. Dobbiamo ottimizzare.

1.  **Formato**: WebM (Chrome/Firefox) + MP4 (Safari/iOS).
2.  **Compressione**: Usare `ffmpeg` per ridurre il bitrate. Un loop di 10 secondi deve pesare < 1MB.
3.  **Seamless Loop**: Il video deve finire esattamente come inizia. (Runway non lo fa sempre in automatico, serve un piccolo editing in Premiere/CapCut con dissolvenza incrociata).

### Workflow "Factory":
1.  **Generate Image**: Midjourney (Prompt: "Cinematic, wide shot, [Subject], minimalist").
2.  **Animate**: Runway Motion Brush (Seleziona acqua/cielo, Speed 2).
3.  **Edit**: Cross-dissolve finale per il loop.
4.  **Compress**: Handbrake / FFmpeg -> WebM.
5.  **Deploy**: Caricare su Supabase Storage e linkare nel DB dei Mood.
