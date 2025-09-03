# Nuclear YouTube Scheduler

End-to-end automated YouTube Shorts pipeline with AI-powered content generation and engagement boosting.

## 🎯 Features

- **RSS Pipeline**: Pulls fresh SEO stories from merged RSS feeds
- **AI Agents**: Ava (Group Dealer Strategist) and Maya (OEM Program Insider) with domain-specific routing
- **Video Generation**: Uses Creatify to auto-script and render Shorts from article URLs
- **YouTube Upload**: Automated video uploads with proper metadata and comments
- **Engagement Boosting**: NuclearSMM integration for views, likes, and comments
- **Modern Dashboard**: React TypeScript UI for configuration and monitoring
- **Real-time API**: Netlify Functions with live queue processing and logging

## 🏗️ Architecture

**Netlify Serverless Architecture:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Netlify       │    │   External      │
│   Dashboard     │◄──►│   Functions     │◄──►│   APIs          │
│   (Netlify)     │    │   (Serverless)  │    │   (YouTube, etc)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Netlify Deployment (Recommended)

1. **Deploy to Netlify**:
   - Connect your GitHub repo to Netlify
   - Netlify will auto-detect the React frontend and Netlify Functions
   - Set environment variables in Netlify dashboard
   - Functions will be automatically deployed

2. **Configure Environment Variables**:
   - Go to Netlify dashboard → Site Settings → Environment Variables
   - Add all required API keys and configuration
   - Redeploy to activate the functions

3. **Authorize YouTube Channels**:
   - Open your Netlify dashboard URL
   - Go to YouTube tab
   - Click "Authorize Channel A" and "Authorize Channel B"
   - Complete OAuth flow for each channel

### Local Development

```bash
# Start Netlify Dev Locally
npx netlify dev

# Or Start Frontend Only
cd dashboard
npm install
npm run dev
```

### Environment Variables

Set these in Netlify → Site Settings → Environment Variables:

```bash
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

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### YouTube OAuth Setup

1. **Create Google Cloud Project**:
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-site.netlify.app/.netlify/functions/oauth2callback`

2. **Authorize Channels**:
   - **Channel A**: Visit `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth-start?channel=A`
   - **Channel B**: Visit `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth-start?channel=B`
   - Complete OAuth flow for each channel
   - **Redirect URI**: `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth2callback`
   - **Required Scopes**:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
     - `https://www.googleapis.com/auth/yt-analytics-monetary.readonly`

## 📡 Netlify Functions

### Core Functions
- `/.netlify/functions/status` - Get system status and last run summary
- `/.netlify/functions/run-now` - Manual batch trigger for RSS pipeline
- `/.netlify/functions/worker` - Background job processor (invoked by schedule-rss)

### OAuth Functions
- `/.netlify/functions/oauth-start` - Initiate YouTube OAuth flow
- `/.netlify/functions/oauth2callback` - Handle OAuth callback

### Scheduled Functions
- `/.netlify/functions/schedule-rss` - Daily trigger (9:00 AM ET) - invokes worker

## 🎮 Usage

### Via Dashboard (Recommended)

1. **Authorize YouTube**: Complete OAuth flow for Channel A and Channel B
2. **Check Status**: Click "Fetch RSS" to see last run status and item count
3. **Manual Run**: Click "Run Queue" to trigger immediate processing
4. **Monitor**: Watch real-time logs and queue status

### Automated Operation

- **Daily Schedule**: System runs automatically at 9:00 AM ET (configured in `netlify.toml` with cron `0 13 * * *`)
- **Smart Deduplication**: Avoids processing same articles for 5 days
- **Agent Routing**: Automatically routes content to Ava or Maya based on source domain
- **Full Pipeline**: RSS → Creatify → YouTube → Comments → SMM Orders

### Expected Output

Each run processes:
- **2 Shorts per channel** (4 total)
- **AI-generated author comments** on each video
- **SMM orders**: 500 views, 15 likes, 15 pinned comment likes, 2 custom comments

## 🔧 Configuration

### Agents
- **Ava**: Group Dealer Strategist (ahrefs.com, moz.com, seo.com)
- **Maya**: OEM Program Insider (developers.google.com, blog.google, etc.)

### RSS Sources
- Moz Blog
- Search Engine Land
- Google Blog
- Ahrefs Blog
- SEMrush Blog
- Yoast Blog
- And more...

### YouTube Settings
- Multiple channel support
- Custom title prefixes
- Automated tagging and descriptions
- Privacy settings (public/private/unlisted)

### SMM Services
- **Views**: 500 views per video
- **Likes**: 15 likes per video
- **Comment Likes**: 15 likes on author comment
- **Comments**: 2 custom reply comments

## 📊 Monitoring

The dashboard provides real-time monitoring of:
- **Queue Status**: Items pending, processing, completed, failed
- **Activity Logs**: Detailed processing logs with timestamps
- **API Connection**: Live connection status to backend
- **System Status**: Processing state and statistics

## 🔒 Security

- API keys are masked in the UI
- CORS configured for local development
- Environment variables for sensitive data
- No hardcoded credentials



## 📝 Notes

- **Comment Pinning**: Not available via YouTube API. Author comments are posted and targeted for engagement.
- **Engagement Policies**: Manufactured engagement may violate YouTube policies; use at your discretion.
- **Rate Limits**: Respect API rate limits for all services.
- **Error Handling**: Comprehensive error handling with detailed logging.

## 🛠️ Development

### Local Development
```bash
# Start Netlify Dev (includes functions)
npx netlify dev

# Or frontend only
cd dashboard
npm run dev
```

## 🚀 Deployment Checklist

### 1) **Environment Variables** (Site → Settings → Environment)
See the Environment Variables section above for the complete list.

### 2) **OAuth Connect** (one-time per channel)
- **Channel A**: Visit `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth-start?channel=A`
- **Channel B**: Visit `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth-start?channel=B`
- Sign in with the Google account that owns each channel and accept scopes
- You should see: "OK – saved refresh token for channel [A/B]"

### 3) **Scheduled Runs**
- Netlify **Scheduled Function** (`schedule-rss`) fires daily at **9:00 AM ET** (cron: `0 13 * * *`)
- Triggers the background **worker** function automatically
- Manual trigger available via dashboard "Run Now" button → `/.netlify/functions/run-now`

### 4) **Status Monitoring**
- Dashboard **Status** button hits `/.netlify/functions/status`
- Reads last run summary from Netlify Blobs (time, items, order responses)
- Data retention: last run + "seen articles" cache to avoid duplicates for ~5 days

### 5) **Required Google APIs**
YouTube Data v3, YouTube Analytics, and YouTube Reporting **must be enabled** in the same GCP project as your OAuth client.

## 📄 License

This project is for educational and development purposes. Please ensure compliance with all platform terms of service and applicable laws.