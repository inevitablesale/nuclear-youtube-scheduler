import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, Play, Pause, Database, Rss, Youtube, 
  Bot, Gauge, KeyRound, Eye, EyeOff, 
  Trash2, FileText, CheckCircle2, AlertCircle, 
  Download, Globe2 
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
        className="pr-10" 
      />
      <button 
        type="button" 
        onClick={() => setShow(s => !s)} 
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
      >
        {show ? <EyeOff size={18}/> : <Eye size={18}/>}
      </button>
    </div>
  )
}

const defaultState = () => ({
  timezone: "America/New_York",
  openai: { apiKey: "", model: "gpt-4o-mini" },
  creatify: { apiId: "", apiKey: "", aspect: "9x16", length: 15, captions: true, noCta: false },
  nuclear: { 
    apiKey: "7034688f756e58db675073e27c52ec79", 
    baseUrl: "https://nuclearsmm.com/api/v2", 
    services: { 
      views: { id: 200, qty: 500 }, 
      likes: { id: 1217, qty: 15 }, 
      pin_likes: { id: 115, qty: 15 }, 
      comments: { id: 1117, qty: 2, target: "comment", send_text: true } 
    } 
  },
  youtube: {
    dailyPerChannel: 2,
    channels: {
      Channel_A: { titlePrefix: "Automotive SEO • ", categoryId: "27", privacy: "public" },
      Channel_B: { titlePrefix: "Auto SEO Tip • ", categoryId: "27", privacy: "public" },
    }
  },
  rss: { 
    url: "https://rss-bridge.org/bridge01/?action=display&bridge=FeedMergeBridge&feed_name=SEO+News&feed_1=https%3A%2F%2Fmoz.com%2Fposts%2Frss%2Fblog&feed_2=https%3A%2F%2Fsearchengineland.com%2Ffeed&feed_3=https%3A%2F%2Fblog.google%2Frss%2F&feed_4=https%3A%2F%2Fwww.aleydasolis.com%2Fen%2Ffeed%2F&feed_5=http%3A%2F%2Ffeeds.seroundtable.com%2FSearchEngineRoundtable1&feed_6=https%3A%2F%2Fwww.semrush.com%2Fblog%2Ffeed%2F&feed_7=https%3A%2F%2Fyoast.com%2Ffeed%2F&feed_8=https%3A%2F%2Fahrefs.com%2Fblog%2Ffeed%2F&feed_9=&feed_10=&limit=&format=Atom", 
    maxFetch: 30, 
    dedupeHours: 48 
  },
  agents: {
    Ava: { 
      label: "Ava – Group Dealer Strategist", 
      channels: ["Channel_A"], 
      domains: ["ahrefs.com","moz.com","seo.com"], 
      tone: "sharp, analytical, big-picture" 
    },
    Maya: { 
      label: "Maya – OEM Program Insider", 
      channels: ["Channel_B"], 
      domains: ["developers.google.com","blog.google","searchengineland.com","seroundtable.com"], 
      tone: "professional, polished, structured" 
    },
  },
  queue: [] as any[],
  logs: [] as any[],
});

function Pill({ color = "", children }: { color?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

export default function App() {
  const [state, setState] = useLocalStorageState(LS_KEY, defaultState);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  const [apiConnected, setApiConnected] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
    loadData();
  }, []);

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
      addLog("Fetching RSS feed...", 'info');
      const response = await apiClient.fetchRSS();
      addLog(`Found ${response.items_added} new articles`, 'success');
      await loadData(); // Refresh queue data
    } catch (error) {
      addLog(`RSS fetch failed: ${error}`, 'error');
    }
  };

  const runQueue = async () => {
    if (queue.length === 0) {
      addLog("No items in queue", 'error');
      return;
    }
    
    try {
      setIsRunning(true);
      addLog("Starting queue processing...", 'info');
      await apiClient.processQueue();
      
      // Poll for updates
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiClient.getStatus();
          if (!status.is_processing) {
            clearInterval(pollInterval);
            setIsRunning(false);
            addLog("Queue processing complete", 'success');
            await loadData(); // Refresh data
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsRunning(false);
          addLog(`Queue processing failed: ${error}`, 'error');
        }
      }, 2000);
    } catch (error) {
      setIsRunning(false);
      addLog(`Failed to start queue processing: ${error}`, 'error');
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
                Automated SEO content pipeline with AI-powered video generation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-slate-300">
                  {apiConnected ? 'API Connected' : 'API Disconnected'}
                </span>
              </div>
              <Button 
                onClick={fetchRSS} 
                disabled={!apiConnected}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Rss className="w-4 h-4 mr-2" />
                Fetch RSS
              </Button>
              <Button 
                onClick={runQueue} 
                disabled={isRunning || queue.length === 0 || !apiConnected}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isRunning ? 'Running...' : 'Run Queue'}
              </Button>
              <Button 
                onClick={exportConfig}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Config
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Status Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Queue</p>
                  <p className="text-2xl font-bold">{queue.length}</p>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Agents</p>
                  <p className="text-2xl font-bold">{Object.keys(state.agents).length}</p>
                </div>
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Channels</p>
                  <p className="text-2xl font-bold">{Object.keys(state.youtube.channels).length}</p>
                </div>
                <Youtube className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Daily Shorts</p>
                  <p className="text-2xl font-bold">{state.youtube.dailyPerChannel * Object.keys(state.youtube.channels).length}</p>
                </div>
                <Gauge className="w-8 h-8 text-green-400" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-white/10 border-white/20">
              <TabsTrigger value="config" className="text-white data-[state=active]:bg-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Config
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-white data-[state=active]:bg-white/20">
                <Bot className="w-4 h-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="rss" className="text-white data-[state=active]:bg-white/20">
                <Rss className="w-4 h-4 mr-2" />
                RSS
              </TabsTrigger>
              <TabsTrigger value="youtube" className="text-white data-[state=active]:bg-white/20">
                <Youtube className="w-4 h-4 mr-2" />
                YouTube
              </TabsTrigger>
              <TabsTrigger value="queue" className="text-white data-[state=active]:bg-white/20">
                <Database className="w-4 h-4 mr-2" />
                Queue
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-white data-[state=active]:bg-white/20">
                <FileText className="w-4 h-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="config" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Keys */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <KeyRound className="w-5 h-5 mr-2" />
                      API Keys
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">OpenAI API Key</Label>
                      <MaskedInput
                        value={state.openai.apiKey}
                        onChange={(value) => updateState('openai.apiKey', value)}
                        placeholder="sk-..."
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Creatify API ID</Label>
                      <MaskedInput
                        value={state.creatify.apiId}
                        onChange={(value) => updateState('creatify.apiId', value)}
                        placeholder="API ID"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Creatify API Key</Label>
                      <MaskedInput
                        value={state.creatify.apiKey}
                        onChange={(value) => updateState('creatify.apiKey', value)}
                        placeholder="API Key"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">NuclearSMM API Key</Label>
                      <MaskedInput
                        value={state.nuclear.apiKey}
                        onChange={(value) => updateState('nuclear.apiKey', value)}
                        placeholder="API Key"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Creatify Settings */}
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe2 className="w-5 h-5 mr-2" />
                      Creatify Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Aspect Ratio</Label>
                      <Select value={state.creatify.aspect} onValueChange={(value) => updateState('creatify.aspect', value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9x16">9:16 (Vertical)</SelectItem>
                          <SelectItem value="16x9">16:9 (Horizontal)</SelectItem>
                          <SelectItem value="1x1">1:1 (Square)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Video Length: {state.creatify.length}s</Label>
                      <Slider
                        value={[state.creatify.length]}
                        onValueChange={([value]) => updateState('creatify.length', value)}
                        max={60}
                        min={5}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Enable Captions</Label>
                      <Switch
                        checked={state.creatify.captions}
                        onCheckedChange={(checked) => updateState('creatify.captions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">No CTA</Label>
                      <Switch
                        checked={state.creatify.noCta}
                        onCheckedChange={(checked) => updateState('creatify.noCta', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(state.agents).map(([key, agent]: [string, any]) => (
                  <Card key={key} className="bg-white/10 border-white/20 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Bot className="w-5 h-5 mr-2" />
                          {agent.label}
                        </span>
                        <Pill color="bg-purple-500/20 text-purple-300">
                          {agent.channels.length} channel{agent.channels.length !== 1 ? 's' : ''}
                        </Pill>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Tone</Label>
                        <Input
                          value={agent.tone}
                          onChange={(e) => updateState(`agents.${key}.tone`, e.target.value)}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Allowed Domains</Label>
                        <Textarea
                          value={agent.domains.join(', ')}
                          onChange={(e) => updateState(`agents.${key}.domains`, e.target.value.split(',').map(d => d.trim()))}
                          className="bg-white/10 border-white/20 text-white"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Channels</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {agent.channels.map((channel: string) => (
                            <Badge key={channel} variant="secondary" className="bg-blue-500/20 text-blue-300">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* RSS Tab */}
            <TabsContent value="rss" className="mt-6">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Rss className="w-5 h-5 mr-2" />
                    RSS Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Feed URL</Label>
                    <Textarea
                      value={state.rss.url}
                      onChange={(e) => updateState('rss.url', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Max Fetch</Label>
                      <Input
                        type="number"
                        value={state.rss.maxFetch}
                        onChange={(e) => updateState('rss.maxFetch', parseInt(e.target.value))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Dedupe Hours</Label>
                      <Input
                        type="number"
                        value={state.rss.dedupeHours}
                        onChange={(e) => updateState('rss.dedupeHours', parseInt(e.target.value))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* YouTube Tab */}
            <TabsContent value="youtube" className="mt-6">
              <div className="space-y-6">
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Youtube className="w-5 h-5 mr-2" />
                      YouTube Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-slate-300">Daily Shorts per Channel</Label>
                      <Slider
                        value={[state.youtube.dailyPerChannel]}
                        onValueChange={([value]) => updateState('youtube.dailyPerChannel', value)}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <p className="text-sm text-slate-400 mt-1">
                        {state.youtube.dailyPerChannel} shorts per channel
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(state.youtube.channels).map(([key, channel]: [string, any]) => (
                    <Card key={key} className="bg-white/10 border-white/20 text-white">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Youtube className="w-5 h-5 mr-2" />
                          {key}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-slate-300">Title Prefix</Label>
                          <Input
                            value={channel.titlePrefix}
                            onChange={(e) => updateState(`youtube.channels.${key}.titlePrefix`, e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Category ID</Label>
                          <Input
                            value={channel.categoryId}
                            onChange={(e) => updateState(`youtube.channels.${key}.categoryId`, e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">Privacy</Label>
                          <Select value={channel.privacy} onValueChange={(value) => updateState(`youtube.channels.${key}.privacy`, value)}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                              <SelectItem value="unlisted">Unlisted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="mt-6">
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
                      <p className="text-sm">Click "Fetch RSS" to populate the queue</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{item.title}</h4>
                            <p className="text-sm text-slate-400">{item.url}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                item.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                item.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                                'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {item.agent}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={`${
                                item.status === 'completed' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                                item.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                                'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                              }`}
                            >
                              {item.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await apiClient.removeQueueItem(item.id);
                                  await loadData();
                                  addLog(`Removed item: ${item.title}`, "info");
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
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="mt-6">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Activity Logs
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {logs.length} entries
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await apiClient.clearLogs();
                            await loadData();
                            addLog("Logs cleared", "info");
                          } catch (error) {
                            addLog(`Failed to clear logs: ${error}`, "error");
                          }
                        }}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Clear
                      </Button>
                    </div>
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
                      {logs.slice().reverse().map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            log.type === 'success' ? 'bg-green-400' : 
                            log.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex-1">
                            <p className="text-white">{log.message}</p>
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}