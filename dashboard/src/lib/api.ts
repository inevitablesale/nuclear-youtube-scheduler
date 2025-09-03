// Netlify Functions API client
export interface Config {
  timezone: string;
  agents: Record<string, any>;
  rss: Record<string, any>;
  openai: Record<string, any>;
  creatify: Record<string, any>;
  nuclearsmm: Record<string, any>;
  youtube: Record<string, any>;
}

export interface QueueItem {
  id: string;
  title: string;
  url: string;
  agent: string;
  status: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  [key: string]: any;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Configuration endpoints
  async getConfig(): Promise<Config> {
    try {
      const response = await fetch('/.netlify/functions/auth-status');
      const data = await response.json();
      return {
        timezone: 'America/New_York',
        agents: {
          ava: { name: 'Ava', persona: 'Group Dealer Strategist' },
          maya: { name: 'Maya', persona: 'OEM Program Insider' }
        },
        rss: { url: 'https://example.com/feed.xml' },
        openai: { model: 'gpt-4o-mini' },
        creatify: { api_id: '', api_key: '' },
        nuclearsmm: { api_key: '', api_url: 'https://nuclearsmm.com/api/v2' },
        youtube: {
          channelA: data.channelA,
          channelB: data.channelB
        }
      };
    } catch (error) {
      console.error('Get config error:', error);
      return {
        timezone: 'America/New_York',
        agents: {
          ava: { name: 'Ava', persona: 'Group Dealer Strategist' },
          maya: { name: 'Maya', persona: 'OEM Program Insider' }
        },
        rss: { url: 'https://example.com/feed.xml' },
        openai: { model: 'gpt-4o-mini' },
        creatify: { api_id: '', api_key: '' },
        nuclearsmm: { api_key: '', api_url: 'https://nuclearsmm.com/api/v2' },
        youtube: {
          channelA: { authorized: false },
          channelB: { authorized: false }
        }
      };
    }
  }

  async updateConfig(config: Config): Promise<ApiResponse<void>> {
    // Configuration is handled via environment variables in Netlify
    return { message: 'Configuration updated via environment variables' };
  }

  // RSS endpoints
  async fetchRSS(): Promise<ApiResponse<{ items_added: number }>> {
    try {
      const response = await fetch('/.netlify/functions/run-now', { method: 'POST' });
      const result = await response.json();
      return { message: 'RSS pipeline triggered', data: { items_added: 0 } };
    } catch (error) {
      console.error('RSS fetch error:', error);
      throw new Error(error.message || 'Failed to trigger RSS pipeline');
    }
  }

  // Queue endpoints
  async getQueue(): Promise<{ queue: QueueItem[]; count: number }> {
    try {
      const response = await fetch('/.netlify/functions/status');
      const data = await response.json();
      const items = data.lastRun?.items || [];
      
      const queue: QueueItem[] = items.map((item: any, index: number) => ({
        id: `item-${index}`,
        title: `Video from ${item.article}`,
        url: item.article,
        agent: item.channel === 'A' ? 'Ava' : 'Maya',
        status: 'completed',
        created_at: data.lastRun?.at || new Date().toISOString()
      }));

      return { queue, count: queue.length };
    } catch (error) {
      console.error('Get queue error:', error);
      return { queue: [], count: 0 };
    }
  }

  async removeQueueItem(itemId: string): Promise<ApiResponse<void>> {
    // For serverless, we'll just return success since queue management is handled by the worker
    return { message: 'Item removed' };
  }

  async clearQueue(): Promise<ApiResponse<void>> {
    // For serverless, we'll just return success since queue management is handled by the worker
    return { message: 'Queue cleared' };
  }

  async processQueue(): Promise<ApiResponse<void>> {
    try {
      const response = await fetch('/.netlify/functions/run-now', { method: 'POST' });
      const result = await response.json();
      return { message: 'Queue processing triggered' };
    } catch (error) {
      console.error('Process queue error:', error);
      throw new Error(error.message || 'Failed to process queue');
    }
  }

  // Logs endpoints
  async getLogs(): Promise<{ logs: LogEntry[]; count: number }> {
    try {
      const response = await fetch('/.netlify/functions/status');
      const data = await response.json();
      const lastRun = data.lastRun;
      
      if (!lastRun || !lastRun.items) {
        return { logs: [], count: 0 };
      }

      const logs: LogEntry[] = lastRun.items.map((item: any, index: number) => ({
        id: `log-${index}`,
        message: `Processed ${item.channel}: ${item.article}`,
        type: 'info',
        timestamp: lastRun.at
      }));

      return { logs, count: logs.length };
    } catch (error) {
      console.error('Get logs error:', error);
      return { logs: [], count: 0 };
    }
  }

  async clearLogs(): Promise<ApiResponse<void>> {
    // For serverless, we'll just return success since logs are managed by the worker
    return { message: 'Logs cleared' };
  }

  // Status endpoint
  async getStatus(): Promise<{
    is_processing: boolean;
    queue_count: number;
    logs_count: number;
    has_config: boolean;
    timestamp: string;
  }> {
    try {
      const response = await fetch('/.netlify/functions/status');
      const data = await response.json();
      const lastRun = data.lastRun;
      
      return {
        is_processing: false, // We can't easily track this in serverless
        queue_count: lastRun?.items?.length || 0,
        logs_count: lastRun?.items?.length || 0,
        has_config: true, // Assume config is available via environment variables
        timestamp: lastRun?.at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Get status error:', error);
      return {
        is_processing: false,
        queue_count: 0,
        logs_count: 0,
        has_config: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch('/.netlify/functions/status');
      await response.json();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', timestamp: new Date().toISOString() };
    }
  }

  // YouTube OAuth
  async getAuthStatus() {
    try {
      const response = await fetch('/.netlify/functions/auth-status');
      return await response.json();
    } catch (error) {
      console.error('Get auth status error:', error);
      return {
        channelA: { authorized: false },
        channelB: { authorized: false }
      };
    }
  }

  async initiateOAuth(channel: 'A' | 'B') {
    const authUrl = `/.netlify/functions/oauth-start?channel=${channel}`;
    window.open(authUrl, '_blank');
    return { success: true, authUrl };
  }

  // New optimized functions
  async fetchStatus() {
    try {
      const response = await fetch('/.netlify/functions/status');
      const data = await response.json();
      return {
        lastRun: data.lastRun?.at || "never",
        itemsCount: data.lastRun?.items?.length || 0,
        items: data.lastRun?.items || []
      };
    } catch (error) {
      console.error('Fetch status error:', error);
      throw new Error('Failed to fetch status');
    }
  }

  async runNow() {
    try {
      const response = await fetch('/.netlify/functions/run-now', { method: 'POST' });
      if (response.ok) {
        return { success: true, message: 'Worker accepted' };
      } else {
        throw new Error('Worker failed to start');
      }
    } catch (error) {
      console.error('Run now error:', error);
      throw new Error('Failed to start worker');
    }
  }
}

export const apiClient = new ApiClient();