# Synergize - Pelican Panel Deployment Guide

Complete guide for deploying Synergize on Pelican Panel.

---

## Overview

Synergize requires **two containers** in Pelican Panel:

| Container | Type | Port | Purpose |
|-----------|------|------|---------|
| synergize-backend | PHP/Laravel | 8000 | API server |
| synergize-frontend | Node.js | 3000 | Next.js frontend |

Plus external services:
- **PostgreSQL** database
- **Redis** for sessions/cache

---

## Prerequisites

Before starting, you need:

1. A domain name pointing to your server
2. SSL certificate (Let's Encrypt or similar)
3. Steam API key from https://steamcommunity.com/dev/apikey
4. PostgreSQL database (managed or self-hosted)
5. Redis instance (managed or self-hosted)

---

## Step 1: Database Setup

### Option A: External Managed Database (Recommended)

Use a managed PostgreSQL service:
- [Supabase](https://supabase.com) (free tier available)
- [Railway](https://railway.app)
- [Neon](https://neon.tech)

Create a database named `synergize` and note:
- Host
- Port (usually 5432)
- Database name
- Username
- Password

### Option B: Self-Hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database and user
sudo -u postgres psql
CREATE USER synergize_user WITH PASSWORD 'your-strong-password';
CREATE DATABASE synergize OWNER synergize_user;
GRANT ALL PRIVILEGES ON DATABASE synergize TO synergize_user;
\q
```

---

## Step 2: Redis Setup

### Option A: External Managed Redis (Recommended)

- [Upstash](https://upstash.com) (free tier available)
- [Railway](https://railway.app)

### Option B: Self-Hosted Redis

```bash
sudo apt install redis-server

# Set password
sudo nano /etc/redis/redis.conf
# Find and change: requirepass your-redis-password

sudo systemctl restart redis-server
```

---

## Step 3: Backend Container Setup

### 3.1 Create Server in Pelican

1. Go to Pelican Panel → Servers → Create New
2. Select a **PHP/Laravel egg** (or generic Docker with PHP 8.2+)
3. Allocate resources:
   - RAM: 512MB minimum (1GB recommended)
   - Disk: 1GB minimum
   - CPU: 1 core minimum

### 3.2 Environment Variables

Add these in the **Startup** configuration:

```env
# Application
APP_NAME=Synergize
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_KEY=

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Database (PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=your-database-host.com
DB_PORT=5432
DB_DATABASE=synergize
DB_USERNAME=synergize_user
DB_PASSWORD=your-db-password

# Redis
REDIS_HOST=your-redis-host.com
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

# Session (IMPORTANT: Keep these settings for security!)
SESSION_DRIVER=redis
SESSION_LIFETIME=4320
SESSION_ENCRYPT=true
SESSION_DOMAIN=.your-domain.com
SESSION_SECURE_COOKIE=true

# Cache & Queue
CACHE_STORE=redis
QUEUE_CONNECTION=redis

# Steam Authentication
STEAM_API_KEY=your-steam-api-key
STEAM_CALLBACK_URL=https://your-domain.com/api/v1/auth/steam/callback

# Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com,www.your-domain.com

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning
```

### 3.3 Upload Code

Upload the `backend/` folder contents via SFTP to your Pelican server.

### 3.4 Initial Setup Commands

Run these in the Pelican console (one at a time):

```bash
# Install dependencies
composer install --no-dev --optimize-autoloader

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate --force

# Create storage symlink
php artisan storage:link

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3.5 Start Command

Set the startup command to:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Or if using PHP-FPM:

```bash
php-fpm
```

---

## Step 4: Frontend Container Setup

### 4.1 Create Server in Pelican

1. Go to Pelican Panel → Servers → Create New
2. Select a **Node.js egg** (Node 20+)
3. Allocate resources:
   - RAM: 512MB minimum (1GB recommended)
   - Disk: 500MB minimum
   - CPU: 1 core minimum

### 4.2 Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Synergize
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
PORT=3000
```

### 4.3 Upload Code

Upload the `frontend/` folder contents via SFTP.

### 4.4 Build Commands

Run these in the Pelican console:

```bash
# Install dependencies
npm ci

# Build the application
npm run build
```

### 4.5 Start Command

Set the startup command to:

```bash
npm start
```

---

## Step 5: Reverse Proxy Configuration

You need a reverse proxy to route traffic to your containers. This runs on your main server (not in Pelican).

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (use certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Laravel)
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Sanctum CSRF cookie
    location /sanctum {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Install SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Step 6: Queue Worker (Optional but Recommended)

For background jobs, set up a queue worker in the backend container.

Add to your startup or create a separate process:

```bash
php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
```

---

## Step 7: First Login & Admin Setup

1. Visit `https://your-domain.com`
2. Click "Login with Steam"
3. Authorize the application
4. You're now logged in!

### Make Yourself an Owner

Connect to your PostgreSQL database and run:

```sql
-- Find your user
SELECT id, steam_id, username FROM users;

-- Make yourself an owner
UPDATE users SET roles = ARRAY['owner'] WHERE steam_id = 'YOUR_STEAM_ID';
```

Replace `YOUR_STEAM_ID` with your Steam ID (17-digit number).

---

## Troubleshooting

### Backend not responding

```bash
# Check if PHP is running
ps aux | grep php

# Check Laravel logs
cat storage/logs/laravel.log | tail -100

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

### Frontend not loading

```bash
# Check if Next.js is running
ps aux | grep node

# Rebuild if needed
npm run build
npm start
```

### Steam login not working

1. Verify `STEAM_API_KEY` is correct
2. Check `STEAM_CALLBACK_URL` matches your domain exactly
3. Ensure SSL is working (Steam requires HTTPS)

### Session/Cookie issues

1. Verify `SESSION_DOMAIN` starts with a dot: `.your-domain.com`
2. Ensure `SESSION_SECURE_COOKIE=true` with HTTPS
3. Check `SANCTUM_STATEFUL_DOMAINS` includes your domain

### Database connection failed

```bash
# Test connection manually
psql -h your-host -U synergize_user -d synergize

# Check credentials in .env
php artisan config:clear
php artisan config:cache
```

### Redis connection failed

```bash
# Test connection
redis-cli -h your-host -p 6379 -a your-password ping

# Should return: PONG
```

---

## Updating the Application

### Backend Updates

```bash
# Pull latest code (via SFTP or git)

# Install new dependencies
composer install --no-dev --optimize-autoloader

# Run new migrations
php artisan migrate --force

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart the server
# (restart container in Pelican)
```

### Frontend Updates

```bash
# Pull latest code (via SFTP or git)

# Install new dependencies
npm ci

# Rebuild
npm run build

# Restart
# (restart container in Pelican)
```

---

## Security Checklist

Before going live, verify:

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] `SESSION_ENCRYPT=true`
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] Strong database password
- [ ] Strong Redis password
- [ ] SSL certificate installed and working
- [ ] Steam API key is valid
- [ ] Firewall configured (only 80, 443 open publicly)

---

## Useful Commands Reference

### Laravel (Backend)

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Check routes
php artisan route:list

# Database access
php artisan tinker
```

### Node.js (Frontend)

```bash
# Install dependencies
npm ci

# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start
```

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Laravel logs: `storage/logs/laravel.log`
3. Check Pelican container logs
4. Verify all environment variables are set correctly
