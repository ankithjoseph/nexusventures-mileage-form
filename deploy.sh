#!/bin/bash

# Deployment script for VPS using Nixpacks
# Usage: ./deploy.sh [server_ip] [user]

set -e

SERVER_IP=${1:-"your-server-ip"}
USER=${2:-"root"}

echo "🚀 Deploying to VPS: $USER@$SERVER_IP"

# Build locally first
echo "📦 Building application..."
npm run build

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.env' \
    .

# Upload to server
echo "📤 Uploading to server..."
scp deploy.tar.gz $USER@$SERVER_IP:~/

# Deploy on server
echo "🔧 Deploying on server..."
ssh $USER@$SERVER_IP << 'EOF'
    # Remove old deployment
    rm -rf nexusventures-mileage-form
    mkdir nexusventures-mileage-form
    cd nexusventures-mileage-form

    # Extract new deployment
    tar -xzf ../deploy.tar.gz
    rm ../deploy.tar.gz

    # Install dependencies and build
    npm ci
    npm run build

    # Start application (you might want to use PM2 or similar)
    npm run preview -- --host 0.0.0.0 --port 4173 &
EOF

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: http://$SERVER_IP:4173"