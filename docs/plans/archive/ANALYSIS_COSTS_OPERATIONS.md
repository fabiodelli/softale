# 💰 Analisi Costi Operativi & Unit Economics

Questa analisi disaggrega i costi in due categorie:
1.  **INFRASTRUTTURA (Fixed Costs)**: Quanto costa tenere il sito "acceso".
2.  **FACTORY (Variable Costs/COGS)**: Quanto costa creare *un* singolo contenuto ("Unit Economics").

---

## 1. Infrastruttura: "Bootstrap" vs "Pro"
*Valutiamo se è possibile lanciare con i piani gratuiti.*

### A. Hosting (Vercel)
*   **Piano Hobby (0€)**: Ottimo per lo sviluppo.
    *   *Limite*: Pensato per uso "Personale/Non-Commerciale". Se inizi a fatturare, Vercel richiede tecnicamente il piano Pro o Enterprise.
    *   *Rischio*: Basso all'inizio, ma se scali devi passare a Pro.
*   **Piano Pro (20$/mese)**:
    *   *Include*: Uso commerciale, firewall migliori, analisi logs.
*   **Verdetto Startup**: Parti con **Hobby** finché non hai i primi 10 utenti paganti, poi passa a **Pro** per stare tranquillo con la licenza.

### B. Database & Storage (Supabase)
*   **Piano Free (0€)**:
    *   *Database*: 500MB (Enorme per testo/utenti, ci stanno migliaia di utenti).
    *   *Storage (File Audio/Img)*: **1 GB**.
    *   *Bandwidth (Egress)*: 2 GB/mese.
*   **Il Collo di Bottiglia**: **Lo Storage Audio**.
    *   *Calcolo*: Un MP3 a 192kbps occupa ~1.4 MB al minuto.
    *   Storia da 10 min = ~14 MB.
    *   Con 1 GB (Free) ci stanno circa **70 Storie**.
    *   Con 2 GB di Banda (Free), se 20 utenti ascoltano quelle 70 storie una volta, hai finito la banda.
*   **Verdetto Startup**: Va bene il **Free** per il "Soft Launch" (primi 50 utenti / 50 storie). Appena cresci, il piano **Pro (25$/mese)** è obbligatorio perché ti dà 100GB di storage e più banda.

### C. Altro
*   **Dominio**: ~15€/anno (es. Namecheap/GoDaddy).
*   **Email (Resend/AWS)**:
    *   **Resend Free**: 3.000 email/mese (Bastano per ~500 utenti attivi).
    *   **Workspace (Google)**: ~6€/mese (per avere `info@tuodominio.com`).

### 📊 Totale Infrastruttura (Mensile)
| Voce | Fase 1: Launch (0-100 User) | Fase 2: Growth (100+ User) |
| :--- | :--- | :--- |
| **Hosting (Vercel)** | 0€ (Hobby) | 18€ (Pro) |
| **Database (Supabase)** | 0€ (Free) | 23€ (Pro) |
| **Email (Google)** | 6€ | 6€ |
| **Email API (Resend)** | 0€ | 0€ (fino a 3k mail) |
| **Dominio** | ~1.5€ (rateizzato) | ~1.5€ |
| **TOTALE FISSO** | **~7.50€ / mese** | **~50.00€ / mese** |

---

## 2. Factory: Costo per Singola Storia (Unit Economics)
*Quanto ci costa generare "1 Asset Completo" (Audio + Voce + Immagini)?*

### Ipotizziamo una "Sleep Tale" Premium (15 min)
*   Script: 2000 parole.
*   Voce: 15 minuti.
*   Immagini: 2 (Cover L + P).
*   Musica: Background Loop (Già ammortizzato).

### Costi Variabili
1.  **Script (Claude 3.5 Sonnet / Opus)**
    *   Input/Output token per una storia.
    *   Cost: **~0.10$** (Irrisorio).
2.  **Immagini (DALL-E 3)**
    *   0.04$ per immagine HD.
    *   2 Immagini: **0.08$**.
3.  **Voce (ElevenLabs) - IL COSTO VERO** ⚠️
    *   *Piano Creator*: 22$ per 100.000 caratteri (~2 ore di audio).
    *   *Costo per minuto*: ~0.18$.
    *   *Storia 15 min*: 15 * 0.18 = **2.70$**.
4.  **Musica (Stable Audio / Suno)**
    *   Abbonamento mensile (es. 12$/mese per 500 crediti).
    *   Se generi 10 storie, incide per ~1.20$.
    *   *Costo allocato*: **~0.50$**.

### 📊 Totale "Costo Industriale" (COGS)
| Asset | Costo Stimato |
| :--- | :--- |
| **Storia Premium (15m)** | **~3.50€** |
| **Meditazione (10m)** | **~2.50€** |
| **Ambient Loop (Infinito)**| **~0.30€** (No Voce) |

---

## 3. Strategia di Margine & Break-Even 📈
Se vendi l'abbonamento a **9.99€/mese**:
*   Togli Stripe (3% + 0.25€) = Rimangono **9.45€**.
*   Togli Fix Cost (50€ pro-rata su 100 utenti) = 0.50€.
*   **Profitto Netto**: **~8.95€ / mese per utente**.

### Recupero Costi Produzione
*   Produrre 10 Storie Premium al mese ti costa **35€**.
*   Produrre 20 Ambient/Loop ti costa **6€**.
*   **Budget Produzione Mensile**: ~40-50€.
*   **Break-Even Point**: Con soli **5-6 abbonati** ti ripaghi INTERAMENTE i costi di produzione mensili e l'infrastruttura base.

## 🏁 Verdetto Finale
1.  **Parti "Lean"**: Vercel Hobby + Supabase Free + Domain. Costo < 10€/mese.
2.  **Attenzione allo Storage Audio**: Supabase Free (1GB) si riempie in fretta. Monitoralo. Quando arrivi a 60 storie, passa al Pro o sposta i file su un bucket AWS S3 esterno (molto più economico di Supabase Pro per solo storage, ma più complesso da configurare).
3.  **La Voce è il lusso**: ElevenLabs è la voce di spesa più alta. Usala saggiamente per i contenuti "Flagship" (Livello 3). Usa l'Ambient (Livello 2) per fare volume a basso costo.
