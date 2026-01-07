# Piano di Migrazione Infrastruttura & Email Pro

## OBIETTIVO
Passare da account personali (gmail/hotmail) a un'infrastruttura aziendale professionale (`@softale.com`). Questo aumenta l'affidabilità, la sicurezza e il valore dell'azienda agli occhi di investitori e servizi terzi.

---

## FASE 1: ACQUISTO E CONFIGURAZIONE DOMINIO
**Tempo stimato:** 1 Giorno

1.  **Provider Email**: Scegli **Google Workspace** (consigliato per integrazioni) o **Microsoft 365**.
2.  **Creazione Account Chiave**:
    *   `admin@softale.com`: "Master Key". Usala per registrare TUTTI i servizi tecnici. Non usarla per comunicare.
    *   `founders@softale.com`: Per comunicare con i clienti (alias di `tuonome@`).
    *   `support@softale.com`: Obbligatorio per Stripe e Termini di Servizio.
    *   `billing@softale.com`: Dove ricevere le fatture dei fornitori (alias di `admin` o `accountant`).
3.  **Sicurezza DNS (Cruciale)**:
    *   Configura **SPF, DKIM, DMARC** (ti guida il provider email). Senza questi, le tue mail di "Reset Password" o "Benvenuto" finiranno nello Spam.

---

## FASE 2: MIGRAZIONE SERVIZI (Checklist)

### 1. Stripe (Pagamenti)
*   [ ] Accedi con la vecchia mail.
*   [ ] Vai su **Settings > Team**.
*   [ ] Invita `admin@softale.com` come **Administrator**.
*   [ ] Accetta l'invito dalla nuova mail.
*   [ ] (Opzionale) Rimuovi la vecchia mail o downgradala a "Analyst".
*   [ ] Vai su **Settings > Public Details**: Cambia la mail di supporto in `support@softale.com`.

### 2. Supabase (Database & Auth)
*   [ ] Accedi al progetto.
*   [ ] Vai su **Settings > General**.
*   [ ] Invita `admin@softale.com` come **Owner/Admin**.
*   [ ] **SMTP Settings** (Per inviare mail agli utenti):
    *   Vai su **Authentication > Email Templates**.
    *   Cambia "Sender Email" in `noreply@softale.com` (o `support@`).
    *   *Nota: Per la produzione, dovrai configurare un Custom SMTP (es. Resend o AWS SES) perché Supabase ha limiti bassi.*

### 3. GitHub / GitLab (Codice)
*   [ ] Aggiungi `admin@softale.com` come mail secondaria al tuo account o trasferisci la repo a una **Organization** (es. "Softale Inc").
*   [ ] Assicurati che billing e notifiche arrivino alla mail aziendale.

### 4. Hosting (Vercel/Netlify)
*   [ ] Crea un **Team** (consigliato per scalare).
*   [ ] Invita `admin@softale.com`.
*   [ ] Imposta le notifiche di build failure su `dev@softale.com` (o la tua personale).

### 5. OpenAI / Anthropic (AI Keys)
*   [ ] Crea un nuovo account Organization con `admin@softale.com`.
*   [ ] Genera nuove API Keys.
*   [ ] Sostituisci le chiavi nel file `.env.local` e nelle variabili d'ambiente di produzione.
*   [ ] Cestina le vecchie chiavi generate dall'account personale.

---

## FASE 3: BEST PRACTICES DI SICUREZZA 🛡️

1.  **Password Manager**: Usa 1Password o Bitwarden aziendale. Salva tutto lì.
2.  **2FA (Due Fattori)**: ATTIVALA OVUNQUE su `admin@softale.com`. Usa un'app (Authy/Google Auth), non SMS.
3.  **Separazione**: Non usare mai la mail `admin@` per iscriverti a newsletter o siti non critici.
