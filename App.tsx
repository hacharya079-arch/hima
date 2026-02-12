
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
  Terminal
} from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import StreamPlayer from './components/StreamPlayer';
import DeploymentGuide from './components/DeploymentGuide';
import { StreamSession, StreamStats, ChatMessage } from './types';
import { analyzeStreamContext } from './services/geminiService';

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
    ingestIp: '154.12.88.2'
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
    ingestIp: '192.168.1.45'
  }
];

export type IPMode = 'auto' | 'lan' | 'loopback' | 'manual';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'streams' | 'settings' | 'deploy'>('dashboard');
  const [streams, setStreams] = useState<StreamSession[]>(MOCK_STREAMS);
  
  // IP Management State
  const [detectedPublicIp, setDetectedPublicIp] = useState<string>('Detecting...');
  const [detectedLanIp, setDetectedLanIp] = useState<string>('Detecting...');
  const [manualIp, setManualIp] = useState<string>('');
  
  // Creation form specific network mode
  const [creationIpMode, setCreationIpMode] = useState<IPMode>('auto');
  
  // Removal Confirmation State
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
    resolution: '1080p' as StreamSession['resolution']
  });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const getEffectiveIp = (mode: IPMode) => {
    switch (mode) {
      case 'lan': return detectedLanIp;
      case 'loopback': return '127.0.0.1';
      case 'manual': return manualIp || '0.0.0.0';
      default: return detectedPublicIp;
    }
  };

  // IP Detection Logic
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
        activeStreams: streams.length
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [streams.length]);

  const handleGenerateKey = async () => {
    if (!newStreamData.title || !newStreamData.broadcaster || !newStreamData.streamKey) return;
    
    setIsGeneratingKey(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const ingestIp = getEffectiveIp(creationIpMode);
    
    const newStream: StreamSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: newStreamData.title,
      broadcaster: newStreamData.broadcaster,
      viewers: 0,
      status: 'offline',
      startTime: new Date().toISOString(),
      rtmpUrl: `rtmp://${ingestIp}/live`,
      streamKey: newStreamData.streamKey,
      thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/800/450`,
      resolution: newStreamData.resolution,
      ingestIp: ingestIp
    };

    setStreams([newStream, ...streams]);
    setNewStreamData({ title: '', broadcaster: '', streamKey: '', resolution: '1080p' });
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-x-hidden">
      <DashboardHeader publicIp={detectedPublicIp} localIp={detectedLanIp} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 flex gap-8">
        {/* Sidebar Nav */}
        <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Admin Panel
          </button>
          <button 
            onClick={() => setActiveTab('streams')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'streams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
          >
            <Tv className="w-5 h-5" />
            Public Viewers
          </button>
          <button 
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'deploy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
          >
            <Terminal className="w-5 h-5" />
            VPS Setup
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
          >
            <Settings className="w-5 h-5" />
            Infrastructure
          </button>

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
        <div className="flex-1 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Broadcaster Quick Access */}
              <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <PlusCircle className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-bold">Create Broadcaster Access</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Broadcaster</label>
                    <input 
                      type="text" 
                      placeholder="Name"
                      value={newStreamData.broadcaster}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, broadcaster: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Title</label>
                    <input 
                      type="text" 
                      placeholder="Stream Title"
                      value={newStreamData.title}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Password (Key)</label>
                    <input 
                      type="text" 
                      placeholder="Secret Key"
                      value={newStreamData.streamKey}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, streamKey: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Resolution</label>
                    <select 
                      value={newStreamData.resolution}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, resolution: e.target.value as StreamSession['resolution'] }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="2K">2K QHD</option>
                      <option value="4K">4K Ultra HD</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Network</label>
                    <select 
                      value={creationIpMode}
                      onChange={(e) => setCreationIpMode(e.target.value as IPMode)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="auto">Public (Global)</option>
                      <option value="lan">LAN (Local Network)</option>
                      <option value="loopback">Loopback (127.0.0.1)</option>
                      <option value="manual">Manual Override</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleGenerateKey}
                      disabled={isGeneratingKey || !newStreamData.title || !newStreamData.broadcaster || !newStreamData.streamKey}
                      className="w-full h-[38px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                    >
                      {isGeneratingKey ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg">
                  <Wifi className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] text-zinc-400">Broadcaster ingest point: </span>
                  <span className="text-[11px] font-mono text-blue-400 font-bold">{getEffectiveIp(creationIpMode)}</span>
                </div>

                {aiSuggestions && (
                  <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
                    <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-blue-400">Gemini AI Stream Suggestion</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{aiSuggestions.description}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Streams Grid */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold">Manage Broadcasts</h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {streams.map(stream => (
                    <StreamPlayer 
                      key={stream.id} 
                      stream={stream} 
                      onRemove={() => setConfirmRemovalId(stream.id)}
                      onUpdateResolution={(res) => handleUpdateResolution(stream.id, res as StreamSession['resolution'])}
                      onUpdateIpMode={(mode) => handleUpdateStreamIpMode(stream.id, mode as IPMode)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'streams' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold">Public Stream Portal</h2>
                <p className="text-zinc-400">View all active broadcasts from our cloud infrastructure.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {streams.map(stream => (
                  <StreamPlayer key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deploy' && <DeploymentGuide />}

          {activeTab === 'settings' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
               <div>
                  <h2 className="text-2xl font-bold mb-2">Global Infrastructure</h2>
                  <p className="text-zinc-400 text-sm">Configure VPS identification and networking overrides.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-blue-500" /> 
                      Network Monitoring
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Detected Public IPv4</label>
                           <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-blue-400">
                              {detectedPublicIp}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Detected LAN IP</label>
                           <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-orange-400">
                              {detectedLanIp}
                           </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                           <Edit3 className="w-3 h-3" /> Manual IP Override
                         </label>
                         <input 
                            type="text"
                            value={manualIp}
                            onChange={(e) => setManualIp(e.target.value)}
                            placeholder="e.g. 154.12.88.2"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-amber-400 focus:ring-2 focus:ring-amber-500/50 outline-none"
                         />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      Global Streaming Config
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                         <p className="text-sm font-bold">Standard Target Resolution</p>
                         <div className="flex gap-2 text-[10px] font-bold">
                           {['720p', '1080p', '2K', '4K'].map(res => (
                             <button 
                               key={res}
                               className={`px-3 py-1 rounded border transition-all ${res === '1080p' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                             >
                               {res}
                             </button>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmRemovalId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setConfirmRemovalId(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-600/20 rounded-full mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Remove Broadcaster?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                Are you sure you want to remove <span className="text-zinc-100 font-bold">@{streams.find(s => s.id === confirmRemovalId)?.broadcaster}</span> from the management list? This will clear their RTMP access records.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setConfirmRemovalId(null)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-xl transition-all"
                >
                  No, Cancel
                </button>
                <button 
                  onClick={handleConfirmRemoval}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
            <button 
              onClick={() => setConfirmRemovalId(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8 px-8 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2024 StreamPulse Media Systems. Professional RTMP Distribution Hub.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
