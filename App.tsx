
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
  Globe
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
    thumbnailUrl: 'https://picsum.photos/seed/coding/800/450'
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
    thumbnailUrl: 'https://picsum.photos/seed/gaming/800/450'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'streams' | 'settings'>('dashboard');
  const [streams, setStreams] = useState<StreamSession[]>(MOCK_STREAMS);
  const [serverIp, setServerIp] = useState<string>('Loading...');
  const [stats, setStats] = useState<StreamStats>({
    cpuUsage: 12.5,
    memoryUsage: 4.2,
    activeStreams: 2,
    totalBandwidth: '124.5 Mbps'
  });
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newStreamData, setNewStreamData] = useState({ title: '', broadcaster: '', streamKey: '' });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Simulate automatic VPS IP detection
  useEffect(() => {
    const detectIp = async () => {
      try {
        // In a real VPS environment, this would be the actual public IP
        // Here we simulate a fetch to an IP detection service
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setServerIp(data.ip);
      } catch (e) {
        setServerIp('154.12.88.2'); // Fallback mock IP
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
      rtmpUrl: `rtmp://${serverIp}/live`,
      streamKey: newStreamData.streamKey,
      thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/800/450`
    };

    setStreams([newStream, ...streams]);
    setNewStreamData({ title: '', broadcaster: '', streamKey: '' });
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
            <h4 className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Auto-Detected VPS</h4>
            <div className="px-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono">{serverIp}</span>
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
               <div>
                 <div className="flex justify-between text-xs mb-1.5">
                   <span className="text-zinc-400 flex items-center gap-1"><RefreshCcw className="w-3 h-3"/> Bandwidth</span>
                   <span className="text-zinc-200">{stats.totalBandwidth}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">Broadcaster Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. creative_pixel"
                      value={newStreamData.broadcaster}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, broadcaster: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">Stream Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Design Stream"
                      value={newStreamData.title}
                      onChange={(e) => setNewStreamData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">Custom Password (Key)</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="e.g. my-secure-pwd-2024"
                        value={newStreamData.streamKey}
                        onChange={(e) => setNewStreamData(prev => ({ ...prev, streamKey: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleGenerateKey}
                      disabled={isGeneratingKey || !newStreamData.title || !newStreamData.broadcaster || !newStreamData.streamKey}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"
                    >
                      {isGeneratingKey ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      Add Broadcaster
                    </button>
                  </div>
                </div>

                {aiSuggestions && (
                  <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
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
                  <p className="text-zinc-400 text-sm">Automated VPS settings and server identification.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-200">Ingest Server (Auto-Detected)</h3>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-500 uppercase">Public VPS IP</label>
                       <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-blue-400 flex justify-between items-center">
                          {serverIp}
                          <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-sans uppercase">Active</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-500 uppercase">Main RTMP Endpoint</label>
                       <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-400">
                          rtmp://{serverIp}/live
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-200">Security Policies</h3>
                    <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <div>
                        <p className="text-sm font-bold">Admin-Defined Keys Only</p>
                        <p className="text-xs text-zinc-500">Prevent unauthorized stream creation</p>
                      </div>
                      <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center px-1">
                        <div className="w-3.5 h-3.5 bg-white rounded-full ml-auto shadow-sm" />
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8 px-8 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">© 2024 StreamPulse Media Systems. Automated VPS RTMP Hub.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
