#!/bin/bash

# =============================================================================
# SYNERGIZE FIRST-TIME SERVER SETUP SCRIPT
# =============================================================================
# Run this script ONCE on a fresh server to set up the environment
# Tested on: Ubuntu 22.04 LTS
# Usage: sudo ./first-time-setup.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SYNERGIZE FIRST-TIME SETUP${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo)${NC}"
    exit 1
fi

# =============================================================================
# CONFIGURATION - CHANGE THESE!
# =============================================================================
DOMAIN="your-domain.com"
DB_NAME="synergize"
DB_USER="synergize_user"
DB_PASS="CHANGE_THIS_STRONG_PASSWORD"
REDIS_PASS="CHANGE_THIS_REDIS_PASSWORD"
DEPLOY_USER="www-data"
DEPLOY_PATH="/var/www/synergize"
REPO_URL="https://github.com/your-username/synergize.git"  # Change this!

echo -e "\n${CYAN}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Deploy Path: $DEPLOY_PATH"
echo "  Database: $DB_NAME"
echo ""
read -p "Is this correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit this script with your configuration."
    exit 1
fi

# =============================================================================
# SYSTEM UPDATES
# =============================================================================
echo -e "\n${YELLOW}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================
echo -e "\n${YELLOW}[2/10] Installing dependencies...${NC}"
apt install -y \
    nginx \
    postgresql \
    redis-server \
    git \
    curl \
    unzip \
    supervisor \
    certbot \
    python3-certbot-nginx

# Install PHP 8.2
echo -e "\n${YELLOW}[3/10] Installing PHP 8.2...${NC}"
apt install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt update
apt install -y \
    php8.2-fpm \
    php8.2-cli \
    php8.2-common \
    php8.2-pgsql \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-curl \
    php8.2-zip \
    php8.2-redis \
    php8.2-bcmath \
    php8.2-intl \
    php8.2-gd

# Install Composer
echo -e "\n${YELLOW}[4/10] Installing Composer...${NC}"
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Node.js 20
echo -e "\n${YELLOW}[5/10] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# =============================================================================
# DATABASE SETUP
# =============================================================================
echo -e "\n${YELLOW}[6/10] Setting up PostgreSQL...${NC}"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# =============================================================================
# REDIS SETUP
# =============================================================================
echo -e "\n${YELLOW}[7/10] Configuring Redis...${NC}"
sed -i "s/# requirepass foobared/requirepass $REDIS_PASS/" /etc/redis/redis.conf
systemctl restart redis-server

# =============================================================================
# CLONE REPOSITORY
# =============================================================================
echo -e "\n${YELLOW}[8/10] Cloning repository...${NC}"
mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest..."
    git pull origin main
else
    git clone "$REPO_URL" .
fi

# =============================================================================
# BACKEND SETUP
# =============================================================================
echo -e "\n${YELLOW}[9/10] Setting up backend...${NC}"
cd "$DEPLOY_PATH/backend"

# Copy environment file
cp .env.production.example .env

# Generate app key
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
php artisan key:generate

echo -e "${CYAN}Please edit the .env file with your configuration:${NC}"
echo "  nano $DEPLOY_PATH/backend/.env"
echo ""
echo "Required changes:"
echo "  - APP_URL=https://$DOMAIN"
echo "  - FRONTEND_URL=https://$DOMAIN"
echo "  - DB_PASSWORD=$DB_PASS"
echo "  - REDIS_PASSWORD=$REDIS_PASS"
echo "  - STEAM_API_KEY=your_steam_api_key"
echo "  - SESSION_DOMAIN=.$DOMAIN"
echo "  - SANCTUM_STATEFUL_DOMAINS=$DOMAIN,www.$DOMAIN"
echo ""
read -p "Press Enter after editing .env to continue..."

# Run migrations
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chown -R www-data:www-data "$DEPLOY_PATH/backend"
chmod -R 755 "$DEPLOY_PATH/backend/storage"
chmod -R 755 "$DEPLOY_PATH/backend/bootstrap/cache"

# =============================================================================
# FRONTEND SETUP
# =============================================================================
echo -e "\n${YELLOW}[10/10] Setting up frontend...${NC}"
cd "$DEPLOY_PATH/frontend"

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_APP_NAME=Synergize
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
EOF

npm ci
npm run build

# Start with PM2
pm2 start npm --name "synergize-frontend" -- start
pm2 save
pm2 startup

# =============================================================================
# NGINX CONFIGURATION
# =============================================================================
echo -e "\n${YELLOW}Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/synergize << EOF
# Frontend (Next.js)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes to Laravel
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Backend API (Laravel)
server {
    listen 8000;
    server_name 127.0.0.1;
    root $DEPLOY_PATH/backend/public;
    index index.php;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/synergize /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# =============================================================================
# SUPERVISOR FOR QUEUE WORKER
# =============================================================================
echo -e "\n${YELLOW}Setting up Supervisor for queue worker...${NC}"

cat > /etc/supervisor/conf.d/synergize-worker.conf << EOF
[program:synergize-worker]
process_name=%(program_name)s_%(process_num)02d
command=php $DEPLOY_PATH/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=$DEPLOY_PATH/backend/storage/logs/worker.log
stopwaitsecs=3600
EOF

supervisorctl reread
supervisorctl update
supervisorctl start synergize-worker:*

# =============================================================================
# CRON JOB
# =============================================================================
echo -e "\n${YELLOW}Setting up cron job...${NC}"
(crontab -l 2>/dev/null; echo "* * * * * cd $DEPLOY_PATH/backend && php artisan schedule:run >> /dev/null 2>&1") | crontab -

# =============================================================================
# SSL CERTIFICATE
# =============================================================================
echo -e "\n${YELLOW}Setting up SSL certificate...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# =============================================================================
# DONE!
# =============================================================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  SETUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your site should now be available at: ${CYAN}https://$DOMAIN${NC}"
echo ""
echo "Next steps:"
echo "  1. Update DNS to point to this server"
echo "  2. Get a Steam API key from https://steamcommunity.com/dev/apikey"
echo "  3. Update STEAM_API_KEY in backend/.env"
echo "  4. Create your first owner account by logging in with Steam"
echo "  5. Manually set your user role to 'owner' in the database:"
echo "     sudo -u postgres psql -d $DB_NAME -c \"UPDATE users SET roles = ARRAY['owner'] WHERE steam_id = 'YOUR_STEAM_ID';\""
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs synergize-frontend"
echo "  - View Laravel logs: tail -f $DEPLOY_PATH/backend/storage/logs/laravel.log"
echo "  - Restart frontend: pm2 restart synergize-frontend"
echo "  - Restart queue: supervisorctl restart synergize-worker:*"
