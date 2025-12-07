# Pelican Panel Deployment Guide

Complete guide to deploying Synergize CS2 Community Platform on Pelican Panel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Importing the Egg](#importing-the-egg)
4. [Creating the Server](#creating-the-server)
5. [Configuration](#configuration)
6. [First Run](#first-run)
7. [Setting Up Steam Auth](#setting-up-steam-auth)
8. [Adding Your First Admin](#adding-your-first-admin)
9. [Updating](#updating)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Pelican Panel installed and running
- [ ] At least one node configured with available ports
- [ ] PostgreSQL database access (can be external)
- [ ] Steam Web API Key ([get one here](https://steamcommunity.com/dev/apikey))
- [ ] Domain name (optional but recommended for HTTPS)

### Minimum Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 512 MB | 1 GB |
| Disk | 1 GB | 2 GB |
| CPU | 1 core | 2 cores |

---

## Database Setup

Synergize requires a PostgreSQL database. You have two options:

### Option A: Use External PostgreSQL

If you already have a PostgreSQL server:

1. Create a new database:
   ```sql
   CREATE DATABASE synergize;
   CREATE USER synergize_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE synergize TO synergize_user;
   ```

2. Note down:
   - Host: `your-postgres-host.com`
   - Port: `5432`
   - Database: `synergize`
   - Username: `synergize_user`
   - Password: `your_secure_password`

### Option B: Use Pelican-Managed PostgreSQL

If your Pelican setup includes database management:

1. Go to **Databases** in your server settings
2. Create a new database
3. Note the connection details provided

---

## Importing the Egg

### Step 1: Download the Egg

Download `egg-synergize.json` from:
- The `pelican/` folder in this repository, OR
- The [Releases page](../../releases)

### Step 2: Import in Pelican Panel

1. Log into Pelican Panel as **Administrator**
2. Navigate to **Admin** → **Nests**
3. Select an existing nest or create a new one called "Web Applications"
4. Click **Import Egg**
5. Upload `egg-synergize.json`
6. Click **Import**

You should see "Synergize Platform" in your eggs list.

---

## Creating the Server

### Step 1: Create New Server

1. Go to **Servers** → **Create New**
2. Fill in the basic details:
   - **Server Name**: `Synergize`
   - **Owner**: Select the account that will manage this server

### Step 2: Select Egg

1. In **Nest**, select the nest containing Synergize
2. In **Egg**, select **Synergize Platform**
3. Choose your preferred Docker image:
   - `PHP 8.3 + Node 20` (recommended)
   - `PHP 8.2 + Node 20`
   - `PHP 8.2 + Node 18`

### Step 3: Configure Resources

Set resource limits:

| Setting | Recommended Value |
|---------|------------------|
| Memory | 1024 MB |
| Disk | 2048 MB |
| CPU Limit | 100% |
| Swap | 512 MB |

### Step 4: Allocate Ports

You need **two ports**:

| Port | Purpose | Default |
|------|---------|---------|
| Primary | Frontend (Next.js) | 3000 |
| Secondary | Backend API (Laravel) | 8000 |

In the **Allocation** section:
1. Select your node
2. Assign the primary allocation (this becomes `SERVER_PORT`)
3. Add an additional allocation for the backend

### Step 5: Configure Variables

Fill in the startup variables:

| Variable | Value | Notes |
|----------|-------|-------|
| Application URL | `https://your-domain.com` | Or `http://your-ip:3000` |
| Database Host | `your-postgres-host` | PostgreSQL server address |
| Database Port | `5432` | Default PostgreSQL port |
| Database Name | `synergize` | The database you created |
| Database Username | `synergize_user` | Your database user |
| Database Password | `***` | Your database password |
| Steam API Key | `XXXXXXXX` | From Steam Developer |
| GitHub Release URL | *(see below)* | Direct download URL |
| Git Repository | *(alternative)* | If not using releases |
| Backend Port | `8000` | Match your secondary allocation |

### Step 6: Choose Source Method

**Option A: GitHub Release (Recommended)**

Set `GitHub Release URL` to the direct download link of a release zip:
```
https://github.com/yourusername/synergize/releases/download/v1.0.0/synergize-v1.0.0.zip
```

**Option B: Git Repository**

Set `Git Repository`:
```
https://github.com/yourusername/synergize.git
```

For private repos, also set `Git Access Token` with a personal access token.

### Step 7: Create Server

Click **Create Server** and wait for provisioning.

---

## Configuration

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes | Public URL (with protocol) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (usually 5432) |
| `DB_DATABASE` | Yes | Database name |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `STEAM_API_KEY` | Yes | Steam Web API key |
| `GITHUB_RELEASE_URL` | No* | Release zip URL |
| `GIT_REPO` | No* | Git repository URL |
| `GIT_BRANCH` | No | Branch name (default: main) |
| `GIT_TOKEN` | No | Token for private repos |
| `BACKEND_PORT` | Yes | API port (default: 8000) |
| `AUTO_UPDATE` | No | Auto-pull on startup |

*Either `GITHUB_RELEASE_URL` or `GIT_REPO` is required.

---

## First Run

### Step 1: Reinstall Server

After creating, click **Reinstall** to download and set up the application.

### Step 2: Monitor Installation

Watch the console for:
```
Installing PHP dependencies...
Installing Node.js dependencies...
Building Next.js application...
Installation complete!
```

### Step 3: Start the Server

Click **Start**. You should see:
```
========================================
  Synergize CS2 Community Platform
========================================

Starting services...

Backend started on port 8000 (PID: 123)
Frontend started on port 3000 (PID: 124)

Synergize platform is running
Frontend: http://0.0.0.0:3000
Backend API: http://0.0.0.0:8000
```

### Step 4: Verify

1. Open your browser to `http://your-ip:3000` (or your domain)
2. You should see the Synergize homepage
3. Test the Steam login button

---

## Setting Up Steam Auth

### Step 1: Get Steam API Key

1. Go to [Steam Web API Key Registration](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Enter your domain name
4. Copy the API key

### Step 2: Configure Callback URL

The Steam callback URL should be:
```
https://your-domain.com/api/v1/auth/steam/callback
```

Make sure this matches your `APP_URL` setting.

### Step 3: Test Login

1. Visit your site
2. Click "Login with Steam"
3. You should be redirected to Steam
4. After login, you're redirected back and logged in

---

## Adding Your First Admin

After logging in with Steam for the first time:

### Method 1: Direct Database

Connect to your PostgreSQL database and run:

```sql
-- Find your user
SELECT id, steam_id, username FROM users;

-- Make yourself a superadmin (replace YOUR_STEAM_ID)
UPDATE users SET roles = '["superadmin"]' WHERE steam_id = 'YOUR_STEAM_ID';
```

### Method 2: Artisan Command (via Console)

In the Pelican console, run:
```bash
cd backend && php artisan synergize:assign-admin YOUR_STEAM_ID superadmin
```

### Method 3: Seeder

Edit `backend/database/seeders/AdminSeeder.php` with your SteamID and run:
```bash
cd backend && php artisan db:seed --class=AdminSeeder
```

---

## Updating

### Automatic Updates (Git)

If using `GIT_REPO` with `AUTO_UPDATE=true`:

1. Simply restart the server
2. It will pull the latest code automatically

### Manual Update (Release)

1. Go to server **Settings**
2. Update `GITHUB_RELEASE_URL` to the new release
3. Click **Reinstall Server**
4. Start the server

### Manual Update (Git)

1. Access the server console
2. Run:
   ```bash
   git pull origin main
   cd backend && composer install --no-dev
   cd ../frontend && npm install && npm run build
   ```
3. Restart the server

---

## Troubleshooting

### Server Won't Start

**Check the logs:**
```bash
cat logs/backend.log
cat logs/frontend.log
```

**Common issues:**

1. **Port already in use**
   - Change `BACKEND_PORT` to a different value
   - Ensure allocations are correct in Pelican

2. **Database connection failed**
   - Verify PostgreSQL is accessible from the container
   - Check credentials are correct
   - Ensure database exists

3. **npm/composer errors**
   - Try reinstalling: click **Reinstall Server**
   - Check disk space

### Steam Login Not Working

1. **Verify Steam API Key**
   - Ensure it's correctly entered (no spaces)
   - Check it's not expired

2. **Check callback URL**
   - Must match your `APP_URL` exactly
   - Must be HTTPS if your domain uses HTTPS

3. **Check browser console**
   - Look for CORS errors
   - Verify API is responding

### Database Migration Errors

Run migrations manually:
```bash
cd backend
php artisan migrate:status
php artisan migrate --force
```

If tables exist from a previous install:
```bash
php artisan migrate:fresh --force  # WARNING: This drops all tables!
```

### Frontend Shows Blank Page

1. Check if built:
   ```bash
   ls frontend/.next
   ```

2. Rebuild if needed:
   ```bash
   cd frontend && npm run build
   ```

3. Check for JavaScript errors in browser console

### API Returns 500 Errors

1. Check Laravel logs:
   ```bash
   cat backend/storage/logs/laravel.log
   ```

2. Clear caches:
   ```bash
   cd backend
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   ```

3. Regenerate key:
   ```bash
   php artisan key:generate
   ```

---

## Reverse Proxy Setup (Optional)

If you want to use a domain with HTTPS, set up a reverse proxy.

### Nginx Example

```nginx
server {
    listen 80;
    server_name synergize.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name synergize.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
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

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Cloudflare Tunnel (Alternative)

If you're using Cloudflare Tunnel:

1. Create a tunnel pointing to `localhost:3000`
2. Configure the `APP_URL` to your Cloudflare domain
3. Ensure the tunnel allows WebSocket connections

---

## Support

- **GitHub Issues**: [Report bugs or request features](../../issues)
- **Documentation**: Check the `docs/` folder for more guides

---

## Next Steps

After successful deployment:

1. [Add your game servers](docs/ADDING_SERVERS.md)
2. [Configure leaderboards](docs/LEADERBOARDS.md)
3. [Set up the shop](docs/SHOP_SETUP.md)
4. [Customize the theme](docs/THEMING.md)
