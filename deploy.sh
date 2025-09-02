#!/bin/bash

echo "🚀 Nuclear YouTube Scheduler Deployment Script"
echo "=============================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway:"
    railway login
fi

echo "📦 Deploying backend to Railway..."
railway deploy

echo "🏗️ Building frontend..."
cd dashboard
npm run build
cd ..

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Get your Railway URL from the deployment output"
echo "2. Set VITE_API_URL environment variable in Netlify to your Railway URL"
echo "3. Deploy frontend to Netlify"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."