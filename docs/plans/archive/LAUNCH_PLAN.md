# 🚀 Reverie - Piano di Lancio
*Documento strategico per il go-to-market*

---

## 📊 Stato Attuale (Dicembre 2024)

### ✅ Cosa è Pronto
| Componente | Stato | Note |
|------------|-------|------|
| App Frontend (Next.js) | ✅ Completo | Home, Library, Player, Account, Login |
| Audio Factory v2.0 | ✅ Completo | Claude + ElevenLabs + Cover AI |
| Admin Dashboard | ✅ Completo | Stats, Story Manager, Factory |
| Auth System | ✅ Completo | Supabase Auth |
| Storage | ✅ Completo | Supabase Storage |
| Database | ✅ Completo | PostgreSQL (Supabase) |

### ⚠️ Cosa Manca per il Lancio
| Componente | Priorità | Effort |
|------------|----------|--------|
| **Contenuti (catalogo)** | 🔴 Critico | 2-3 settimane |
| **Stripe Integration** | 🔴 Critico | 2-3 giorni |
| **Landing Page** | 🟡 Alto | 1-2 giorni |
| **PWA / Mobile** | 🟡 Alto | 1 settimana |
| **Analytics** | 🟢 Medio | 2-3 giorni |
| **Email Marketing** | 🟢 Medio | 1 giorno |

---

## 🗓️ Timeline: 8 Settimane al Lancio

```
FASE 1: PRE-LAUNCH (Settimane 1-3)
├── Generazione catalogo (30-50 storie)
├── Stripe integration
├── Landing page con waitlist
└── Testing su mobile

FASE 2: SOFT LAUNCH (Settimane 4-5)
├── Beta privata (10-20 utenti)
├── Feedback collection
├── Bug fixing
└── Content refinement

FASE 3: PUBLIC LAUNCH (Settimane 6-8)
├── Lancio pubblico
├── Marketing push
├── Subscription activation
└── Monitoring & iteration
```

---

## 📅 FASE 1: Pre-Launch (3 settimane)

### Settimana 1: Contenuti

**Obiettivo**: Generare 30-50 storie di alta qualità

| Giorno | Attività | Output |
|--------|----------|--------|
| Lun-Mar | Sleep stories (10) | 2-20 min, varie voci |
| Mer-Gio | Meditation (8) | Body scan, breath, visualization |
| Ven | Fantasy (7) | Viaggi immaginari |
| Sab-Dom | Nature (5) | Foresta, mare, pioggia |

**Target catalog iniziale:**
- 10 Sleep stories (varietà di temi)
- 8 Meditation (diversi approcci)
- 7 Fantasy journeys
- 5 Nature soundscapes
- **Totale: 30 contenuti**

**Costo generazione:**
- 30 storie × ~0.36€ = **~11€**

---

### Settimana 2: Monetizzazione + Landing

**Stripe Integration (2-3 giorni)**
```
Pricing Strategy:
├── Free Tier
│   ├── 5 storie gratuite
│   ├── Pubblicità soft (banner)
│   └── Preview 1 min contenuti premium
│
└── Premium (8€/mese o 60€/anno)
    ├── Catalogo completo
    ├── Nuovi contenuti ogni settimana
    ├── Download offline (futuro)
    └── Qualità audio HD
```

**Landing Page (1-2 giorni)**
```
reverie.app (o altro dominio)

Sezioni:
1. Hero: "Sleep better with AI-crafted stories"
2. Demo audio player (sample gratuito)
3. Features (3-4 bullet points)
4. Pricing (Free vs Premium)
5. [Join Waitlist] button
6. Footer con social links
```

---

### Settimana 3: Mobile + Testing

**PWA Enhancement**
- manifest.json (già mancante - lo aggiungiamo)
- Service worker per offline
- Add to Home Screen prompt
- Notifiche push (opzionale)

**Testing Checklist**
- [ ] Audio playback su iOS Safari
- [ ] Audio playback su Android Chrome
- [ ] Background play (screen off)
- [ ] Volume mixing (voice + ambient)
- [ ] Login/Signup flow mobile
- [ ] Stripe checkout mobile

---

## 📅 FASE 2: Soft Launch (2 settimane)

### Settimana 4: Beta Privata

**Recruit Beta Testers (10-20 persone)**
- Amici / famiglia interessati a wellness
- Community Reddit (r/sleep, r/meditation)
- Social media personali
- NO pagamento, solo accesso gratuito

**Feedback Form (Google Forms / Typeform)**
```
Domande chiave:
1. La voce ti ha aiutato a rilassarti? (1-5)
2. La durata era adeguata? (troppo corto/lungo/ok)
3. Quale categoria preferisci?
4. Useresti l'app regolarmente?
5. Pagheresti 8€/mese?
6. Bug o problemi riscontrati?
```

---

### Settimana 5: Refinement

**Basato su feedback:**
- Fix bug critici
- Aggiusta contenuti problematici
- Aggiungi 5-10 storie extra se richieste
- Ottimizza player mobile

---

## 📅 FASE 3: Public Launch (2 settimane)

### Settimana 6: Launch Day 🚀

**Pre-launch checklist:**
- [ ] Tutti i contenuti pubblicati
- [ ] Stripe webhook funzionante
- [ ] Analytics attive
- [ ] Error monitoring (Sentry)
- [ ] Backup database

**Launch channels:**
1. **Product Hunt** (principale)
2. **Reddit** (r/sleep, r/meditation, r/productivity)
3. **Hacker News** (Show HN)
4. **Twitter/X** thread
5. **Instagram** stories
6. **Email** a waitlist

---

### Settimana 7-8: Monitoring & Growth

**Metriche da tracciare:**
| Metrica | Target Settimana 1 |
|---------|-------------------|
| Signups | 100-500 |
| Free → Premium conversion | 5-10% |
| Daily Active Users | 20-50 |
| Avg session duration | 10+ min |
| Stories completed | 50%+ |

---

## 💰 Budget Totale Lancio

### Costi Una Tantum
| Voce | Costo |
|------|-------|
| Dominio (1 anno) | 15€ |
| Logo/Branding (opzionale) | 0-100€ |
| Product Hunt featured | 0€ (gratis) |
| **Totale** | **15-115€** |

### Costi Mensili (Post-Lancio)
| Voce | Costo | Note |
|------|-------|------|
| Vercel Hosting | 0€ | Free tier |
| Supabase | 0€ → 25€ | Free fino a soglia |
| ElevenLabs | 22€ | Starter plan |
| Stripe fees | ~3% | Su transazioni |
| **Totale** | **~25-50€/mese** |

### Break-Even Analysis
```
Costi fissi mensili: ~50€
Prezzo abbonamento: 8€/mese
Stripe fee (3%): -0.24€
Netto per utente: 7.76€

Break-even: 50€ ÷ 7.76€ = ~7 utenti

Target sostenibilità: 20 utenti = 155€ - 50€ = 105€ profit
Target crescita: 50 utenti = 388€ - 50€ = 338€ profit
```

---

## 🎯 Strategia Marketing (Zero Budget)

### 1. Content Marketing (Gratuito)
- Blog post: "How AI is transforming sleep therapy"
- Social clips da storie (30 sec preview)
- Behind-the-scenes: come creo le storie

### 2. Community Seeding
- Reddit AMA in r/sleep
- Discord wellness communities
- Facebook groups (insonnia, mindfulness)

### 3. Product Hunt Launch
- Prepara asset (logo, screenshot, video demo)
- Scrivi descrizione compelling
- Pianifica per martedì/mercoledì mattina (UTC)

### 4. Referral Program (Futuro)
- "Invita un amico, ottieni 1 mese gratis"
- Virale e low-cost

---

## ⚠️ Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Nessuno paga | Media | Alto | Validare pricing con beta |
| ElevenLabs costa troppo | Bassa | Medio | Voice caching, playlist |
| Bug critici al lancio | Media | Alto | Testing approfondito |
| Concorrenza (Calm, Headspace) | Alta | Medio | Nicchia + AI unique |
| Burnout sviluppatore | Media | Alto | MVP mindset, non perfezionismo |

---

## ✅ Checklist Pre-Lancio Finale

### Tecnico
- [ ] 30+ storie nel catalogo
- [ ] Stripe checkout funzionante
- [ ] Mobile player testato (iOS/Android)
- [ ] manifest.json per PWA
- [ ] Analytics (Plausible/Umami gratuiti)
- [ ] Error monitoring (Sentry free tier)

### Business
- [ ] Pricing definito (8€/mese)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Email di benvenuto automatica

### Marketing
- [ ] Landing page live
- [ ] Product Hunt draft pronto
- [ ] Social media accounts creati
- [ ] 5-10 beta tester confermati

---

## 🏁 Decision Point

### Quando lanciare?

**Lancia quando hai:**
1. ✅ 25+ storie di qualità
2. ✅ Stripe funzionante
3. ✅ Mobile non crasha
4. ✅ 5+ beta tester soddisfatti

**NON aspettare:**
- Perfezione grafica
- 100+ contenuti
- App nativa
- Feature premium

---

## 📌 Prossimi Passi Immediati

| # | Azione | Tempo | Chi |
|---|--------|-------|-----|
| 1 | Genera 10 storie Sleep | 1-2 giorni | Tu + AI |
| 2 | Integra Stripe Checkout | 2-3 giorni | Dev |
| 3 | Crea Landing Page | 1 giorno | Dev |
| 4 | Aggiungi manifest.json | 1 ora | Dev |
| 5 | Trova 5 beta tester | 1 settimana | Tu |
| 6 | Fissa data lancio | Ora | Tu |

---

## 💡 Consiglio Finale

> **Ship fast, iterate faster.**
> 
> Calm ha iniziato con 10 meditazioni.
> Headspace con 10 sessioni.
> 
> Tu hai già una Factory che genera contenuti infiniti.
> Il tuo vantaggio è la velocità.
> 
> Lancia con 30 storie, aggiungi 5 a settimana.
> **In 3 mesi avrai più contenuti dei competitor.**

---

*Data target lancio suggerita: **Fine Gennaio 2025***
