# Nuclear YouTube Scheduler - Deployment Guide

## Overview
This application consists of two parts:
- **Backend**: FastAPI server (deploy to Railway)
- **Frontend**: React dashboard (deploy to Netlify)

## Backend Deployment (Railway)

### 1. Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from the project root
railway deploy
```

### 2. Set Environment Variables in Railway
In your Railway dashboard, add these environment variables:

```
OPENAI_API_KEY=your_openai_api_key
CREATIFY_API_KEY=your_creatify_api_key
NUCLEARSMM_API_KEY=your_nuclearsmm_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Get Railway URL
After deployment, Railway will provide a URL like: `https://your-app-name.railway.app`

## Frontend Deployment (Netlify)

### 1. Build the Frontend
```bash
cd dashboard
npm run build
```

### 2. Deploy to Netlify
- Connect your GitHub repository to Netlify
- Set build directory to `dashboard`
- Set publish directory to `dashboard/dist`

### 3. Set Environment Variables in Netlify
In Netlify dashboard, go to Site Settings > Environment Variables:

```
VITE_API_URL=https://your-app-name.railway.app
```

### 4. Redeploy
After setting environment variables, trigger a new deployment.

## Testing the Deployment

1. **Backend Health Check**: Visit `https://your-app-name.railway.app/health`
2. **Frontend**: Visit your Netlify URL
3. **Test Connection**: Click "Fetch RSS" button in the dashboard

## Configuration

### RSS Feed Configuration
Update the RSS feed URL in the dashboard configuration:
- Go to Configuration tab
- Update RSS URL to your desired feed
- Set fetch limits and allowed domains

### Agent Configuration
Configure Ava and Maya agents:
- Set allowed domains for each agent
- Configure target audiences
- Set daily content limits

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure:
1. Railway backend URL is correctly set in Netlify environment variables
2. Backend CORS middleware includes your Netlify domain

### API Connection Issues
1. Check Railway logs: `railway logs`
2. Verify environment variables are set
3. Test backend health endpoint directly

### Build Issues
1. Check Node.js version compatibility
2. Ensure all dependencies are in package.json
3. Check build logs in Netlify dashboard

## Production Considerations

1. **Database**: Consider using Railway PostgreSQL for persistent storage
2. **File Storage**: Use Railway volumes for video files
3. **Monitoring**: Set up Railway monitoring and alerts
4. **Backup**: Regular backups of configuration and data
5. **Security**: Use HTTPS, secure API keys, and proper CORS settings