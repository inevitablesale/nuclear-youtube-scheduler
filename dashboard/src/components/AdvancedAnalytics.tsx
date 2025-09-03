import React, { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, Cell,
  BarChart, Bar, PieChart, Pie, Cell as PieCell
} from 'recharts';
import { 
  TrendingUp, BarChart3, Search, Video, 
  Eye, Heart, MessageCircle, Users, Clock,
  Rss, Youtube, Bot, Zap, Target, Activity,
  ArrowUp, ArrowDown, Minus, Play, Pause
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AdvancedAnalyticsProps {
  channel: "A" | "B";
  channelName: string;
}

// Error boundary component
class AnalyticsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Analytics component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <p className="text-red-400 text-center">
              Something went wrong loading analytics. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function AdvancedAnalytics({ channel, channelName }: AdvancedAnalyticsProps) {
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [keywordsData, setKeywordsData] = useState<any[]>([]);
  const [shortsData, setShortsData] = useState<any[]>([]);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  // Auto-load data on component mount
  useEffect(() => {
    loadRetention();
    loadTraffic();
    loadKeywords();
    loadShorts();
  }, [channel]);

  const loadData = async (type: string, fetchFn: () => Promise<any>, setFn: (data: any) => void) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const data = await fetchFn();
      setFn(data);
    } catch (error) {
      console.error(`Failed to load ${type}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const loadRetention = () => loadData('retention', () => apiClient.fetchRetention(channel), setRetentionData);
  const loadTraffic = () => loadData('traffic', () => apiClient.fetchTraffic(channel), setTrafficData);
  const loadKeywords = () => loadData('keywords', () => apiClient.fetchKeywords(channel), setKeywordsData);
  const loadShorts = () => loadData('shorts', () => apiClient.fetchShorts(channel), setShortsData);

  // Process retention data for chart
  const processedRetentionData = Array.isArray(retentionData) ? retentionData.map((row: any) => ({
    videoId: row[0] || 'Unknown',
    views: row[3] || 0,
    watchTime: row[1] || 0,
    avgDuration: row[2] || 0,
    avgPercentage: row[4] || 0
  })).slice(0, 10) : [];

  // Process traffic data for pie chart
  const processedTrafficData = Array.isArray(trafficData) ? trafficData.map((row: any) => ({
    source: row[0] || 'Unknown',
    views: row[1] || 0,
    watchTime: row[2] || 0
  })) : [];

  // Process keywords data for bar chart
  const processedKeywordsData = Array.isArray(keywordsData) ? keywordsData.map((row: any) => ({
    term: row[0] || 'Unknown',
    views: row[1] || 0
  })).slice(0, 10) : [];

  // Process shorts data for leaderboard
  const processedShortsData = Array.isArray(shortsData) ? shortsData.map((short: any) => ({
    ...short,
    title: (short && typeof short === 'object' && short.title) ? short.title.replace('#shorts', '').trim() : 'Untitled',
    views: (short && typeof short === 'object' && short.views) ? short.views : 0,
    likes: (short && typeof short === 'object' && short.likes) ? short.likes : 0,
    comments: (short && typeof short === 'object' && short.comments) ? short.comments : 0
  })).slice(0, 5) : [];

  const COLORS = {
    A: ['#ec4899', '#f472b6', '#fbbf24', '#10b981', '#3b82f6'],
    B: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']
  };

  const channelColors = COLORS[channel];

  return (
    <AnalyticsErrorBoundary>
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className={`w-5 h-5 mr-2 ${channel === 'A' ? 'text-pink-400' : 'text-blue-400'}`} />
              {channelName} Analytics
            </span>
            <div className="flex items-center gap-2">
              <Badge className={`${channel === 'A' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                {Object.values(loading).some(l => l) ? 'Loading...' : 'Live Data'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Videos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Video className="w-5 h-5 mr-2" />
                Top Performing Videos
              </h3>
              {loading.retention ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-slate-400">Loading video performance...</p>
                </div>
              ) : processedRetentionData.length > 0 ? (
                <div className="space-y-3">
                  {processedRetentionData.slice(0, 5).map((video, index) => (
                    <div key={video.videoId} className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-orange-500 text-orange-900' :
                            'bg-white/20 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium truncate">
                            {video.videoId}
                          </span>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {video.views.toLocaleString()} views
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <div>Watch: {video.watchTime.toLocaleString()}m</div>
                        <div>Avg: {video.avgDuration.toFixed(1)}s</div>
                        <div>Retention: {video.avgPercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No video data available</p>
                </div>
              )}
            </div>

            {/* Traffic Sources */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Traffic Sources
              </h3>
              {loading.traffic ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-slate-400">Loading traffic data...</p>
                </div>
              ) : processedTrafficData.length > 0 ? (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedTrafficData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="views"
                      >
                        {processedTrafficData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={channelColors[index % channelColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value.toLocaleString(), 'Views']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No traffic data available</p>
                </div>
              )}
            </div>

            {/* Search Keywords */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Top Search Keywords
              </h3>
              {loading.keywords ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-slate-400">Loading keywords...</p>
                </div>
              ) : processedKeywordsData.length > 0 ? (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedKeywordsData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis 
                        type="category" 
                        dataKey="term" 
                        stroke="#9CA3AF"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [value.toLocaleString(), 'Views']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                      />
                      <Bar 
                        dataKey="views" 
                        fill={channel === 'A' ? '#ec4899' : '#3b82f6'}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No keyword data available</p>
                </div>
              )}
            </div>

            {/* Recent Shorts Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Recent Shorts Performance
              </h3>
              {loading.shorts ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-slate-400">Loading Shorts data...</p>
                </div>
              ) : processedShortsData.length > 0 ? (
                <div className="space-y-3">
                  {processedShortsData.map((short, index) => (
                    <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate flex-1 mr-2">
                          {short.title}
                        </span>
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          {short.views.toLocaleString()} views
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                        <div className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {short.likes.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {short.comments.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {short.views > 0 ? ((short.likes + short.comments) / short.views * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No Shorts data available</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AnalyticsErrorBoundary>
  );
}