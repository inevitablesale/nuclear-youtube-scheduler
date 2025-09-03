import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rss, ExternalLink, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, Eye, EyeOff,
  ArrowRight, Calendar, Hash, Globe
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Article {
  title: string;
  link: string;
  date?: number;
  processed: boolean;
  processedAt?: string;
  usedInLastRun?: boolean;
  lastRunChannel?: string;
  videoUrl?: string;
  commentUrl?: string;
  orders?: any;
}

interface RSSData {
  success: boolean;
  totalArticles?: number;
  channelA?: {
    name: string;
    articles: Article[];
    count: number;
  };
  channelB?: {
    name: string;
    articles: Article[];
    count: number;
  };
  unassigned?: {
    articles: Article[];
    count: number;
  };
  lastUpdated?: string;
}

interface RSSArticlesProps {
  isProcessing?: boolean;
}

export function RSSArticles({ isProcessing = false }: RSSArticlesProps) {
  const [rssData, setRssData] = useState<RSSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProcessed, setShowProcessed] = useState(false);

  const loadRSSData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.fetchRSSArticles("all");
      setRssData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load RSS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRSSData();
  }, []);

  // Auto-refresh when processing completes
  useEffect(() => {
    if (!isProcessing && rssData) {
      // Refresh data after processing completes
      const timer = setTimeout(() => {
        loadRSSData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString();
  };

  const formatProcessedDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const getArticleStatus = (article: Article) => {
    if (article.usedInLastRun) {
      return { 
        badge: <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Used in Last Run</Badge>,
        icon: <CheckCircle2 className="w-4 h-4 text-green-400" />
      };
    } else if (article.processed) {
      return { 
        badge: <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Processed</Badge>,
        icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />
      };
    } else {
      return { 
        badge: <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">Pending</Badge>,
        icon: <Clock className="w-4 h-4 text-orange-400" />
      };
    }
  };

  const renderArticleList = (articles: Article[], title: string, color: string) => {
    const filteredArticles = showProcessed ? articles : articles.filter(a => !a.processed);
    
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>
              {title}
            </span>
            <Badge className="bg-white/20 text-white">
              {filteredArticles.length} articles
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Rss className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No articles available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article, index) => {
                const status = getArticleStatus(article);
                return (
                  <div key={article.link} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        {status.icon}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(article.date)}
                            </span>
                            <span className="flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              {new URL(article.link).hostname}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {status.badge}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(article.link, '_blank')}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {article.processed && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-sm text-slate-400">
                          <span className="flex items-center mb-1">
                            <CheckCircle2 className="w-3 h-3 mr-2 text-green-400" />
                            Processed: {formatProcessedDate(article.processedAt)}
                          </span>
                          {article.usedInLastRun && (
                            <div className="space-y-1">
                              <span className="flex items-center">
                                <ArrowRight className="w-3 h-3 mr-2 text-blue-400" />
                                Channel: {article.lastRunChannel}
                              </span>
                              {article.videoUrl && (
                                <span className="flex items-center">
                                  <Hash className="w-3 h-3 mr-2 text-purple-400" />
                                  <a 
                                    href={article.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-300 hover:text-purple-200 underline"
                                  >
                                    View Video
                                  </a>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-400">Loading RSS feed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadRSSData} className="bg-red-500/20 text-red-300 border-red-500/30">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rssData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Rss className="w-6 h-6 mr-3 text-blue-400" />
              RSS Feed Articles
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowProcessed(!showProcessed)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {showProcessed ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showProcessed ? 'Hide Processed' : 'Show Processed'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadRSSData}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {rssData.totalArticles || 0} total articles
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-pink-400">{rssData.channelA?.count || 0}</div>
              <div className="text-sm text-slate-400">Channel A (Ava)</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{rssData.channelB?.count || 0}</div>
              <div className="text-sm text-slate-400">Channel B (Maya)</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">{rssData.unassigned?.count || 0}</div>
              <div className="text-sm text-slate-400">Unassigned</div>
            </div>
          </div>
          {rssData.lastUpdated && (
            <p className="text-xs text-slate-500 mt-4 text-center">
              Last updated: {new Date(rssData.lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Article Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rssData.channelA && renderArticleList(rssData.channelA.articles, rssData.channelA.name, "bg-pink-400")}
        {rssData.channelB && renderArticleList(rssData.channelB.articles, rssData.channelB.name, "bg-blue-400")}
      </div>
      
      {rssData.unassigned && rssData.unassigned.count > 0 && (
        <div className="grid grid-cols-1">
          {renderArticleList(rssData.unassigned.articles, "Unassigned Articles", "bg-orange-400")}
        </div>
      )}
    </div>
  );
}