# Architecture Overview

This document describes the technical architecture of the Synergize CS2 Community Platform.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVERSE PROXY (Optional)                         │
│                    (Nginx / Cloudflare / Caddy)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│      NEXT.JS FRONTEND         │   │      LARAVEL BACKEND          │
│         (Port 3000)           │   │         (Port 8000)           │
│                               │   │                               │
│  • Server-side rendering      │   │  • RESTful API               │
│  • Static page generation     │   │  • Steam OpenID auth         │
│  • React components           │   │  • Business logic            │
│  • TailwindCSS styling        │   │  • Database operations       │
│                               │   │  • Background jobs           │
└───────────────────────────────┘   └───────────────────────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │        POSTGRESQL             │
                                    │                               │
                                    │  • Users & authentication    │
                                    │  • Servers & status          │
                                    │  • Bans & audit logs         │
                                    │  • Leaderboards              │
                                    │  • Shop items                │
                                    └───────────────────────────────┘
```

## Component Details

### Frontend (Next.js 14)

**Technology Stack:**
- Next.js 14 with App Router
- TypeScript for type safety
- TailwindCSS for styling
- React Query for data fetching
- Zustand for state management

**Key Directories:**
```
frontend/
├── app/                    # App Router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Homepage
│   ├── servers/           # Server browser
│   ├── leaderboards/      # Player rankings
│   ├── bans/              # Ban list
│   ├── shop/              # Credits shop
│   └── admin/             # Admin panel
├── components/
│   ├── ui/                # Base components (Button, Card, etc.)
│   ├── ServerCard.tsx     # Server display component
│   ├── LeaderboardTable.tsx
│   └── Navigation.tsx
├── lib/
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth utilities
│   └── utils.ts           # Helper functions
└── styles/
    └── globals.css        # Global styles
```

**Rendering Strategy:**
- Homepage: Static Site Generation (SSG)
- Server list: Incremental Static Regeneration (ISR) + Client polling
- Leaderboards: ISR with 5-minute revalidation
- Admin pages: Server-side rendering (SSR) with auth check

### Backend (Laravel 11)

**Technology Stack:**
- Laravel 11 (PHP 8.2+)
- PostgreSQL database
- Laravel Sanctum for API authentication
- Queue system for background jobs

**Key Directories:**
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/  # API controllers
│   │   ├── Middleware/          # Auth & rate limiting
│   │   └── Resources/           # API response formatting
│   ├── Models/                  # Eloquent models
│   ├── Services/                # Business logic
│   │   ├── SteamAuthService.php
│   │   ├── ServerPollerService.php
│   │   └── LeaderboardService.php
│   └── Jobs/                    # Background jobs
├── database/
│   ├── migrations/              # Schema definitions
│   └── seeders/                 # Test data
├── routes/
│   └── api.php                  # API routes
└── config/                      # Configuration files
```

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │───────│    Roles    │       │   Servers   │
├─────────────┤  M:N  ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ steam_id    │       │ name        │       │ name        │
│ username    │       │ permissions │       │ ip          │
│ avatar_url  │       └─────────────┘       │ port        │
│ credits     │                             │ rcon_pass   │
│ is_banned   │                             │ status      │
└─────────────┘                             └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐                            ┌─────────────────┐
│    Bans     │                            │ LeaderboardEntry│
├─────────────┤                            ├─────────────────┤
│ id          │                            │ id              │
│ steam_id    │                            │ steam_id        │
│ actor_id    │                            │ server_id       │
│ reason      │                            │ kills           │
│ expires_at  │                            │ deaths          │
│ scope       │                            │ wins            │
│ server_id   │                            │ points          │
└─────────────┘                            └─────────────────┘
       │
       │
       ▼
┌─────────────┐       ┌─────────────┐
│  AuditLog   │       │  ShopItem   │
├─────────────┤       ├─────────────┤
│ id          │       │ id          │
│ actor_id    │       │ name        │
│ action      │       │ description │
│ target_type │       │ price       │
│ target_id   │       │ type        │
│ payload     │       │ metadata    │
└─────────────┘       └─────────────┘
```

### Model Relationships

```php
// User
User hasMany Bans (as actor)
User hasMany AuditLogs (as actor)
User belongsToMany Roles
User hasMany LeaderboardEntries

// Server
Server hasMany Bans (scoped)
Server hasMany LeaderboardEntries
Server hasMany AdminAssignments

// Ban
Ban belongsTo User (target via steam_id)
Ban belongsTo User (actor)
Ban belongsTo Server (optional)

// LeaderboardEntry
LeaderboardEntry belongsTo User (via steam_id)
LeaderboardEntry belongsTo Server (optional)
```

## Authentication Flow

### Steam OpenID Login

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Browser │      │ Frontend │      │ Backend  │      │  Steam   │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │ Click Login     │                 │                 │
     │────────────────>│                 │                 │
     │                 │                 │                 │
     │                 │ GET /auth/steam/init              │
     │                 │────────────────>│                 │
     │                 │                 │                 │
     │                 │ Steam OpenID URL│                 │
     │                 │<────────────────│                 │
     │                 │                 │                 │
     │ Redirect to Steam                 │                 │
     │<────────────────│                 │                 │
     │                 │                 │                 │
     │ Login at Steam  │                 │                 │
     │─────────────────────────────────────────────────────>
     │                 │                 │                 │
     │ Callback with OpenID params       │                 │
     │<─────────────────────────────────────────────────────
     │                 │                 │                 │
     │ GET /auth/steam/callback          │                 │
     │─────────────────────────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ Verify OpenID   │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │ Valid           │
     │                 │                 │<────────────────│
     │                 │                 │                 │
     │                 │                 │ Create/Update User
     │                 │                 │ Generate Session
     │                 │                 │                 │
     │ Set Cookie + Redirect to /        │                 │
     │<──────────────────────────────────│                 │
     │                 │                 │                 │
```

### Session Management

- **Session Storage**: Database (PostgreSQL)
- **Cookie**: HttpOnly, Secure, SameSite=Lax
- **Lifetime**: 7 days (configurable)
- **Token Rotation**: On each request

## API Architecture

### Versioning

All API endpoints are versioned under `/api/v1/`. This allows for breaking changes in future versions without affecting existing clients.

### Response Format

**Success Response:**
```json
{
    "data": { ... },
    "meta": {
        "total": 100,
        "page": 1,
        "per_page": 20
    }
}
```

**Error Response:**
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "The given data was invalid.",
        "details": {
            "steam_id": ["The steam id field is required."]
        }
    }
}
```

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public API | 60 requests | 1 minute |
| Authenticated | 120 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |
| Admin actions | 30 requests | 1 minute |

## Security Measures

### Input Validation
- All input validated using Laravel Form Requests
- Steam IDs validated against format (17 digits)
- SQL injection prevented via Eloquent ORM
- XSS prevented via Blade escaping and React's default behavior

### Authentication & Authorization
- Steam OpenID for identity verification
- Role-based access control (RBAC)
- CSRF protection for state-changing requests
- Rate limiting on all endpoints

### Data Protection
- RCON passwords encrypted at rest (AES-256)
- Sensitive data excluded from API responses
- Audit logging for all admin actions
- Database credentials stored in environment variables

## Caching Strategy

### Frontend Caching
- Static pages: CDN cached at edge
- API responses: React Query with stale-while-revalidate
- Images: Browser cache with long TTL

### Backend Caching
- Server status: File cache (5 seconds TTL)
- Leaderboard snapshots: File cache (5 minutes TTL)
- User sessions: Database
- Configuration: File cache (cleared on deploy)

## Background Jobs

### Job Types

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `PollServersJob` | Every 15 seconds | Fetch server status via A2S queries |
| `RecalculateLeaderboardsJob` | Hourly | Aggregate leaderboard data |
| `CleanupExpiredBansJob` | Daily | Remove expired ban records |
| `PruneAuditLogsJob` | Weekly | Archive old audit logs |

### Job Processing

Jobs are processed synchronously in the default Pelican setup. For higher traffic, consider:
- Setting up a separate worker process
- Using database queue driver
- Implementing job batching

## Scalability Considerations

### Current Architecture (Single Instance)
- Suitable for small to medium communities (< 1000 concurrent users)
- All services run in single container
- File-based caching

### Future Scaling Options
1. **Separate Frontend/Backend**: Use two Pelican servers
2. **External Redis**: For caching and sessions
3. **Read Replicas**: For database reads
4. **CDN**: For static assets
5. **Queue Workers**: Separate job processing

## Directory Structure Summary

```
synergize/
├── frontend/                 # Next.js application
│   ├── app/                 # Pages and layouts
│   ├── components/          # React components
│   ├── lib/                 # Utilities
│   └── public/              # Static files
│
├── backend/                  # Laravel API
│   ├── app/                 # Application code
│   ├── database/            # Migrations and seeds
│   ├── routes/              # API routes
│   └── storage/             # Logs and cache
│
├── pelican/                  # Deployment files
│   └── egg-synergize.json   # Pelican egg
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md      # This file
│   ├── API.md               # API documentation
│   ├── PELICAN_DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── scripts/                  # Build scripts
│   ├── build.sh
│   └── start.sh
│
└── README.md                 # Project overview
```
