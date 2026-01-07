# 02. PRODUCT & TECH MASTER PLAN 📱
*The definitive guide to the Softale Application, UI/UX, and Infrastructure.*

---

## 1. USER EXPERIENCE PHILOSOPHY
**"Situational Design"**: L'interfaccia non chiede *"Quale categoria vuoi?"* ma *"Come vuoi sentirti?"*.
*   **Mood-First**: Il selettore del mood è l'elemento centrale.
*   **Atmosphere**: L'intera UI (colori, sfondi, gradienti) cambia in base al mood selezionato.

### UI Concepts
*   **Design Language**: Glassmorphism, Clean Typography (Inter), Large Imagery.
*   **Current State (MVP)**: "Mood Bubbles". Selettore a pillola semplice ed efficace per filtrare i contenuti.
*   **Future Vision**: "Living Atmosphere". L'idea è che selezionando un mood, l'interfaccia "espanda" un'aura di colore e movimento che cambia lo sfondo e il feeling dell'app.
*   **Mood Cards**: Evolveranno da semplici righe a "Glass Cards" verticali ed immersive.
*   **Player**: Minimalista. Nasconde progress/timer per i contenuti "Infinite Loop" per non rompere l'immersione.

---

## 2. TECH STACK (Infrastructure) 🏗️

### Core Stack
*   **Frontend**: Next.js 14+ (App Router).
*   **Hosting**: Vercel (Hobby -> Pro).
*   **Styling**: TailwindCSS + Framer Motion (Animazioni).

### User Accounts & Migration Strategy 🔄
1.  **Google Workspace**: SETUP REQUIRED. `admin@softale.com` è il prerequisito per Stripe Live e Prod Accounts.
2.  **API Services (Burn Down)**:
    *   Usare account personali fino esaurimento crediti, poi migrare.
3.  **Supabase Migration (Metodo "Invite")**:
    *   **NON Rifare il DB**: È rischioso e inutile.
    *   **Procedura**: Logga col tuo account attuale -> Settings -> Members -> Invita `admin@softale.com` come **Owner**.
    *   **Risultato**: Il database è lo stesso, le API key non cambiano, ma ora è di proprietà aziendale.
4.  **Naming Convention**:
    *   **Company**: Softale (Intestatario fatture, Developer Account Apple/Google).
    *   **Product/App**: Reverie (Nome visibile agli utenti, nome del DB).
    *   *Consiglio*: Mantieni "Reverie" ovunque nel codice/DB. Softale è solo la "scatola fiscale".

### Backend & Data
*   **Database**: Supabase (PostgreSQL).
*   **Auth**: Supabase Auth (Email/Password + Social).
*   **Storage**: Supabase Storage (Bucket 'audio' e 'images').
    *   *Nota*: Monitorare usage (1GB Free). Piano per migrare a S3 se >500 utenti.

### Payments
*   **Gateway**: Stripe.
*   **Integrazione**: Stripe Checkout (Hosted Page) + Webhooks per sync DB.

---

### 3. COMPONENT ARCHITECTURE (AUDITED)
*Verified against `src/components`.*

| Component | Status | Description |
| :--- | :--- | :--- |
| `MoodSelector` | 🟢 Live | The "How are you feeling?" entry point. Hardcoded moods (Sleep, Focus, Dreamy, Peaceful, Energized). |
| `MiniPlayer` | 🟢 Live | Global audio persistence. Handles playback state across navigation. |
| `CinematicHero` | 🟢 Live | Full-screen video backgrounds for "Hero" content. |
| `StoryCard` | 🟢 Live | The primary asset display unit. Supports loop/once logic. |
| `AmbienceSelector` | 🟢 Live | Specialized UI for Level 1 Soundscapes (Rain, Fire). |
| `CollectionRow` | 🟢 Live | Horizontal scrolling lists, handling data flow. |
| `VisualEngine` | 🟡 Planning | Dynamic background shifts based on active audio. |

### 4. DATA ARCHITECTURE
*   **Database**: Supabase (PostgreSQL).
*   **Storage**: Supabase Storage (Buckets: `covers`, `audio`).
*   **Auth**: Supabase Auth (Email/Magic Link).


---

## 4. SECURITY & COMPLIANCE 🛡️
*   **Dati Utente**: Minimi indispensabili (Email, ID Stripe). No tracking invasivo.
*   **Email**: Dominio `@softale.com` configurato con SPF/DKIM/DMARC.
*   **Accesso Admin**: Ruolo 'admin' su Supabase protetto da RLS (Row Level Security).
