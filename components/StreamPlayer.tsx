
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause,
  Volume2, 
  VolumeX, 
  Users, 
  Radio, 
  Copy, 
  Check, 
  Lock, 
  Monitor, 
  X,
  ChevronDown,
  Wifi,
  Cloud,
  Headphones,
  Mic,
  ShieldCheck, 
  ShieldAlert,
  Server,
  Eye,
  EyeOff,
  Sliders,
  Zap,
  Cpu,
  Timer,
  Activity,
  ExternalLink,
  PlayCircle,
  Globe,
  Smartphone,
  Info,
  RefreshCcw,
  AlertTriangle
} from 'lucide-react';
import { StreamSession } from '../types';

interface StreamPlayerProps {
  stream: StreamSession;
  onRemove?: () => void;
  onUpdateResolution?: (resolution: string) => void;
  onUpdateIpMode?: (mode: string) => void;
  onUpdateQuality?: (bitrate: number, codec: StreamSession['codec']) => void;
  onRegenerateKey?: () => void;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  stream, 
  onRemove, 
  onUpdateResolution, 
  onUpdateIpMode,
  onUpdateQuality,
  onRegenerateKey
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPlayback, setCopiedPlayback] = useState<string | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [revealedPlaybacks, setRevealedPlaybacks] = useState<Record<string, boolean>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [configTab, setConfigTab] = useState<'broadcast' | 'playback'>('broadcast');
  const [volume, setVolume] = useState(80);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConfirmingRegen, setIsConfirmingRegen] = useState(false);
  
  const [latency, setLatency] = useState(24);
  const [droppedFrames, setDroppedFrames] = useState(0.0);

  const [bitrate, setBitrate] = useState(stream.bitrate || 4500);
  const [codec, setCodec] = useState<StreamSession['codec']>(stream.codec || 'H.264');

  // Derive alternative URLs (assuming standard Nginx RTMP module paths)
  const rtmpPlayback = `${stream.rtmpUrl}/${stream.streamKey}`;
  const baseHttp = stream.rtmpUrl.replace('rtmp://', 'http://').split('/')[0];
  const hlsUrl = `http://${baseHttp}/hls/${stream.streamKey}.m3u8`;
  const dashUrl = `http://${baseHttp}/dash/${stream.streamKey}.mpd`;

  useEffect(() => {
    let interval: number;
    if (stream.status === 'live' && isPlaying) {
      interval = window.setInterval(() => {
        const base = volume > 0 ? (volume / 100) * 40 : 0;
        const peak = volume > 0 ? Math.random() * (volume / 100) * 60 : 0;
        setAudioLevel(base + peak);

        if (isMonitoring) {
          setLatency(prev => {
            const jitter = (Math.random() - 0.5) * 12;
            return Math.max(15, Math.min(350, Math.round(prev + jitter)));
          });
          setDroppedFrames(prev => {
            const chance = Math.random();
            if (chance > 0.94) return Math.min(10.0, prev + 0.15);
            if (chance < 0.12) return Math.max(0.0, prev - 0.1);
            return prev;
          });
        }
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [stream.status, isPlaying, volume, isMonitoring]);

  const copyToClipboard = (text: string, type: 'url' | 'key' | 'rtmp' | 'hls' | 'dash') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedPlayback(type);
      setTimeout(() => setCopiedPlayback(null), 2000);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedPlaybacks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleRegenClick = () => {
    if (onRegenerateKey) {
      onRegenerateKey();
      setIsConfirmingRegen(false);
    }
  };

  const handleQualityUpdate = (newBitrate: number, newCodec: StreamSession['codec']) => {
    setBitrate(newBitrate);
    setCodec(newCodec);
    onUpdateQuality?.(newBitrate, newCodec);
  };

  const getLatencyColor = (val: number) => {
    if (val < 60) return 'text-emerald-400';
    if (val < 150) return 'text-amber-400';
    return 'text-red-500';
  };

  const getDroppedColor = (val: number) => {
    if (val < 0.5) return 'bg-emerald-500';
    if (val < 2.0) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const isLocal = stream.ingestIp === '127.0.0.1' || stream.ingestIp.startsWith('192.168.') || stream.ingestIp.startsWith('10.');

  return (
    <div className={`bg-zinc-900 rounded-xl overflow-hidden border transition-all group shadow-xl flex flex-col h-full relative ${isMonitoring ? 'ring-2 ring-blue-500 border-blue-500/50' : 'border-zinc-800 hover:border-zinc-700'}`}>
      {/* Video Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden shrink-0">
        {stream.status === 'live' ? (
          <div className="relative w-full h-full overflow-hidden">
            <img 
              src={stream.thumbnailUrl} 
              alt={stream.title} 
              className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'opacity-100 scale-100' : 'opacity-40 scale-110 grayscale-[0.5] blur-[2px]'}`}
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white/50 animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-600 flex flex-col items-center">
            <Radio className="w-10 h-10 sm:w-12 sm:h-12 mb-2 opacity-20" />
            <span className="font-bold text-xs sm:text-sm tracking-widest uppercase text-zinc-700">Off-Air</span>
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={handlePlayToggle}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMonitoring(!isMonitoring); }}
                className={`p-2 rounded-full transition-all flex items-center gap-1 sm:gap-2 ${isMonitoring ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
                {isMonitoring && <span className="text-[8px] sm:text-[10px] font-bold pr-1 animate-in fade-in slide-in-from-left-1 uppercase">Monitor</span>}
              </button>
            </div>
            <div className="flex items-center gap-2">
               {onRemove && (
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5"
                 >
                   <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                   Remove
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5">
            {stream.status === 'live' && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[8px] sm:text-[10px] font-bold tracking-widest uppercase shadow-lg transition-all duration-300 ${isPlaying ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isPlaying ? 'bg-white animate-ping' : 'bg-zinc-600'}`} />
                {isPlaying ? 'LIVE' : 'PAUSE'}
              </div>
            )}
            {isEncrypted && (
              <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-600/90 text-white rounded text-[8px] sm:text-[10px] font-bold tracking-widest uppercase shadow-lg">
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                SECURE
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-bold uppercase backdrop-blur-md border ${isLocal ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-blue-500/20 border-blue-500/40 text-blue-400'}`}>
            {isLocal ? <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Cloud className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            {isLocal ? 'LAN' : 'CLOUD'}
          </div>
        </div>

        {/* Resolution Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded text-[9px] sm:text-[10px] font-bold text-zinc-300 flex items-center border border-white/10 overflow-hidden">
          {onUpdateResolution ? (
            <div className="relative group/res flex items-center px-2 py-0.5 sm:py-1 hover:bg-white/10 transition-colors cursor-pointer">
              <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 mr-1 sm:mr-1.5" />
              <span>{stream.resolution}</span>
              <select 
                value={stream.resolution}
                onChange={(e) => onUpdateResolution(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center px-2 py-0.5 sm:py-1">
              <Monitor className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 mr-1 sm:mr-1.5" />
              {stream.resolution}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 sm:p-4 space-y-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base line-clamp-1 text-zinc-100">{stream.title}</h3>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
               <p className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate max-w-[100px] sm:max-w-none">@{stream.broadcaster}</p>
               <span className="hidden xs:inline w-1 h-1 bg-zinc-700 rounded-full"></span>
               <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500">{stream.ingestIp}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 text-zinc-400 bg-zinc-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold">
              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
              <span>{stream.viewers >= 1000 ? (stream.viewers / 1000).toFixed(1) + 'k' : stream.viewers}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-1 sm:p-1.5 rounded transition-all border ${showAdvanced ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
              >
                <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button 
                onClick={() => setIsEncrypted(!isEncrypted)}
                className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-[9px] font-bold transition-all border ${isEncrypted ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
              >
                {isEncrypted ? <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />}
                <span className="hidden xs:inline">{isEncrypted ? "SECURE" : "UNSEC"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Panel */}
        {showAdvanced && (
          <div className="bg-zinc-950/80 rounded-lg p-2.5 sm:p-3 border border-blue-500/20 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
               <h4 className="text-[9px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                 <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Quality
               </h4>
               <button onClick={() => setShowAdvanced(false)} className="text-zinc-600 hover:text-zinc-400">
                 <X className="w-3 h-3" />
               </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase">
                   <label>Target Bitrate</label>
                   <span className="font-mono text-zinc-300">{bitrate}k</span>
                </div>
                <input 
                  type="range" min="1000" max="12000" step="500" value={bitrate}
                  onChange={(e) => handleQualityUpdate(parseInt(e.target.value), codec)}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Codec
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {(['H.264', 'H.265', 'AV1'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => handleQualityUpdate(bitrate, c)}
                      className={`py-1 rounded text-[8px] sm:text-[10px] font-bold border transition-all ${codec === c ? 'bg-blue-600/20 border-blue-600/50 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Panel */}
        <div className={`bg-zinc-950/50 rounded-lg p-2.5 sm:p-3 border transition-colors space-y-2.5 sm:space-y-3 ${isMonitoring ? 'border-blue-500/30' : 'border-zinc-800/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mic className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isMonitoring ? 'text-blue-500' : 'text-zinc-500'}`} />
              <span className={`text-[8px] sm:text-[10px] font-bold uppercase ${isMonitoring ? 'text-blue-400' : 'text-zinc-500'}`}>Audio Level</span>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-mono ${audioLevel > 80 ? 'text-red-500' : audioLevel > 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {Math.round(audioLevel)} dB
            </span>
          </div>
          
          <div className="h-1.5 sm:h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-zinc-800/80">
             {Array.from({ length: 24 }).map((_, i) => (
               <div key={i} className={`h-full flex-1 rounded-[1px] transition-all duration-75 ${i * 4 < audioLevel ? (i > 18 ? 'bg-red-500' : i > 12 ? 'bg-yellow-500' : 'bg-emerald-500') : 'bg-zinc-800'}`} />
             ))}
          </div>

          {isMonitoring && (
            <div className="flex items-center gap-6 pt-1 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 group/latency">
                <Timer className={`w-3 h-3 ${getLatencyColor(latency)} transition-colors`} />
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7px] font-bold text-zinc-500 uppercase tracking-tighter">Latency</span>
                  <span className={`text-[9px] sm:text-[10px] font-mono font-bold ${getLatencyColor(latency)} transition-colors`}>{latency}ms</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 group/dropped">
                <Activity className={`w-3 h-3 ${droppedFrames > 1.0 ? 'text-red-400' : 'text-emerald-400'} transition-colors`} />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] sm:text-[7px] font-bold text-zinc-500 uppercase tracking-tighter">Dropped Frames</span>
                    <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${droppedFrames > 1.0 ? 'text-red-400' : 'text-zinc-300'}`}>{droppedFrames.toFixed(1)}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getDroppedColor(droppedFrames)} transition-all duration-300`} 
                      style={{ width: `${Math.min(100, (droppedFrames / 5) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 pt-0.5">
            <button onClick={() => setVolume(v => v === 0 ? 80 : 0)} className="text-zinc-500 hover:text-white transition-colors">
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <div className="flex-1">
              <input 
                type="range" min="0" max="100" value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="mt-auto space-y-3 pt-3 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 bg-zinc-950/40 p-1 rounded-lg border border-zinc-800/50">
              <button 
                onClick={() => setConfigTab('broadcast')}
                className={`flex-1 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${configTab === 'broadcast' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Server className="w-3 h-3" /> Broadcast
              </button>
              <button 
                onClick={() => setConfigTab('playback')}
                className={`flex-1 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${configTab === 'playback' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <PlayCircle className="w-3 h-3" /> Playback
              </button>
            </div>

            {configTab === 'broadcast' ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex justify-between items-center gap-2">
                   <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">Ingest Server</p>
                      {onUpdateIpMode && (
                        <div className="relative shrink-0">
                           <button className="text-zinc-600 hover:text-blue-500 p-0.5"><ChevronDown className="w-2.5 h-2.5" /></button>
                           <select 
                            onChange={(e) => onUpdateIpMode(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            defaultValue={isLocal ? "lan" : "auto"}
                           >
                              <option value="auto">Public</option>
                              <option value="lan">LAN</option>
                              <option value="loopback">Host (127.0.0.1)</option>
                           </select>
                        </div>
                      )}
                   </div>
                   <span className={`text-[7px] sm:text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${isLocal ? 'border-orange-500/20 text-orange-500/60' : 'border-blue-500/20 text-blue-500/60'}`}>
                     {isLocal ? 'LAN NODE' : 'GLOBAL'}
                   </span>
                </div>
                
                <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] bg-black/60 p-1.5 sm:p-2 rounded-lg border border-zinc-800/80 overflow-hidden">
                          <code className="text-blue-400 truncate mr-1.5 font-mono select-all flex-1">{stream.rtmpUrl}</code>
                          <button 
                            onClick={() => copyToClipboard(stream.rtmpUrl, 'url')} 
                            className="text-zinc-500 hover:text-white bg-zinc-800/50 p-1.5 rounded-md shrink-0"
                          >
                            {copiedUrl ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                          </button>
                      </div>
                    </div>

                    <div className="space-y-1 relative">
                      <div className={`flex items-center justify-between text-[10px] sm:text-[11px] bg-black/60 p-1.5 sm:p-2 rounded-lg border overflow-hidden transition-colors ${isConfirmingRegen ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-800/80'}`}>
                          {isConfirmingRegen ? (
                            <div className="flex items-center justify-between w-full">
                               <div className="flex items-center gap-1.5 text-amber-500">
                                 <AlertTriangle className="w-3 h-3" />
                                 <span className="text-[9px] font-bold uppercase tracking-tighter">Regenerate Key?</span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <button onClick={() => setIsConfirmingRegen(false)} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-bold uppercase">Cancel</button>
                                 <button onClick={handleRegenClick} className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] font-bold uppercase">Confirm</button>
                               </div>
                            </div>
                          ) : (
                            <>
                              <code className="text-amber-400/80 truncate mr-1.5 font-mono tracking-widest flex-1">
                                {showStreamKey ? stream.streamKey : '••••••••••••'}
                              </code>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => setShowStreamKey(!showStreamKey)} className="text-zinc-500 hover:text-white p-1" title="Toggle Visibility">
                                  {showStreamKey ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                </button>
                                <button onClick={() => copyToClipboard(stream.streamKey, 'key')} className="text-zinc-500 hover:text-white p-1" title="Copy Key">
                                  {copiedKey ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                                </button>
                                {onRegenerateKey && (
                                  <button onClick={() => setIsConfirmingRegen(true)} className="text-zinc-500 hover:text-amber-500 p-1 transition-colors" title="Regenerate Key">
                                    <RefreshCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {/* RTMP Row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black bg-emerald-500 text-white px-1 rounded">RTMP</span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Direct Access</p>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase">VLC / OBS</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] bg-black/60 p-1.5 rounded-lg border border-zinc-800/80">
                      <code className="text-emerald-400 truncate mr-1.5 font-mono flex-1">
                        {revealedPlaybacks.rtmp ? rtmpPlayback : `${stream.rtmpUrl}/••••••`}
                      </code>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleReveal('rtmp')} className="text-zinc-500 hover:text-white p-1">
                          {revealedPlaybacks.rtmp ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(rtmpPlayback, 'rtmp')} className="text-zinc-500 hover:text-white p-1">
                          {copiedPlayback === 'rtmp' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                  </div>
                </div>

                {/* HLS Row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black bg-blue-500 text-white px-1 rounded">HLS</span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Browser Compatible</p>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase flex items-center gap-1"><Smartphone className="w-2.5 h-2.5" /> Mobile</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] bg-black/60 p-1.5 rounded-lg border border-zinc-800/80">
                      <code className="text-blue-400 truncate mr-1.5 font-mono flex-1">
                        {revealedPlaybacks.hls ? hlsUrl : `http://${baseHttp}/hls/••••••.m3u8`}
                      </code>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleReveal('hls')} className="text-zinc-500 hover:text-white p-1">
                          {revealedPlaybacks.hls ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(hlsUrl, 'hls')} className="text-zinc-500 hover:text-white p-1">
                          {copiedPlayback === 'hls' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                  </div>
                </div>

                {/* DASH Row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black bg-purple-500 text-white px-1 rounded">DASH</span>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Adaptive Streaming</p>
                    </div>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase flex items-center gap-1"><Monitor className="w-2.5 h-2.5" /> Web Player</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] bg-black/60 p-1.5 rounded-lg border border-zinc-800/80">
                      <code className="text-purple-400 truncate mr-1.5 font-mono flex-1">
                        {revealedPlaybacks.dash ? dashUrl : `http://${baseHttp}/dash/••••••.mpd`}
                      </code>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleReveal('dash')} className="text-zinc-500 hover:text-white p-1">
                          {revealedPlaybacks.dash ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => copyToClipboard(dashUrl, 'dash')} className="text-zinc-500 hover:text-white p-1">
                          {copiedPlayback === 'dash' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/30 rounded border border-zinc-800/50">
                  <Info className="w-3 h-3 text-zinc-500 shrink-0" />
                  <p className="text-[8px] text-zinc-500 font-medium leading-tight">
                    HLS is recommended for VLC and Safari. Use DASH for professional web players like Shaka or Video.js.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;
