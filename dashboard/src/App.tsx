import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Play, Pause, Database, Rss, Youtube, 
  Bot, Gauge, KeyRound, Eye, EyeOff, 
  Trash2, FileText, CheckCircle2, AlertCircle, 
  Download, Globe2, BarChart3, TrendingUp, Users, Eye as EyeIcon,
  Zap, Target, Activity, Clock, ArrowRight, ArrowDown,
  Video, Heart, MessageCircle, Share2, UserPlus, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { apiClient, Config, QueueItem, LogEntry } from "@/lib/api";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { RSSArticles } from "@/components/RSSArticles";
import { ProcessingStatus } from "@/components/ProcessingStatus";

// ----------------------------------------------
// Helpers
// ----------------------------------------------
const LS_KEY = "nuclear_sched_ui_state_v1";

function useLocalStorageState(key: string, initialValue: any) {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : (typeof initialValue === 'function' ? initialValue() : initialValue);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input 
        type={show ? "text" : "password"} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setShow(!show)}
        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export default function App() {
  const [apiConnected, setApiConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [youtubeAuth, setYoutubeAuth] = useState<{A: boolean, B: boolean}>({A: false, B: false});
  const [channelAnalytics, setChannelAnalytics] = useState<{
    A: any,
    B: any
  }>({
    A: null,
    B: null
  });

  const [state, setState] = useLocalStorageState(LS_KEY, () => ({
    timezone: "America/New_York",
    agents: [
      { 
        name: "Ava", 
        personality: "Tech-savvy millennial", 
        target: "tech enthusiasts",
        systemPrompt: "You are Ava, a Group Dealer Strategist with deep expertise in automotive SEO and digital marketing. You create sharp, analytical content that helps car dealers understand big-picture SEO strategies. Your content is data-driven, professional, and focuses on actionable insights for automotive businesses."
      },
      { 
        name: "Maya", 
        personality: "Creative professional", 
        target: "design community",
        systemPrompt: "You are Maya, an OEM Program Insider with extensive experience in automotive marketing and program management. You create professional, polished content that helps automotive professionals understand structured approaches to digital marketing. Your content is well-organized, comprehensive, and focuses on practical implementation strategies."
      }
    ],
    rss: {
      url: "",
      enabled: true,
      updateInterval: 30
    },
    openai: {
      model: "gpt-4o-mini"
    },
    creatify: {
      aspect: "9:16",
      length: 30,
      noCta: false
    },
    nuclear: {
      enabled: true,
      apiKey: "",
      apiUrl: "https://nuclear-api.com",
      dailyBudget: 50,
      boostTypes: ["views", "likes", "comments", "subscribers"]
    },
    youtube: {
      dailyPerChannel: 2,
      channels: {
        A: { name: "Ava's Tech Channel", handle: "@avatech" },
        B: { name: "Maya's Creative Space", handle: "@mayacreative" }
      }
    }
  }));

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
    loadData();
    loadYoutubeAuth();
    // Auto-load analytics for both channels
    loadChannelAnalytics('A');
    loadChannelAnalytics('B');
  }, []);

  const loadYoutubeAuth = async () => {
    try {
      const authStatus = await apiClient.getAuthStatus();
      setYoutubeAuth(authStatus);
    } catch (error) {
      console.error('Failed to load YouTube auth status:', error);
    }
  };

  const initiateYouTubeOAuth = async (channel: 'A' | 'B') => {
    try {
      addLog(`Initiating YouTube OAuth for Channel ${channel}...`, 'info');
      await apiClient.initiateOAuth(channel);
      addLog(`OAuth window opened for Channel ${channel}. Complete authorization and return here.`, 'info');
    } catch (error) {
      addLog(`Failed to initiate OAuth for Channel ${channel}: ${error}`, 'error');
    }
  };

  const loadChannelAnalytics = async (channel: 'A' | 'B') => {
    try {
      addLog(`Loading analytics for Channel ${channel}...`, 'info');
      const analytics = await apiClient.fetchChannelInfo(channel);
      setChannelAnalytics(prev => ({
        ...prev,
        [channel]: analytics
      }));
      addLog(`Analytics loaded for Channel ${channel}`, 'success');
    } catch (error) {
      addLog(`Failed to load analytics for Channel ${channel}: ${error}`, 'error');
    }
  };

  const checkApiConnection = async () => {
    try {
      await apiClient.healthCheck();
      setApiConnected(true);
    } catch (error) {
      setApiConnected(false);
      console.error('API connection failed:', error);
    }
  };

  const loadData = async () => {
    try {
      const [queueData, logsData] = await Promise.all([
        apiClient.getQueue(),
        apiClient.getLogs()
      ]);
      setQueue(queueData.queue);
      setLogs(logsData.logs);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const updateState = (path: string, value: any) => {
    setState((prev: any) => {
      const keys = path.split('.');
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const log = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [...prev.slice(-99), log]);
  };

  const fetchRSS = async () => {
    try {
      addLog("Fetching RSS status...", 'info');
      const status = await apiClient.fetchStatus();
      addLog(`Last run: ${status.lastRun} • Items: ${status.itemsCount}`, 'info');
      await loadData(); // Refresh queue data
    } catch (error) {
      addLog(`Status fetch failed: ${error}`, 'error');
    }
  };

  const runQueue = async () => {
    try {
      setIsRunning(true);
      addLog("Manual run triggered", 'info');
      const result = await apiClient.runNow();
      addLog(result.message, 'success');
      await loadData(); // Refresh data
    } catch (error) {
      addLog(`Run failed: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const exportConfig = () => {
    const config = {
      timezone: state.timezone,
      agents: state.agents,
      rss: state.rss,
      openai: { model: state.openai.model },
      creatify: {
        base_url: "https://api.creatify.ai",
        api_id_env: "CREATIFY_API_ID",
        api_key_env: "CREATIFY_API_KEY",
        defaults: {
          target_platform: "youtube_shorts",
          language: "en",
          aspect_ratio: state.creatify.aspect,
          video_length: state.creatify.length,
          script_style: "ThreeReasonsWriter",
          visual_style: "QuickTransitionTemplate",
          no_cta: state.creatify.noCta,
        }
      },
      nuclearsmm: state.nuclear,
      youtube: {
        daily_per_channel: state.youtube.dailyPerChannel,
        short_max_seconds: 60,
        title_max_len: 95,
        channels: state.youtube.channels
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
    addLog("Configuration exported", 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Nuclear YouTube Scheduler
              </h1>
              <p className="text-slate-300">
                Automated RSS-to-YouTube video generation with SMM boosting
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-slate-300">
                  {apiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button
                onClick={runQueue}
                disabled={isRunning}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Workflow Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-6 h-6 mr-3 text-purple-400" />
                Automated Workflow Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Step 1: RSS Processing */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30 mb-4">
                    <Rss className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-300">RSS Processing</h3>
                  </div>
                  <p className="text-sm text-slate-400">Fetches articles from RSS feeds</p>
                  <div className="mt-2">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      {state.rss?.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>

                {/* Step 2: Video Generation */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30 mb-4">
                    <Video className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-300">Video Generation</h3>
                  </div>
                  <p className="text-sm text-slate-400">Creates YouTube Shorts using AI</p>
                  <div className="mt-2">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      Creatify Disabled
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>

                {/* Step 3: YouTube Publishing */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30 mb-4">
                    <Youtube className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-purple-300">YouTube Publishing</h3>
                  </div>
                  <p className="text-sm text-slate-400">Publishes to persona channels</p>
                  <div className="mt-2 space-y-1">
                    <Badge className={`${youtubeAuth.A ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                      Channel A {youtubeAuth.A ? '✓' : '✗'}
                    </Badge>
                    <Badge className={`${youtubeAuth.B ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                      Channel B {youtubeAuth.B ? '✓' : '✗'}
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-slate-400" />
                </div>

                {/* Step 4: SMM Boosting */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30 mb-4">
                    <Zap className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <h3 className="font-semibold text-orange-300">SMM Nuclear Boost</h3>
                  </div>
                  <p className="text-sm text-slate-400">Boosts engagement & views</p>
                  <div className="mt-2">
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {state.nuclear?.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-white/10 border-white/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="rss" className="data-[state=active]:bg-white/20">
                <Rss className="w-4 h-4 mr-2" />
                RSS Feed
              </TabsTrigger>
              <TabsTrigger value="personas" className="data-[state=active]:bg-white/20">
                <Users className="w-4 h-4 mr-2" />
                Personas
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="queue" className="data-[state=active]:bg-white/20">
                <Database className="w-4 h-4 mr-2" />
                Queue
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Channel Performance */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2 text-purple-400" />
                      Channel Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Channel A */}
                      <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 rounded-lg border border-pink-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-pink-400 rounded-full mr-3"></div>
                            <h3 className="font-semibold">Channel A (Ava)</h3>
                          </div>
                          <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                            {youtubeAuth.A ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </div>
                        {channelAnalytics.A ? (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-pink-400">
                                {channelAnalytics.A.subscribers ? parseInt(channelAnalytics.A.subscribers).toLocaleString() : 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Subscribers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-pink-400">
                                {channelAnalytics.A.totalViews ? parseInt(channelAnalytics.A.totalViews).toLocaleString() : 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Total Views</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-pink-400">
                                {channelAnalytics.A.videoCount || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Videos</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-slate-400">Loading analytics...</p>
                          </div>
                        )}
                      </div>

                      {/* Channel B */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                            <h3 className="font-semibold">Channel B (Maya)</h3>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {youtubeAuth.B ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </div>
                        {channelAnalytics.B ? (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-400">
                                {channelAnalytics.B.subscribers ? parseInt(channelAnalytics.B.subscribers).toLocaleString() : 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Subscribers</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-400">
                                {channelAnalytics.B.totalViews ? parseInt(channelAnalytics.B.totalViews).toLocaleString() : 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Total Views</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-400">
                                {channelAnalytics.B.videoCount || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-400">Videos</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-slate-400">Loading analytics...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Gauge className="w-5 h-5 mr-2 text-green-400" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center">
                          <Rss className="w-5 h-5 text-blue-400 mr-3" />
                          <span>RSS Feed</span>
                        </div>
                        <Badge className={state.rss?.enabled ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                          {state.rss?.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center">
                          <Video className="w-5 h-5 text-orange-400 mr-3" />
                          <span>Video Generation</span>
                        </div>
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          Creatify Disabled
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center">
                          <Youtube className="w-5 h-5 text-red-400 mr-3" />
                          <span>YouTube Channels</span>
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {youtubeAuth.A && youtubeAuth.B ? '2 Connected' : `${(youtubeAuth.A ? 1 : 0) + (youtubeAuth.B ? 1 : 0)} Connected`}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center">
                          <Zap className="w-5 h-5 text-orange-400 mr-3" />
                          <span>SMM Nuclear</span>
                        </div>
                        <Badge className={state.nuclear?.enabled ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                          {state.nuclear?.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* RSS Feed Tab */}
            <TabsContent value="rss" className="mt-6">
              <RSSArticles isProcessing={isRunning} />
            </TabsContent>

            {/* Personas Tab */}
            <TabsContent value="personas" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Persona A (Ava) */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="w-5 h-5 mr-2 text-pink-400" />
                        Persona A (Ava)
                      </span>
                      <Badge className={youtubeAuth.A ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'}>
                        {youtubeAuth.A ? 'YouTube Connected' : 'YouTube Not Connected'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Persona Name</Label>
                        <Input
                          value={state.agents?.[0]?.name || "Ava"}
                          onChange={e => updateState('agents.0.name', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Personality</Label>
                        <Input
                          value={state.agents?.[0]?.personality || "Tech-savvy millennial"}
                          onChange={e => updateState('agents.0.personality', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Target Audience</Label>
                        <Input
                          value={state.agents?.[0]?.target || "tech enthusiasts"}
                          onChange={e => updateState('agents.0.target', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">System Prompt</Label>
                        <Textarea
                          value={state.agents?.[0]?.systemPrompt || "You are Ava, a Group Dealer Strategist with deep expertise in automotive SEO and digital marketing. You create sharp, analytical content that helps car dealers understand big-picture SEO strategies. Your content is data-driven, professional, and focuses on actionable insights for automotive businesses."}
                          onChange={e => updateState('agents.0.systemPrompt', e.target.value)}
                          className="bg-white/10 border-white/20 text-white min-h-[120px]"
                          placeholder="Enter the system prompt for this persona..."
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">YouTube Channel Name</Label>
                        <Input
                          value={state.youtube?.channels?.A?.name || ""}
                          onChange={e => updateState('youtube.channels.A.name', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter YouTube channel name"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">YouTube Handle</Label>
                        <Input
                          value={state.youtube?.channels?.A?.handle || ""}
                          onChange={e => updateState('youtube.channels.A.handle', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="@channelhandle"
                        />
                      </div>
                      <Button
                        onClick={() => initiateYouTubeOAuth('A')}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
                      >
                        {youtubeAuth.A ? 'Reconnect YouTube' : 'Connect YouTube Channel'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Persona B (Maya) */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-400" />
                        Persona B (Maya)
                      </span>
                      <Badge className={youtubeAuth.B ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'}>
                        {youtubeAuth.B ? 'YouTube Connected' : 'YouTube Not Connected'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Persona Name</Label>
                        <Input
                          value={state.agents?.[1]?.name || "Maya"}
                          onChange={e => updateState('agents.1.name', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Personality</Label>
                        <Input
                          value={state.agents?.[1]?.personality || "Creative professional"}
                          onChange={e => updateState('agents.1.personality', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Target Audience</Label>
                        <Input
                          value={state.agents?.[1]?.target || "design community"}
                          onChange={e => updateState('agents.1.target', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">System Prompt</Label>
                        <Textarea
                          value={state.agents?.[1]?.systemPrompt || "You are Maya, an OEM Program Insider with extensive experience in automotive marketing and program management. You create professional, polished content that helps automotive professionals understand structured approaches to digital marketing. Your content is well-organized, comprehensive, and focuses on practical implementation strategies."}
                          onChange={e => updateState('agents.1.systemPrompt', e.target.value)}
                          className="bg-white/10 border-white/20 text-white min-h-[120px]"
                          placeholder="Enter the system prompt for this persona..."
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">YouTube Channel Name</Label>
                        <Input
                          value={state.youtube?.channels?.B?.name || ""}
                          onChange={e => updateState('youtube.channels.B.name', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter YouTube channel name"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">YouTube Handle</Label>
                        <Input
                          value={state.youtube?.channels?.B?.handle || ""}
                          onChange={e => updateState('youtube.channels.B.handle', e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="@channelhandle"
                        />
                      </div>
                      <Button
                        onClick={() => initiateYouTubeOAuth('B')}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                      >
                        {youtubeAuth.B ? 'Reconnect YouTube' : 'Connect YouTube Channel'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Advanced Analytics */}
                <div className="grid grid-cols-1 gap-6">
                  <AdvancedAnalytics channel="A" channelName="Channel A (Ava)" />
                  <AdvancedAnalytics channel="B" channelName="Channel B (Maya)" />
                </div>
              </div>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="mt-6">
              <div className="space-y-6">
                {/* Processing Status */}
                <ProcessingStatus 
                  isRunning={isRunning}
                  onRun={runQueue}
                  onStop={() => setIsRunning(false)}
                />

                {/* Processing Logs */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Processing Logs
                      </span>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {logs.length} entries
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No logs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {logs.slice(-20).reverse().map((log) => (
                          <div key={log.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              log.type === 'success' ? 'bg-green-400' :
                              log.type === 'error' ? 'bg-red-400' :
                              'bg-blue-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm">{log.message}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Queue Items */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Database className="w-5 h-5 mr-2" />
                        Processing Queue
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {queue.length} items
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await apiClient.clearQueue();
                              await loadData();
                              addLog("Queue cleared", "info");
                            } catch (error) {
                              addLog(`Failed to clear queue: ${error}`, "error");
                            }
                          }}
                          className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                        >
                          Clear All
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queue.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No items in queue</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {queue.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center space-x-4">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <div>
                                <p className="text-white font-medium">{item.title}</p>
                                <p className="text-sm text-slate-400">Agent: {item.agent}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                                {item.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await apiClient.removeFromQueue(item.id);
                                    await loadData();
                                    addLog(`Removed ${item.title} from queue`, "info");
                                  } catch (error) {
                                    addLog(`Failed to remove item: ${error}`, "error");
                                  }
                                }}
                                className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* RSS Settings */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Rss className="w-5 h-5 mr-2 text-blue-400" />
                      RSS Feed Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">RSS URL</Label>
                                              <Input
                          value={state.rss?.url || ""}
                          onChange={e => updateState('rss.url', e.target.value)}
                          placeholder="https://example.com/feed.xml"
                          className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Enable RSS Processing</Label>
                      <Switch
                        checked={state.rss?.enabled || false}
                        onCheckedChange={checked => updateState('rss.enabled', checked)}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Update Interval (minutes)</Label>
                      <Slider
                        value={[state.rss?.updateInterval || 30]}
                        onValueChange={value => updateState('rss.updateInterval', value[0])}
                        max={120}
                        min={5}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-sm text-slate-400 mt-1">{state.rss?.updateInterval || 30} minutes</p>
                    </div>
                  </CardContent>
                </Card>

                {/* SMM Nuclear Settings */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-orange-400" />
                      SMM Nuclear Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Enable SMM Boosting</Label>
                      <Switch
                        checked={state.nuclear?.enabled || false}
                        onCheckedChange={checked => updateState('nuclear.enabled', checked)}
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">API Key</Label>
                      <MaskedInput
                        value={state.nuclear?.apiKey || ""}
                        onChange={value => updateState('nuclear.apiKey', value)}
                        placeholder="Enter your SMM Nuclear API key"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Daily Budget ($)</Label>
                      <Input
                        type="number"
                        value={state.nuclear?.dailyBudget || 50}
                        onChange={e => updateState('nuclear.dailyBudget', parseInt(e.target.value))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Boost Types</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['views', 'likes', 'comments', 'subscribers'].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={state.nuclear?.boostTypes?.includes(type) || false}
                              onChange={e => {
                                const currentTypes = state.nuclear?.boostTypes || [];
                                const newTypes = e.target.checked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter(t => t !== type);
                                updateState('nuclear.boostTypes', newTypes);
                              }}
                              className="rounded"
                            />
                            <Label className="text-sm text-slate-300 capitalize">{type}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Generation Settings */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Video className="w-5 h-5 mr-2 text-green-400" />
                        Video Generation Settings
                      </span>
                      <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                        Creatify Disabled
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-sm text-orange-300">
                        <strong>Creatify API not configured:</strong> Add CREATIFY_API_ID and CREATIFY_API_KEY environment variables to enable video generation.
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-300">Videos per Channel per Day</Label>
                                              <Input
                          type="number"
                          value={state.youtube?.dailyPerChannel || 2}
                          onChange={e => updateState('youtube.dailyPerChannel', parseInt(e.target.value))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                    </div>
                    <div>
                      <Label className="text-slate-300">Aspect Ratio</Label>
                      <Select value={state.creatify?.aspect || "9:16"} onValueChange={value => updateState('creatify.aspect', value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                          <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Video Length (seconds)</Label>
                      <Slider
                        value={[state.creatify?.length || 30]}
                        onValueChange={value => updateState('creatify.length', value[0])}
                        max={60}
                        min={15}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-sm text-slate-400 mt-1">{state.creatify?.length || 30} seconds</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Disable Call-to-Action</Label>
                      <Switch
                        checked={state.creatify?.noCta || false}
                        onCheckedChange={checked => updateState('creatify.noCta', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Export/Import */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Download className="w-5 h-5 mr-2 text-purple-400" />
                      Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      onClick={exportConfig}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Configuration
                    </Button>
                    <p className="text-sm text-slate-400">
                      Export your current settings to a JSON file for backup or sharing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}