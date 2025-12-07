#!/bin/bash

# Synergize Platform Start Script
# This script is executed by Pelican Panel to start the application

set -e

cd /home/container

echo "========================================"
echo "  Synergize CS2 Community Platform"
echo "========================================"
echo ""

# Configure environment variables
export APP_URL="${APP_URL:-http://localhost}"
export DB_CONNECTION="pgsql"
export DB_HOST="${DB_HOST}"
export DB_PORT="${DB_PORT:-5432}"
export DB_DATABASE="${DB_DATABASE}"
export DB_USERNAME="${DB_USERNAME}"
export DB_PASSWORD="${DB_PASSWORD}"
export STEAM_API_KEY="${STEAM_API_KEY}"
export FRONTEND_URL="${APP_URL}"

# Create logs directory
mkdir -p logs

# Update backend .env file
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env from example"
fi

if [ -f "backend/.env" ]; then
    # Update .env values
    sed -i "s|APP_URL=.*|APP_URL=${APP_URL}|g" backend/.env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=${APP_URL}|g" backend/.env
    sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=pgsql|g" backend/.env
    sed -i "s|DB_HOST=.*|DB_HOST=${DB_HOST}|g" backend/.env
    sed -i "s|DB_PORT=.*|DB_PORT=${DB_PORT}|g" backend/.env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_DATABASE}|g" backend/.env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USERNAME}|g" backend/.env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|g" backend/.env
    sed -i "s|STEAM_API_KEY=.*|STEAM_API_KEY=${STEAM_API_KEY}|g" backend/.env
    echo "Updated backend/.env with environment variables"
fi

# Generate app key if not set
if [ -f "backend/artisan" ]; then
    cd backend
    if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
        php artisan key:generate --force
        echo "Generated application key"
    fi
    cd ..
fi

# Run database migrations
if [ -f "backend/artisan" ]; then
    echo "Running database migrations..."
    cd backend
    php artisan migrate --force 2>&1 || echo "Migration notice: Some migrations may have already run"
    php artisan config:cache 2>/dev/null || true
    php artisan route:cache 2>/dev/null || true
    cd ..
    echo "Migrations complete"
fi

# Create frontend .env.local
if [ -d "frontend" ]; then
    echo "NEXT_PUBLIC_API_URL=${APP_URL}" > frontend/.env.local
    echo "NEXT_PUBLIC_APP_NAME=Synergize" >> frontend/.env.local
    echo "Created frontend/.env.local"
fi

# Set ports
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${SERVER_PORT:-3000}

echo ""
echo "Starting services..."
echo ""

# Start Laravel backend
cd /home/container/backend
php artisan serve --host=0.0.0.0 --port=${BACKEND_PORT} > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started on port ${BACKEND_PORT} (PID: ${BACKEND_PID})"

# Wait a moment for backend to initialize
sleep 2

# Start Next.js frontend
cd /home/container/frontend
if [ -d ".next" ]; then
    # Production build exists
    npm run start -- -p ${FRONTEND_PORT} > ../logs/frontend.log 2>&1 &
else
    # Development mode
    npm run dev -- -p ${FRONTEND_PORT} > ../logs/frontend.log 2>&1 &
fi
FRONTEND_PID=$!
echo "Frontend started on port ${FRONTEND_PORT} (PID: ${FRONTEND_PID})"

echo ""
echo "========================================"
echo "Synergize platform is running"
echo "========================================"
echo ""
echo "Frontend: http://0.0.0.0:${FRONTEND_PORT}"
echo "Backend API: http://0.0.0.0:${BACKEND_PORT}"
echo ""
echo "Logs:"
echo "  Backend: logs/backend.log"
echo "  Frontend: logs/frontend.log"
echo ""

# Handle shutdown gracefully
cleanup() {
    echo "Shutting down..."
    kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for either process to exit
wait -n ${BACKEND_PID} ${FRONTEND_PID}

# If one dies, kill the other
echo "A service has stopped. Shutting down..."
kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null
exit 1
