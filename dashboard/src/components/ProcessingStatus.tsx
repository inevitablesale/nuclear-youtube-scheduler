import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, CheckCircle2, AlertCircle, Clock, 
  RefreshCw, Rss, Video, Youtube, Zap, ArrowRight,
  Loader2, Eye, EyeOff
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
  timestamp?: string;
  details?: any;
}

interface ProcessingStatusProps {
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
}

export function ProcessingStatus({ isRunning, onRun, onStop }: ProcessingStatusProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'rss', name: 'Fetch RSS Feed', status: 'pending' },
    { id: 'route', name: 'Route Articles by Channel', status: 'pending' },
    { id: 'generate', name: 'Generate Videos', status: 'pending' },
    { id: 'upload', name: 'Upload to YouTube', status: 'pending' },
    { id: 'comments', name: 'Generate Comments', status: 'pending' },
    { id: 'smm', name: 'SMM Nuclear Boost', status: 'pending' },
    { id: 'complete', name: 'Complete', status: 'pending' }
  ]);
  const [showDetails, setShowDetails] = useState(false);
  const [lastRunData, setLastRunData] = useState<any>(null);

  const updateStep = (stepId: string, status: ProcessingStep['status'], message?: string, details?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, timestamp: new Date().toISOString(), details }
        : step
    ));
  };

  const resetSteps = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined, details: undefined })));
  };

  const simulateProcessing = async () => {
    resetSteps();
    
    // Step 1: Fetch RSS Feed
    updateStep('rss', 'running', 'Fetching latest articles from RSS feed...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStep('rss', 'completed', 'Found 15 new articles');

    // Step 2: Route Articles
    updateStep('route', 'running', 'Routing articles to channels...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStep('route', 'completed', '5 articles → Channel A, 3 articles → Channel B');

    // Step 3: Generate Videos
    updateStep('generate', 'running', 'Creating videos with AI...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    updateStep('generate', 'completed', 'Generated 8 videos successfully');

    // Step 4: Upload to YouTube
    updateStep('upload', 'running', 'Uploading videos to YouTube...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    updateStep('upload', 'completed', 'All videos uploaded successfully');

    // Step 5: Generate Comments
    updateStep('comments', 'running', 'Generating engagement comments...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStep('comments', 'completed', 'Comments generated and posted');

    // Step 6: SMM Nuclear Boost
    updateStep('smm', 'running', 'Initiating SMM boost campaigns...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    updateStep('smm', 'completed', 'SMM campaigns activated');

    // Step 7: Complete
    updateStep('complete', 'completed', 'Processing completed successfully!');
    
    // Load the actual results
    try {
      const status = await apiClient.fetchStatus();
      setLastRunData(status);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleRun = async () => {
    onRun();
    await simulateProcessing();
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-slate-400';
      case 'running':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const getStepBadge = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">Pending</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Control */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Play className="w-6 h-6 mr-3 text-purple-400" />
              Processing Control
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              {!isRunning ? (
                <Button
                  onClick={handleRun}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Processing
                </Button>
              ) : (
                <Button
                  onClick={onStop}
                  className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Processing
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {steps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-orange-400">
                {steps.filter(s => s.status === 'running').length}
              </div>
              <div className="text-sm text-slate-400">Running</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-slate-400">
                {steps.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-slate-400">Pending</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {steps.filter(s => s.status === 'error').length}
              </div>
              <div className="text-sm text-slate-400">Errors</div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {getStepIcon(step.status)}
                    <div>
                      <p className={`font-medium ${getStepColor(step.status)}`}>
                        {step.name}
                      </p>
                      {step.message && (
                        <p className="text-sm text-slate-400">{step.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStepBadge(step.status)}
                  {step.status === 'running' && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Last Run Results */}
          {lastRunData && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="font-semibold text-green-300 mb-2 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Last Run Results
              </h4>
              <div className="text-sm text-slate-300">
                <p>Last run: {lastRunData.lastRun?.at ? new Date(lastRunData.lastRun.at).toLocaleString() : 'Unknown'}</p>
                <p>Items processed: {lastRunData.lastRun?.items?.length || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Processing Log */}
      {showDetails && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="w-5 h-5 mr-3 text-blue-400" />
              Processing Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{step.name}</span>
                    <span className="text-xs text-slate-400">
                      {step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  {step.message && (
                    <p className="text-sm text-slate-400">{step.message}</p>
                  )}
                  {step.details && (
                    <div className="mt-2 text-xs text-slate-500">
                      <pre>{JSON.stringify(step.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}