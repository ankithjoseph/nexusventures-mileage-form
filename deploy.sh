#!/bin/bash

# VPS Deployment Script for Mileage Form App

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Clone or update repository
if [ ! -d "nexusventures-mileage-form" ]; then
    echo "📦 Cloning repository..."
    git clone https://github.com/ankithjoseph/nexusventures-mileage-form.git
    cd nexusventures-mileage-form
else
    echo "📦 Updating repository..."
    cd nexusventures-mileage-form
    git pull origin main
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🔨 Building application..."
npm run build

# Start application with PM2
echo "🚀 Starting application..."
pm2 stop mileage-app 2>/dev/null || true
pm2 delete mileage-app 2>/dev/null || true
pm2 start "npx serve dist -s -l 4173" --name mileage-app
pm2 save
pm2 startup
pm2 save

echo "✅ Deployment completed!"
echo "🌐 Your app should be running on port 4173"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs mileage-app"
