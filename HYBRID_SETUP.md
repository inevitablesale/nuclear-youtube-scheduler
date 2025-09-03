# 🚀 Nuclear YouTube Scheduler - Netlify Serverless Setup Guide

## 🏗️ **Architecture Overview**

Your Nuclear YouTube Scheduler uses a **fully serverless architecture**:

- **Frontend**: React TypeScript dashboard on Netlify
- **Backend**: Netlify Functions (serverless)
- **Storage**: Netlify Blobs for state management
- **Scheduling**: Netlify Scheduled Functions (daily at 9AM ET)
- **OAuth**: Secure YouTube authentication flow

## 🎯 **Deployment Strategy**

### **Netlify Serverless Deployment (Recommended)**

1. **Deploy to Netlify**:
   - Connect your GitHub repo to Netlify
   - Netlify will auto-detect the React frontend and Netlify Functions
   - Set environment variables in Netlify dashboard
   - Functions will be automatically deployed

2. **Configure Environment Variables**:
   - Go to Netlify dashboard → Site Settings → Environment Variables
   - Add all required API keys and configuration
   - Redeploy to activate the functions

### **Local Development**

1. **Start Netlify Dev Locally**:
   ```bash
   cd /Users/christabb/nuclear-youtube-scheduler
   npx netlify dev
   ```

2. **Or Start Frontend Only**:
   ```bash
   cd dashboard
   npm run dev
   ```

## 🔧 **Environment Variables Setup**

### **For Netlify (All in one place):**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Creatify
CREATIFY_API_ID=your_creatify_api_id
CREATIFY_API_KEY=your_creatify_api_key

# NuclearSMM
NUCLEAR_API_KEY=your_nuclear_api_key
NUCLEAR_API_URL=https://nuclearsmm.com/api/v2

# RSS Configuration
RSS_URL=your_rss_feed_url
DAILY_PER_CHANNEL=2
```

## 🚀 **Quick Start Guide**

### **Step 1: Deploy to Netlify**

1. Go to [Netlify.com](https://netlify.com)
2. Connect your GitHub account
3. Create new site from GitHub repo
4. Select `inevitablesale/nuclear-youtube-scheduler` repository
5. Netlify will auto-detect React frontend and Netlify Functions
6. Deploy will happen automatically

### **Step 2: Configure Environment Variables**

1. Go to your Netlify dashboard
2. Site Settings → Environment Variables
3. Add all required environment variables (see list above)
4. Redeploy the site to activate functions

### **Step 3: Authorize YouTube Channels**

1. Open your Netlify dashboard URL
2. Go to YouTube tab
3. Click "Authorize Channel A" and "Authorize Channel B"
4. Complete OAuth flow for each channel

### **Step 4: Test the System**

1. Check API connection status (should show "API Connected")
2. Use "Fetch RSS" to test the pipeline
3. Monitor logs and queue status
4. Verify videos are uploaded to YouTube channels

## 🔄 **How It Works**

### **Daily Automation**
1. **Manual Trigger**: Use "Run Queue" button in dashboard
2. **RSS Fetch**: Pulls latest SEO articles
3. **Agent Routing**: Routes to Ava (Group Dealer) or Maya (OEM Program)
4. **Video Creation**: Uses Creatify to generate YouTube Shorts
5. **Upload**: Posts to YouTube channels
6. **Engagement**: AI comments + SMM orders

### **Netlify Functions**
- `/.netlify/functions/status` - System status and activity logs
- `/.netlify/functions/run-now` - Manual trigger for RSS pipeline
- `/.netlify/functions/schedule-rss` - Scheduled function (daily 9AM ET)
- `/.netlify/functions/oauth2callback` - YouTube OAuth flow
- `/.netlify/functions/auth-status` - YouTube authorization status

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
- ✅ **Backend**: Netlify Functions ready
- ✅ **API Integration**: Configured for serverless
- ✅ **Environment**: Properly externalized
- ✅ **Scheduling**: Daily automation configured
- ✅ **OAuth**: YouTube integration ready

## 🎯 **Next Steps**

1. **Set Environment Variables**: Add all required API keys in Netlify
2. **Authorize YouTube**: Complete OAuth flow for both channels
3. **Test System**: Use dashboard to test full pipeline
4. **Monitor**: Watch logs and queue for successful operation
5. **Go Live**: System will run automatically daily at 9AM ET

Your Nuclear YouTube Scheduler is ready for production deployment! 🎉