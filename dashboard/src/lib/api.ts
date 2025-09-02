const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
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
    return this.request<Config>('/config');
  }

  async updateConfig(config: Config): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // RSS endpoints
  async fetchRSS(): Promise<ApiResponse<{ items_added: number }>> {
    return this.request<ApiResponse<{ items_added: number }>>('/rss/fetch', {
      method: 'POST',
    });
  }

  // Queue endpoints
  async getQueue(): Promise<{ queue: QueueItem[]; count: number }> {
    return this.request<{ queue: QueueItem[]; count: number }>('/queue');
  }

  async removeQueueItem(itemId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/queue/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearQueue(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/queue', {
      method: 'DELETE',
    });
  }

  async processQueue(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/queue/process', {
      method: 'POST',
    });
  }

  // Logs endpoints
  async getLogs(): Promise<{ logs: LogEntry[]; count: number }> {
    return this.request<{ logs: LogEntry[]; count: number }>('/logs');
  }

  async clearLogs(): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/logs', {
      method: 'DELETE',
    });
  }

  // Status endpoint
  async getStatus(): Promise<{
    is_processing: boolean;
    queue_count: number;
    logs_count: number;
    has_config: boolean;
    timestamp: string;
  }> {
    return this.request('/status');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();