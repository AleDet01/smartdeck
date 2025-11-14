# 🌐 Setup Dominio Personalizzato per SmartDeck

## 📋 Prerequisiti
- Account Render.com (già configurato ✓)
- Dominio acquistato (GoDaddy, Namecheap, Cloudflare, etc.)

---

## 🚀 Setup Rapido (Render + Custom Domain)

### **Step 1: Acquista Dominio**
Scegli un provider e acquista il tuo dominio:
- **Namecheap** (raccomandato): ~$10/anno
- **Cloudflare**: ~$10/anno + DNS super veloce
- **GoDaddy**: ~$15/anno

Esempio: `smartdeck.com` o `yourdomain.com`

---

### **Step 2: Configura Backend su Render**

1. **Vai su Render Dashboard** → `smartdeck` (backend service)
2. **Settings** → **Custom Domains**
3. **Add Custom Domain**: `api.tuodominio.com`
4. Render ti darà istruzioni DNS

**Environment Variables da aggiungere:**
```bash
CUSTOM_DOMAIN=tuodominio.com
ALLOW_ORIGINS=https://tuodominio.com,https://www.tuodominio.com,http://localhost:3001
```

---

### **Step 3: Configura Frontend su Render**

1. **Vai su Render Dashboard** → `smartdeck-frontend` (frontend service)
2. **Settings** → **Custom Domains**
3. **Add Custom Domain**: 
   - `tuodominio.com` (dominio principale)
   - `www.tuodominio.com` (opzionale)

**Environment Variables da aggiungere:**
```bash
REACT_APP_CUSTOM_API_DOMAIN=https://api.tuodominio.com
REACT_APP_API_HOST=https://api.tuodominio.com
```

---

### **Step 4: Configura DNS nel Provider Dominio**

Accedi al pannello DNS del tuo provider e aggiungi questi record:

#### **Backend API**
```
Type: CNAME
Name: api
Value: smartdeck.onrender.com
TTL: 3600
```

#### **Frontend Website**
```
Type: CNAME
Name: @ (o www)
Value: smartdeck-frontend.onrender.com
TTL: 3600
```

**Se il provider non supporta CNAME per @:**
```
Type: A
Name: @
Value: [IP di Render - disponibile in Render Dashboard]
TTL: 3600
```

---

### **Step 5: Verifica e Attendi**

1. **Propagazione DNS**: Può richiedere 5 minuti - 48 ore (di solito 15-30 minuti)
2. **Verifica DNS**: 
   ```bash
   nslookup api.tuodominio.com
   nslookup tuodominio.com
   ```
3. **SSL Automatico**: Render configura HTTPS automaticamente con Let's Encrypt

---

## ✅ Checklist Post-Setup

- [ ] Backend risponde su `https://api.tuodominio.com/health`
- [ ] Frontend carica su `https://tuodominio.com`
- [ ] Login funziona (test CORS)
- [ ] SSL attivo (lucchetto verde nel browser)
- [ ] Redirect www → non-www (o viceversa) configurato

---

## 🔧 Configurazione Avanzata (Opzionale)

### **Cloudflare CDN (Gratis)**
Se vuoi performance globali:
1. Trasferisci nameserver a Cloudflare
2. Cloudflare gestisce DNS + CDN
3. Frontend distribuito in 200+ datacenter worldwide

### **Email con Dominio Custom**
- **Google Workspace**: ~$6/mese/utente (`hello@tuodominio.com`)
- **Zoho Mail**: Gratis per 5 utenti

---

## 📊 Costi Stimati

| Servizio | Costo | Note |
|----------|-------|------|
| **Dominio** | $10-15/anno | Una tantum annuale |
| **Render Hosting** | $0-7/mese | Gratis o $7 per istanza sempre attiva |
| **SSL Certificate** | $0 | Incluso gratis con Render |
| **CDN (Cloudflare)** | $0 | Opzionale, gratis |
| **Totale minimo** | **~$10/anno** | Solo dominio |

---

## 🆘 Troubleshooting

### **CORS Error dopo setup**
```javascript
// Verifica in Render Environment Variables:
ALLOW_ORIGINS=https://tuodominio.com,https://www.tuodominio.com
```

### **API non risponde**
```bash
# Testa direttamente:
curl https://api.tuodominio.com/health

# Controlla DNS:
nslookup api.tuodominio.com
```

### **SSL non attivo**
- Attendi 10-15 minuti dopo configurazione DNS
- Render auto-genera certificato Let's Encrypt
- Se fallisce: controlla che DNS punti correttamente a Render

---

## 📞 Supporto

- **Render Docs**: https://render.com/docs/custom-domains
- **DNS Checker**: https://dnschecker.org
- **SSL Checker**: https://www.ssllabs.com/ssltest/

---

## 🎯 Esempio Completo

Se il tuo dominio è `smartdeck.io`:

**DNS Records:**
```
api.smartdeck.io    → CNAME → smartdeck.onrender.com
smartdeck.io        → CNAME → smartdeck-frontend.onrender.com
www.smartdeck.io    → CNAME → smartdeck-frontend.onrender.com
```

**Render Environment Variables:**
```bash
# Backend
CUSTOM_DOMAIN=smartdeck.io
ALLOW_ORIGINS=https://smartdeck.io,https://www.smartdeck.io

# Frontend  
REACT_APP_CUSTOM_API_DOMAIN=https://api.smartdeck.io
REACT_APP_API_HOST=https://api.smartdeck.io
```

**Result:**
- 🌐 Website: `https://smartdeck.io`
- 🔌 API: `https://api.smartdeck.io`
- 🔒 SSL: Attivo automaticamente
- ⚡ Deploy: Auto-deploy da GitHub main branch

---

**Ready to go live! 🚀**
