# Environment Variables Template for Custom Domain

## BACKEND (Render - smartdeck service)
# Copy these to Render Dashboard → smartdeck → Environment

# Your custom domain (without https://)
CUSTOM_DOMAIN=yourdomain.com

# Allowed CORS origins (add your custom domain)
ALLOW_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:3001

# MongoDB (already set ✓)
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (already set ✓)
JWT_SECRET=your_jwt_secret

# OpenAI API Key (already set ✓)
OPENAI_API_KEY=your_openai_key

# Node Environment (already set ✓)
NODE_ENV=production

# Optional: Sentry for error tracking
SENTRY_DSN=your_sentry_dsn_url

# Optional: Redis for rate limiting
REDIS_URL=your_redis_url

---

## FRONTEND (Render - smartdeck-frontend service)
# Copy these to Render Dashboard → smartdeck-frontend → Environment

# Custom API domain
REACT_APP_CUSTOM_API_DOMAIN=https://api.yourdomain.com
REACT_APP_API_HOST=https://api.yourdomain.com

# Node Environment (already set ✓)
NODE_ENV=production

---

## Example with real domain: smartdeck.io

### Backend:
CUSTOM_DOMAIN=smartdeck.io
ALLOW_ORIGINS=https://smartdeck.io,https://www.smartdeck.io,http://localhost:3001

### Frontend:
REACT_APP_CUSTOM_API_DOMAIN=https://api.smartdeck.io
REACT_APP_API_HOST=https://api.smartdeck.io

---

## How to set in Render:

1. Go to https://dashboard.render.com
2. Click on your service (backend or frontend)
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Paste the variable name and value
6. Click "Save Changes"
7. Service will auto-redeploy with new variables

---

## Local Development (.env file)

Create `backend/.env` for local testing:

```bash
MONGODB_URI=your_mongodb_uri
JWT_SECRET=supersecretkey
OPENAI_API_KEY=your_openai_key
NODE_ENV=development
ALLOW_ORIGINS=http://localhost:3001,http://localhost:3000
```

Create `frontend/.env` for local testing:

```bash
REACT_APP_API_HOST=http://localhost:5000
NODE_ENV=development
```

---

## After Setup

Test your custom domain:
- Frontend: https://yourdomain.com
- Backend API: https://api.yourdomain.com/health
- Backend root: https://api.yourdomain.com

If CORS errors appear, verify ALLOW_ORIGINS includes your domain!
