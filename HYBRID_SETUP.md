# 🚀 Nuclear YouTube Scheduler - Hybrid Setup Guide

## 🏗️ **Architecture Overview**

Your Nuclear YouTube Scheduler uses a **hybrid architecture**:

- **Frontend**: React TypeScript dashboard on Netlify
- **Backend**: Python FastAPI server (deploy to Railway)
- **Database**: Local SQLite (can be upgraded to PostgreSQL later)
- **Storage**: Local file system (can be upgraded to cloud storage)

## 🎯 **Deployment Strategy**

### **Option 1: Railway Backend + Netlify Frontend (Recommended)**

1. **Deploy Python Backend to Railway**:
   - Connect your GitHub repo to Railway
   - Railway will auto-detect the Python backend
   - Set environment variables in Railway dashboard

2. **Configure Netlify Frontend**:
   - Set `VITE_API_URL` environment variable to your Railway backend URL
   - Netlify will automatically connect to Railway backend

### **Option 2: Local Development**

1. **Start Python Backend Locally**:
   ```bash
   cd /Users/christabb/nuclear-youtube-scheduler
   python -m uvicorn api_server:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start React Frontend**:
   ```bash
   cd dashboard
   npm run dev
   ```

## 🔧 **Environment Variables Setup**

### **For Railway Backend:**
```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Creatify
CREATIFY_API_ID=your_creatify_api_id
CREATIFY_API_KEY=your_creatify_api_key

# NuclearSMM
NUCLEAR_API_KEY=your_nuclear_api_key
NUCLEAR_API_URL=https://nuclearsmm.com/api/v2

# YouTube OAuth
YT_CLIENT_ID=your_youtube_client_id
YT_CLIENT_SECRET=your_youtube_client_secret

# RSS Configuration
RSS_URL=your_rss_feed_url
DAILY_PER_CHANNEL=2
```

### **For Netlify Frontend:**
```bash
# Backend URL (Railway or local)
VITE_API_URL=https://your-railway-backend.railway.app
# OR for local development:
VITE_API_URL=http://localhost:8000
```

## 🚀 **Quick Start Guide**

### **Step 1: Deploy Backend to Railway**

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub account
3. Create new project from GitHub repo
4. Select `nuclear-youtube-scheduler` repository
5. Railway will auto-detect Python and deploy
6. Add environment variables in Railway dashboard
7. Copy the Railway URL (e.g., `https://nuclear-scheduler-production.railway.app`)

### **Step 2: Configure Netlify Frontend**

1. Go to your Netlify dashboard
2. Site Settings → Environment Variables
3. Add: `VITE_API_URL=https://your-railway-backend.railway.app`
4. Redeploy the site

### **Step 3: Test the System**

1. Open your Netlify dashboard URL
2. Check API connection status (should show "API Connected")
3. Use "Fetch RSS" to test the pipeline
4. Monitor logs and queue status

## 🔄 **How It Works**

### **Daily Automation**
1. **Manual Trigger**: Use "Run Queue" button in dashboard
2. **RSS Fetch**: Pulls latest SEO articles
3. **Agent Routing**: Routes to Ava (Group Dealer) or Maya (OEM Program)
4. **Video Creation**: Uses Creatify to generate YouTube Shorts
5. **Upload**: Posts to YouTube channels
6. **Engagement**: AI comments + SMM orders

### **API Endpoints**
- `GET /health` - Health check
- `GET /status` - System status
- `POST /rss/fetch` - Fetch RSS and process
- `GET /queue` - Get processing queue
- `POST /queue/process` - Process queue items
- `GET /logs` - Get activity logs

## 🎨 **Dashboard Features**

- **Real-time Status**: API connection, queue, agents, channels
- **Manual Controls**: Fetch RSS, run queue, clear queue
- **Configuration**: API keys, RSS settings, agent personas
- **Activity Logs**: Complete history of operations
- **Queue Management**: View and manage processing queue

## 🔒 **Security**

- ✅ All credentials stored as environment variables
- ✅ No hardcoded secrets in codebase
- ✅ CORS properly configured for production
- ✅ API endpoints protected with proper error handling

## 📊 **Monitoring**

The dashboard provides real-time visibility into:
- API connection status
- Queue processing status
- Activity logs with timestamps
- Error handling and status updates
- System health and performance

## 🚀 **Current Status**

- ✅ **Frontend**: Deployed to Netlify
- ✅ **Backend**: Ready for Railway deployment
- ✅ **API Integration**: Configured and tested
- ✅ **Environment**: Properly externalized
- ⏳ **Backend Deployment**: Ready for Railway

## 🎯 **Next Steps**

1. **Deploy to Railway**: Connect GitHub repo and deploy backend
2. **Set Environment Variables**: Add all required API keys
3. **Configure Frontend**: Set `VITE_API_URL` in Netlify
4. **Test System**: Use dashboard to test full pipeline
5. **Monitor**: Watch logs and queue for successful operation

Your Nuclear YouTube Scheduler is ready for production deployment! 🎉