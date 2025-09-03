import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter, Cell,
  BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, BarChart3, Search, Video, 
  Eye, Heart, MessageCircle, Users, Clock
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
    timeOffset: (row[0] || 0) * 100, // Convert to percentage
    audienceWatchRatio: row[2] || 0,
    relativePerformance: row[3] || 0
  })) : [];

  // Process traffic data for radar chart
  const processedTrafficData = Array.isArray(trafficData) ? trafficData.map((row: any) => ({
    source: row[0] || 'Unknown',
    views: row[1] || 0,
    likes: row[2] || 0,
    comments: row[3] || 0,
    subsGained: row[4] || 0,
    engagementRate: row[1] > 0 ? ((row[2] + row[3] + row[4]) / row[1] * 100).toFixed(1) : '0.0'
  })) : [];

  // Process keywords data for scatter chart
  const processedKeywordsData = Array.isArray(keywordsData) ? keywordsData.map((row: any) => ({
    term: row[0] || 'Unknown',
    views: row[1] || 0,
    size: Math.min(Math.max((row[1] || 0) / 100, 5), 50) // Scale for bubble size
  })) : [];

  // Process shorts data for leaderboard
  const processedShortsData = Array.isArray(shortsData?.shorts) ? shortsData.shorts.map((short: any) => ({
    ...short,
    title: short.title?.replace('#shorts', '').trim() || 'Untitled',
    views: short.views || 0,
    velocityScore: short.velocityScore || 0,
    estimatedHalfLife: short.estimatedHalfLife || 0,
    likes: short.likes || 0
  })) : [];

  return (
    <AnalyticsErrorBoundary>
      <div className="space-y-6">
      {/* Retention Curves */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Retention Curves
            </span>
            <Button
              onClick={loadRetention}
              disabled={loading.retention}
              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              size="sm"
            >
              {loading.retention ? 'Loading...' : 'Load Retention'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedRetentionData.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedRetentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timeOffset" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    domain={[0, 1]}
                    tickFormatter={(value) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [`${Math.round((value || 0) * 100)}%`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="audienceWatchRatio" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    name="Audience Watch Ratio"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="relativePerformance" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Relative Performance"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">Click "Load Retention" to fetch retention curves</p>
          )}
        </CardContent>
      </Card>

      {/* Traffic Sources Radar */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Traffic Sources Efficiency
            </span>
            <Button
              onClick={loadTraffic}
              disabled={loading.traffic}
              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              size="sm"
            >
              {loading.traffic ? 'Loading...' : 'Load Traffic'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedTrafficData.length > 0 ? (
            <div className="space-y-4">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={processedTrafficData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="source" stroke="#9CA3AF" />
                    <PolarRadiusAxis stroke="#9CA3AF" />
                    <Radar 
                      dataKey="views" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Traffic Sources Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-2">Source</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Engagement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedTrafficData.map((source, index) => (
                      <tr key={index} className="border-b border-slate-700">
                        <td className="py-2">{source.source}</td>
                        <td className="text-right py-2">{source.views.toLocaleString()}</td>
                        <td className="text-right py-2">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                            {source.engagementRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">Click "Load Traffic" to fetch traffic sources</p>
          )}
        </CardContent>
      </Card>

      {/* Search Keywords */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Search Keywords
            </span>
            <Button
              onClick={loadKeywords}
              disabled={loading.keywords}
              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              size="sm"
            >
              {loading.keywords ? 'Loading...' : 'Load Keywords'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedKeywordsData.length > 0 ? (
            <div className="space-y-4">
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart data={processedKeywordsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="views" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => `${((value || 0) / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      dataKey="term" 
                      type="category" 
                      stroke="#9CA3AF"
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter dataKey="size" fill="#ef4444">
                      {processedKeywordsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#ef4444" />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              {/* Keywords List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {processedKeywordsData.slice(0, 10).map((keyword, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm">{keyword.term}</span>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                      {keyword.views.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">Click "Load Keywords" to fetch search terms</p>
          )}
        </CardContent>
      </Card>

      {/* Shorts Leaderboard */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Shorts Performance
            </span>
            <Button
              onClick={loadShorts}
              disabled={loading.shorts}
              className="bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30"
              size="sm"
            >
              {loading.shorts ? 'Loading...' : 'Load Shorts'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedShortsData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-sm text-slate-400">Total Shorts</p>
                  <p className="text-lg font-semibold">{processedShortsData.length}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-sm text-slate-400">Avg Views</p>
                  <p className="text-lg font-semibold">
                    {Math.round(processedShortsData.reduce((sum, s) => sum + s.views, 0) / processedShortsData.length).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-sm text-slate-400">Avg Velocity</p>
                  <p className="text-lg font-semibold">
                    {Math.round(processedShortsData.reduce((sum, s) => sum + s.velocityScore, 0) / processedShortsData.length).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-sm text-slate-400">Avg Half-life</p>
                  <p className="text-lg font-semibold">
                    {Math.round(processedShortsData.reduce((sum, s) => sum + s.estimatedHalfLife, 0) / processedShortsData.length)}h
                  </p>
                </div>
              </div>
              
              {/* Shorts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-2">Video</th>
                      <th className="text-right py-2">Views</th>
                      <th className="text-right py-2">Velocity</th>
                      <th className="text-right py-2">Half-life</th>
                      <th className="text-right py-2">Likes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedShortsData.slice(0, 10).map((short, index) => (
                      <tr key={index} className="border-b border-slate-700">
                        <td className="py-2 max-w-xs truncate" title={short.title}>
                          {short.title}
                        </td>
                        <td className="text-right py-2">{short.views.toLocaleString()}</td>
                        <td className="text-right py-2">
                          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                            {short.velocityScore.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="text-right py-2">{short.estimatedHalfLife}h</td>
                        <td className="text-right py-2">{short.likes.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">Click "Load Shorts" to fetch Shorts performance</p>
          )}
        </CardContent>
      </Card>
      </div>
    </AnalyticsErrorBoundary>
  );
}