# API Documentation

Synergize REST API v1 Documentation.

**Base URL:** `/api/v1`

## Authentication

### Steam Login Flow

The API uses Steam OpenID for authentication. After successful login, a session cookie is set.

#### Initialize Steam Login

```http
GET /api/v1/auth/steam/init
```

**Response:**
```json
{
    "data": {
        "redirect_url": "https://steamcommunity.com/openid/login?..."
    }
}
```

Redirect the user to `redirect_url` to begin Steam authentication.

#### Steam Callback

```http
GET /api/v1/auth/steam/callback?openid.ns=...&openid.sig=...
```

This endpoint is called by Steam after the user authenticates. It:
1. Validates the OpenID response
2. Creates or updates the user record
3. Sets a session cookie
4. Redirects to the frontend

#### Logout

```http
POST /api/v1/auth/logout
```

**Headers:**
- `Cookie: session=...`

**Response:**
```json
{
    "data": {
        "message": "Successfully logged out"
    }
}
```

---

## Current User

#### Get Current User

```http
GET /api/v1/users/me
```

**Headers:**
- `Cookie: session=...`

**Response:**
```json
{
    "data": {
        "id": 1,
        "steam_id": "76561198000000000",
        "username": "PlayerName",
        "avatar_url": "https://avatars.steamstatic.com/...",
        "credits": 1500,
        "roles": ["user"],
        "is_banned": false,
        "created_at": "2024-01-15T10:30:00Z"
    }
}
```

**Error (401 Unauthenticated):**
```json
{
    "error": {
        "code": "UNAUTHENTICATED",
        "message": "You must be logged in to access this resource."
    }
}
```

---

## Servers

#### List Servers

```http
GET /api/v1/servers
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `online`, `offline` |
| `region` | string | Filter by region code |
| `search` | string | Search by server name |
| `sort` | string | Sort field: `name`, `players`, `created_at` |
| `order` | string | Sort order: `asc`, `desc` |
| `page` | integer | Page number (default: 1) |
| `per_page` | integer | Items per page (default: 20, max: 100) |

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "name": "Synergize #1 | Competitive",
            "ip": "192.168.1.1",
            "port": 27015,
            "region": "EU",
            "status": "online",
            "map": "de_dust2",
            "players": 18,
            "max_players": 24,
            "tags": ["competitive", "128tick"],
            "last_polled_at": "2024-01-15T10:30:00Z"
        }
    ],
    "meta": {
        "total": 10,
        "page": 1,
        "per_page": 20,
        "last_page": 1
    }
}
```

#### Get Server Details

```http
GET /api/v1/servers/{id}
```

**Response:**
```json
{
    "data": {
        "id": 1,
        "name": "Synergize #1 | Competitive",
        "ip": "192.168.1.1",
        "port": 27015,
        "region": "EU",
        "status": "online",
        "map": "de_dust2",
        "players": 18,
        "max_players": 24,
        "tags": ["competitive", "128tick"],
        "last_polled_at": "2024-01-15T10:30:00Z",
        "current_players": [
            {
                "name": "Player1",
                "score": 15,
                "duration": 1234.5
            }
        ]
    }
}
```

---

## Leaderboards

#### Get Leaderboard

```http
GET /api/v1/leaderboards
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `server_id` | integer | Filter by server (optional) |
| `period` | string | `daily`, `weekly`, `monthly`, `alltime` (default: `alltime`) |
| `sort` | string | Sort by: `points`, `kills`, `wins`, `hours` (default: `points`) |
| `page` | integer | Page number |
| `per_page` | integer | Items per page (max: 100) |

**Response:**
```json
{
    "data": [
        {
            "rank": 1,
            "steam_id": "76561198000000000",
            "username": "TopPlayer",
            "avatar_url": "https://avatars.steamstatic.com/...",
            "kills": 15420,
            "deaths": 8230,
            "wins": 234,
            "hours": 456.7,
            "points": 28500,
            "kd_ratio": 1.87,
            "last_active": "2024-01-15T10:30:00Z"
        }
    ],
    "meta": {
        "total": 1500,
        "page": 1,
        "per_page": 20,
        "last_page": 75,
        "period": "alltime"
    }
}
```

#### Get Player Stats

```http
GET /api/v1/leaderboards/player/{steam_id}
```

**Response:**
```json
{
    "data": {
        "steam_id": "76561198000000000",
        "username": "PlayerName",
        "avatar_url": "https://avatars.steamstatic.com/...",
        "global_rank": 42,
        "stats": {
            "kills": 15420,
            "deaths": 8230,
            "wins": 234,
            "hours": 456.7,
            "points": 28500
        },
        "rank_history": [
            {"date": "2024-01-14", "rank": 45},
            {"date": "2024-01-15", "rank": 42}
        ]
    }
}
```

---

## Bans

#### List Bans

```http
GET /api/v1/bans
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `steam_id` | string | Filter by banned player's Steam ID |
| `search` | string | Search by player name or reason |
| `scope` | string | Filter by scope: `global`, `server` |
| `active` | boolean | Only show active bans |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "steam_id": "76561198000000000",
            "username": "BannedPlayer",
            "reason": "Cheating",
            "scope": "global",
            "server": null,
            "expires_at": null,
            "is_permanent": true,
            "created_at": "2024-01-15T10:30:00Z",
            "actor": {
                "steam_id": "76561198111111111",
                "username": "AdminName"
            }
        }
    ],
    "meta": {
        "total": 150,
        "page": 1,
        "per_page": 20
    }
}
```

#### Check Ban Status

```http
GET /api/v1/bans/check/{steam_id}
```

**Response (Banned):**
```json
{
    "data": {
        "is_banned": true,
        "bans": [
            {
                "id": 1,
                "reason": "Cheating",
                "scope": "global",
                "expires_at": null,
                "is_permanent": true
            }
        ]
    }
}
```

**Response (Not Banned):**
```json
{
    "data": {
        "is_banned": false,
        "bans": []
    }
}
```

---

## Shop

#### List Shop Items

```http
GET /api/v1/shop/items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by type: `perk`, `skin`, `role`, `other` |
| `available` | boolean | Only show available items |

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "name": "VIP Role",
            "description": "Get VIP perks on all servers",
            "price": 5000,
            "type": "role",
            "available": true,
            "metadata": {
                "duration_days": 30,
                "perks": ["reserved_slot", "custom_tag"]
            }
        }
    ]
}
```

#### Purchase Item (Authenticated)

```http
POST /api/v1/shop/purchase
```

**Headers:**
- `Cookie: session=...`
- `Content-Type: application/json`

**Request Body:**
```json
{
    "item_id": 1
}
```

**Response (Success):**
```json
{
    "data": {
        "message": "Purchase successful",
        "item": {
            "id": 1,
            "name": "VIP Role"
        },
        "new_balance": 500
    }
}
```

**Response (Insufficient Credits):**
```json
{
    "error": {
        "code": "INSUFFICIENT_CREDITS",
        "message": "You do not have enough credits for this purchase.",
        "details": {
            "required": 5000,
            "current": 1500
        }
    }
}
```

---

## Admin Endpoints

All admin endpoints require authentication and appropriate role permissions.

### Bans Management

#### Create Ban

```http
POST /api/v1/admin/bans
```

**Required Role:** `admin`, `moderator`

**Headers:**
- `Cookie: session=...`
- `Content-Type: application/json`

**Request Body:**
```json
{
    "steam_id": "76561198000000000",
    "reason": "Cheating - Aimbot detected",
    "scope": "global",
    "server_id": null,
    "expires_at": "2024-06-15T00:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `steam_id` | string | Yes | 17-digit Steam ID |
| `reason` | string | Yes | Ban reason (max 500 chars) |
| `scope` | string | Yes | `global` or `server` |
| `server_id` | integer | No | Required if scope is `server` |
| `expires_at` | datetime | No | Null for permanent ban |

**Response:**
```json
{
    "data": {
        "id": 123,
        "steam_id": "76561198000000000",
        "reason": "Cheating - Aimbot detected",
        "scope": "global",
        "expires_at": "2024-06-15T00:00:00Z",
        "created_at": "2024-01-15T10:30:00Z",
        "actor": {
            "steam_id": "76561198111111111",
            "username": "AdminName"
        }
    }
}
```

#### Remove Ban

```http
DELETE /api/v1/admin/bans/{id}
```

**Required Role:** `admin`

**Request Body (Optional):**
```json
{
    "reason": "Ban appeal approved"
}
```

**Response:**
```json
{
    "data": {
        "message": "Ban successfully removed",
        "ban_id": 123
    }
}
```

### Role Management

#### Assign Role

```http
POST /api/v1/admin/assign-role
```

**Required Role:** `superadmin`

**Request Body:**
```json
{
    "steam_id": "76561198000000000",
    "role": "admin",
    "scope": "global",
    "server_id": null,
    "expires_at": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `steam_id` | string | Yes | Target user's Steam ID |
| `role` | string | Yes | `superadmin`, `admin`, `moderator` |
| `scope` | string | Yes | `global` or `server` |
| `server_id` | integer | No | Required if scope is `server` |
| `expires_at` | datetime | No | Null for permanent |

**Response:**
```json
{
    "data": {
        "message": "Role assigned successfully",
        "assignment": {
            "id": 1,
            "steam_id": "76561198000000000",
            "role": "admin",
            "scope": "global"
        }
    }
}
```

#### Remove Role

```http
DELETE /api/v1/admin/roles/{assignment_id}
```

**Required Role:** `superadmin`

**Response:**
```json
{
    "data": {
        "message": "Role removed successfully"
    }
}
```

### Server Management

#### List Admin Servers

```http
GET /api/v1/admin/servers
```

**Required Role:** `admin`

Returns servers with additional admin-only fields (RCON status, etc.)

#### Update Server

```http
PUT /api/v1/admin/servers/{id}
```

**Required Role:** `admin`

**Request Body:**
```json
{
    "name": "Updated Server Name",
    "tags": ["competitive", "128tick"],
    "rcon_password": "new_password"
}
```

### Audit Logs

#### Get Audit Logs

```http
GET /api/v1/admin/logs
```

**Required Role:** `admin`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `actor_steam_id` | string | Filter by actor |
| `action` | string | Filter by action type |
| `target_type` | string | Filter by target type |
| `from` | datetime | Start date |
| `to` | datetime | End date |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "actor": {
                "steam_id": "76561198111111111",
                "username": "AdminName"
            },
            "action": "ban.create",
            "target_type": "ban",
            "target_id": 123,
            "payload": {
                "steam_id": "76561198000000000",
                "reason": "Cheating"
            },
            "created_at": "2024-01-15T10:30:00Z"
        }
    ],
    "meta": {
        "total": 500,
        "page": 1,
        "per_page": 20
    }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHENTICATED` | 401 | User is not logged in |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `INSUFFICIENT_CREDITS` | 400 | Not enough credits |
| `ALREADY_BANNED` | 400 | User is already banned |
| `INVALID_STEAM_ID` | 400 | Invalid Steam ID format |

---

## Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Public endpoints | 60 | 1 minute |
| Authenticated endpoints | 120 | 1 minute |
| Auth endpoints | 10 | 1 minute |
| Admin endpoints | 30 | 1 minute |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705312200
```

---

## Webhooks (Future)

Webhooks will be available for:
- `ban.created` - When a new ban is created
- `ban.removed` - When a ban is lifted
- `server.status` - Server online/offline changes
- `shop.purchase` - When a purchase is made

Webhook payloads will be signed with HMAC-SHA256.
