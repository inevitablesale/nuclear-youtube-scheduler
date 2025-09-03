# Netlify Environment Variables

Set these environment variables in your Netlify dashboard under Site Settings → Environment Variables:

## Required Environment Variables

### Google OAuth
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### OpenAI
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Creatify
```
CREATIFY_API_ID=your_creatify_api_id_here
CREATIFY_API_KEY=your_creatify_api_key_here
```

### NuclearSMM
```
NUCLEAR_API_KEY=your_nuclear_api_key_here
NUCLEAR_API_URL=https://nuclearsmm.com/api/v2
```

### RSS Configuration
```
RSS_URL=your_merged_seo_feed_url_here
DAILY_PER_CHANNEL=2
```

## YouTube OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://nuclear-youtube-scheduler.netlify.app/.netlify/functions/oauth2callback`
6. Copy Client ID and Client Secret to environment variables above

## Scheduled Function

The system runs automatically daily at 9:00 AM Eastern Time via Netlify's scheduled functions. The cron expression is set to `0 13 * * *` (UTC equivalent).

## Manual Triggers

- **Run Now**: Use the "Run Queue" button in the dashboard
- **Status Check**: The dashboard automatically polls for status updates
- **OAuth**: Use the "Authorize Channel" buttons in the YouTube tab