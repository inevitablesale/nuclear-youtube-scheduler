# Nuclear YouTube Scheduler

End-to-end automated YouTube Shorts pipeline with AI-powered content generation and engagement boosting.

## 🎯 Features

- **RSS Pipeline**: Pulls fresh SEO stories from merged RSS feeds
- **AI Agents**: Ava (Group Dealer Strategist) and Maya (OEM Program Insider) with domain-specific routing
- **Video Generation**: Uses Creatify to auto-script and render Shorts from article URLs
- **YouTube Upload**: Automated video uploads with proper metadata and comments
- **Engagement Boosting**: NuclearSMM integration for views, likes, and comments
- **Modern Dashboard**: React TypeScript UI for configuration and monitoring
- **Real-time API**: FastAPI backend with live queue processing and logging

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   FastAPI       │    │   Python        │
│   Dashboard     │◄──►│   Backend       │◄──►│   Pipeline      │
│   (Port 5173)   │    │   (Port 8000)   │    │   (RSS→Video)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI backend
python start_backend.py
```

The API will be available at:
- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 2. Frontend Setup

```bash
# Navigate to dashboard directory
cd dashboard

# Install Node.js dependencies
npm install

# Start the React development server
npm run dev
```

The dashboard will be available at: http://localhost:5173

### 3. Configuration

1. **Copy configuration template**:
   ```bash
   cp config.example.json config.json
   ```

2. **Set environment variables**:
   ```bash
   export OPENAI_API_KEY="sk-..."
   export CREATIFY_API_ID="xxxx"
   export CREATIFY_API_KEY="yyyy"
   ```

3. **Configure in dashboard**:
   - Open http://localhost:5173
   - Go to Config tab
   - Enter your API keys
   - Configure agents, RSS feeds, and YouTube channels

## 📡 API Endpoints

### Configuration
- `GET /config` - Get current configuration
- `POST /config` - Update configuration

### RSS & Queue
- `POST /rss/fetch` - Fetch RSS feeds and populate queue
- `GET /queue` - Get current queue
- `DELETE /queue/{item_id}` - Remove specific item
- `DELETE /queue` - Clear entire queue
- `POST /queue/process` - Start processing queue

### Monitoring
- `GET /logs` - Get activity logs
- `DELETE /logs` - Clear logs
- `GET /status` - Get system status
- `GET /health` - Health check

## 🎮 Usage

### Via Dashboard (Recommended)

1. **Configure**: Set up API keys, agents, and channels in the dashboard
2. **Fetch RSS**: Click "Fetch RSS" to populate the queue with fresh content
3. **Process**: Click "Run Queue" to start automated video creation and upload
4. **Monitor**: Watch real-time logs and queue status

### Via API

```bash
# Fetch RSS feeds
curl -X POST http://localhost:8000/rss/fetch

# Check queue status
curl http://localhost:8000/queue

# Start processing
curl -X POST http://localhost:8000/queue/process
```

### Via Python Scripts

```bash
# Run RSS pipeline
python run_from_rss.py

# Run local file upload
python run_daily.py
```

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

## 🚀 Production Deployment

### Backend
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with production server
uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
# Build for production
cd dashboard
npm run build

# Serve static files
npx serve -s dist -l 3000
```

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
CREATIFY_API_ID=xxxx
CREATIFY_API_KEY=yyyy

# Optional
NUCLEARSMM_API_KEY=7034688f756e58db675073e27c52ec79
```

## 📝 Notes

- **Comment Pinning**: Not available via YouTube API. Author comments are posted and targeted for engagement.
- **Engagement Policies**: Manufactured engagement may violate YouTube policies; use at your discretion.
- **Rate Limits**: Respect API rate limits for all services.
- **Error Handling**: Comprehensive error handling with detailed logging.

## 🛠️ Development

### Backend Development
```bash
# Start with auto-reload
python start_backend.py

# Or directly with uvicorn
uvicorn api_server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd dashboard
npm run dev
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

## 📄 License

This project is for educational and development purposes. Please ensure compliance with all platform terms of service and applicable laws.