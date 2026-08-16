# Softale

Piattaforma di audio storytelling generato con AI: storie da ascoltare, con voce,
musica e ambiente prodotti da una pipeline automatizzata e mixati **nel browser**
invece che cotti in un unico file.

La scelta architetturale che definisce il progetto è questa: una storia non è un
MP3, è un insieme di tracce separate. Il player le ricompone in tempo reale, e da
lì derivano il mixer per l'ascoltatore, la fase di warm-up e il riuso dei
sottofondi tra storie diverse.

## Le tre tracce

Ogni storia viene consegnata come quattro asset invece di uno:

| Traccia | Contenuto |
|---|---|
| `voice_url` | La sola narrazione (Qwen 2.5 TTS) |
| `music_url` | Musica di sottofondo, in loop |
| `ambient_url` | Texture ambientale, in loop |
| `audio_url` | Mix completo già pronto — fallback e download |

Tenerle separate permette all'utente di regolare i tre livelli mentre ascolta, di
far partire musica e ambiente prima della voce (il *warm-up*, per entrare
nell'ascolto senza strappi) e di riutilizzare gli stessi loop in storie diverse
invece di rigenerarli — che è anche la voce di costo principale della pipeline.

## Il motore audio

`src/lib/audio/AudioEngine.ts` — una classe singleton che incapsula tutta la
logica di basso livello: istanze native `HTMLAudioElement` per voce, musica e
ambience (doppio buffer A/B per il crossfade), stato di riproduzione, seek,
buffering, mixing. Nessuna libreria audio esterna.

Sopra ci sono due strati React:

- **`PlayerContext`** — il ViewModel: traduce gli eventi del motore in stato
  React ed espone azioni di alto livello (`play(story)`, `playQueue`, `toggle`).
- **`AmbienceContext`** — i suoni d'atmosfera globali (pioggia, foresta…),
  indipendenti dalle storie. L'audio di una storia ha sempre la precedenza, e
  l'ambiente riprende da solo quando la storia finisce, a meno che l'utente non
  l'abbia spento di proposito.

Lo stato è in **Zustand**, con selettori separati per UI stabile e avanzamento
temporale (`usePlayer` contro `usePlayerTime`): il contatore dei secondi non fa
ri-renderizzare l'intera app.

## La Audio Factory

La pipeline che produce le storie (`tools/audio-factory/`), ibrida TypeScript +
Python:

```
Concept    Claude genera titolo, fasi e prompt
Script     Claude espande ogni fase in testo di narrazione
Voice      server locale Qwen 2.5 TTS, una traccia per fase
Sottofondi Stable Audio genera musica e ambience — oppure riusa loop esistenti
Harvest    i nuovi sottofondi vengono salvati come loop riutilizzabili
Mix        ffmpeg compone il full mix rispettando la durata di warm-up
```

## Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript strict · Tailwind v4 ·
Framer Motion · Zustand · Supabase (Postgres, Auth, Storage) · Stripe per gli
abbonamenti · ffmpeg per il mixing · Vercel.

## Setup

```bash
npm install
cp .env.example .env.local     # popola le chiavi: Supabase, Stripe, TTS, Stable Audio
npm run dev
```

| Comando | |
|---|---|
| `npm run dev` | sviluppo |
| `npm run build` | build di produzione |
| `npm test` | test (Vitest) |
| `npm run autotag` | tagging automatico del catalogo |
| `npm run update-types` | rigenera i tipi TypeScript dallo schema Supabase |

## Documentazione

La documentazione completa è in [`docs/architecture/`](./docs/architecture/00_INDEX.md):
stack, autenticazione, pagamenti, Audio Factory, architettura del player, data
layer e design system.

---

Nota sul nome: il codice e la cartella usano ancora `reverie-app`, il nome
originale del progetto. Il prodotto si chiama Softale; la rinomina del codice non
è stata fatta di proposito, per non spezzare riferimenti e cronologia.
