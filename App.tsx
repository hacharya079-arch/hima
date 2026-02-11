
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
  Edit3
} from 'lucide-react';
import DashboardHeader from './components/DashboardHeader';
import StreamPlayer from './components/StreamPlayer';
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
    resolution: '1080p'
  },
  {
    id: '2',
    title: 'E-Sports Tournament Qualifiers',
    broadcaster: 'pro_gaming_tv',
    viewers: 8520,
    status: 'live',
    startTime: new Date().toISOString(),
    rtmpUrl: 'rtmp://154.12.88.2/live',
    streamKey: 'tournament_alpha',
    thumbnailUrl: 'https://picsum.photos/seed/gaming/800/450',
    resolution: '4K'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'streams' | 'settings'>('dashboard');
  const [streams, setStreams] = useState<StreamSession[]>(MOCK_STREAMS);
  const [detectedIp, setDetectedIp] = useState<string>('Detecting...');
  const [manualIp, setManualIp] = useState<string>('');
  const [useManualIp, setUseManualIp] = useState<boolean>(false);
  
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

  const effectiveIp = useManualIp && manualIp ? manualIp : detectedIp;

  // Simulate automatic VPS IP detection
  useEffect(() => {
    const detectIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setDetectedIp(data.ip);
      } catch (e) {
        setDetectedIp('154.12.88.2'); // Fallback mock IP
      }
    };
    detectIp();
  }, []);

  // Simulate real-time stats updates
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
    
    const newStream: StreamSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: newStreamData.title,
      broadcaster: newStreamData.broadcaster,
      viewers: 0,
      status: 'offline',
      startTime: new Date().toISOString(),
      rtmpUrl: `rtmp://${effectiveIp}/live`,
      streamKey: newStreamData.streamKey,
      thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/800/450`,
      resolution: newStreamData.resolution
    };

    setStreams([newStream, ...streams]);
    setNewStreamData({ title: '', broadcaster: '', streamKey: '', resolution: '1080p' });
    setIsGeneratingKey(false);

    const suggestions = await analyzeStreamContext(newStream.title, newStream.broadcaster);
    setAiSuggestions(suggestions);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <DashboardHeader />
      
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
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
          >
            <Settings className="w-5 h-5" />
            Infrastructure
          </button>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Active VPS Ingest</h4>
            <div className="px-4 mb-6">
              <div className="flex flex-col gap-1 text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-mono">{effectiveIp}</span>
                </div>
                <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">
                  {useManualIp ? 'Manual Override' : 'Auto-Detected'}
                </span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    <StreamPlayer key={stream.id} stream={stream} />
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

          {activeTab === 'settings' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-8">
               <div>
                  <h2 className="text-2xl font-bold mb-2">Global Infrastructure</h2>
                  <p className="text-zinc-400 text-sm">Configure VPS identification and manual IP overrides.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" /> 
                      IP Address Management
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <div>
                          <p className="text-sm font-bold">Manual IP Override</p>
                          <p className="text-xs text-zinc-500">Enable this to set a custom VPS address</p>
                        </div>
                        <button 
                          onClick={() => setUseManualIp(!useManualIp)}
                          className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${useManualIp ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${useManualIp ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {useManualIp && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                           <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                             <Edit3 className="w-3 h-3" /> Custom VPS IP Address
                           </label>
                           <input 
                              type="text"
                              value={manualIp}
                              onChange={(e) => setManualIp(e.target.value)}
                              placeholder="e.g. 1.2.3.4"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm font-mono text-blue-400 focus:ring-2 focus:ring-blue-500/50 outline-none"
                           />
                        </div>
                      )}

                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-500 uppercase">Auto-Detected IP</label>
                         <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-500">
                            {detectedIp}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-emerald-500" />
                      Streaming Defaults
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                         <p className="text-sm font-bold">Default Transcode Resolution</p>
                         <div className="flex gap-2">
                           {['720p', '1080p', '2K', '4K'].map(res => (
                             <button 
                               key={res}
                               className={`px-3 py-1 text-[10px] font-bold rounded border transition-all ${res === '1080p' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                             >
                               {res}
                             </button>
                           ))}
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <div>
                          <p className="text-sm font-bold">Multi-Quality HLS</p>
                          <p className="text-xs text-zinc-500">Generate multiple variants automatically</p>
                        </div>
                        <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center px-1">
                          <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8 px-8 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2024 StreamPulse Media Systems. Automated VPS RTMP Hub.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
