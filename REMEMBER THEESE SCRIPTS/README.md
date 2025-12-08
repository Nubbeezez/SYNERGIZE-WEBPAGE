# Synergize Deployment Scripts

## Overview

These scripts and guides help you deploy Synergize to production.

---

## Choose Your Deployment Method

### Option 1: Pelican Panel (Recommended)

If you're using Pelican Panel for hosting, see:

**[PELICAN-DEPLOYMENT.md](PELICAN-DEPLOYMENT.md)** - Complete step-by-step guide

### Option 2: Traditional VPS

If you're deploying to a bare Ubuntu/Debian server, use the scripts below.

---

## Files Reference

| File | Purpose |
|------|---------|
| `PELICAN-DEPLOYMENT.md` | Complete Pelican Panel deployment guide |
| `pelican-env-template.txt` | Environment variables template for Pelican |
| `first-time-setup.sh` | VPS: Run ONCE on fresh server to install everything |
| `deploy-backend.sh` | VPS: Deploy backend updates |
| `deploy-frontend.sh` | VPS: Deploy frontend updates |
| `deploy-all.sh` | VPS: Deploy both backend and frontend |
| `backup.sh` | Database and file backup script |

---

## VPS Deployment (Traditional Server)

> Skip this section if using Pelican Panel - see [PELICAN-DEPLOYMENT.md](PELICAN-DEPLOYMENT.md) instead.

### First-Time Setup

#### 1. Prepare Your Server

- Ubuntu 22.04 LTS recommended
- Minimum 2GB RAM, 20GB storage
- Root access required

#### 2. Edit Configuration

Open `first-time-setup.sh` and edit these variables:

```bash
DOMAIN="your-domain.com"
DB_PASS="CHANGE_THIS_STRONG_PASSWORD"
REDIS_PASS="CHANGE_THIS_REDIS_PASSWORD"
REPO_URL="https://github.com/your-username/synergize.git"
```

#### 3. Run Setup

```bash
# Upload script to server
scp first-time-setup.sh root@your-server:/root/

# SSH into server
ssh root@your-server

# Make executable and run
chmod +x first-time-setup.sh
./first-time-setup.sh
```

#### 4. After Setup

1. Get a Steam API key: https://steamcommunity.com/dev/apikey
2. Edit `/var/www/synergize/backend/.env` and add your Steam API key
3. Login with Steam to create your account
4. Make yourself an owner:

```bash
sudo -u postgres psql -d synergize -c "UPDATE users SET roles = ARRAY['owner'] WHERE steam_id = 'YOUR_STEAM_ID';"
```

---

### Subsequent Deployments

After the initial setup, use these commands to deploy updates:

#### Backend Updates

```bash
cd /var/www/synergize
./deploy-backend.sh
```

#### Frontend Updates

```bash
cd /var/www/synergize
./deploy-frontend.sh
```

---

### Environment Variables Checklist

#### Backend (`/var/www/synergize/backend/.env`)

```env
# MUST SET THESE
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
DB_PASSWORD=your_db_password
REDIS_PASSWORD=your_redis_password
STEAM_API_KEY=your_steam_api_key
SESSION_DOMAIN=.your-domain.com
SANCTUM_STATEFUL_DOMAINS=your-domain.com,www.your-domain.com
```

#### Frontend (`/var/www/synergize/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Synergize
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

### Useful Commands

#### View Logs

```bash
# Frontend logs
pm2 logs synergize-frontend

# Backend logs
tail -f /var/www/synergize/backend/storage/logs/laravel.log

# Queue worker logs
tail -f /var/www/synergize/backend/storage/logs/worker.log

# Nginx logs
tail -f /var/log/nginx/error.log
```

#### Restart Services

```bash
# Frontend
pm2 restart synergize-frontend

# PHP-FPM
systemctl restart php8.2-fpm

# Nginx
systemctl restart nginx

# Queue workers
supervisorctl restart synergize-worker:*

# Redis
systemctl restart redis-server
```

#### Database

```bash
# Access PostgreSQL
sudo -u postgres psql -d synergize

# Backup database
pg_dump -U synergize_user synergize > backup.sql

# Restore database
psql -U synergize_user synergize < backup.sql
```

#### Clear Caches

```bash
cd /var/www/synergize/backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

### Troubleshooting

#### 500 Server Error
```bash
# Check Laravel logs
tail -100 /var/www/synergize/backend/storage/logs/laravel.log

# Check permissions
chown -R www-data:www-data /var/www/synergize/backend/storage
chmod -R 755 /var/www/synergize/backend/storage
```

#### Steam Login Not Working
1. Check `STEAM_API_KEY` is set correctly
2. Check `STEAM_CALLBACK_URL` matches your domain
3. Verify Steam API key at https://steamcommunity.com/dev/apikey

#### Frontend Not Loading
```bash
# Check if PM2 is running
pm2 status

# Restart if needed
pm2 restart synergize-frontend

# Check for port conflicts
netstat -tlpn | grep 3000
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
sudo -u postgres psql -c "SELECT 1;"

# Check credentials in .env
```

---

### Security Reminders

- [ ] `APP_DEBUG=false` in production
- [ ] `SESSION_ENCRYPT=true` in production
- [ ] Strong database password
- [ ] Strong Redis password
- [ ] SSL certificate installed
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Regular backups enabled
