# Synergize - Pelican Panel Deployment Guide

## Overview

This guide covers deploying Synergize on Pelican Panel using Docker containers.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Pelican Panel                    │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  Frontend   │  │   Backend   │  │  Redis  │ │
│  │  (Next.js)  │  │  (Laravel)  │  │         │ │
│  │  Port 3000  │  │  Port 8000  │  │  6379   │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│                         │                       │
│                    ┌────┴────┐                  │
│                    │ PostgreSQL│                │
│                    │   5432   │                  │
│                    └──────────┘                  │
└─────────────────────────────────────────────────┘
```

---

## Option 1: Single Container (Recommended for Small Sites)

### Egg Configuration

Create a custom egg with these settings:

**Docker Image:** `ghcr.io/your-username/synergize:latest` (or build your own)

**Startup Command:**
```bash
/entrypoint.sh
```

**Environment Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Your domain | `https://synergize.example.com` |
| `APP_KEY` | Laravel key | (auto-generated) |
| `DB_HOST` | Database host | `postgres` or IP |
| `DB_DATABASE` | Database name | `synergize` |
| `DB_USERNAME` | Database user | `synergize_user` |
| `DB_PASSWORD` | Database password | `your_password` |
| `REDIS_HOST` | Redis host | `redis` or IP |
| `REDIS_PASSWORD` | Redis password | `your_redis_password` |
| `STEAM_API_KEY` | Steam API key | Get from Steam |
| `FRONTEND_URL` | Frontend URL | `https://synergize.example.com` |

---

## Option 2: Separate Containers (Recommended for Production)

### Container 1: Backend (Laravel)

**Ports:** `8000`

**Environment Variables:**
```env
APP_NAME=Synergize
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.synergize.example.com
APP_KEY=base64:your-generated-key

FRONTEND_URL=https://synergize.example.com

DB_CONNECTION=pgsql
DB_HOST={{DB_HOST}}
DB_PORT=5432
DB_DATABASE={{DB_DATABASE}}
DB_USERNAME={{DB_USERNAME}}
DB_PASSWORD={{DB_PASSWORD}}

REDIS_HOST={{REDIS_HOST}}
REDIS_PASSWORD={{REDIS_PASSWORD}}
REDIS_PORT=6379

SESSION_DRIVER=redis
SESSION_LIFETIME=4320
SESSION_ENCRYPT=true
SESSION_DOMAIN=.synergize.example.com
SESSION_SECURE_COOKIE=true

CACHE_STORE=redis
QUEUE_CONNECTION=redis

STEAM_API_KEY={{STEAM_API_KEY}}
STEAM_CALLBACK_URL=${APP_URL}/api/v1/auth/steam/callback

SANCTUM_STATEFUL_DOMAINS=synergize.example.com,www.synergize.example.com
```

### Container 2: Frontend (Next.js)

**Ports:** `3000`

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://api.synergize.example.com
NEXT_PUBLIC_APP_NAME=Synergize
NEXT_PUBLIC_SITE_URL=https://synergize.example.com
NODE_ENV=production
```

### Container 3: PostgreSQL

**Ports:** `5432`

**Environment Variables:**
```env
POSTGRES_DB=synergize
POSTGRES_USER=synergize_user
POSTGRES_PASSWORD={{DB_PASSWORD}}
```

### Container 4: Redis

**Ports:** `6379`

**Environment Variables:**
```env
REDIS_PASSWORD={{REDIS_PASSWORD}}
```

---

## Pelican Panel Variable Setup

In your Pelican Panel egg, add these variables:

### Required Variables

```json
{
  "STEAM_API_KEY": {
    "name": "Steam API Key",
    "description": "Your Steam Web API key from https://steamcommunity.com/dev/apikey",
    "env_variable": "STEAM_API_KEY",
    "default_value": "",
    "user_viewable": true,
    "user_editable": true,
    "rules": "required|string"
  },
  "APP_URL": {
    "name": "Application URL",
    "description": "Your full domain URL (https://your-domain.com)",
    "env_variable": "APP_URL",
    "default_value": "http://localhost:8000",
    "user_viewable": true,
    "user_editable": true,
    "rules": "required|url"
  },
  "DB_PASSWORD": {
    "name": "Database Password",
    "description": "PostgreSQL database password",
    "env_variable": "DB_PASSWORD",
    "default_value": "",
    "user_viewable": true,
    "user_editable": true,
    "rules": "required|string|min:8"
  },
  "REDIS_PASSWORD": {
    "name": "Redis Password",
    "description": "Redis server password",
    "env_variable": "REDIS_PASSWORD",
    "default_value": "",
    "user_viewable": true,
    "user_editable": true,
    "rules": "nullable|string"
  }
}
```

---

## Docker Compose for Local Testing

Before deploying to Pelican, test locally:

```yaml
# docker-compose.yml (already in your project)
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend.Dockerfile
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_URL=http://localhost:8000
      - DB_HOST=postgres
      - DB_DATABASE=synergize
      - DB_USERNAME=synergize_user
      - DB_PASSWORD=secret
      - REDIS_HOST=redis
      - STEAM_API_KEY=${STEAM_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=synergize
      - POSTGRES_USER=synergize_user
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    command: redis-server --requirepass secret

volumes:
  postgres_data:
```

---

## Step-by-Step Pelican Deployment

### 1. Build Docker Images

```bash
# Build backend image
cd backend
docker build -f ../docker/backend.Dockerfile -t synergize-backend:latest .

# Build frontend image
cd ../frontend
docker build -f ../docker/frontend.Dockerfile -t synergize-frontend:latest .
```

### 2. Push to Registry (Optional)

```bash
# Tag for your registry
docker tag synergize-backend:latest ghcr.io/your-username/synergize-backend:latest
docker tag synergize-frontend:latest ghcr.io/your-username/synergize-frontend:latest

# Push
docker push ghcr.io/your-username/synergize-backend:latest
docker push ghcr.io/your-username/synergize-frontend:latest
```

### 3. Create Pelican Server

1. Go to Pelican Panel → Servers → Create New
2. Select your custom egg (or Docker generic)
3. Set the Docker image
4. Configure environment variables
5. Set port allocations
6. Deploy!

### 4. Run Migrations

After first deploy, exec into the container:

```bash
# In Pelican console or SSH
php artisan migrate --force
php artisan key:generate --force
php artisan config:cache
php artisan route:cache
```

### 5. Create Owner Account

1. Login with Steam on your site
2. Get your Steam ID from the users table
3. Update your role:

```sql
UPDATE users SET roles = ARRAY['owner'] WHERE steam_id = 'YOUR_STEAM_ID';
```

---

## Reverse Proxy Configuration

If using a reverse proxy (Nginx/Caddy) in front of Pelican:

### Nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name synergize.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy Example

```caddyfile
synergize.example.com {
    # Frontend
    reverse_proxy localhost:3000

    # API routes
    handle /api/* {
        reverse_proxy localhost:8000
    }
}
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs in Pelican console
# Or SSH into node and check Docker logs
docker logs <container_id>
```

### Database Connection Failed
- Verify DB_HOST is correct (use container name or IP)
- Check DB_PASSWORD matches
- Ensure PostgreSQL container is running

### Steam Login Not Working
1. Verify STEAM_API_KEY is set
2. Check STEAM_CALLBACK_URL matches your domain
3. Ensure APP_URL uses HTTPS in production

### 502 Bad Gateway
- Container might still be starting
- Check if port allocations are correct
- Verify reverse proxy config

---

## Environment Variables Quick Reference

| Variable | Required | Example |
|----------|----------|---------|
| `APP_ENV` | Yes | `production` |
| `APP_DEBUG` | Yes | `false` |
| `APP_URL` | Yes | `https://synergize.example.com` |
| `APP_KEY` | Yes | `base64:...` |
| `DB_HOST` | Yes | `postgres` |
| `DB_DATABASE` | Yes | `synergize` |
| `DB_USERNAME` | Yes | `synergize_user` |
| `DB_PASSWORD` | Yes | `strong_password` |
| `REDIS_HOST` | Yes | `redis` |
| `REDIS_PASSWORD` | No | `redis_password` |
| `STEAM_API_KEY` | Yes | `your_steam_key` |
| `FRONTEND_URL` | Yes | `https://synergize.example.com` |
| `SESSION_DOMAIN` | Yes | `.synergize.example.com` |
| `SANCTUM_STATEFUL_DOMAINS` | Yes | `synergize.example.com` |
