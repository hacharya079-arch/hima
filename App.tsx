
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  Tv, 
  Users, 
  Cpu, 
  HardDrive, 
  CloudRain, 
  RefreshCcw,
  Plus,
  MessageSquare,
  Key,
  Globe,
  Monitor,
  Edit3,
  Wifi,
  Laptop,
  AlertTriangle,
  X,
  Network,
  Terminal,
  Image as ImageIcon,
  Sparkles,
  Calendar,
  Clock,
  ListRestart
} from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import StreamPlayer from './components/StreamPlayer';
import DeploymentGuide from './components/DeploymentGuide';
import { StreamSession, StreamStats, ChatMessage } from './types';
import { analyzeStreamContext, generateStreamThumbnail } from './services/geminiService';

const MOCK_STREAMS: StreamSession[] = [
  {
    id: '1',
    title: 'Late Night Coding Sessions',
    broadcaster: 'dev_alex',
    viewers: 1240,
    status: 'live',
    startTime: new Date().toISOString(),
    rtmpUrl: 'rtmp://154.12.88.2/live',
    streamKey: 'alex_secure_123',
    thumbnailUrl: 'https://picsum.photos/seed/coding/800/450',
    resolution: '1080p',
    ingestIp: '154.12.88.2',
    bitrate: 6000,
    codec: 'H.264'
  },
  {
    id: '2',
    title: 'E-Sports Tournament Qualifiers',
    broadcaster: 'pro_gaming_tv',
    viewers: 8520,
    status: 'live',
    startTime: new Date().toISOString(),
    rtmpUrl: 'rtmp://192.168.1.45/live',
    streamKey: 'tournament_alpha',
    thumbnailUrl: 'https://picsum.photos/seed/gaming/800/450',
    resolution: '4K',
    ingestIp: '192.168.1.45',
    bitrate: 10000,
    codec: 'H.265'
  }
];

export type IPMode = 'auto' | 'lan' | 'loopback' | 'manual';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'streams' | 'settings' | 'deploy'>('dashboard');
  const [streams, setStreams] = useState<StreamSession[]>(MOCK_STREAMS);
  
  const [detectedPublicIp, setDetectedPublicIp] = useState<string>('Detecting...');
  const [detectedLanIp, setDetectedLanIp] = useState<string>('Detecting...');
  const [manualIp, setManualIp] = useState<string>('');
  const [creationIpMode, setCreationIpMode] = useState<IPMode>('auto');
  const [confirmRemovalId, setConfirmRemovalId] = useState<string | null>(null);

  const [stats, setStats] = useState<StreamStats>({
    cpuUsage: 12.5,
    memoryUsage: 4.2,
    activeStreams: 2,
    totalBandwidth: '124.5 Mbps'
  });
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newStreamData, setNewStreamData] = useState({ 
    title: '', 
    broadcaster: '', 
    streamKey: '',
    thumbnailUrl: '',
    resolution: '1080p' as StreamSession['resolution'],
    isScheduled: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const MIN_SCHEDULE_DATE = '2024-01-01';
  const MAX_SCHEDULE_DATE = '2025-12-31';

  const getEffectiveIp = (mode: IPMode) => {
    switch (mode) {
      case 'lan': return detectedLanIp;
      case 'loopback': return '127.0.0.1';
      case 'manual': return manualIp || '0.0.0.0';
      default: return detectedPublicIp;
    }
  };

  useEffect(() => {
    const detectPublicIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setDetectedPublicIp(data.ip);
      } catch (e) {
        setDetectedPublicIp('154.12.88.2');
      }
    };

    const detectLanIp = () => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(pc.setLocalDescription.bind(pc));
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)?.[1];
        if (myIP) {
          setDetectedLanIp(myIP);
          pc.onicecandidate = null;
        }
      };
      setTimeout(() => {
        setDetectedLanIp(prev => prev === 'Detecting...' ? '192.168.1.100' : prev);
      }, 2000);
    };

    detectPublicIp();
    detectLanIp();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(0, prev.cpuUsage + (Math.random() - 0.5) * 2)),
        memoryUsage: Math.min(16, Math.max(0, prev.memoryUsage + (Math.random() - 0.5) * 0.1)),
        activeStreams: streams.filter(s => s.status === 'live').length
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [streams.length]);

  const handleCreateStream = async () => {
    if (!newStreamData.title || !newStreamData.broadcaster || !newStreamData.streamKey) return;
    
    setIsGeneratingKey(true);
    let finalThumbnail = newStreamData.thumbnailUrl;
    if (!finalThumbnail) {
      const aiThumbnail = await generateStreamThumbnail(newStreamData.title, newStreamData.broadcaster);
      finalThumbnail = aiThumbnail || `https://picsum.photos/seed/${Math.random()}/800/450`;
    }
    
    const ingestIp = getEffectiveIp(creationIpMode);
    const scheduledStart = newStreamData.isScheduled ? `${newStreamData.scheduledDate}T${newStreamData.scheduledTime}:00` : undefined;
    
    const newStream: StreamSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: newStreamData.title,
      broadcaster: newStreamData.broadcaster,
      viewers: 0,
      status: newStreamData.isScheduled ? 'scheduled' : 'offline',
      startTime: new Date().toISOString(),
      scheduledStart: scheduledStart,
      rtmpUrl: `rtmp://${ingestIp}/live`,
      streamKey: newStreamData.streamKey,
      thumbnailUrl: finalThumbnail,
      resolution: newStreamData.resolution,
      ingestIp: ingestIp,
      bitrate: 4500,
      codec: 'H.264'
    };

    setStreams([newStream, ...streams]);
    setNewStreamData({ 
      title: '', 
      broadcaster: '', 
      streamKey: '', 
      thumbnailUrl: '', 
      resolution: '1080p',
      isScheduled: false,
      scheduledDate: '',
      scheduledTime: ''
    });
    setIsGeneratingKey(false);

    const suggestions = await analyzeStreamContext(newStream.title, newStream.broadcaster);
    setAiSuggestions(suggestions);
  };

  const handleConfirmRemoval = () => {
    if (confirmRemovalId) {
      setStreams(prev => prev.filter(s => s.id !== confirmRemovalId));
      setConfirmRemovalId(null);
    }
  };

  const handleUpdateResolution = (id: string, resolution: StreamSession['resolution']) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, resolution } : s));
  };

  const handleUpdateQuality = (id: string, bitrate: number, codec: StreamSession['codec']) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, bitrate, codec } : s));
  };

  const handleRegenerateKey = (id: string) => {
    const newKey = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    setStreams(prev => prev.map(s => s.id === id ? { ...s, streamKey: newKey } : s));
  };

  const handleGoLive = (id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { ...s, status: 'live' } : s));
  };

  const handleRestartStream = (id: string) => {
    setStreams(prev => prev.map(s => s.id === id ? { 
      ...s, 
      status: s.status === 'scheduled' ? 'scheduled' : 'offline',
      startTime: new Date().toISOString(),
      viewers: 0
    } : s));
  };

  const handleUpdateStreamIpMode = (id: string, mode: IPMode) => {
    const newIp = getEffectiveIp(mode);
    setStreams(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ingestIp: newIp,
          rtmpUrl: `rtmp://${newIp}/live`
        };
      }
      return s;
    }));
  };

  const NavItems = () => (
    <>
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
      >
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        <span className="truncate">Admin Panel</span>
      </button>
      <button 
        onClick={() => setActiveTab('streams')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'streams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
      >
        <Tv className="w-5 h-5 shrink-0" />
        <span className="truncate">Public Viewers</span>
      </button>
      <button 
        onClick={() => setActiveTab('deploy')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'deploy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
      >
        <Terminal className="w-5 h-5 shrink-0" />
        <span className="truncate">VPS Setup</span>
      </button>
      <button 
        onClick={() => setActiveTab('settings')}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
      >
        <Settings className="w-5 h-5 shrink-0" />
        <span className="truncate">Infrastructure</span>
      </button>
    </>
  );

  const liveStreams = streams.filter(s => s.status === 'live');
  const scheduledStreams = streams.filter(s => s.status === 'scheduled');

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden pb-20 lg:pb-0">
      <DashboardHeader publicIp={detectedPublicIp} localIp={detectedLanIp} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Desktop Nav */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-2">
          <NavItems />

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Detected Addresses</h4>
            <div className="px-4 mb-6 space-y-3">
              <div className="flex flex-col gap-1 text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono text-[11px] truncate">{detectedPublicIp}</span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-tighter font-bold">Public Node</span>
              </div>
              <div className="flex flex-col gap-1 text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-mono text-[11px] truncate">{detectedLanIp}</span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-tighter font-bold">Local LAN IP</span>
              </div>
            </div>

            <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Server Resources</h4>
            <div className="px-4 space-y-4">
               <div>
                 <div className="flex justify-between text-xs mb-1.5">
                   <span className="text-zinc-400 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU</span>
                   <span className="text-zinc-200">{stats.cpuUsage.toFixed(1)}%</span>
                 </div>
                 <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.cpuUsage}%` }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs mb-1.5">
                   <span className="text-zinc-400 flex items-center gap-1"><HardDrive className="w-3 h-3"/> RAM</span>
                   <span className="text-zinc-200">{stats.memoryUsage.toFixed(1)} GB / 16GB</span>
                 </div>
                 <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(stats.memoryUsage / 16) * 100}%` }} />
                 </div>
               </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          {activeTab === 'dashboard' && (
            <>
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-bold">Create Ingest Point</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                     <button 
                        onClick={() => setNewStreamData(prev => ({ ...prev, isScheduled: false }))}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${!newStreamData.isScheduled ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                     >
                       Now
                     </button>
                     <button 
                        onClick={() => setNewStreamData(prev => ({ ...prev, isScheduled: true }))}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${newStreamData.isScheduled ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                     >
                       Later
                     </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Broadcaster</label>
                      <input 
                        type="text" placeholder="Name" value={newStreamData.broadcaster}
                        onChange={(e) => setNewStreamData(prev => ({ ...prev, broadcaster: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Title</label>
                      <input 
                        type="text" placeholder="Stream Title" value={newStreamData.title}
                        onChange={(e) => setNewStreamData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Secret Key</label>
                      <input 
                        type="text" placeholder="Password" value={newStreamData.streamKey}
                        onChange={(e) => setNewStreamData(prev => ({ ...prev, streamKey: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between">
                        Thumbnail (Optional)
                        {!newStreamData.thumbnailUrl && (
                          <span className="flex items-center gap-1 text-[8px] text-blue-400">
                            <Sparkles className="w-2.5 h-2.5" /> AI Artwork
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="text" placeholder="https://..." value={newStreamData.thumbnailUrl}
                          onChange={(e) => setNewStreamData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Resolution</label>
                      <select 
                        value={newStreamData.resolution}
                        onChange={(e) => setNewStreamData(prev => ({ ...prev, resolution: e.target.value as StreamSession['resolution'] }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer text-zinc-100"
                      >
                        <option value="720p">720p HD</option>
                        <option value="1080p">1080p FHD</option>
                        <option value="2K">2K QHD</option>
                        <option value="4K">4K UHD</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Network</label>
                      <select 
                        value={creationIpMode}
                        onChange={(e) => setCreationIpMode(e.target.value as IPMode)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm appearance-none cursor-pointer text-zinc-100"
                      >
                        <option value="auto">Public (WAN)</option>
                        <option value="lan">LAN (Local)</option>
                        <option value="loopback">Host (127.0.0.1)</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>

                  {newStreamData.isScheduled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-500" /> Start Date
                          </label>
                          <input 
                            type="date" 
                            value={newStreamData.scheduledDate}
                            min={MIN_SCHEDULE_DATE}
                            max={MAX_SCHEDULE_DATE}
                            onChange={(e) => setNewStreamData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                          />
                          <p className="text-[8px] text-zinc-500 font-medium px-1">Allowed window: {MIN_SCHEDULE_DATE} to {MAX_SCHEDULE_DATE}</p>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-500" /> Start Time
                          </label>
                          <input 
                            type="time" value={newStreamData.scheduledTime}
                            onChange={(e) => setNewStreamData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-zinc-100"
                          />
                       </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleCreateStream}
                      disabled={isGeneratingKey || !newStreamData.title || !newStreamData.broadcaster || !newStreamData.streamKey || (newStreamData.isScheduled && (!newStreamData.scheduledDate || !newStreamData.scheduledTime))}
                      className="w-full md:w-48 h-[42px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isGeneratingKey ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</> : 
                        newStreamData.isScheduled ? <><Calendar className="w-4 h-4" /> Schedule Stream</> : <><Plus className="w-4 h-4" /> Create Stream</>}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">Ingest point: </span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 font-bold truncate">{getEffectiveIp(creationIpMode)}</span>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold">Manage Broadcasts</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      {liveStreams.length} Live
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      {scheduledStreams.length} Scheduled
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {streams.map(stream => (
                    <StreamPlayer 
                      key={stream.id} stream={stream} 
                      onRemove={() => setConfirmRemovalId(stream.id)}
                      onUpdateResolution={(res) => handleUpdateResolution(stream.id, res as StreamSession['resolution'])}
                      onUpdateIpMode={(mode) => handleUpdateStreamIpMode(stream.id, mode as IPMode)}
                      onUpdateQuality={(bitrate, codec) => handleUpdateQuality(stream.id, bitrate, codec)}
                      onRegenerateKey={() => handleRegenerateKey(stream.id)}
                      onGoLive={() => handleGoLive(stream.id)}
                      onRestartStream={() => handleRestartStream(stream.id)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'streams' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">Public Stream Portal</h2>
                <p className="text-zinc-400 text-sm">Real-time broadcast monitoring hub.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {streams.map(stream => (
                  <StreamPlayer key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deploy' && <DeploymentGuide />}

          {activeTab === 'settings' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-8 space-y-8">
               <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Global Infrastructure</h2>
                  <p className="text-zinc-400 text-sm">VPS identification and hardware config.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-500" /> Network Overrides
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase">Public IPv4</label>
                         <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs sm:text-sm font-mono text-blue-400 truncate">{detectedPublicIp}</div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase">IP Override</label>
                         <input 
                            type="text" value={manualIp} onChange={(e) => setManualIp(e.target.value)}
                            placeholder="e.g. 154.12.88.2"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 outline-none"
                         />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-500" /> Default Quality
                    </h3>
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                       <p className="text-sm font-bold">Global Target Resolution</p>
                       <div className="flex flex-wrap gap-2">
                         {['720p', '1080p', '2K', '4K'].map(res => (
                           <button 
                             key={res}
                             className={`px-3 py-1 rounded border text-[10px] font-bold ${res === '1080p' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                           >
                             {res}
                           </button>
                         ))}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-around px-2 py-3 lg:hidden z-[60] shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-zinc-500'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase">Admin</span>
        </button>
        <button onClick={() => setActiveTab('streams')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'streams' ? 'text-blue-500' : 'text-zinc-500'}`}>
          <Tv className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase">Streams</span>
        </button>
        <button onClick={() => setActiveTab('deploy')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'deploy' ? 'text-blue-500' : 'text-zinc-500'}`}>
          <Terminal className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase">Setup</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'settings' ? 'text-blue-500' : 'text-zinc-500'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase">Infra</span>
        </button>
      </nav>

      {confirmRemovalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setConfirmRemovalId(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-600/20 rounded-full mb-6">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Remove Access?</h3>
              <p className="text-zinc-400 text-sm mb-8">
                Clear RTMP credentials for <span className="text-zinc-100 font-bold">@{streams.find(s => s.id === confirmRemovalId)?.broadcaster}</span>?
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmRemovalId(null)} className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-100 font-bold rounded-xl">Cancel</button>
                <button onClick={handleConfirmRemoval} className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl">Remove</button>
              </div>
            </div>
            <button onClick={() => setConfirmRemovalId(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      <footer className="hidden sm:block border-t border-zinc-900 bg-zinc-950/50 py-8 px-8 text-center mt-auto">
        <p className="text-xs text-zinc-500">© 2024 StreamPulse Media Systems. Professional RTMP Distribution Hub.</p>
      </footer>
    </div>
  );
};

export default App;
