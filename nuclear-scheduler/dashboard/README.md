# Nuclear YouTube Scheduler Dashboard

A modern React TypeScript dashboard for managing the Nuclear YouTube Scheduler automation pipeline.

## Features

- **API Key Management**: Secure masked input fields for OpenAI, Creatify, and NuclearSMM credentials
- **Agent Configuration**: Configure Ava (Group Dealer Strategist) and Maya (OEM Program Insider) personas
- **RSS Feed Management**: Set up and preview RSS feed sources with deduplication settings
- **YouTube Channel Settings**: Configure multiple channels with custom titles, categories, and privacy settings
- **Queue Management**: Real-time queue monitoring with item processing status
- **Activity Logs**: Comprehensive logging with timestamps and status indicators
- **Configuration Export**: Export settings as JSON for use with the Python backend

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Radix UI** components for accessibility
- **Lucide React** for icons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Configuration

The dashboard automatically saves your configuration to localStorage. You can:

- Configure API keys for all services
- Set up agent personas and domain routing
- Configure RSS feed sources and processing limits
- Set YouTube channel parameters
- Export configuration for use with the Python backend

## Integration

The dashboard is designed to work with the Nuclear YouTube Scheduler Python backend:

1. Configure settings in the dashboard
2. Export configuration as `config.json`
3. Use with `run_from_rss.py` or `run_daily.py`

## UI Components

Built with shadcn/ui components for consistency and accessibility:
- Cards, Buttons, Inputs, Labels
- Switches, Sliders, Selects
- Tabs, Badges, Textareas
- All components support dark mode and responsive design

## State Management

- Local state management with React hooks
- Persistent storage via localStorage
- Real-time updates across all tabs
- Mock API integration for testing

## Development

The dashboard includes mock functionality for testing:
- RSS feed fetching simulation
- Queue processing simulation
- Log generation and management
- Configuration export functionality

Ready for integration with real API endpoints when connected to the Python backend.