# 🎓 SmartDeck - Production Ready

**Piattaforma di Studio Intelligente con AI Assistant**

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.production.example .env
# Configura variabili in .env
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 📦 Tech Stack

### Backend
- **Framework:** Express 5.1.0
- **Database:** MongoDB Atlas con Mongoose
- **Authentication:** JWT + Secure Cookies
- **Security:** Helmet, mongoSanitize, hpp, CORS
- **Rate Limiting:** Redis (fallback memory)
- **Logging:** Winston (daily rotation)
- **Error Tracking:** Sentry
- **AI:** OpenAI GPT-4o/4o-mini/O1-preview

### Frontend
- **Framework:** React 19
- **Routing:** React Router 7
- **UI:** Custom CSS con Gradient Design System
- **SEO:** React Helmet Async
- **Performance:** Lazy Loading, Service Worker
- **Analytics:** Google Analytics 4
- **Monitoring:** Web Vitals
- **Notifications:** React Hot Toast

---

## 🛡️ Security Features

✅ **Account Protection**
- Account lockout dopo 10 failed attempts (30 min)
- Password hashing bcrypt (12 rounds)
- Secure cookies (httpOnly, secure, sameSite=strict)
- JWT tokens con expiry (2h)

✅ **API Protection**
- Helmet security headers (CSP, HSTS, XSS)
- MongoDB NoSQL injection prevention
- HTTP Parameter Pollution protection
- Suspicious activity detection
- Rate limiting (5 login/15min, 200 API/15min)

✅ **HTTPS Enforcement**
- Force HTTPS redirect in production
- HSTS preload enabled (1 year max-age)

---

## ⚡ Performance Optimizations

### Frontend
- **Code Splitting:** Lazy loading routes
- **Caching:** Service Worker per static assets
- **Bundle Size:** React 19 optimizations
- **Web Vitals:** CLS, FID, LCP, FCP, TTFB tracking

### Backend
- **Database:** Indexes su User, Flashcard, TestSession
- **Connection Pooling:** Min 2, Max 10 connections
- **Compression:** gzip level 6
- **Response Time:** Health check <200ms

---

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)
- Backend: Node.js errors, slow queries
- Frontend: React errors, performance issues
- Sampling: 10% traces, custom filtering

### Logging (Winston)
- **App logs:** 14 days retention
- **Error logs:** 30 days retention
- **Format:** JSON structured
- **Rotation:** Daily, 10MB max size

### Analytics (Google Analytics 4)
- User registrations & logins
- Test starts & completions
- AI Assistant usage
- Flashcard creations
- Conversion tracking

---

## 📝 Environment Variables

### Backend (.env)
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://...

# Auth
JWT_SECRET=<32+ random chars>
TOKEN_EXPIRY=2h

# CORS
ALLOW_ORIGINS=https://smartdeck-frontend.onrender.com

# OpenAI
OPENAI_API_KEY=sk-...

# Sentry (Optional)
SENTRY_DSN=https://...

# Redis (Optional)
REDIS_URL=redis://...
```

### Frontend (.env)
```bash
REACT_APP_API_HOST=https://smartdeck-backend.onrender.com
REACT_APP_GA4_MEASUREMENT_ID=G-...
```

---

## 🗄️ Database Setup

### Create Indexes (PRIMA DEL LAUNCH)
```bash
node backend/scripts/init-indexes.js
```

**Indexes creati:**
- **User:** username (unique), email (sparse unique), lastLogin, createdAt
- **Flashcard:** createdBy+thematicArea, difficulty, usageCount, isActive
- **TestSession:** userId+completedAt, score, leaderboard (area+score)

### Backup Automation
```bash
# Setup cron job su Render.com
Schedule: 0 2 * * * (daily 2 AM)
Command: node scripts/backup-db.js
```

---

## 🧪 Testing

### Pre-Deploy Test
```bash
node backend/scripts/pre-deploy-test.js
```

### Manual Smoke Test
1. ✅ Registrazione nuovo utente
2. ✅ Login / Logout
3. ✅ Creazione flashcard
4. ✅ Esecuzione test (10 domande)
5. ✅ AI Assistant con file upload
6. ✅ Visualizzazione statistiche
7. ✅ Responsive mobile/tablet

### Lighthouse Audit
Target: **Score > 90** (Performance, Accessibility, Best Practices, SEO)

---

## 📱 Features

### 🎴 Flashcard System
- Creazione flashcard personalizzate
- Organizzazione per aree tematiche
- Difficulty levels: Easy, Medium, Hard
- Usage tracking per popolarità

### 📝 Test Interattivi
- Test da 5, 10, 15, 20 domande
- Randomizzazione domande
- Timer e scoring real-time
- Statistiche dettagliate

### 🤖 AI Assistant
- **Modelli:** GPT-4o, GPT-4o-mini, O1-preview
- **File Upload:** PDF, TXT, immagini (10MB max)
- **Streaming:** Risposte in tempo reale
- **Conversation Context:** Ultimi 10 messaggi
- **Token Tracking:** Uso e costi per richiesta

### 📊 Statistics Dashboard
- Punteggi test nel tempo
- Accuracy rate per area
- Test completati totali
- Progress charts
- Leaderboard (coming soon)

---

## 🌍 Legal & Privacy

✅ **GDPR Compliant**
- Privacy Policy completa
- Terms of Service
- Cookie Banner con consent management
- User data export/deletion su richiesta

📄 **Pages:**
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service

---

## 🔧 Maintenance

### Logs Location
```
backend/logs/
  ├── application-2025-11-14.log
  ├── error-2025-11-14.log
  └── ... (rotated daily)
```

### Health Check
```bash
curl https://smartdeck-backend.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "mongoState": "connected",
  "memory": { "heapUsed": 50, "heapTotal": 100, "rss": 150 },
  "cpu": { "user": 12345, "system": 6789 }
}
```

---

## 📈 Scaling Strategy

### Phase 1: Launch (0-1K users)
- **Infrastructure:** MongoDB M0 Free, Render Free tier
- **Cost:** ~$10/mese (OpenAI)
- **Target:** 50 concurrent users, <500ms response

### Phase 2: Growth (1K-10K users)
- **Infrastructure:** MongoDB M10, Render Standard x2, Redis
- **Cost:** ~$220/mese
- **Target:** 500 concurrent users, <300ms response

### Phase 3: Scale (10K-50K users)
- **Infrastructure:** MongoDB M30 sharded, Render Pro x5, Redis Enterprise
- **Cost:** ~$1,600-2,100/mese
- **Target:** 2000 concurrent users, <200ms response

**Dettagli completi:** `doc/Production_Architecture.md`

---

## 🚀 Deployment

### Render.com Setup

**Backend:**
```yaml
name: smartdeck-backend
type: web
env: node
buildCommand: npm install
startCommand: npm start
healthCheckPath: /health
```

**Frontend:**
```yaml
name: smartdeck-frontend
type: static
buildCommand: npm run build
publishDir: build
```

### Deploy Process
1. Push to `main` branch → auto-deploy trigger
2. Monitor logs durante build
3. Health check verification
4. Sentry error monitoring
5. GA4 traffic monitoring

### Rollback
```bash
# Render Dashboard → Deployments → Previous → Rollback
```

---

## 📞 Support & Monitoring

- **Sentry Dashboard:** Error tracking & performance
- **MongoDB Atlas:** Database metrics & alerts
- **Render Dashboard:** Deploy logs & metrics
- **Google Analytics:** User behavior & conversions

---

## 📚 Documentation

- `PRODUCTION_READY.md` - Full deployment checklist
- `PRODUCTION_CHECKLIST.md` - 65+ pre-launch tasks
- `doc/Production_Architecture.md` - Scaling architecture
- `doc/AI_Chat_Enhancement.md` - AI features docs
- `doc/Documentazione_backend.md` - API documentation
- `doc/Documentazione_frontend.md` - Frontend structure

---

## 👥 Team

Created by: **GitHub Copilot AI Assistant**  
Production Ready: **14 Novembre 2025**  
Target Launch: **17 Novembre 2025**

---

## 📜 License

Private Project - All Rights Reserved

---

## 🎉 Status

**✅ PRODUCTION READY** - 7/8 Tasks Completed

**Ultimo step:** Eseguire `node backend/scripts/init-indexes.js` su MongoDB production

**Ready to go live! 🚀**
