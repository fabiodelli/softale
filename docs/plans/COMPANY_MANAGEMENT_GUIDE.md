# SOFTALE: Guida alla Gestione "Brand vs Entity" 🏢

Questa guida definisce la struttura legale e operativa del progetto **Softale**.

---

## 1. Mappa delle Identità 🗺️

Per evitare confusione, ecco cosa è cosa:

| Entità | Nome Attuale | Ruolo | Note |
| :--- | :--- | :--- | :--- |
| **BRAND (Il Prodotto)** | **SOFTALE** | È l'app che vendiamo. Quello che il cliente vede e ama. | Sostituisce il vecchio nome "Reverie". |
| **CODENAME (Tecnico)** | **REVERIE** | È il nome del codice, del DB e della Repo. | *Non lo cambiamo mai* per non rompere il software. |
| **ENTITY (Legale)** | **TU (P.IVA)** | Sei tu, persona fisica. L'intestatario di tutto. | In futuro diventerà "Softale SRL". |

---

## 2. Strategia di Crescita ("Solopreneur Evolution") 📈

### FASE 1: "Freelance Founder" (OGGI)
*   **Chi Fattura**: Tu, Persona Fisica.
*   **Caso Speciale (NASPI / Dormant)**:
    *   Se sei in fase di "sviluppo dormiente" e vuoi evitare contestazioni NASPI per attività professionale:
    *   **Google/Domini**: Registrati come **PRIVATO** (Privato cittadino, solo Codice Fiscale). È una spesa personale, non business.
    *   **Stripe**: Attivalo solo quando sei pronto a fatturare (e quindi a rinunciare/ridurre la NASPI).
    *   *Nota*: Puoi passare da Billing Privato a P.IVA su Google in qualsiasi momento.
*   **Diritti**: Tu possiedi personalmente il codice, il dominio (`softale.app`) e il marchio.

### FASE 2: "The Company" (FUTURO - Revenue > 85k€)
*   **Azione**: Costituzione di **Softale SRL**.
*   **Passaggio**: Tu vendi (o conferisci) l'asset "Softale Software" alla SRL.
*   **Vantaggio**: Protezione patrimoniale e scalabilità.
*   **Nome Prodotto**: Rimane "Softale". Non cambia nulla per i clienti.

---

## 3. Gestione Pratica dei Servizi 🛠️

Ecco come intestare i servizi OGGI per facilitare il passaggio DOMANI.

| Servizio | Intestato a... | Nome Progetto / Display Name |
| :--- | :--- | :--- |
| **Domini** | Tuo Nome | `softale.app` |
| **Stripe** | Tuo Nome | Business Name: **Softale** |
| **Google Workspace** | Tuo Nome | `admin@softale.com` |
| **Supabase** | Tuo Nome | Org: "Softale" / Project: "Reverie" (Legacy Name) |
| **Vercel** | Tuo Nome | Project: "reverie-app" (Legacy Name) |
| **Support Email** | - | `support@softale.com` |

---

## 4. Perché NON rinominare il Codice ("Reverie")? 🚫
Nel codice troverai spesso `reverie`, `reverie-app` o `supabase_reverie`.
**NON CAMBIARLO.**
1.  **Rischio Tecnico**: Rinominare cartelle, database o variabili d'ambiente rompe build e deploy.
2.  **Inutilità**: All'utente finale non importa come si chiama la cartella del server.
3.  **Standard**: Anche grandi aziende usano codename interni diversi dal prodotto finale (es. Nintendo GameCube era "Dolphin").

### Regola d'Oro:
*   Se è **PUBBLICO** (Sito, App Store, Fattura) -> Usa **SOFTALE**.
*   Se è **PRIVATO** (Codice, GitHub, Vercel) -> Usa **REVERIE** (o quello che è).
