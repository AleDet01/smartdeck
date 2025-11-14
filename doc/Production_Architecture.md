# 🏗️ SmartDeck Production Architecture

## 📊 Current Stack

```
┌─────────────────────────────────────────────────────────┐
│                      USERS (Browser)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              CDN / Static Hosting (Frontend)             │
│  • Render Static Site / Vercel / Netlify                │
│  • React 18 SPA                                          │
│  • Optimized Bundle (<1MB)                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│               Load Balancer (Render)                     │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
┌───────────────┐         ┌───────────────┐
│  API Server 1 │         │  API Server N │
│  (Node.js)    │         │  (Node.js)    │
│  Express 5    │   ...   │  Express 5    │
└───────┬───────┘         └───────┬───────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ MongoDB  │  │  Redis   │  │ OpenAI   │
│ Atlas    │  │ (Cache)  │  │   API    │
│ (M10+)   │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘
```

---

## 🚀 Scalability Strategy

### Phase 1: Launch (0-1000 users)
**Current Setup** ✅
- Single Render instance (Free/Starter)
- MongoDB Atlas M0 (Free tier)
- No Redis (memory rate limiting)
- OpenAI $10 credit

**Performance Target:**
- Response time: <500ms (95th percentile)
- Concurrent users: 50-100
- Daily active users: 100-500

---

### Phase 2: Growth (1000-10000 users)
**Upgrades Required:**

#### Backend Scaling
```yaml
Render Instance:
  - Plan: Starter ($7/month) → Standard ($25/month)
  - RAM: 512MB → 2GB
  - CPU: Shared → Dedicated
  - Instances: 1 → 2 (auto-scale)
```

#### Database Scaling
```yaml
MongoDB Atlas:
  - Tier: M0 (Free) → M10 (Dedicated, $0.08/hr)
  - Storage: 512MB → 10GB
  - RAM: Shared → 2GB
  - Backup: Enabled (daily, 7-day retention)
  - Replica Set: 3 nodes (high availability)
```

#### Caching Layer
```yaml
Redis:
  - Provider: Upstash / Redis Cloud
  - Plan: Free → $10/month (256MB)
  - Use Cases:
    - Rate limiting (distributed)
    - Session storage
    - API response caching
    - Hot data caching
```

#### OpenAI Budget
```yaml
Budget: $10 → $50-100/month
- GPT-4o-mini as default (95% requests)
- GPT-4o for premium users (5% requests)
- Implement user quotas:
  - Free: 5 AI requests/day
  - Premium: 50 AI requests/day
```

**Performance Target:**
- Response time: <300ms
- Concurrent users: 500-1000
- Daily active users: 5000-10000

---

### Phase 3: Scale (10000+ users)
**Enterprise Setup:**

#### Multi-Region Deployment
```yaml
Regions:
  - Primary: US East (Render)
  - Secondary: EU West (backup)
  - Asia: CloudFlare Workers (static)

Load Balancing:
  - Geo-routing (Cloudflare)
  - Failover automation
  - Health check every 30s
```

#### Database Sharding
```yaml
MongoDB Sharding Strategy:
  - Shard Key: userId (hash-based)
  - Shards: 3 (expandable to 10)
  - Config Servers: 3
  - Query Routers: 2

Collections:
  - Users: Sharded by userId
  - Flashcards: Sharded by createdBy
  - TestSessions: Sharded by userId
```

#### Advanced Caching
```yaml
CDN:
  - CloudFlare: Static assets, API cache
  - Cache-Control headers optimized
  - Edge caching for reads

Redis Cluster:
  - Master-Slave replication
  - Read replicas: 2
  - Memory: 1GB-5GB
  - Eviction policy: LRU

Application Cache:
  - User sessions: 30min TTL
  - Flashcards list: 5min TTL
  - Statistics: 1min TTL
```

#### Microservices Split
```yaml
Services:
  1. Auth Service (authentication only)
  2. Flashcard Service (CRUD operations)
  3. AI Service (OpenAI requests)
  4. Analytics Service (statistics, logging)

Benefits:
  - Independent scaling
  - Fault isolation
  - Technology flexibility
```

**Performance Target:**
- Response time: <200ms
- Concurrent users: 5000-10000
- Daily active users: 50000+

---

## 💰 Cost Estimation

### Phase 1 (Launch - 1000 users)
| Service | Cost/month |
|---------|------------|
| Render (Free) | $0 |
| MongoDB Atlas M0 | $0 |
| OpenAI | $10 |
| **TOTAL** | **$10/month** |

### Phase 2 (Growth - 10000 users)
| Service | Cost/month |
|---------|------------|
| Render Standard (2 instances) | $50 |
| MongoDB Atlas M10 | $60 |
| Redis Cloud | $10 |
| OpenAI | $100 |
| Sentry | $0 (Developer plan) |
| **TOTAL** | **$220/month** |

### Phase 3 (Scale - 50000+ users)
| Service | Cost/month |
|---------|------------|
| Render Professional (5 instances) | $350 |
| MongoDB Atlas M30 (Sharded) | $450 |
| Redis Enterprise | $150 |
| OpenAI | $500-1000 |
| CloudFlare Pro | $20 |
| Sentry Team | $26 |
| New Relic APM | $99 |
| Backup Storage (S3) | $50 |
| **TOTAL** | **$1,645-2,145/month** |

---

## 🔧 Performance Optimization Techniques

### Backend Optimizations
```javascript
// 1. Query Optimization
User.find({ username }).select('username _id').lean();

// 2. Projection (only needed fields)
Flashcard.find({ createdBy: userId })
  .select('question thematicArea difficulty -_id')
  .limit(100);

// 3. Pagination
const page = 1, limit = 20;
const skip = (page - 1) * limit;
Flashcard.find().skip(skip).limit(limit);

// 4. Aggregation Pipeline
TestSession.aggregate([
  { $match: { userId } },
  { $group: { _id: '$thematicArea', avgScore: { $avg: '$score' } }}
]);

// 5. Caching Layer
const cacheKey = `user:${userId}:flashcards`;
let data = await redis.get(cacheKey);
if (!data) {
  data = await Flashcard.find({ createdBy: userId });
  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5min cache
}
```

### Frontend Optimizations
```javascript
// 1. Code Splitting
const AIAssistant = lazy(() => import('./pages/AIAssistantPage'));

// 2. Memoization
const MemoizedComponent = React.memo(ExpensiveComponent);

// 3. Virtual Scrolling (per liste lunghe)
import { FixedSizeList } from 'react-window';

// 4. Debouncing
const debouncedSearch = debounce(handleSearch, 300);

// 5. Service Worker (offline support)
workbox.precacheAndRoute(self.__WB_MANIFEST);
```

### Database Optimizations
```javascript
// 1. Index usage verification
db.collection.explain('executionStats').find({ userId: '...' });

// 2. Covered queries (query fully satisfied by index)
db.users.createIndex({ username: 1, email: 1 });
db.users.find({ username: 'john' }).select('username email -_id');

// 3. Compound indexes (order matters!)
db.flashcards.createIndex({ createdBy: 1, thematicArea: 1, createdAt: -1 });

// 4. Text search indexes
db.flashcards.createIndex({ question: 'text', 'answers.text': 'text' });

// 5. TTL indexes (auto-delete expired data)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 1800 }); // 30min
```

---

## 🛡️ Security Best Practices

### Production Security Layers

1. **Network Security**
   - HTTPS only (enforce with HSTS)
   - DDoS protection (CloudFlare)
   - IP whitelisting for admin endpoints
   - VPN for database access

2. **Application Security**
   - Input validation (express-validator)
   - Output encoding (prevent XSS)
   - NoSQL injection prevention (sanitization)
   - CSRF tokens
   - Rate limiting (aggressive)

3. **Data Security**
   - Encryption at rest (MongoDB)
   - Encryption in transit (TLS 1.3)
   - Password hashing (bcrypt rounds 12)
   - Sensitive data masking in logs
   - Regular security audits

4. **Access Control**
   - Principle of least privilege
   - Role-based access control (RBAC)
   - Multi-factor authentication (admin)
   - Session timeout (30 min)
   - Account lockout (10 failed attempts)

---

## 📈 Monitoring & Alerts

### Key Metrics to Track

#### Application Metrics
- **Response Time**: 95th percentile <500ms
- **Error Rate**: <0.1%
- **Throughput**: Requests/second
- **Apdex Score**: >0.95

#### Infrastructure Metrics
- **CPU Usage**: <70%
- **Memory Usage**: <80%
- **Disk I/O**: <1000 IOPS
- **Network Bandwidth**: <100Mbps

#### Business Metrics
- **User Registrations**: Daily growth rate
- **Active Users**: DAU/MAU ratio
- **AI Usage**: Requests per user, cost per request
- **Test Completion Rate**: % of started tests completed

### Alert Thresholds
```yaml
Critical Alerts (PagerDuty):
  - API error rate > 1%
  - Response time > 2000ms
  - CPU usage > 90%
  - Database connection pool exhausted

Warning Alerts (Slack):
  - API error rate > 0.5%
  - Response time > 1000ms
  - Memory usage > 80%
  - Failed login attempts > 100/min

Info Alerts (Email):
  - New user registration spike
  - OpenAI API quota warning (>80%)
  - Backup completed/failed
```

---

## 🔄 Deployment Strategy

### Zero-Downtime Deployment
```yaml
Strategy: Blue-Green Deployment

Steps:
  1. Deploy new version to "green" environment
  2. Run health checks
  3. Run integration tests
  4. Gradually shift traffic (10% → 50% → 100%)
  5. Monitor errors for 5 minutes
  6. If errors, rollback to "blue"
  7. If stable, decommission "blue"

Rollback Time: <2 minutes
```

### Database Migrations
```yaml
Strategy: Backward Compatible Migrations

Steps:
  1. Add new field (optional, with default)
  2. Deploy application (supports both old/new schema)
  3. Migrate data in background
  4. Deploy application (requires new schema)
  5. Remove old field

Migration Time: ~30 minutes
Downtime: 0 seconds
```

---

## 📚 Resources

- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Render.com Scaling Guide](https://render.com/docs/scaling)

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** SmartDeck Team
