#!/bin/bash

# Synergize Platform Build Script
# Use this to create a release package

set -e

echo "Building Synergize Platform..."
echo ""

# Get version from argument or default
VERSION=${1:-"dev"}

# Create build directory
BUILD_DIR="dist/synergize-${VERSION}"
rm -rf dist
mkdir -p ${BUILD_DIR}

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Preparing backend..."
cd backend
composer install --no-dev --optimize-autoloader
cd ..

echo "Creating release package..."

# Copy frontend (with build)
cp -r frontend/. ${BUILD_DIR}/frontend/
rm -rf ${BUILD_DIR}/frontend/node_modules

# Copy backend
cp -r backend/. ${BUILD_DIR}/backend/
rm -rf ${BUILD_DIR}/backend/vendor
rm -rf ${BUILD_DIR}/backend/storage/logs/*
rm -rf ${BUILD_DIR}/backend/storage/framework/cache/*
rm -rf ${BUILD_DIR}/backend/storage/framework/sessions/*
rm -rf ${BUILD_DIR}/backend/storage/framework/views/*

# Copy scripts
cp -r scripts ${BUILD_DIR}/
chmod +x ${BUILD_DIR}/scripts/*.sh

# Copy documentation
cp -r docs ${BUILD_DIR}/
cp README.md ${BUILD_DIR}/
cp .gitignore ${BUILD_DIR}/

# Copy Pelican egg
mkdir -p ${BUILD_DIR}/pelican
cp pelican/egg-synergize.json ${BUILD_DIR}/pelican/

# Create gitkeep files
touch ${BUILD_DIR}/backend/storage/logs/.gitkeep
touch ${BUILD_DIR}/backend/storage/framework/cache/.gitkeep
touch ${BUILD_DIR}/backend/storage/framework/sessions/.gitkeep
touch ${BUILD_DIR}/backend/storage/framework/views/.gitkeep
touch ${BUILD_DIR}/backend/bootstrap/cache/.gitkeep

# Create zip
cd dist
zip -r synergize-${VERSION}.zip synergize-${VERSION}
cd ..

echo ""
echo "Build complete!"
echo "Release package: dist/synergize-${VERSION}.zip"
echo ""
echo "To deploy:"
echo "1. Upload the zip to GitHub releases"
echo "2. Use the direct download URL in Pelican Panel"
